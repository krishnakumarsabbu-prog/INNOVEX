@echo off
echo ===================================================
echo Starting INNOVEX Backend Server (FastAPI + Uvicorn)
echo ===================================================
cd /d "%~dp0"
py run.py
if %ERRORLEVEL% NEQ 0 (
    python run.py
)
pause
