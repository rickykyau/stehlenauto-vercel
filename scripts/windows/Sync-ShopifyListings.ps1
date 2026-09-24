<#
================================================================================
 Sync-ShopifyListings.ps1   -  Stehlen Auto  (CB / JLDataMart -> Shopify)
================================================================================

 WHAT IT DOES
   Makes Shopify's LISTED set follow the CB view [JLDataMart].[shopify].[vInventoryItem]
   (the same view the inventory sync reads). Being in the view IS the listing
   decision; this script only carries it out:

     in view + Shopify product has photos  -> ACTIVE and published on every
                                              channel in $Channels
     in view + product has NO photos       -> left as-is, reported (never
                                              publish a listing without images)
     NOT in view                           -> set to DRAFT (hidden everywhere;
                                              nothing is deleted - it comes back
                                              automatically if it re-enters the view)
     in view + no Shopify product yet      -> reported as "needs listing"
                                              (creating listings is a separate,
                                              reviewed pipeline)

   Products are matched by metafield  cb_integration.item_name  == CB ItemName.

 SAFETY
   * Same owner rule as the inventory sync: the CB view is the source of truth,
     no magnitude guards. The one guard is against a FAILED read: 0 rows from the
     view aborts the run (a broken query/connection, not an empty catalog).
   * Only products whose state actually differs are written.
   * -DryRun writes a CSV of intended actions and changes NOTHING.
   * Every run appends a timestamped log under $LogDir.

 NEEDS the token scopes: read_products, write_products, read_publications,
 write_publications (checked at start; exit 2 if missing).

 EXIT CODES (Task Scheduler "Last Run Result")
   0 = success (or dry run)
   1 = aborted: CB view read returned 0 rows
   2 = configuration error (token/scopes, SQL, channel names)
   3 = completed but one or more Shopify writes failed
================================================================================
#>

[CmdletBinding()]
param(
    [switch]$DryRun
)

# ============================== CONFIG ========================================
$ShopDomain  = 'http-stehlenauto-com.myshopify.com'
$ApiVersion  = '2025-01'
$AdminToken  = ''          # or env var SHOPIFY_ADMIN_TOKEN

# Sales channels a listed product must be on (exact Shopify publication names).
$Channels = @('Online Store', 'Point of Sale', 'Lovable', 'Google & YouTube', 'Stehlen Next.js Storefront')

$SqlServer   = 'localhost'
$SqlDatabase = 'JLDataMart'
$SqlAuth     = 'Integrated'   # 'Integrated' or 'Sql'
$SqlUser     = ''
$SqlPassword = ''

$AbortIfEmpty = $true
$LogDir       = Join-Path $PSScriptRoot 'logs'
# ============================ END CONFIG ======================================

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$stamp   = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$logFile = Join-Path $LogDir "listing-sync_$stamp.log"
function Log {
    param([string]$Msg, [string]$Level = 'INFO')
    $line = "{0} [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Msg
    $line | Tee-Object -FilePath $logFile -Append | Write-Host
}
function Fail { param([string]$Msg,[int]$Code) ; Log $Msg 'ERROR' ; exit $Code }

Log "=== Stehlen listing sync START (DryRun=$($DryRun.IsPresent)) ==="

if (-not $AdminToken) { $AdminToken = $env:SHOPIFY_ADMIN_TOKEN }
if (-not $AdminToken) { Fail 'No Shopify admin token (config blank and SHOPIFY_ADMIN_TOKEN unset).' 2 }

# ----- 1. read CB view --------------------------------------------------------
function Get-ConnString {
    if ($SqlAuth -eq 'Sql') {
        return "Server=$SqlServer;Database=$SqlDatabase;User Id=$SqlUser;Password=$SqlPassword;TrustServerCertificate=True;Connect Timeout=30"
    }
    return "Server=$SqlServer;Database=$SqlDatabase;Integrated Security=True;TrustServerCertificate=True;Connect Timeout=30"
}
$view = @{}   # ItemName(UPPER) -> ItemStatus
try {
    $conn = New-Object System.Data.SqlClient.SqlConnection (Get-ConnString)
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = 'SELECT ItemName, ItemStatus FROM shopify.vInventoryItem WHERE ItemName IS NOT NULL'
    $cmd.CommandTimeout = 60
    $rdr = $cmd.ExecuteReader()
    while ($rdr.Read()) {
        $name = ([string]$rdr['ItemName']).Trim()
        if ($name) { $view[$name.ToUpper()] = [string]$rdr['ItemStatus'] }
    }
    $rdr.Close(); $conn.Close()
} catch { Fail "SQL read failed: $($_.Exception.Message)" 2 }
Log "CB view rows: $($view.Count)"
if ($AbortIfEmpty -and $view.Count -eq 0) {
    Fail 'CB view returned 0 rows - treating as a failed read, not an empty catalog. Aborting.' 1
}

# ----- 2. Shopify GraphQL helper ---------------------------------------------
$gqlUri  = "https://$ShopDomain/admin/api/$ApiVersion/graphql.json"
$headers = @{ 'X-Shopify-Access-Token' = $AdminToken; 'Content-Type' = 'application/json' }
function Invoke-GQL {
    param([string]$Query, $Variables = @{})
    $body = @{ query = $Query; variables = $Variables } | ConvertTo-Json -Depth 12 -Compress
    for ($attempt = 1; $attempt -le 6; $attempt++) {
        try {
            $resp = Invoke-RestMethod -Uri $gqlUri -Method Post -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($body))
        } catch {
            if ($attempt -eq 6) { throw }
            Start-Sleep -Seconds ([math]::Min(30, [math]::Pow(2, $attempt))); continue
        }
        if ($resp.errors) {
            $throttled = $resp.errors | Where-Object { $_.extensions.code -eq 'THROTTLED' }
            if ($throttled -and $attempt -lt 6) { Start-Sleep -Seconds ([math]::Min(30, [math]::Pow(2, $attempt))); continue }
            throw ("GraphQL error: " + ($resp.errors | ConvertTo-Json -Depth 6 -Compress))
        }
        return $resp.data
    }
}

# ----- 3. scopes + channel ids -----------------------------------------------
try {
    $scopes = (Invoke-GQL '{ appInstallation{ accessScopes{ handle } } }').appInstallation.accessScopes | ForEach-Object { $_.handle }
} catch { Fail "Shopify auth failed: $($_.Exception.Message)" 2 }
foreach ($s in @('write_products', 'write_publications')) {
    if ($scopes -notcontains $s) { Fail "Token is missing scope '$s'." 2 }
}
$pubs = (Invoke-GQL '{ publications(first:50){ nodes{ id name } } }').publications.nodes
$channelIds = @{}
foreach ($c in $Channels) {
    $p = $pubs | Where-Object { $_.name -eq $c } | Select-Object -First 1
    if (-not $p) { Fail "Sales channel not found in Shopify: '$c'" 2 }
    $channelIds[$p.id] = $c
}

# ----- 4. pull Shopify products ----------------------------------------------
$q = @'
query($c:String){
  products(first:100, after:$c){
    pageInfo{ hasNextPage endCursor }
    nodes{
      id handle status
      mediaCount{ count }
      metafield(namespace:"cb_integration", key:"item_name"){ value }
      resourcePublicationsV2(first:25){ nodes{ isPublished publication{ id } } }
    }
  }
}
'@
$shop = @{}; $cursor = $null
do {
    $page = (Invoke-GQL $q @{ c = $cursor }).products
    foreach ($p in $page.nodes) {
        if (-not $p.metafield.value) { continue }
        $on = @($p.resourcePublicationsV2.nodes | Where-Object { $_.isPublished } | ForEach-Object { $_.publication.id })
        $shop[$p.metafield.value.Trim().ToUpper()] = [pscustomobject]@{
            Id = $p.id; Handle = $p.handle; Status = $p.status; Media = [int]$p.mediaCount.count; On = $on
        }
    }
    $cursor = $page.pageInfo.endCursor
} while ($page.pageInfo.hasNextPage)
Log "Shopify products with cb_integration.item_name: $($shop.Count)"

# ----- 5. plan ----------------------------------------------------------------
$actions = New-Object System.Collections.Generic.List[object]
$noPhotos = 0; $needsListing = 0
foreach ($key in $view.Keys) {
    if (-not $shop.ContainsKey($key)) {
        $needsListing++
        $actions.Add([pscustomobject]@{ Item=$key; Handle=''; Action='NEEDS_LISTING'; Detail="ItemStatus=$($view[$key])" })
        continue
    }
    $p = $shop[$key]
    if ($p.Media -eq 0) {
        $noPhotos++
        $actions.Add([pscustomobject]@{ Item=$key; Handle=$p.Handle; Action='NO_PHOTOS'; Detail="status=$($p.Status)" })
        continue
    }
    $missing = @($channelIds.Keys | Where-Object { $p.On -notcontains $_ })
    if ($p.Status -ne 'ACTIVE' -or $missing.Count -gt 0) {
        $actions.Add([pscustomobject]@{ Item=$key; Handle=$p.Handle; Action='LIST'; Id=$p.Id; Missing=$missing
            Detail = "status=$($p.Status); add channels: " + (($missing | ForEach-Object { $channelIds[$_] }) -join ', ') })
    }
}
foreach ($key in $shop.Keys) {
    if ($view.ContainsKey($key)) { continue }
    $p = $shop[$key]
    if ($p.Status -eq 'ACTIVE') {
        $actions.Add([pscustomobject]@{ Item=$key; Handle=$p.Handle; Action='DELIST'; Id=$p.Id; Detail='not in CB view -> DRAFT' })
    }
}
$toList   = @($actions | Where-Object { $_.Action -eq 'LIST' })
$toDelist = @($actions | Where-Object { $_.Action -eq 'DELIST' })
Log "Plan: list/fix $($toList.Count) ; delist $($toDelist.Count) ; in view without photos $noPhotos ; in view without Shopify product $needsListing"

if ($DryRun) {
    $csv = Join-Path $LogDir "listing-sync_dryrun_$stamp.csv"
    $actions | Select-Object Item, Handle, Action, Detail | Export-Csv -Path $csv -NoTypeInformation -Encoding UTF8
    Log "DRY RUN - wrote $($actions.Count) rows to $csv. No writes performed."
    Log '=== END (dry run) ==='
    exit 0
}

# ----- 6. apply ---------------------------------------------------------------
$errors = 0; $listed = 0; $delisted = 0
$updM = 'mutation($p:ProductUpdateInput!){ productUpdate(product:$p){ userErrors{ message } } }'
$pubM = 'mutation($id:ID!,$i:[PublicationInput!]!){ publishablePublish(id:$id,input:$i){ userErrors{ message } } }'
foreach ($a in $toList) {
    try {
        if ($a.Missing.Count -gt 0) {
            $inp = @($a.Missing | ForEach-Object { @{ publicationId = $_ } })
            $r = Invoke-GQL $pubM @{ id = $a.Id; i = $inp }
            if ($r.publishablePublish.userErrors.Count) { throw ($r.publishablePublish.userErrors | ConvertTo-Json -Compress) }
        }
        $r = Invoke-GQL $updM @{ p = @{ id = $a.Id; status = 'ACTIVE' } }
        if ($r.productUpdate.userErrors.Count) { throw ($r.productUpdate.userErrors | ConvertTo-Json -Compress) }
        $listed++
        Log "LISTED $($a.Item) ($($a.Handle)) - $($a.Detail)"
    } catch { $errors++; Log "LIST FAILED $($a.Item): $($_.Exception.Message)" 'ERROR' }
    Start-Sleep -Milliseconds 300
}
foreach ($a in $toDelist) {
    try {
        $r = Invoke-GQL $updM @{ p = @{ id = $a.Id; status = 'DRAFT' } }
        if ($r.productUpdate.userErrors.Count) { throw ($r.productUpdate.userErrors | ConvertTo-Json -Compress) }
        $delisted++
        Log "DELISTED $($a.Item) ($($a.Handle)) - not in CB view"
    } catch { $errors++; Log "DELIST FAILED $($a.Item): $($_.Exception.Message)" 'ERROR' }
    Start-Sleep -Milliseconds 300
}
foreach ($a in @($actions | Where-Object { $_.Action -in 'NO_PHOTOS','NEEDS_LISTING' })) {
    Log "$($a.Action) $($a.Item) $($a.Handle) $($a.Detail)" 'WARN'
}
Log "DONE listed=$listed delisted=$delisted errors=$errors"
Log '=== END ==='
if ($errors -gt 0) { exit 3 }
exit 0

<#
 WINDOWS TASK SCHEDULER - runs hourly at :10 (after the :00 inventory sync),
 same account and folder as "Sync CB Inventory to Shopify (StehlenAuto.com)":
   Task:      \JL BI\Sync CB Listings to Shopify (StehlenAuto.com)
   Program:   powershell.exe
   Arguments: -NoProfile -ExecutionPolicy Bypass -File "C:\Apps\Scripts\Sync-ShopifyListings.ps1"
#>
