# OWERU - Backup DB + receipts
# Tumia: powershell -ExecutionPolicy Bypass -File scripts\backup.ps1

$Root = Split-Path $PSScriptRoot -Parent
$Backend = Join-Path $Root 'backend'
$Dest = Join-Path $Root 'backups'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

$mysql = 'C:\xampp\mysql\bin\mysqldump.exe'
$db = 'oweru'
$sqlOut = Join-Path $Dest "oweru-$Stamp.sql"

Write-Host "Backup DB -> $sqlOut" -ForegroundColor Cyan
& $mysql -u root $db > $sqlOut 2>&1
if ($?) {
    Write-Host "DB backup OK ($((Get-Item $sqlOut).Length) bytes)" -ForegroundColor Green
} else {
    Write-Host "DB backup IMESHINDIKANA. Angalia MySQL service." -ForegroundColor Red
}

$receipts = Join-Path $Backend 'storage\app\public'
if (Test-Path $receipts) {
    $rOut = Join-Path $Dest "receipts-$Stamp"
    robocopy $receipts $rOut /E /NFL /NDL /NJH /NJS | Out-Null
    Write-Host "Receipts backup -> $rOut" -ForegroundColor Green
}

# Hifadhi nakala za mwisho 14
Get-ChildItem $Dest -Filter 'oweru-*.sql' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 14 | Remove-Item -Force
Write-Host "Kamilika." -ForegroundColor Cyan