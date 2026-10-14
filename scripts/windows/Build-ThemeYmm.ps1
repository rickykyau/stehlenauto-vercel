<#
================================================================================
 Build-ThemeYmm.ps1   -  Stehlen Auto  (Shopify theme vehicle-picker list)
================================================================================

 WHAT IT DOES
   Runs build-theme-ymm.py, which rebuilds assets/stehlen-ymm.json on the live
   Shopify theme: the Make -> Model -> Year list behind the theme's "Select your
   vehicle" picker. Only vehicles that active products' custom.make / model /
   year metafields contain are offered, so new items show up in the picker the
   day after they're published and no picker choice returns an empty page.

 SETUP (on JL-SQL)
   1. Copy this file + build-theme-ymm.py to C:\Apps\Scripts\ and
      data\ymm_tree.json to C:\Apps\Scripts\data\
   2. Fill $AdminToken in CONFIG (same Admin token as the bid-label sync).
   3. Test:  powershell -ExecutionPolicy Bypass -File C:\Apps\Scripts\Build-ThemeYmm.ps1 -DryRun
   4. Task:  \JL BI\Build Theme Vehicle Picker (StehlenAuto.com), daily 05:40

 EXIT CODES  0 = ok   2 = configuration error   3 = Python run failed
================================================================================
#>

[CmdletBinding()]
param(
    [switch]$DryRun
)

# ============================== CONFIG ========================================
$ShopDomain = 'http-stehlenauto-com.myshopify.com'
$AdminToken = ''
$ScriptDir  = 'C:\Apps\Scripts'
$PyScript   = Join-Path $ScriptDir 'build-theme-ymm.py'
$TreeFile   = Join-Path $ScriptDir 'data\ymm_tree.json'
$Python     = ''                                   # '' = auto-detect (py launcher / python)
$LogDir     = Join-Path $ScriptDir 'logs'
# ==============================================================================

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$LogFile = Join-Path $LogDir "theme-ymm-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
function Log($msg) { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg" | Tee-Object -FilePath $LogFile -Append }

if ($env:SHOPIFY_ADMIN_TOKEN) { $AdminToken = $env:SHOPIFY_ADMIN_TOKEN }
if (-not $AdminToken) { Log 'CONFIG: no Shopify admin token'; exit 2 }
if (-not (Test-Path $TreeFile)) { Log "CONFIG: missing $TreeFile"; exit 2 }
if (-not $Python) {
    $cmd = Get-Command py, python -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $cmd) { Log 'CONFIG: python not found'; exit 2 }
    $Python = $cmd.Source
}

$env:SHOPIFY_SHOP_URL    = $ShopDomain
$env:SHOPIFY_ADMIN_TOKEN = $AdminToken
$env:PYTHONIOENCODING    = 'utf-8'
$pyArgs = @($PyScript, '--tree', $TreeFile, '--log-dir', $LogDir)
if ($DryRun) { $pyArgs += '--dry' }
if ((Split-Path $Python -Leaf) -eq 'py.exe') { $pyArgs = @('-3') + $pyArgs }

$ErrorActionPreference = 'Continue'
$output = & $Python @pyArgs 2>&1
$code = $LASTEXITCODE
$output | ForEach-Object { Log "  $_" }
if ($code -ne 0) { Log "Python exited $code"; exit 3 }
Log 'Done'
exit 0
