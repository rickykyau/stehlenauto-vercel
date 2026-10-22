<#
================================================================================
 Sync-ShopifyTracking.ps1   -  Stehlen Auto  (CB shipments -> Shopify fulfillments)
================================================================================

 WHAT IT DOES
   Writes CB tracking numbers back to stehlenauto.com orders - the step that
   was being done by hand in Shopify ("mark as fulfilled" + tracking number).

   1. Asks Shopify for open website orders that are unfulfilled / partially
      fulfilled (created in the last $LookbackDays days, not cancelled).
   2. Looks each one up in CB (JLConceptsProduction18) by
        SalesRepOrderCode = 'stehlen-<order number>'   (#1042 -> stehlen-1042)
      which is what the admin "Export CB import" file writes. Voided CB sales
      orders are ignored. The CB ship-to / bill-to name must match the Shopify
      order's shipping / billing / customer name (accents + case ignored) or
      the order is skipped with a WARN - the "name + PO number" key.
   3. Takes the item-level tracking from CB ShipmentDetail for shipments that
      are completed, not void, and at least $MinShipmentAgeMinutes old (labels
      are sometimes voided within ~2h of printing).
   4. Matches shipped CB items to Shopify line items by the product metafield
      cb_integration.item_name. Bundle products ("A+B") are fulfilled once
      EVERY component has shipped, with all of the components' tracking numbers.
   5. Creates the Shopify fulfillment(s) with the tracking number(s). Shopify
      emails the customer the shipping confirmation (if $NotifyCustomer) and,
      with this store's settings, captures the authorized payment.

 SAFE TO RUN OFTEN
   * Read-only against CB. Only touches orders Shopify still shows as open
     for fulfillment, so already-fulfilled orders (incl. ones done by hand)
     are never touched again; quantities already fulfilled are subtracted.
   * -DryRun writes a CSV of the fulfillments it WOULD create and changes nothing.
   * -Orders '#1035','#1009' -DryRun  replays past orders as if unfulfilled and
     compares the computed tracking numbers to what is in Shopify (test mode;
     refuses to run without -DryRun).
   * Every run appends a timestamped log under $LogDir.

 NEEDS the token scopes: read_orders + write_merchant_managed_fulfillment_orders
 (checked at start; exit 2 if missing).

 EXIT CODES (Task Scheduler "Last Run Result")
   0 = success (or dry run) - WARNs (name mismatch, unmapped item) do not fail
   2 = configuration error (token/scopes, SQL)
   3 = completed but one or more Shopify fulfillments failed
================================================================================
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [string[]]$Orders
)

# ============================== CONFIG ========================================
$ShopDomain  = 'http-stehlenauto-com.myshopify.com'
$ApiVersion  = '2025-01'
$AdminToken  = ''          # or env var SHOPIFY_ADMIN_TOKEN

$NotifyCustomer        = $true   # Shopify sends the shipping-confirmation email
$LookbackDays          = 45      # only Shopify orders created within this window
$MinShipmentAgeMinutes = 30      # ignore CB labels younger than this (void window)
$OrderCodePrefix       = 'stehlen-'

# Orders + shipments live in the CB production DB (not JLDataMart)
$SqlServer   = 'localhost'
$SqlDatabase = 'JLConceptsProduction18'
$SqlAuth     = 'Integrated'   # 'Integrated' or 'Sql'
$SqlUser     = ''
$SqlPassword = ''

$LogDir      = Join-Path $PSScriptRoot 'logs'
# ============================ END CONFIG ======================================

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$stamp   = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$logFile = Join-Path $LogDir "tracking-sync_$stamp.log"
function Log {
    param([string]$Msg, [string]$Level = 'INFO')
    $line = "{0} [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Msg
    $line | Tee-Object -FilePath $logFile -Append | Write-Host
}
function Fail { param([string]$Msg,[int]$Code) ; Log $Msg 'ERROR' ; exit $Code }

# -File passes "-Orders '#1,#2'" as one string
$Orders = @($Orders | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$replay = $Orders.Count -gt 0
if ($replay -and -not $DryRun) { Fail '-Orders is a test replay and needs -DryRun.' 2 }
Log "=== Stehlen tracking sync START (DryRun=$($DryRun.IsPresent) Replay=$replay) ==="

if (-not $AdminToken) { $AdminToken = $env:SHOPIFY_ADMIN_TOKEN }
if (-not $AdminToken) { Fail 'No Shopify admin token (config blank and SHOPIFY_ADMIN_TOKEN unset).' 2 }

# ----- helpers ----------------------------------------------------------------
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
function Get-ConnString {
    if ($SqlAuth -eq 'Sql') {
        return "Server=$SqlServer;Database=$SqlDatabase;User Id=$SqlUser;Password=$SqlPassword;TrustServerCertificate=True;Connect Timeout=30"
    }
    return "Server=$SqlServer;Database=$SqlDatabase;Integrated Security=True;TrustServerCertificate=True;Connect Timeout=30"
}
# "María De la Cruz" -> "mariadelacruz"
function Normalize-Name {
    param([string]$s)
    if (-not $s) { return '' }
    $d = $s.Normalize([Text.NormalizationForm]::FormD)
    $sb = New-Object System.Text.StringBuilder
    foreach ($ch in $d.ToCharArray()) {
        if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch) -ne [Globalization.UnicodeCategory]::NonSpacingMark) { [void]$sb.Append($ch) }
    }
    return ($sb.ToString().ToLowerInvariant() -replace '[^a-z0-9]', '')
}

# ----- 1. scopes ----------------------------------------------------------------
try {
    $scopes = (Invoke-GQL '{ appInstallation{ accessScopes{ handle } } }').appInstallation.accessScopes | ForEach-Object { $_.handle }
} catch { Fail "Shopify auth failed: $($_.Exception.Message)" 2 }
foreach ($s in @('read_orders', 'write_merchant_managed_fulfillment_orders')) {
    if ($scopes -notcontains $s) { Fail "Token is missing scope '$s'." 2 }
}

# ----- 2. Shopify orders awaiting fulfillment -----------------------------------
if ($replay) {
    $search = ($Orders | ForEach-Object { 'name:#' + $_.Trim().TrimStart('#') }) -join ' OR '
} else {
    $since  = (Get-Date).AddDays(-$LookbackDays).ToString('yyyy-MM-dd')
    $search = "created_at:>=$since AND (fulfillment_status:unshipped OR fulfillment_status:partial)"
}
$oq = @'
query($c:String,$q:String){
  orders(first:50, after:$c, query:$q){
    pageInfo{ hasNextPage endCursor }
    nodes{
      id name cancelledAt
      shippingAddress{ name } billingAddress{ name } customer{ displayName }
      fulfillments{ trackingInfo{ number } }
      lineItems(first:50){ nodes{
        id title sku currentQuantity unfulfilledQuantity
        product{ metafield(namespace:"cb_integration", key:"item_name"){ value } }
      } }
      fulfillmentOrders(first:10){ nodes{
        id status
        supportedActions{ action }
        lineItems(first:50){ nodes{ id remainingQuantity lineItem{ id } } }
      } }
    }
  }
}
'@
$shopOrders = New-Object System.Collections.Generic.List[object]; $cursor = $null
do {
    $page = (Invoke-GQL $oq @{ c = $cursor; q = $search }).orders
    foreach ($o in $page.nodes) { if (-not $o.cancelledAt) { $shopOrders.Add($o) } }
    $cursor = $page.pageInfo.endCursor
} while ($page.pageInfo.hasNextPage)
Log "Shopify orders to check: $($shopOrders.Count)  (query: $search)"
if ($shopOrders.Count -eq 0) { Log 'Nothing awaiting fulfillment.'; Log '=== END ==='; exit 0 }

# ----- 3. CB sales orders + item-level tracking ---------------------------------
$codes = @($shopOrders | ForEach-Object { $OrderCodePrefix + $_.name.TrimStart('#') })
$cbHdr = @{}   # code -> list of { So, ShipTo, BillTo, Shipments }
$cbDet = @{}   # code -> list of { Item, Qty, Tracking, Carrier }
try {
    $conn = New-Object System.Data.SqlClient.SqlConnection (Get-ConnString)
    $conn.Open()
    $inList = (0..($codes.Count - 1) | ForEach-Object { "@p$_" }) -join ','
    function New-Cmd([string]$sql) {
        $cmd = $conn.CreateCommand(); $cmd.CommandText = $sql; $cmd.CommandTimeout = 60
        for ($i = 0; $i -lt $codes.Count; $i++) { [void]$cmd.Parameters.AddWithValue("@p$i", $codes[$i]) }
        [void]$cmd.Parameters.AddWithValue('@age', $MinShipmentAgeMinutes)
        return $cmd
    }
    $okShipment = 's.SourceDocument = so.SalesOrderCode AND s.IsVoid = 0 AND s.IsCompleted = 1 AND s.DateCreated <= DATEADD(minute, -@age, GETDATE())'

    $rdr = (New-Cmd @"
SELECT so.SalesOrderCode, so.SalesRepOrderCode, so.ShipToName, so.BillToName,
       (SELECT COUNT(*) FROM Shipment s WHERE $okShipment) AS Shipments
FROM CustomerSalesOrder so
WHERE so.OrderStatus <> 'Voided' AND so.SalesRepOrderCode IN ($inList)
"@).ExecuteReader()
    while ($rdr.Read()) {
        $k = ([string]$rdr['SalesRepOrderCode']).Trim().ToLower()
        if (-not $cbHdr.ContainsKey($k)) { $cbHdr[$k] = New-Object System.Collections.Generic.List[object] }
        $cbHdr[$k].Add([pscustomobject]@{ So = [string]$rdr['SalesOrderCode']; ShipTo = [string]$rdr['ShipToName']
            BillTo = [string]$rdr['BillToName']; Shipments = [int]$rdr['Shipments'] })
    }
    $rdr.Close()

    $rdr = (New-Cmd @"
SELECT so.SalesRepOrderCode, d.ItemName, d.ShipQuantity, d.TrackingNumber, c.CarrierDescription
FROM CustomerSalesOrder so
JOIN ShipmentDetail d ON d.SourceDocument = so.SalesOrderCode
OUTER APPLY (SELECT TOP 1 s.CarrierDescription FROM Shipment s WHERE $okShipment AND s.TrackingNumber = d.TrackingNumber) c
WHERE so.OrderStatus <> 'Voided' AND so.SalesRepOrderCode IN ($inList)
  AND d.TrackingNumber IS NOT NULL
  AND EXISTS (SELECT 1 FROM Shipment s WHERE $okShipment AND s.TrackingNumber = d.TrackingNumber)
"@).ExecuteReader()
    while ($rdr.Read()) {
        $k = ([string]$rdr['SalesRepOrderCode']).Trim().ToLower()
        if (-not $cbDet.ContainsKey($k)) { $cbDet[$k] = New-Object System.Collections.Generic.List[object] }
        $cbDet[$k].Add([pscustomobject]@{ Item = ([string]$rdr['ItemName']).Trim().ToUpper(); Qty = [int][decimal]$rdr['ShipQuantity']
            Tracking = ([string]$rdr['TrackingNumber']).Trim(); Carrier = ([string]$rdr['CarrierDescription']).Trim() })
    }
    $rdr.Close(); $conn.Close()
} catch { Fail "SQL read failed: $($_.Exception.Message)" 2 }
Log "CB: $($cbHdr.Count) matching sales orders, $($cbDet.Count) with shipped tracking"

# ----- 4. plan ------------------------------------------------------------------
$plan = New-Object System.Collections.Generic.List[object]
$warn = 0; $notInCb = 0; $notShipped = 0
foreach ($o in $shopOrders) {
    $code = $OrderCodePrefix + $o.name.TrimStart('#')
    if (-not $cbHdr.ContainsKey($code)) { $notInCb++; Log "$($o.name): not in CB yet ($code)"; continue }
    $hdrs = $cbHdr[$code]
    if ($hdrs.Count -gt 1) { Log "$($o.name): $($hdrs.Count) non-voided CB sales orders for $code ($(($hdrs | ForEach-Object { $_.So }) -join ', ')) - using all their shipments" 'WARN'; $warn++ }

    # name + order number key
    $cbNames   = @($hdrs | ForEach-Object { Normalize-Name $_.ShipTo; Normalize-Name $_.BillTo } | Where-Object { $_ })
    $shopNames = @((Normalize-Name $o.shippingAddress.name), (Normalize-Name $o.billingAddress.name), (Normalize-Name $o.customer.displayName)) | Where-Object { $_ }
    if (-not ($cbNames | Where-Object { $shopNames -contains $_ })) {
        Log "$($o.name): name mismatch - CB '$($hdrs[0].ShipTo)' vs Shopify '$($o.shippingAddress.name)'. Skipped; fulfil by hand if correct." 'WARN'
        $warn++; continue
    }

    $rows = if ($cbDet.ContainsKey($code)) { $cbDet[$code] } else { @() }
    if ($rows.Count -eq 0) {
        $notShipped++
        if (($hdrs | Measure-Object -Property Shipments -Sum).Sum -gt 0) {
            Log "$($o.name): CB has a shipment for $code but no item-level tracking in ShipmentDetail. Skipped." 'WARN'; $warn++
        }
        continue
    }

    $shipped = @{}; $tracks = @{}; $carrierOf = @{}
    foreach ($r in $rows) {
        if (-not $shipped.ContainsKey($r.Item)) { $shipped[$r.Item] = 0; $tracks[$r.Item] = New-Object System.Collections.Generic.List[string] }
        $shipped[$r.Item] += $r.Qty
        if (-not $tracks[$r.Item].Contains($r.Tracking)) { $tracks[$r.Item].Add($r.Tracking) }
        if ($r.Carrier) { $carrierOf[$r.Tracking] = $r.Carrier }
    }
    $existing = @($o.fulfillments | ForEach-Object { $_.trackingInfo } | ForEach-Object { $_.number } | Where-Object { $_ })

    # line item -> CB components (bundle "A+B" -> A, B)
    $lines = @{}
    foreach ($li in $o.lineItems.nodes) {
        $key = $li.product.metafield.value
        if (-not $key) { $key = $li.sku }
        $comps = @(([string]$key).Split('+') | ForEach-Object { $_.Trim().ToUpper() } | Where-Object { $_ })
        $done  = if ($replay) { 0 } else { [int]$li.currentQuantity - [int]$li.unfulfilledQuantity }
        $lines[$li.id] = [pscustomobject]@{ Title = $li.title; Comps = $comps; Done = $done; Qty = [int]$li.currentQuantity }
    }
    # shipped units not yet used by earlier fulfillments
    $pool = @{}
    foreach ($c in $shipped.Keys) { $pool[$c] = $shipped[$c] }
    foreach ($l in $lines.Values) { foreach ($c in $l.Comps) { if ($pool.ContainsKey($c)) { $pool[$c] -= $l.Done } } }

    # open fulfillment-order lines (replay: every line item, as if unfulfilled)
    $open = New-Object System.Collections.Generic.List[object]
    if ($replay) {
        foreach ($id in $lines.Keys) { if ($lines[$id].Qty -gt 0) { $open.Add([pscustomobject]@{ Fo = 'replay'; FoLine = $id; Need = $lines[$id].Qty; Line = $lines[$id] }) } }
    } else {
        foreach ($fo in $o.fulfillmentOrders.nodes) {
            if ($fo.status -notin 'OPEN', 'IN_PROGRESS') { continue }
            if (-not ($fo.supportedActions | Where-Object { $_.action -eq 'CREATE_FULFILLMENT' })) { continue }
            foreach ($fl in $fo.lineItems.nodes) {
                if ([int]$fl.remainingQuantity -gt 0 -and $lines.ContainsKey($fl.lineItem.id)) {
                    $open.Add([pscustomobject]@{ Fo = $fo.id; FoLine = $fl.id; Need = [int]$fl.remainingQuantity; Line = $lines[$fl.lineItem.id] })
                }
            }
        }
    }

    $groups = @{}; $used = @{}
    foreach ($x in $open) {
        $comps = $x.Line.Comps
        if ($comps.Count -eq 0 -or ($comps | Where-Object { -not $pool.ContainsKey($_) })) { continue }   # not (fully) shipped yet
        $avail = ($comps | ForEach-Object { $pool[$_] } | Measure-Object -Minimum).Minimum
        $q = [math]::Min($x.Need, $avail)
        if ($q -le 0) { continue }
        foreach ($c in $comps) { $pool[$c] -= $q; $used[$c] = $true }
        $t = @($comps | ForEach-Object { $tracks[$_] } | Select-Object -Unique)
        $new = @($t | Where-Object { $existing -notcontains $_ })
        if (-not $replay -and $new.Count -gt 0) { $t = $new }
        $gk = ($t | Sort-Object) -join ','
        if (-not $groups.ContainsKey($gk)) { $groups[$gk] = New-Object System.Collections.Generic.List[object] }
        $groups[$gk].Add([pscustomobject]@{ Fo = $x.Fo; FoLine = $x.FoLine; Qty = $q; Title = $x.Line.Title })
    }
    foreach ($c in $shipped.Keys) {
        if (-not $used.ContainsKey($c) -and $pool[$c] -gt 0) {
            $onOrder = $lines.Values | Where-Object { $_.Comps -contains $c }
            if (-not $onOrder) { Log "$($o.name): CB shipped item $c which is not on the Shopify order (tracking $(($tracks[$c]) -join ',')). Check by hand." 'WARN'; $warn++ }
        }
    }
    foreach ($gk in $groups.Keys) {
        $nums = @($gk.Split(','))
        $carrier = ($nums | ForEach-Object { $carrierOf[$_] } | Where-Object { $_ } | Select-Object -First 1)
        $plan.Add([pscustomobject]@{ Order = $o.name; OrderId = $o.id; Trackings = $nums; Carrier = $carrier
            Lines = $groups[$gk]; Existing = $existing })
    }
}
Log "Plan: $($plan.Count) fulfillment(s) ; not in CB yet $notInCb ; in CB, not shipped yet $notShipped ; warnings $warn"
foreach ($p in $plan) {
    Log ("PLAN {0}: {1} [{2}] -> {3}" -f $p.Order, ($p.Trackings -join ', '), $p.Carrier, (($p.Lines | ForEach-Object { "$($_.Qty)x $($_.Title)" }) -join '; '))
}

if ($DryRun) {
    if ($replay) {
        foreach ($o in $shopOrders) {
            $mine = @($plan | Where-Object { $_.Order -eq $o.name } | ForEach-Object { $_.Trackings } | Sort-Object -Unique)
            $real = @($o.fulfillments | ForEach-Object { $_.trackingInfo } | ForEach-Object { $_.number } | Where-Object { $_ } | Sort-Object -Unique)
            $same = (($mine -join ',') -eq ($real -join ','))
            Log ("REPLAY {0}: {1}  computed=[{2}] shopify=[{3}]" -f $o.name, $(if ($same) { 'MATCH' } else { 'DIFF' }), ($mine -join ','), ($real -join ',')) $(if ($same) { 'INFO' } else { 'WARN' })
        }
    }
    $csv = Join-Path $LogDir "tracking-sync_dryrun_$stamp.csv"
    $plan | ForEach-Object { [pscustomobject]@{ Order = $_.Order; Trackings = ($_.Trackings -join ' '); Carrier = $_.Carrier
        Lines = (($_.Lines | ForEach-Object { "$($_.Qty)x $($_.Title)" }) -join '; ') } } |
        Export-Csv -Path $csv -NoTypeInformation -Encoding UTF8
    Log "DRY RUN - wrote $($plan.Count) rows to $csv. No fulfillments created."
    Log '=== END (dry run) ==='
    exit 0
}

# ----- 5. apply -----------------------------------------------------------------
$fm = @'
mutation($f:FulfillmentInput!){
  fulfillmentCreate(fulfillment:$f){ fulfillment{ id status } userErrors{ field message } }
}
'@
$errors = 0; $created = 0
foreach ($p in $plan) {
    $byFo = @($p.Lines | Group-Object Fo | ForEach-Object {
        @{ fulfillmentOrderId = $_.Name; fulfillmentOrderLineItems = @($_.Group | ForEach-Object { @{ id = $_.FoLine; quantity = $_.Qty } }) }
    })
    $tracking = @{ numbers = @($p.Trackings) }
    if ($p.Carrier) { $tracking.company = $p.Carrier }
    $fin = @{ lineItemsByFulfillmentOrder = $byFo; trackingInfo = $tracking; notifyCustomer = $NotifyCustomer }
    try {
        $r = Invoke-GQL $fm @{ f = $fin }
        if ($r.fulfillmentCreate.userErrors.Count) { throw ($r.fulfillmentCreate.userErrors | ConvertTo-Json -Compress) }
        $created++
        Log "FULFILLED $($p.Order): $($p.Trackings -join ', ') ($($r.fulfillmentCreate.fulfillment.status))"
    } catch { $errors++; Log "FULFILL FAILED $($p.Order): $($_.Exception.Message)" 'ERROR' }
    Start-Sleep -Milliseconds 300
}
Log "DONE fulfilled=$created errors=$errors warnings=$warn"
Log '=== END ==='
if ($errors -gt 0) { exit 3 }
exit 0

<#
 WINDOWS TASK SCHEDULER - hourly at :20 (after inventory :00 and listings :10),
 same account and folder as the other StehlenAuto.com syncs:
   Task:      \JL BI\Sync CB Tracking to Shopify (StehlenAuto.com)
   Program:   powershell.exe
   Arguments: -NoProfile -ExecutionPolicy Bypass -File "C:\Apps\Scripts\Sync-ShopifyTracking.ps1"
#>
