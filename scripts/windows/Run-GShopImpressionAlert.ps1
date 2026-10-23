<#
================================================================================
 Run-GShopImpressionAlert.ps1  -  Stehlen Auto Google Ads impression alert
================================================================================

 Runs C:\Apps\Scripts\gshop-impression-alert.py (repo: scripts/catalog/) with
 --email: compares the last 6h / 24h of Google Ads impressions with the same
 hours on the previous days and emails the owners (marked high priority) when
 they drop or spike, again every 24h while it lasts, and once on recovery.
 Logic lives ONLY in the Python script.

 Task: \JL BI\Google Ads Impression Alert (StehlenAuto.com), hourly at :35.
 Logs: C:\Apps\Scripts\logs\gshop-impression-alert-*.log (+ .jsonl, state .json)

 CONFIG secrets are filled in the SERVER copy only (never commit them):
   Google OAuth (client id / secret / refresh token from .secrets/google-ads-token.json),
   Brevo API key.

 EXIT CODES: 0 ok · 1 script error · 2 config
================================================================================
#>
[CmdletBinding()]
param([switch]$DryRun, [switch]$Test)

# ============================== CONFIG ========================================
$GoogleClientId     = ''
$GoogleClientSecret = ''
$GoogleRefreshToken = ''
$BrevoApiKey        = ''
$EmailTo            = 'rickykyau@gmail.com,rtsui.jlconcepts@gmail.com'
$ScriptDir          = 'C:\Apps\Scripts'
$PyScript           = Join-Path $ScriptDir 'gshop-impression-alert.py'
$LogDir             = Join-Path $ScriptDir 'logs'
# ==============================================================================

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$LogFile = Join-Path $LogDir ("gshop-impression-alert-{0}.log" -f (Get-Date -Format 'yyyyMMdd'))
if (-not ($GoogleRefreshToken -and $BrevoApiKey)) { "CONFIG: missing secrets" | Out-File $LogFile -Append; exit 2 }
$cmd = Get-Command py, python -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $cmd) { "CONFIG: python not found" | Out-File $LogFile -Append; exit 2 }

$env:GOOGLE_OAUTH_CLIENT_ID     = $GoogleClientId
$env:GOOGLE_OAUTH_CLIENT_SECRET = $GoogleClientSecret
$env:GOOGLE_OAUTH_REFRESH_TOKEN = $GoogleRefreshToken
$env:BREVO_API_KEY              = $BrevoApiKey
$env:ALERT_EMAIL_TO             = $EmailTo
$env:ALERT_LOG_DIR              = $LogDir
$env:PYTHONIOENCODING           = 'utf-8'

$pyArgs = @($PyScript)
if ($Test) { $pyArgs += '--test' } elseif (-not $DryRun) { $pyArgs += '--email' }
if ((Split-Path $cmd.Source -Leaf) -eq 'py.exe') { $pyArgs = @('-3') + $pyArgs }
"===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File -FilePath $LogFile -Append -Encoding utf8
& $cmd.Source @pyArgs *>&1 | Out-File -FilePath $LogFile -Append -Encoding utf8
exit $LASTEXITCODE
