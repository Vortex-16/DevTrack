# DevTrack One-Click Installer & Launcher
$ErrorActionPreference = "Stop"

try {
    Write-Host "Starting DevTrack Setup..." -ForegroundColor Cyan

    $CurrentDir = Get-Location
    $ServerDir = "$CurrentDir\server"
    $ClientDir = "$CurrentDir\client"

    # 1. Setup Backend (Node.js)
    Write-Host "`nChecking Backend Dependencies..." -ForegroundColor Yellow
    if (-not (Test-Path "$ServerDir\node_modules")) {
        Write-Host "Installing NPM Packages for Backend (this may take a minute)..."
        Push-Location $ServerDir
        npm install
        Pop-Location
    }
    Write-Host "Backend Ready" -ForegroundColor Green

    # 2. Setup Frontend (React/Node)
    Write-Host "`nChecking Frontend Dependencies..." -ForegroundColor Yellow
    if (-not (Test-Path "$ClientDir\node_modules")) {
        Write-Host "Installing NPM Packages for Frontend (this may take a minute)..."
        Push-Location $ClientDir
        npm install
        Pop-Location
    }
    Write-Host "Frontend Ready" -ForegroundColor Green

    # 3. Launch Services
    Write-Host "`nLaunching Services..." -ForegroundColor Cyan

    # Start Backend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$ServerDir'; npm run dev" -WindowStyle Normal
    Write-Host "Started Backend Server"

    # Start Frontend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$ClientDir'; npm run dev" -WindowStyle Normal
    Write-Host "Started Frontend Client"

    Write-Host "`nDevTrack is running! Open http://localhost:5173 to view." -ForegroundColor Green
    Write-Host "NOTE: To stop, simply close the opened PowerShell windows." -ForegroundColor Gray
} catch {
    Write-Host "`nAn error occurred:`n$($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "`nPress Enter to exit this launcher..."
