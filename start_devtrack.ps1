# DevTrack One-Click Installer & Launcher
Write-Host "🚀 Starting DevTrack Setup..." -ForegroundColor Cyan

$CurrentDir = Get-Location
$BackendDir = "$CurrentDir\Shell\backend"
$ClientDir = "$CurrentDir\client"
$LoggerScript = "$CurrentDir\Shell\win_activity_logger.py"

# 1. Setup Backend (Python)
Write-Host "`n📦 Checking Backend Dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "$BackendDir\venv")) {
    Write-Host "Creating Python Virtual Environment..."
    python -m venv "$BackendDir\venv"
}

# Activate & Install
& "$BackendDir\venv\Scripts\python" -m pip install -r "$BackendDir\requirements.txt" | Out-Null
Write-Host "✅ Backend Ready" -ForegroundColor Green

# 2. Setup Frontend (Node)
Write-Host "`n🎨 Checking Frontend Dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "$ClientDir\node_modules")) {
    Write-Host "Installing NPM Packages (this may take a minute)..."
    Push-Location $ClientDir
    npm install | Out-Null
    Pop-Location
}
Write-Host "✅ Frontend Ready" -ForegroundColor Green

# 3. Launch Services
Write-Host "`n🚀 Launching Services..." -ForegroundColor Cyan

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; .\venv\Scripts\python server.py" -WindowStyle Normal
Write-Host "Started Backend Server (Port 5000)"

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ClientDir'; npm run dev" -WindowStyle Normal
Write-Host "Started Frontend Client"

# Start Windows Activity Tracker
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; .\venv\Scripts\python '$LoggerScript'" -WindowStyle Minimized
Write-Host "Started Activity Logger (Minimized)"

Write-Host "`n✨ DevTrack is running! Open http://localhost:5173 to view." -ForegroundColor Green
Write-Host "NOTE: To stop, simply close the opened PowerShell windows." -ForegroundColor Gray
Read-Host "Press Enter to exit this launcher..."
