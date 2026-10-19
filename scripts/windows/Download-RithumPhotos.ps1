<#
================================================================================
 Download-RithumPhotos.ps1  -  Stehlen Auto  (Rithum/ChannelAdvisor -> server)
================================================================================

 WHAT IT DOES
   For each CB Item Name in the input CSV (the 426 new Shopify drafts), finds
   the item's product images on Rithum (ChannelAdvisor) and downloads them into
   a per-item folder for partner review:

       <OutDir>\<CBItemName>\01-ITEMIMAGEURL1.jpg
                            \02-ITEMIMAGEURL2.jpg ...

   ACCOUNT/PROFILE PICKING - same logic as the fitment sync:
     * CA profile IDs are tried IN ORDER from $ProfileIds (comma-delimited,
       profile #1 first, fall through only if no usable match).
     * Within a profile, CA SKUs are '<CBItemName>-NNN' (3-digit counter).
       Suffixes -601 / -801 are ALWAYS excluded (internal variants).
     * Candidates are checked in ascending suffix order; the FIRST SKU that
       actually has >=1 image wins - capture and stop.

   Resume-safe: an item whose folder already contains images is skipped
   (use -Force to re-download). A per-run manifest CSV records every image
   (item, profile, matched SKU, placement, URL, saved path) plus a status row
   for items with no images / not found - that manifest is the review index
   and the input for the later Shopify upload step.

 FIRST-TIME SETUP (server, PowerShell 5.1+)
   1. Copy this file + the input CSV somewhere stable, e.g. C:\Scripts\
   2. Fill in the CONFIG block (or set env vars CA_FITMENT_APPLICATION_ID,
      CA_FITMENT_SHARED_SECRET, CA_FITMENT_REFRESH_TOKEN, CA_FITMENT_PROFILE_ID
      - env vars win if both are set).
   3. Test one item, no downloads:
        powershell -ExecutionPolicy Bypass -File C:\Scripts\Download-RithumPhotos.ps1 -DryRun -ItemName BGHD-PAT99-AM-MB
   4. Full dry run (lists what would be downloaded):
        powershell -ExecutionPolicy Bypass -File C:\Scripts\Download-RithumPhotos.ps1 -DryRun
   5. Go live:
        powershell -ExecutionPolicy Bypass -File C:\Scripts\Download-RithumPhotos.ps1

 EXIT CODES (Task Scheduler "Last Run Result")
   0 = success, every item got >=1 image
   2 = configuration error (missing credentials / input CSV)
   3 = completed, but one or more items had NO images or NO match (see manifest)
================================================================================
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$Force,           # re-download items whose folder already has images
    [string]$ItemName = '',   # limit to a single CB Item Name (testing)
    [string]$OutDirOverride = ''  # photo output root (defaults to .\rithum-photos)
)

# ============================== CONFIG ========================================
# Rithum / ChannelAdvisor OAuth (same app + profiles as the fitment sync).
# Leave blank to use env vars CA_FITMENT_APPLICATION_ID / CA_FITMENT_SHARED_SECRET
# / CA_FITMENT_REFRESH_TOKEN / CA_FITMENT_PROFILE_ID (env wins if both set).
$AppId        = ''
$SharedSecret = ''
$RefreshToken = ''
$ProfileIds   = ''            # comma-delimited, order matters: try #1 first

# Input CSV (from repo: data/exports/new-drafts-photo-queue-2026-08-25.csv).
# Needs a CBItemName column; other columns are carried into the manifest.
$InputCsv = Join-Path $PSScriptRoot 'new-drafts-photo-queue-2026-08-25.csv'

# Where per-item photo folders are written (partner review root)
$OutDir = Join-Path $PSScriptRoot 'rithum-photos'
if ($OutDirOverride) { $OutDir = $OutDirOverride }

$ThrottleMs = 250             # CA allows ~5 req/s per app - do not burst
$LogDir     = Join-Path $PSScriptRoot 'logs'
# ============================ END CONFIG ======================================

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$stamp    = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$logFile  = Join-Path $LogDir "rithum-photos_$stamp.log"
$manifest = Join-Path $LogDir "rithum-photos-manifest_$stamp.csv"
function Log { param([string]$Msg,[string]$Level='INFO')
    $line = "{0} [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Msg
    $line | Tee-Object -FilePath $logFile -Append | Write-Host }
function Fail { param([string]$Msg,[int]$Code) ; Log $Msg 'ERROR' ; exit $Code }

Log "=== Rithum photo download START (DryRun=$($DryRun.IsPresent) Force=$($Force.IsPresent) ItemName='$ItemName') ==="

# ----- credentials ------------------------------------------------------------
if ($env:CA_FITMENT_APPLICATION_ID) { $AppId        = $env:CA_FITMENT_APPLICATION_ID }
if ($env:CA_FITMENT_SHARED_SECRET)  { $SharedSecret = $env:CA_FITMENT_SHARED_SECRET }
if ($env:CA_FITMENT_REFRESH_TOKEN)  { $RefreshToken = $env:CA_FITMENT_REFRESH_TOKEN }
if ($env:CA_FITMENT_PROFILE_ID)     { $ProfileIds   = $env:CA_FITMENT_PROFILE_ID }
if (-not $AppId -or -not $SharedSecret -or -not $RefreshToken -or -not $ProfileIds) {
    Fail 'Missing Rithum credentials (AppId/SharedSecret/RefreshToken/ProfileIds).' 2 }
if (-not (Test-Path $InputCsv)) { Fail "Input CSV not found: $InputCsv" 2 }

$profiles = @($ProfileIds -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
Log "Profiles (in fall-through order): $($profiles -join ', ')"

# ----- OAuth: refresh-token flow, ~30 min token, refresh proactively ----------
$script:Token = $null ; $script:TokenExpires = Get-Date
function Get-CaToken {
    $basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$AppId`:$SharedSecret"))
    $resp = Invoke-RestMethod -Method Post -Uri 'https://api.channeladvisor.com/oauth2/token' `
        -Headers @{ Authorization = "Basic $basic" } `
        -ContentType 'application/x-www-form-urlencoded' `
        -Body "grant_type=refresh_token&refresh_token=$([Uri]::EscapeDataString($RefreshToken))"
    $script:Token = $resp.access_token
    $script:TokenExpires = (Get-Date).AddSeconds([int]$resp.expires_in - 90)
    Log 'Obtained CA access token.'
}
function Invoke-CaGet { param([string]$Uri)
    if (-not $script:Token -or (Get-Date) -gt $script:TokenExpires) { Get-CaToken }
    try {
        return Invoke-RestMethod -Method Get -Uri $Uri -Headers @{ Authorization = "Bearer $($script:Token)" }
    } catch {
        $status = $null ; try { $status = [int]$_.Exception.Response.StatusCode } catch {}
        if ($status -eq 401) {  # token died mid-run: refresh once and retry
            Log '401 from CA - refreshing token and retrying once.' 'WARN'
            Get-CaToken
            return Invoke-RestMethod -Method Get -Uri $Uri -Headers @{ Authorization = "Bearer $($script:Token)" }
        }
        throw
    }
}

# ----- load input -------------------------------------------------------------
$queue = @(Import-Csv $InputCsv)
if ($ItemName) { $queue = @($queue | Where-Object { $_.CBItemName -eq $ItemName }) }
if ($queue.Count -eq 0) { Fail 'Input queue is empty (bad CSV or -ItemName not found).' 2 }
Log "Queue: $($queue.Count) item(s)"
if (-not $DryRun -and -not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

'CBItemName,Status,ProfileId,MatchedSku,Position,PlacementName,Url,SavedPath' | Out-File $manifest -Encoding utf8
function Manifest { param($i,$s,$p,$m,$pos,$pl,$u,$sp)
    ('"{0}","{1}","{2}","{3}","{4}","{5}","{6}","{7}"' -f $i,$s,$p,$m,$pos,$pl,$u,$sp) | Out-File $manifest -Append -Encoding utf8 }

# ----- main loop --------------------------------------------------------------
$ok = 0 ; $noImages = 0 ; $notFound = 0 ; $skipped = 0 ; $errors = 0
foreach ($row in $queue) {
    $item = $row.CBItemName.Trim()
    if (-not $item) { continue }
    $itemDir = Join-Path $OutDir $item

    if (-not $Force -and (Test-Path $itemDir) -and @(Get-ChildItem $itemDir -File -ErrorAction SilentlyContinue).Count -gt 0) {
        Log "$item : SKIP (folder already has images; use -Force to refresh)"
        $skipped++ ; continue
    }

    try {
        $hit = $null
        # Pass 1: standard -NNN SKUs (excluding internal -601/-801), all profiles.
        # Pass 2 (photos only, unlike the fitment sync): some items exist in CA
        # ONLY as an internal -601/-801 variant - those still carry the product
        # photos, so fall back to them and flag the manifest row for review.
        foreach ($allowInternal in @($false, $true)) {
            foreach ($profId in $profiles) {                # profile #1 first, fall through
                $flt = [Uri]::EscapeDataString("startswith(Sku, '$item-')")
                $data = Invoke-CaGet "https://api.channeladvisor.com/v1/Products?profileId=$profId&`$filter=$flt&`$select=ID,Sku&`$top=20"
                Start-Sleep -Milliseconds $ThrottleMs

                $cands = @($data.value | Where-Object {
                        $_.Sku -match '-(\d{3})$' -and
                        ($_.Sku.EndsWith('-601') -or $_.Sku.EndsWith('-801')) -eq $allowInternal
                    } | Sort-Object { [int]($_.Sku -replace '.*-(\d{3})$','$1') })

                foreach ($c in $cands) {                    # ascending; first WITH images wins
                    $imgs = Invoke-CaGet "https://api.channeladvisor.com/v1/Products($($c.ID))/Images"
                    Start-Sleep -Milliseconds $ThrottleMs
                    # CA returns placements in STRING order (ITEMIMAGEURL1, ITEMIMAGEURL10,
                    # ITEMIMAGEURL2 ...) - sort numerically so file 02 is really image #2.
                    $urls = @($imgs.value | Where-Object { $_.Url } | Sort-Object {
                            if ($_.PlacementName -match '(\d+)$') { [int]$Matches[1] } else { 999 } })
                    if ($urls.Count -gt 0) { $hit = @{ ProfileId = $profId; Sku = $c.Sku; Images = $urls; Internal = $allowInternal } ; break }
                }
                if ($hit) { break }
            }
            if ($hit) { break }
        }

        if (-not $hit) {
            Log "$item : NO IMAGES FOUND in any profile" 'WARN'
            Manifest $item 'NO_IMAGES' '' '' '' '' '' ''
            $noImages++ ; continue
        }

        $status = if ($hit.Internal) { 'OK_FALLBACK_INTERNAL' } else { 'OK' }
        Log "$item : $($hit.Images.Count) image(s) via profile $($hit.ProfileId) sku $($hit.Sku)$(if($hit.Internal){' [internal-variant fallback]'})$(if($DryRun){' [dry run]'})"
        $pos = 0
        foreach ($img in $hit.Images) {
            $pos++
            $ext = [IO.Path]::GetExtension(($img.Url -split '\?')[0]) ; if (-not $ext) { $ext = '.jpg' }
            $file = ('{0:d2}-{1}{2}' -f $pos, ($img.PlacementName -replace '[^\w\-]',''), $ext)
            $dest = Join-Path $itemDir $file
            if (-not $DryRun) {
                if (-not (Test-Path $itemDir)) { New-Item -ItemType Directory -Path $itemDir -Force | Out-Null }
                Invoke-WebRequest -Uri $img.Url -OutFile $dest -UseBasicParsing
            }
            Manifest $item $status $hit.ProfileId $hit.Sku $pos $img.PlacementName $img.Url $dest
        }
        $ok++
    } catch {
        Log "$item : ERROR $($_.Exception.Message)" 'ERROR'
        Manifest $item 'ERROR' '' '' '' '' '' ''
        $errors++
    }
}

Log "=== DONE. OK=$ok  NO_IMAGES=$noImages  NOT_FOUND=$notFound  SKIPPED=$skipped  ERRORS=$errors ==="
Log "Manifest: $manifest"
if ($errors -gt 0 -or $noImages -gt 0) { exit 3 }
exit 0
