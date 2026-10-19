<#
================================================================================
 Run-GShopWeeklyTuneup.ps1  -  Stehlen Auto weekly Google Shopping tune-up
================================================================================

 Runs C:\Apps\Scripts\gshop-weekly-tuneup.py (repo: scripts/catalog/) with
 --apply --email: pulls last week's Google Ads / GA4 / Merchant Center /
 Shopify data, adjusts the custom_label_3 bucket bids within guardrails, and
 emails the report via Brevo. Logic lives ONLY in the Python script.

 Task: \JL BI\Google Shopping Weekly Tune-up (StehlenAuto.com), Mondays 07:00.
 Logs: C:\Apps\Scripts\logs\gshop-weekly-tuneup-*.log (+ gshop-weekly-tuneup.jsonl)

 CONFIG secrets are filled in the SERVER copy only (never commit them):
   Google OAuth (client id / secret / refresh token from .secrets/google-ads-token.json),
   Shopify admin token, Brevo API key, OpenAI API key (AI analyst section).

 EXIT CODES: 0 ok · 1 a data source failed (report still sent) · 2 email failed / config
================================================================================
#>
[CmdletBinding()]
param([switch]$DryRun)

# ============================== CONFIG ========================================
$GoogleClientId     = ''
$GoogleClientSecret = ''
$GoogleRefreshToken = ''
$ShopDomain         = 'http-stehlenauto-com.myshopify.com'
$ShopifyToken       = ''
$BrevoApiKey        = ''
$OpenAiApiKey       = ''                 # AI analyst (advisory); blank = report without it
$AiModel            = 'gpt-6-astra'
$EmailTo            = 'support@robome.io'
$ScriptDir          = 'C:\Apps\Scripts'
$PyScript           = Join-Path $ScriptDir 'gshop-weekly-tuneup.py'
$LogDir             = Join-Path $ScriptDir 'logs'
# ==============================================================================

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$LogFile = Join-Path $LogDir ("gshop-weekly-tuneup-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
if (-not ($GoogleRefreshToken -and $ShopifyToken -and $BrevoApiKey)) { "CONFIG: missing secrets" | Out-File $LogFile; exit 2 }
$cmd = Get-Command py, python -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $cmd) { "CONFIG: python not found" | Out-File $LogFile; exit 2 }

$env:GOOGLE_OAUTH_CLIENT_ID     = $GoogleClientId
$env:GOOGLE_OAUTH_CLIENT_SECRET = $GoogleClientSecret
$env:GOOGLE_OAUTH_REFRESH_TOKEN = $GoogleRefreshToken
$env:SHOPIFY_SHOP_URL           = $ShopDomain
$env:SHOPIFY_ADMIN_TOKEN        = $ShopifyToken
$env:BREVO_API_KEY              = $BrevoApiKey
$env:TUNEUP_EMAIL_TO            = $EmailTo
$env:OPENAI_API_KEY             = $OpenAiApiKey
$env:AI_MODEL                   = $AiModel
$env:TUNEUP_LOG_DIR             = $LogDir
$env:PYTHONIOENCODING           = 'utf-8'

$pyArgs = @($PyScript)
if (-not $DryRun) { $pyArgs += @('--apply', '--email') }
if ((Split-Path $cmd.Source -Leaf) -eq 'py.exe') { $pyArgs = @('-3') + $pyArgs }
& $cmd.Source @pyArgs *>&1 | Out-File -FilePath $LogFile -Encoding utf8
exit $LASTEXITCODE
