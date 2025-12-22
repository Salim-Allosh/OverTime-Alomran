@echo off
cd /d "%~dp0"
echo Starting Backend Server...
py -3 -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
pause


