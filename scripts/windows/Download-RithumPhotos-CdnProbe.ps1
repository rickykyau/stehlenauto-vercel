<#
================================================================================
 Download-RithumPhotos-CdnProbe.ps1  -  Stehlen Auto  (phase 3: CDN probe pass)
================================================================================

 Final-pass photo recovery for items whose CA products were DELETED (the API
 404s) but whose image files still exist on the Rithum CDN
 (d3d71ba2asa5oz.cloudfront.net/<account>/images/<name>.jpg).

 For each queue item whose output folder is still empty:
   1. Collect candidate filename BASES: every CA Sku for the item from the
      JLDataMart.dbo.CAProduct bridge (counter suffix -NNN stripped, lowercased)
      plus the CB Item Name itself (lowercased).
   2. Probe HEAD <base><suffix>.jpg for the suffix conventions observed across
      2,136 confirmed downloads (-p, -p1.., -t-1.., -g-1.., -t-g, -g-info1..,
      -ws-1.., and bare) in each account folder (60000167, 33001142, 60000168,
      60000669, 60000507).
   3. First account folder with >=1 hit wins - download all its hits, in
      main-image-first order. Manifest status: OK_CDN_PROBE.

 NOTE: heuristic recovery - the team review pass MUST eyeball these items.
 Env vars: CB_DB_USER / CB_DB_PASS (for the bridge query). No CA API creds
 needed - the CDN is public.
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
$ThrottleMs = 100
$LogDir     = Join-Path $PSScriptRoot 'logs'
$CdnRoot    = 'https://d3d71ba2asa5oz.cloudfront.net'
$Accounts   = @('60000167','33001142','60000168','60000669','60000507')
# main image first, then numbered/detail/gallery/infographic conventions
$Suffixes   = @('-p','','-p1','-p2','-p3','-p4','-p5','-p6','-p7','-p8','-p9',
                '-t-g','-g-g','-t','-g',
                '-t-1','-t-2','-t-3','-t-4','-t-5','-t-6','-t-7','-t-8','-t-9',
                '-g-1','-g-2','-g-3','-g-4','-g-5','-g-6','-g-7','-g-8','-g-9',
                '-ws-1','-ws-2','-ws-3',
                '-g-info1','-g-info2','-g-info3','-g-info4','-g-info5')

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$stamp    = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$logFile  = Join-Path $LogDir "rithum-photos-cdnprobe_$stamp.log"
$manifest = Join-Path $LogDir "rithum-photos-cdnprobe-manifest_$stamp.csv"
function Log { param([string]$Msg,[string]$Level='INFO')
    $line = '{0} [{1}] {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Msg
    $line | Tee-Object -FilePath $logFile -Append | Write-Host }
function Fail { param([string]$Msg,[int]$Code) ; Log $Msg 'ERROR' ; exit $Code }

if (-not $env:CB_DB_USER -or -not $env:CB_DB_PASS) { Fail 'Missing CB_DB_USER / CB_DB_PASS.' 2 }
if (-not (Test-Path $InputCsv)) { Fail "Input CSV not found: $InputCsv" 2 }

$queue = @(Import-Csv $InputCsv | Where-Object {
    $i = $_.CBItemName.Trim()
    if (-not $i) { return $false }
    if ($ItemName -and $i -ne $ItemName) { return $false }
    $d = Join-Path $OutDir $i
    -not ((Test-Path $d) -and @(Get-ChildItem $d -File -ErrorAction SilentlyContinue).Count -gt 0)
})
Log "=== CDN-probe photo pass START (DryRun=$DryRun) - $($queue.Count) item(s) still without photos ==="
if ($queue.Count -eq 0) { Log 'Nothing to do.' ; exit 0 }

# bridge: CbSku -> known CA sku bases
$inList = ($queue | ForEach-Object { "'" + $_.CBItemName.Trim().Replace("'","''") + "'" }) -join ','
$conn = New-Object System.Data.SqlClient.SqlConnection
$conn.ConnectionString = "Server=localhost;Database=JLDataMart;User ID=$($env:CB_DB_USER);Password=$($env:CB_DB_PASS)"
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT CbSku, Sku FROM dbo.CAProduct WHERE CbSku IN ($inList)"
$rdr = $cmd.ExecuteReader()
$bases = @{}   # lower(CbSku) -> ordered unique list of filename bases
while ($rdr.Read()) {
    $k = ([string]$rdr['CbSku']).ToLower()
    $b = ([string]$rdr['Sku']).ToLower() -replace '-\d{3}$',''
    if (-not $bases.ContainsKey($k)) { $bases[$k] = New-Object System.Collections.ArrayList }
    if (-not $bases[$k].Contains($b)) { [void]$bases[$k].Add($b) }
}
$rdr.Close() ; $conn.Close()

'CBItemName,Status,ProfileId,MatchedSku,Position,PlacementName,Url,SavedPath' | Out-File $manifest -Encoding utf8
function Manifest { param($i,$s,$p,$m,$pos,$pl,$u,$sp)
    ('"{0}","{1}","{2}","{3}","{4}","{5}","{6}","{7}"' -f $i,$s,$p,$m,$pos,$pl,$u,$sp) | Out-File $manifest -Append -Encoding utf8 }

function Test-CdnUrl { param([string]$Url)
    try {
        $r = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -TimeoutSec 10
        $len = 0 ; if ($r.Headers['Content-Length']) { $len = [long]$r.Headers['Content-Length'] }
        return ($r.StatusCode -eq 200 -and $len -gt 2048)   # skip placeholder/tiny files
    } catch { return $false }
}

$ok = 0 ; $noImages = 0 ; $errors = 0
foreach ($row in $queue) {
    $item = $row.CBItemName.Trim()
    $itemDir = Join-Path $OutDir $item
    $itemBases = New-Object System.Collections.ArrayList
    if ($bases.ContainsKey($item.ToLower())) { $bases[$item.ToLower()] | ForEach-Object { [void]$itemBases.Add($_) } }
    if (-not $itemBases.Contains($item.ToLower())) { [void]$itemBases.Add($item.ToLower()) }

    try {
        $hits = @()   # list of @{Url; Suffix; Account}
        foreach ($acct in $Accounts) {
            foreach ($base in $itemBases) {
                foreach ($suf in $Suffixes) {
                    $u = "$CdnRoot/$acct/images/$base$suf.jpg"
                    if (Test-CdnUrl $u) { $hits += @{ Url = $u; Suffix = $suf; Account = $acct; Base = $base } }
                    Start-Sleep -Milliseconds $ThrottleMs
                }
                if ($hits.Count -gt 0) { break }   # this base worked in this account
            }
            if ($hits.Count -gt 0) { break }       # first account with hits wins
        }

        if ($hits.Count -eq 0) {
            Log "$item : no CDN hits" 'WARN'
            Manifest $item 'NO_IMAGES' '' '' '' '' '' ''
            $noImages++ ; continue
        }

        Log "$item : $($hits.Count) CDN image(s) via account $($hits[0].Account) base $($hits[0].Base)$(if($DryRun){' [dry run]'})"
        $pos = 0
        foreach ($h in $hits) {
            $pos++
            $tag = if ($h.Suffix) { $h.Suffix.TrimStart('-') } else { 'main' }
            $file = ('{0:d2}-CDN-{1}.jpg' -f $pos, ($tag -replace '[^\w\-]',''))
            $dest = Join-Path $itemDir $file
            if (-not $DryRun) {
                if (-not (Test-Path $itemDir)) { New-Item -ItemType Directory -Path $itemDir -Force | Out-Null }
                Invoke-WebRequest -Uri $h.Url -OutFile $dest -UseBasicParsing
                Start-Sleep -Milliseconds $ThrottleMs
            }
            Manifest $item 'OK_CDN_PROBE' $h.Account $h.Base $pos $tag $h.Url $dest
        }
        $ok++
    } catch {
        Log "$item : ERROR $($_.Exception.Message)" 'ERROR'
        Manifest $item 'ERROR' '' '' '' '' '' ''
        $errors++
    }
}

Log "=== DONE. OK=$ok  NO_IMAGES=$noImages  ERRORS=$errors ==="
Log "Manifest: $manifest"
if ($errors -gt 0 -or $noImages -gt 0) { exit 3 }
exit 0
