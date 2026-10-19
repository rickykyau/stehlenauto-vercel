<#
================================================================================
 Download-RithumPhotos-DbBridge.ps1  -  Stehlen Auto  (phase 2: DB-bridge pass)
================================================================================

 Second-pass photo fetch for items the SKU-prefix search missed.
 Runs ON jl-sql: uses the local JLDataMart.dbo.CAProduct mirror (CbSku column)
 to resolve each CB Item Name to exact CA ProductIds, then pulls images via
 GET /v1/Products(ID)/Images. No SKU guessing.

 Inputs (env vars, same as Download-RithumPhotos.ps1):
   CA_FITMENT_APPLICATION_ID / CA_FITMENT_SHARED_SECRET / CA_FITMENT_REFRESH_TOKEN
   CB_DB_USER / CB_DB_PASS   (JLDataMart read access, Server=localhost)

 Params mirror the phase-1 script; queue CSV defaults to the same file.
 Manifest status: OK_DB_BRIDGE (found via CAProduct bridge).
 Only items whose output folder is EMPTY are attempted (resume-safe).
================================================================================
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [string]$ItemName = '',
    [string]$OutDirOverride = ''
)

$InputCsv   = Join-Path $PSScriptRoot 'new-drafts-photo-queue-2026-08-25.csv'
$OutDir     = Join-Path $PSScriptRoot 'rithum-photos'
if ($OutDirOverride) { $OutDir = $OutDirOverride }
$ThrottleMs = 250
$LogDir     = Join-Path $PSScriptRoot 'logs'

# Profile preference: primary pair first (matches fitment sync), then the other
# API-visible accounts, then legacy 33001142 (present in DB mirror only).
$ProfileOrder = @(60000168, 60000669, 60000167, 60000507, 33001142)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$stamp    = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$logFile  = Join-Path $LogDir "rithum-photos-bridge_$stamp.log"
$manifest = Join-Path $LogDir "rithum-photos-bridge-manifest_$stamp.csv"
function Log { param([string]$Msg,[string]$Level='INFO')
    $line = '{0} [{1}] {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Msg
    $line | Tee-Object -FilePath $logFile -Append | Write-Host }
function Fail { param([string]$Msg,[int]$Code) ; Log $Msg 'ERROR' ; exit $Code }

$AppId = $env:CA_FITMENT_APPLICATION_ID ; $SharedSecret = $env:CA_FITMENT_SHARED_SECRET
$RefreshToken = $env:CA_FITMENT_REFRESH_TOKEN
if (-not $AppId -or -not $SharedSecret -or -not $RefreshToken) { Fail 'Missing CA credentials.' 2 }
if (-not $env:CB_DB_USER -or -not $env:CB_DB_PASS) { Fail 'Missing CB_DB_USER / CB_DB_PASS.' 2 }
if (-not (Test-Path $InputCsv)) { Fail "Input CSV not found: $InputCsv" 2 }

# ----- CA auth ----------------------------------------------------------------
$script:tok = $null ; $script:tokExpires = Get-Date
function Get-CaToken {
    if ($script:tok -and ((Get-Date) -lt $script:tokExpires.AddSeconds(-60))) { return $script:tok }
    $basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$AppId`:$SharedSecret"))
    $r = Invoke-RestMethod -Method Post -Uri 'https://api.channeladvisor.com/oauth2/token' `
        -Headers @{Authorization="Basic $basic"} `
        -Body @{grant_type='refresh_token';refresh_token=$RefreshToken}
    $script:tok = $r.access_token
    $script:tokExpires = (Get-Date).AddSeconds([int]$r.expires_in)
    Log 'Obtained CA access token.'
    return $script:tok
}
function Invoke-CaGet { param([string]$Uri)
    try { Invoke-RestMethod -Uri $Uri -Headers @{Authorization = "Bearer $(Get-CaToken)"} }
    catch {
        if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) {
            $script:tok = $null
            Invoke-RestMethod -Uri $Uri -Headers @{Authorization = "Bearer $(Get-CaToken)"}
        } else { throw }
    }
}

# ----- queue: items whose folder is still empty -------------------------------
$queue = @(Import-Csv $InputCsv | Where-Object {
    $i = $_.CBItemName.Trim()
    if (-not $i) { return $false }
    if ($ItemName -and $i -ne $ItemName) { return $false }
    $d = Join-Path $OutDir $i
    -not ((Test-Path $d) -and @(Get-ChildItem $d -File -ErrorAction SilentlyContinue).Count -gt 0)
})
Log "=== DB-bridge photo pass START (DryRun=$DryRun) - $($queue.Count) item(s) still without photos ==="
if ($queue.Count -eq 0) { Log 'Nothing to do.' ; exit 0 }

# ----- one SQL round-trip: CbSku -> candidate CA products ---------------------
$inList = ($queue | ForEach-Object { "'" + $_.CBItemName.Trim().Replace("'","''") + "'" }) -join ','
$conn = New-Object System.Data.SqlClient.SqlConnection
$conn.ConnectionString = "Server=localhost;Database=JLDataMart;User ID=$($env:CB_DB_USER);Password=$($env:CB_DB_PASS)"
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT CbSku, ProfileId, ProductId, Sku FROM dbo.CAProduct WHERE CbSku IN ($inList)"
$rdr = $cmd.ExecuteReader()
$bridge = @{}   # lower(CbSku) -> list of @{ProfileId;ProductId;Sku}
while ($rdr.Read()) {
    $k = ([string]$rdr['CbSku']).ToLower()
    if (-not $bridge.ContainsKey($k)) { $bridge[$k] = New-Object System.Collections.ArrayList }
    [void]$bridge[$k].Add(@{ ProfileId = [int]$rdr['ProfileId']; ProductId = [long]$rdr['ProductId']; Sku = [string]$rdr['Sku'] })
}
$rdr.Close() ; $conn.Close()
Log "CAProduct bridge rows loaded for $($bridge.Keys.Count) of $($queue.Count) item(s)."

'CBItemName,Status,ProfileId,MatchedSku,Position,PlacementName,Url,SavedPath' | Out-File $manifest -Encoding utf8
function Manifest { param($i,$s,$p,$m,$pos,$pl,$u,$sp)
    ('"{0}","{1}","{2}","{3}","{4}","{5}","{6}","{7}"' -f $i,$s,$p,$m,$pos,$pl,$u,$sp) | Out-File $manifest -Append -Encoding utf8 }

function SuffixRank { param([string]$Sku)
    # standard -001.. first (rank 0), then -2xx/-3xx/-9xx (1), then -601/-602/-801 internal (2)
    if ($Sku -match '-(\d{3})$') {
        $n = [int]$Matches[1]
        if ($n -ge 600 -and $n -lt 700) { return 2 }
        if ($n -ge 800 -and $n -lt 900) { return 2 }
        if ($n -lt 100) { return 0 }
        return 1
    }
    return 3
}

# ----- main loop --------------------------------------------------------------
$ok = 0 ; $noImages = 0 ; $notInBridge = 0 ; $errors = 0
foreach ($row in $queue) {
    $item = $row.CBItemName.Trim()
    $itemDir = Join-Path $OutDir $item
    $cands = $bridge[$item.ToLower()]
    if (-not $cands -or $cands.Count -eq 0) {
        Log "$item : not in CAProduct bridge" 'WARN'
        Manifest $item 'NOT_IN_BRIDGE' '' '' '' '' '' ''
        $notInBridge++ ; continue
    }
    # order: profile preference, then suffix class, then ascending suffix
    $ordered = $cands | Sort-Object `
        @{Expression={ $i = $ProfileOrder.IndexOf([int]$_.ProfileId); if ($i -lt 0) { 99 } else { $i } }}, `
        @{Expression={ SuffixRank $_.Sku }}, `
        @{Expression={ if ($_.Sku -match '-(\d{3})$') { [int]$Matches[1] } else { 999 } }}
    try {
        $hit = $null
        foreach ($c in $ordered) {
            try {
                $imgs = Invoke-CaGet "https://api.channeladvisor.com/v1/Products($($c.ProductId))/Images"
            } catch {
                Log "$item : ProductId $($c.ProductId) (profile $($c.ProfileId)) images call failed: $($_.Exception.Message)" 'WARN'
                Start-Sleep -Milliseconds $ThrottleMs ; continue
            }
            Start-Sleep -Milliseconds $ThrottleMs
            $urls = @($imgs.value | Where-Object { $_.Url } | Sort-Object {
                    if ($_.PlacementName -match '(\d+)$') { [int]$Matches[1] } else { 999 } })
            if ($urls.Count -gt 0) { $hit = @{ ProfileId = $c.ProfileId; Sku = $c.Sku; Images = $urls } ; break }
        }
        if (-not $hit) {
            Log "$item : bridge candidates exist ($($cands.Count)) but none have images" 'WARN'
            Manifest $item 'NO_IMAGES' '' '' '' '' '' ''
            $noImages++ ; continue
        }
        Log "$item : $($hit.Images.Count) image(s) via profile $($hit.ProfileId) sku $($hit.Sku) [db-bridge]$(if($DryRun){' [dry run]'})"
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
            Manifest $item 'OK_DB_BRIDGE' $hit.ProfileId $hit.Sku $pos $img.PlacementName $img.Url $dest
        }
        $ok++
    } catch {
        Log "$item : ERROR $($_.Exception.Message)" 'ERROR'
        Manifest $item 'ERROR' '' '' '' '' '' ''
        $errors++
    }
}

Log "=== DONE. OK=$ok  NO_IMAGES=$noImages  NOT_IN_BRIDGE=$notInBridge  ERRORS=$errors ==="
Log "Manifest: $manifest"
if ($errors -gt 0 -or $noImages -gt 0 -or $notInBridge -gt 0) { exit 3 }
exit 0
