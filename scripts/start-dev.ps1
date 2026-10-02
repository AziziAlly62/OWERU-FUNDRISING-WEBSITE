# OWERU - Start full dev system (MySQL + PHP backend + Vite frontend)
# Tumia: powershell -ExecutionPolicy Bypass -File scripts\start-dev.ps1

$ErrorActionPreference = 'Continue'
$Root = Split-Path $PSScriptRoot -Parent
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'
$Php = 'C:\xampp\php\php.exe'
$MysqlExe = 'C:\xampp\mysql\bin\mysqld.exe'

Write-Host "== OWERU dev system ==" -ForegroundColor Cyan

# 1) MySQL
$mysqlUp = Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue -InformationLevel Quiet
if (-not $mysqlUp) {
    Write-Host "MySQL haipo. Inajaribu kuizindua..." -ForegroundColor Yellow
    Start-Process -FilePath $MysqlExe -WindowStyle Hidden
    Start-Sleep -Seconds 6
}
$mysqlUp = Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue -InformationLevel Quiet
if (-not $mysqlUp) {
    Write-Host "MySQL imeshindwa kuanza. Fungua XAMPP Control -> Start MySQL kwanza." -ForegroundColor Red
}
else { Write-Host "MySQL: running (port 3306)" -ForegroundColor Green }

# 2) Backend (Laravel via php -S + serve-router)
# IMPORTANT: php -S is single-threaded by default, so concurrent browser
# requests queue up (a 3-call page took ~10s instead of ~1.5s).
# PHP_CLI_SERVER_WORKERS spawns parallel workers -> 8x faster under load.
$started = Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue
if ($started) { Write-Host "Backend: ikishafanya kazi http://127.0.0.1:8001" -ForegroundColor Green }
else {
    Write-Host "Anzisha backend... (php -S 127.0.0.1:8001 -t public serve-router.php, workers=8)" -ForegroundColor Yellow
    $env:PHP_CLI_SERVER_WORKERS = '8'
    Start-Process -FilePath $Php -ArgumentList '-S','127.0.0.1:8001','-t','public','serve-router.php' -WorkingDirectory $Backend -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Host "Backend: http://127.0.0.1:8001" -ForegroundColor Green
}

# 3) Frontend (Vite)
$viteAvail = Test-NetConnection -ComputerName 127.0.0.1 -Port 5173 -WarningAction SilentlyContinue -InformationLevel Quiet
if (-not $viteAvail) {
    Write-Host "Anzisha frontend vite..." -ForegroundColor Yellow
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm run dev' -WorkingDirectory $Frontend -WindowStyle Hidden
    Start-Sleep -Seconds 5
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
}
else { Write-Host "Frontend: ikishafanya kazi http://localhost:5173" -ForegroundColor Green }

Write-Host ""
Write-Host "Vyote vimezinduliwa. Fungua http://localhost:5173" -ForegroundColor Cyan