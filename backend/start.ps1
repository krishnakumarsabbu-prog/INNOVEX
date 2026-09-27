Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting INNOVEX Backend Server (FastAPI + Uvicorn)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Set-Location $PSScriptRoot
try {
    py run.py
} catch {
    python run.py
}
