<#
 Run-HolidaySale.ps1  -  Stehlen Auto holiday sale on the Shopify store
   -Mode start | end   applies / reverts C:\Apps\Scripts\data\bf-2026-sale-plan.json
                       via holiday-sale.py (repo: scripts/catalog/). -DryRun writes nothing.
 Tasks (one-time): \JL BI\Holiday Sale START (StehlenAuto.com)  2026-11-20 00:05
                   \JL BI\Holiday Sale END (StehlenAuto.com)    2026-12-02 00:05
 Log: C:\Apps\Scripts\logs\holiday-sale.jsonl + holiday-sale-<stamp>.log
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('start', 'end')][string]$Mode,
    [switch]$DryRun
)
# ============================== CONFIG ========================================
$ShopDomain = 'http-stehlenauto-com.myshopify.com'
$AdminToken = ''
$ScriptDir  = 'C:\Apps\Scripts'
$Plan       = Join-Path $ScriptDir 'data\bf-2026-sale-plan.json'
$Python     = ''
$LogDir     = Join-Path $ScriptDir 'logs'
# ==============================================================================
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$LogFile = Join-Path $LogDir "holiday-sale-$Mode-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
function Log($msg) { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg" | Tee-Object -FilePath $LogFile -Append }
if (-not $AdminToken) { Log 'CONFIG: no Shopify admin token'; exit 2 }
if (-not $Python) {
    $cmd = Get-Command py, python -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $cmd) { Log 'CONFIG: python not found'; exit 2 }
    $Python = $cmd.Source
}
$env:SHOPIFY_SHOP_URL = $ShopDomain; $env:SHOPIFY_ADMIN_TOKEN = $AdminToken; $env:PYTHONIOENCODING = 'utf-8'
$pyArgs = @((Join-Path $ScriptDir 'holiday-sale.py'), $Mode, '--plan', $Plan, '--log-dir', $LogDir)
if ($DryRun) { $pyArgs += '--dry' }
if ((Split-Path $Python -Leaf) -eq 'py.exe') { $pyArgs = @('-3') + $pyArgs }
$ErrorActionPreference = 'Continue'
$output = & $Python @pyArgs 2>&1; $code = $LASTEXITCODE
$output | ForEach-Object { Log "  $_" }
if ($code -ne 0) { Log "Python exited $code"; exit 3 }
Log 'Done'; exit 0
