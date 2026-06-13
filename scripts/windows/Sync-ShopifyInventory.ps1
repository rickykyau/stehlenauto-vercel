<#
================================================================================
 Sync-ShopifyInventory.ps1   —  Stehlen Auto  (CB / JLDataMart -> Shopify)
================================================================================

 WHAT IT DOES
   Reads the purpose-built view  [JLDataMart].[shopify].[vInventoryItem]
   (one row per product, key = ItemName, qty = AvailableQuantity) and pushes
   each AvailableQuantity into the matching Shopify product's "available"
   inventory at the store's fulfillment location. The Shopify product is
   matched by the metafield  cb_integration.item_name  == CB ItemName.

   Negative AvailableQuantity (oversold/backorder) is clamped to 0.
   Only items whose Shopify quantity DIFFERS from CB are written.

 WHY IT IS SAFE TO RUN HOURLY
   * Read-only against CB. Writes only "available" inventory in Shopify.
   * ABORTS if the CB view returns fewer than $MinRowsGuard rows, so a broken
     query / empty result can NEVER zero out the catalog.
   * Optional $MaxZeroOutGuard aborts if an implausible number of items would
     drop to 0 in a single run (protects against a bad CB data load).
   * -DryRun writes a CSV of intended changes and pushes NOTHING.
   * Every run appends a timestamped log under $LogDir.

 FIRST-TIME SETUP (on the SQL server, PowerShell 5.1+)
   1. Copy this file somewhere stable, e.g.  C:\Scripts\Sync-ShopifyInventory.ps1
   2. Fill in the CONFIG block below (Shopify token + domain). Leave SQL as
      localhost/Integrated if the task runs as a Windows account with read
      access to JLDataMart; otherwise set SQL auth.
   3. Test, no writes:
        powershell -ExecutionPolicy Bypass -File C:\Scripts\Sync-ShopifyInventory.ps1 -DryRun
      Inspect C:\Scripts\logs\*.log and the dryrun CSV.
   4. Go live once:
        powershell -ExecutionPolicy Bypass -File C:\Scripts\Sync-ShopifyInventory.ps1
   5. Schedule (see WINDOWS TASK SCHEDULER at the bottom of this header).

 EXIT CODES (Task Scheduler "Last Run Result")
   0 = success (or dry run)
   1 = aborted by a safety guard (CB rows too few / too many zero-outs)
   2 = configuration error (missing token, location, SQL/Shopify auth)
   3 = completed but one or more Shopify batches reported errors
================================================================================
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$Force   # bypass $MaxZeroOutGuard for this run only
)

# ============================== CONFIG ========================================
# Shopify
$ShopDomain  = 'http-stehlenauto-com.myshopify.com'   # *.myshopify.com host
$ApiVersion  = '2025-01'
# Admin API token. Either paste it here, or set env var SHOPIFY_ADMIN_TOKEN and
# leave this blank (env var wins if both are set). Needs read_products +
# write_inventory + read/write_locations scopes.
$AdminToken  = ''

# Shopify location to write to. Leave '' to auto-detect the single active
# inventory-shipping location (recommended — there is exactly one today:
# "21912 Garcia Lane"). Pin it here only if you ever add more locations.
$LocationId  = ''   # e.g. 'gid://shopify/Location/84099563567'

# SQL Server (this view lives in JLDataMart)
$SqlServer   = 'localhost'        # '(local)', 'localhost\INSTANCE', or 'JL-SQL'
$SqlDatabase = 'JLDataMart'
$SqlAuth     = 'Integrated'       # 'Integrated' (Windows acct) or 'Sql'
$SqlUser     = ''                 # only if $SqlAuth = 'Sql'
$SqlPassword = ''                 # only if $SqlAuth = 'Sql'

# Safety + logging
$MinRowsGuard    = 1000           # abort if the CB view returns fewer rows
$MaxZeroOutGuard = 400            # abort if more than this many items would go
                                  # to 0 in one run (use -Force to override).
                                  # 0 = disable this guard.
$BatchSize       = 100            # Shopify quantities per mutation (<=250)
$LogDir          = Join-Path $PSScriptRoot 'logs'
# ============================ END CONFIG ======================================

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# ----- logging ----------------------------------------------------------------
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$stamp   = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$logFile = Join-Path $LogDir "inventory-sync_$stamp.log"
function Log {
    param([string]$Msg, [string]$Level = 'INFO')
    $line = "{0} [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Msg
    $line | Tee-Object -FilePath $logFile -Append | Write-Host
}
function Fail { param([string]$Msg,[int]$Code) ; Log $Msg 'ERROR' ; exit $Code }

Log "=== Stehlen inventory sync START (DryRun=$($DryRun.IsPresent)) ==="

if (-not $AdminToken) { $AdminToken = $env:SHOPIFY_ADMIN_TOKEN }
if (-not $AdminToken) { Fail 'No Shopify admin token (config blank and SHOPIFY_ADMIN_TOKEN unset).' 2 }

# ----- 1. read CB view --------------------------------------------------------
function Get-ConnString {
    if ($SqlAuth -eq 'Sql') {
        return "Server=$SqlServer;Database=$SqlDatabase;User Id=$SqlUser;Password=$SqlPassword;TrustServerCertificate=True;Connect Timeout=30"
    }
    return "Server=$SqlServer;Database=$SqlDatabase;Integrated Security=True;TrustServerCertificate=True;Connect Timeout=30"
}

$cb = @{}   # ItemName(UPPER) -> clamped qty
try {
    $conn = New-Object System.Data.SqlClient.SqlConnection (Get-ConnString)
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = 'SELECT ItemName, AvailableQuantity FROM shopify.vInventoryItem WHERE ItemName IS NOT NULL'
    $cmd.CommandTimeout = 60
    $rdr = $cmd.ExecuteReader()
    while ($rdr.Read()) {
        $name = ([string]$rdr['ItemName']).Trim()
        if (-not $name) { continue }
        $qty = [int][math]::Floor([double]$rdr['AvailableQuantity'])
        if ($qty -lt 0) { $qty = 0 }          # clamp negatives
        $cb[$name.ToUpper()] = $qty
    }
    $rdr.Close(); $conn.Close()
} catch {
    Fail "SQL read failed: $($_.Exception.Message)" 2
}
Log "CB view rows: $($cb.Count)"
if ($cb.Count -lt $MinRowsGuard) {
    Fail "CB returned $($cb.Count) rows (< MinRowsGuard $MinRowsGuard). Aborting to protect the catalog." 1
}

# ----- 2. Shopify GraphQL helper ---------------------------------------------
$gqlUri = "https://$ShopDomain/admin/api/$ApiVersion/graphql.json"
$headers = @{ 'X-Shopify-Access-Token' = $AdminToken; 'Content-Type' = 'application/json' }
function Invoke-GQL {
    param([string]$Query, $Variables = @{})
    $body = @{ query = $Query; variables = $Variables } | ConvertTo-Json -Depth 12 -Compress
    for ($attempt = 1; $attempt -le 6; $attempt++) {
        try {
            $resp = Invoke-RestMethod -Uri $gqlUri -Method Post -Headers $headers -Body $body
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

# ----- 3. resolve location ----------------------------------------------------
if (-not $LocationId) {
    try {
        $locs = (Invoke-GQL '{ locations(first:25){ nodes{ id name isActive shipsInventory } } }').locations.nodes
    } catch { Fail "Shopify location query failed (check token/scopes): $($_.Exception.Message)" 2 }
    $pick = $locs | Where-Object { $_.isActive -and $_.shipsInventory } | Select-Object -First 1
    if (-not $pick) { Fail 'No active inventory-shipping location found in Shopify.' 2 }
    $LocationId = $pick.id
    Log "Auto-detected location: $($pick.name) ($LocationId)"
} else {
    Log "Using configured location: $LocationId"
}

# ----- 4. pull Shopify products (metafield -> inventoryItem + current qty) -----
$shopifyQuery = @'
query($c:String){
  products(first:100, after:$c){
    pageInfo{ hasNextPage endCursor }
    nodes{
      handle
      metafield(namespace:"cb_integration", key:"item_name"){ value }
      variants(first:1){ nodes{ inventoryItem{ id tracked } inventoryQuantity } }
    }
  }
}
'@
$map = @{}   # ItemName(UPPER) -> @{ inv=<gid>; cur=<int> }
$cursor = $null; $productCount = 0
do {
    $page = (Invoke-GQL $shopifyQuery @{ c = $cursor }).products
    foreach ($p in $page.nodes) {
        $productCount++
        $val = $p.metafield.value
        if (-not $val) { continue }
        $v = $p.variants.nodes | Select-Object -First 1
        if (-not $v -or -not $v.inventoryItem.tracked) { continue }
        $map[$val.Trim().ToUpper()] = @{ inv = $v.inventoryItem.id; cur = [int]$v.inventoryQuantity }
    }
    $cursor = $page.pageInfo.endCursor
} while ($page.pageInfo.hasNextPage)
Log "Shopify products scanned: $productCount ; with tracked cb_integration.item_name: $($map.Count)"

# ----- 5. diff ----------------------------------------------------------------
$changes = New-Object System.Collections.Generic.List[object]
$matched = 0; $zeroOut = 0
foreach ($key in $map.Keys) {
    if (-not $cb.ContainsKey($key)) { continue }   # Shopify item not in CB view: leave untouched
    $matched++
    $target = $cb[$key]; $current = $map[$key].cur
    if ($current -ne $target) {
        if ($target -eq 0 -and $current -gt 0) { $zeroOut++ }
        $changes.Add([pscustomobject]@{ Item=$key; Inv=$map[$key].inv; From=$current; To=$target })
    }
}
Log "Matched CB<->Shopify: $matched ; changes: $($changes.Count) ; would-zero-out: $zeroOut ; already-correct: $($matched - $changes.Count)"

if ($MaxZeroOutGuard -gt 0 -and $zeroOut -gt $MaxZeroOutGuard -and -not $Force) {
    Fail "Would zero out $zeroOut items (> MaxZeroOutGuard $MaxZeroOutGuard). Aborting. Re-run with -Force if this is expected." 1
}

# ----- 6. dry run exit --------------------------------------------------------
if ($DryRun) {
    $csv = Join-Path $LogDir "inventory-sync_dryrun_$stamp.csv"
    $changes | Export-Csv -Path $csv -NoTypeInformation -Encoding UTF8
    Log "DRY RUN — wrote $($changes.Count) intended changes to $csv. No writes performed."
    Log "=== END (dry run) ==="
    exit 0
}
if ($changes.Count -eq 0) { Log 'Nothing to update — Shopify already matches CB.'; Log '=== END ==='; exit 0 }

# ----- 7. push in batches -----------------------------------------------------
$setMutation = @'
mutation set($input: InventorySetQuantitiesInput!){
  inventorySetQuantities(input:$input){
    inventoryAdjustmentGroup{ createdAt }
    userErrors{ field message }
  }
}
'@
$pushed = 0; $errors = 0; $batchNo = 0
for ($i = 0; $i -lt $changes.Count; $i += $BatchSize) {
    $batchNo++
    $take  = [math]::Min($BatchSize, $changes.Count - $i)
    $slice = $changes.GetRange($i, $take)
    $quantities = foreach ($c in $slice) {
        @{ inventoryItemId = $c.Inv; locationId = $LocationId; quantity = [int]$c.To }
    }
    # NOTE: do not name this $input — that is a PowerShell automatic variable.
    $setInput = @{
        name                 = 'available'
        reason               = 'correction'
        # Required by inventorySetQuantities: without this, Shopify demands a
        # per-item compareQuantity (optimistic-lock). We overwrite from the ERP
        # source of truth, so we explicitly ignore it. (Verified against the
        # live 2025-01 API — the mutation rejects the call otherwise.)
        ignoreCompareQuantity = $true
        referenceDocumentUri = 'cb://jldatamart/shopify.vInventoryItem'
        quantities           = @($quantities)
    }
    try {
        $res = Invoke-GQL $setMutation @{ input = $setInput }
        $ue = $res.inventorySetQuantities.userErrors
        if ($ue -and $ue.Count -gt 0) {
            $errors += $ue.Count
            Log ("Batch $batchNo userErrors: " + ($ue | ConvertTo-Json -Depth 6 -Compress)) 'ERROR'
        } else {
            $pushed += $slice.Count
            Log "Batch $batchNo OK ($($slice.Count) items)"
        }
    } catch {
        $errors++
        Log "Batch $batchNo FAILED: $($_.Exception.Message)" 'ERROR'
    }
    Start-Sleep -Milliseconds 600   # gentle throttle
}

Log "PUSHED $pushed items in $batchNo batch(es); errors=$errors"
Log '=== END ==='
if ($errors -gt 0) { exit 3 }
exit 0

<#
================================================================================
 WINDOWS TASK SCHEDULER  (run hourly — recommended cadence)
--------------------------------------------------------------------------------
 Recommended: every hour, on the hour. Stock changes are driven by orders
 (Shopify decrements live on each sale) and CB restocks/adjustments; an hourly
 overwrite from the ERP corrects drift and surfaces restocks fast enough for a
 storefront without hammering the API. 30 min is fine too; sub-15 min is
 overkill and just spends API budget.

 Create the task (run as a user/service account with read access to JLDataMart):

   schtasks /Create /TN "Stehlen Shopify Inventory Sync" /SC HOURLY ^
     /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Scripts\Sync-ShopifyInventory.ps1" ^
     /RU "DOMAIN\svc_account" /RP * /RL LIMITED /F

 Or in Task Scheduler GUI:
   Program/script:  powershell.exe
   Arguments:       -NoProfile -ExecutionPolicy Bypass -File C:\Scripts\Sync-ShopifyInventory.ps1
   Trigger:         Daily, repeat every 1 hour, indefinitely
   "Run whether user is logged on or not", "Run with highest privileges" not
   required (script needs no admin rights).

 Verify a run: check the newest file in C:\Scripts\logs\ and the task's
 "Last Run Result" (0 = success).
================================================================================
#>
