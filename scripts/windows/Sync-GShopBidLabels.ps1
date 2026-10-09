<#
================================================================================
 Sync-GShopBidLabels.ps1   -  Stehlen Auto  (CB cost + Shopify -> Google Shopping bids)
================================================================================

 WHAT IT DOES
   1. Exports landed cost (EffectiveCost + EstShipping_C) per ItemName from
      [JLDataMart].[shopify].[vInventoryItem] to a CSV.
   2. Runs update-gshop-bid-labels.py with that CSV. The Python script reads
      price / stock / product type from Shopify, computes each product's bid
      bucket from its REAL margin, and writes the Google Shopping custom labels
      (mm-google-shopping.custom_label_0..3) - only labels that changed.
   The Google Ads campaign "Shopping - Standard - All Products - Tiered" bids per
   custom_label_3 bucket, so this re-prices the campaign daily with no Ads edits.
   Bid logic lives ONLY in the Python script (repo: scripts/catalog/).

 SAFETY
   * Read-only against CB. Writes only Google Shopping label metafields.
   * Aborts if the cost export has < 100 rows (failed query, not a real catalog).
   * -DryRun prints the bucket summary and writes nothing.
   * Every run appends a timestamped log under $LogDir.

 SETUP (on JL-SQL)
   1. Copy this file + update-gshop-bid-labels.py to C:\Apps\Scripts\
   2. Fill $AdminToken in CONFIG (same Admin token as the inventory sync).
   3. Test:  powershell -ExecutionPolicy Bypass -File C:\Apps\Scripts\Sync-GShopBidLabels.ps1 -DryRun
   4. Task:  \JL BI\Sync Google Shopping Bid Labels (StehlenAuto.com), daily 05:20

 EXIT CODES
   0 = success (or dry run)
   1 = aborted: cost export returned < 100 rows
   2 = configuration error (token, python, SQL)
   3 = Python run reported errors
================================================================================
#>

[CmdletBinding()]
param(
    [switch]$DryRun
)

# ============================== CONFIG ========================================
$ShopDomain  = 'http-stehlenauto-com.myshopify.com'
$AdminToken  = ''                                  # or env var SHOPIFY_ADMIN_TOKEN
$SqlServer   = 'localhost'
$SqlDatabase = 'JLDataMart'
$ScriptDir   = 'C:\Apps\Scripts'
$PyScript    = Join-Path $ScriptDir 'update-gshop-bid-labels.py'
$Python      = ''                                  # '' = auto-detect (py launcher / python)
$LogDir      = Join-Path $ScriptDir 'logs'
# ==============================================================================

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$stamp   = Get-Date -Format 'yyyyMMdd-HHmmss'
$LogFile = Join-Path $LogDir "gshop-bid-labels-$stamp.log"
function Log($msg) { $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"; $line | Tee-Object -FilePath $LogFile -Append }

if ($env:SHOPIFY_ADMIN_TOKEN) { $AdminToken = $env:SHOPIFY_ADMIN_TOKEN }
if (-not $AdminToken) { Log 'CONFIG: no Shopify admin token'; exit 2 }
if (-not (Test-Path $PyScript)) { Log "CONFIG: missing $PyScript"; exit 2 }
if (-not $Python) {
    $cmd = Get-Command py, python -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $cmd) { Log 'CONFIG: python not found'; exit 2 }
    $Python = $cmd.Source
}

# --- 1. Export CB landed cost ---------------------------------------------------
$CostCsv = Join-Path $LogDir 'gshop-cb-cost.csv'
try {
    $conn = New-Object System.Data.SqlClient.SqlConnection "Server=$SqlServer;Database=$SqlDatabase;Integrated Security=True;TrustServerCertificate=True;Connect Timeout=30"
    $conn.Open()
    $sql = 'SELECT ItemName, EffectiveCost, EstShipping_C FROM shopify.vInventoryItem'
    $da  = New-Object System.Data.SqlClient.SqlDataAdapter ($sql, $conn)
    $tbl = New-Object System.Data.DataTable
    [void]$da.Fill($tbl)
    $conn.Close()
} catch { Log "SQL error: $($_.Exception.Message)"; exit 2 }

if ($tbl.Rows.Count -lt 100) { Log "ABORT: cost export returned $($tbl.Rows.Count) rows"; exit 1 }
$tbl | Select-Object ItemName, EffectiveCost, EstShipping_C | Export-Csv -Path $CostCsv -NoTypeInformation -Encoding UTF8
Log "Exported $($tbl.Rows.Count) cost rows"

# --- 2. Recompute + write labels ---------------------------------------------------
$env:SHOPIFY_SHOP_URL    = $ShopDomain
$env:SHOPIFY_ADMIN_TOKEN = $AdminToken
$env:PYTHONIOENCODING    = 'utf-8'
$pyArgs = @($PyScript, '--cost-csv', $CostCsv, '--log-dir', $LogDir)
if (-not $DryRun) { $pyArgs += '--apply' }
if ((Split-Path $Python -Leaf) -eq 'py.exe') { $pyArgs = @('-3') + $pyArgs }

$output = & $Python @pyArgs 2>&1
$code = $LASTEXITCODE
$output | ForEach-Object { Log "  $_" }
if ($code -ne 0) { Log "Python exited $code"; exit 3 }
Log ('Done' + $(if ($DryRun) { ' (dry run)' } else { '' }))
exit 0
