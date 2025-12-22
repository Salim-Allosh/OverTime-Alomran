@echo off
echo Stopping old server...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *uvicorn*" 2>nul
taskkill /F /IM python.exe /FI "COMMANDLINE eq *uvicorn*" 2>nul
timeout /t 2 /nobreak >nul

echo Starting new server...
cd /d "%~dp0"
start "Backend Server" cmd /k "py -3 -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"
echo.
echo Server is starting... Please wait a few seconds.
echo.
pause


