@echo off
setlocal enabledelayedexpansion

REM ============================================
REM OverTime Development Server Startup Script
REM ============================================

REM Paths
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend-new"
set "FRONTEND=%ROOT%frontend"
set "PHP_CMD=C:\xampp\php\php.exe"
set "COMPOSER_PHAR=%ROOT%composer.phar"

echo.
echo ========================================
echo   Starting OverTime Development Servers
echo   (Laravel Backend + React Frontend)
echo ========================================
echo.

REM Kill old servers
echo [1/6] Stopping old servers...
echo   Stopping PHP processes (Backend)...
for /f "tokens=2" %%p in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%p >nul 2>&1
    if !errorlevel! equ 0 (
        echo   [OK] Stopped process on port 8000 (PID: %%p)
    )
)
taskkill /F /IM php.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] PHP processes stopped
) else (
    echo   [INFO] No PHP processes found
)

echo   Stopping Node processes (Frontend)...
for /f "tokens=2" %%p in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%p >nul 2>&1
    if !errorlevel! equ 0 (
        echo   [OK] Stopped process on port 5173 (PID: %%p)
    )
)
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Node processes stopped
) else (
    echo   [INFO] No Node processes found
)
timeout /t 2 /nobreak >nul
echo   [OK] Old servers stopped

REM Check PHP
echo [2/6] Checking PHP environment...
if not exist "%PHP_CMD%" (
  echo   [ERROR] PHP not found at %PHP_CMD%
  echo   Please ensure XAMPP is installed at C:\xampp
  pause
  exit /b 1
)
"%PHP_CMD%" -v >nul 2>&1
if errorlevel 1 (
  echo   [ERROR] Failed to execute PHP
  pause
  exit /b 1
)
echo   [OK] PHP is ready

REM Start Backend (Laravel)
echo [3/6] Starting Backend on port 8000...
cd /d "%BACKEND%"
echo   Starting Laravel server...
start "Backend Server - OverTime" "%PHP_CMD%" artisan serve --host 0.0.0.0 --port 8000
timeout /t 5 /nobreak >nul

REM Verify Backend
set "BACKEND_OK=0"
for /l %%i in (1,1,15) do (
    timeout /t 1 /nobreak >nul
    netstat -an 2>nul | findstr ":8000" | findstr "LISTENING" >nul 2>&1
    if !errorlevel! equ 0 (
        set "BACKEND_OK=1"
        echo   [OK] Backend is running on port 8000
        echo   [INFO] Laravel is serving API requests
        goto backend_done
    )
    if %%i lss 15 (
        echo   Waiting for Backend to start... (attempt %%i/15)
    )
)
if !BACKEND_OK! equ 0 (
    echo   [ERROR] Failed to start Backend or Backend not responding
    echo   Please check the "Backend Server - OverTime" window for errors
    echo   Make sure MySQL is running in XAMPP
    pause
    exit /b 1
)

:backend_done

REM Install Frontend dependencies
echo [4/6] Installing Frontend dependencies...
cd /d "%FRONTEND%"
if not exist "package.json" (
  echo   [ERROR] package.json not found
  pause
  exit /b 1
)

REM Find npm
set "NPM_CMD=npm.cmd"
where npm.cmd >nul 2>&1
if !errorlevel! equ 0 (
  for /f "delims=" %%i in ('where npm.cmd') do set "NPM_CMD=%%i"
)

echo   [INFO] Skipping npm install to save time (run manually if needed)
REM call "%NPM_CMD%" install

REM Start Frontend
echo [5/6] Starting Frontend on port 5173...
echo   Starting Vite server...
start "Frontend Server - OverTime" "%NPM_CMD%" run dev -- --host --port 5173 --strictPort
echo   Waiting for Frontend to start...
timeout /t 5 /nobreak >nul

REM Verify Frontend
set "FRONTEND_OK=0"
for /l %%i in (1,1,15) do (
    timeout /t 1 /nobreak >nul
    netstat -an 2>nul | findstr ":5173" | findstr "LISTENING" >nul 2>&1
    if !errorlevel! equ 0 (
        set "FRONTEND_OK=1"
        echo   [OK] Frontend is running on port 5173
        echo   [INFO] Frontend will auto-reload on code changes
        goto frontend_done
    )
    if %%i lss 15 (
        echo   Waiting for Frontend to start... (attempt %%i/15)
    )
)
if !FRONTEND_OK! equ 0 (
    echo   [ERROR] Failed to start Frontend or Frontend not responding
    echo   Please check the "Frontend Server - OverTime" window for errors
    pause
    exit /b 1
)

:frontend_done

REM Wait for Frontend to be ready
echo [6/6] Waiting for Frontend to be ready...
set "READY=0"
for /l %%i in (1,1,8) do (
  timeout /t 1 /nobreak >nul
  netstat -an 2>nul | findstr ":5173" | findstr "LISTENING" >nul 2>&1
  if !errorlevel! equ 0 (
    set "READY=1"
    echo   [OK] Frontend is ready!
    timeout /t 1 /nobreak >nul
    goto ready_done
  )
  echo   Waiting... (attempt %%i/8)
)
echo   [WARNING] Frontend may not be ready yet, but proceeding...

:ready_done

REM Display info and open browser
echo.
echo ========================================
echo   Servers are running successfully!
echo ========================================
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://localhost:5173
echo ========================================
echo.

REM Open browser
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173/"
if errorlevel 1 (
  echo   [WARNING] Failed to open browser automatically
  echo   Please open http://localhost:5173 manually
) else (
  echo   [OK] Browser opened
)

echo.
echo Browser opened automatically!
echo.
echo ========================================
echo   Servers are running in separate windows
echo   Backend:  "Backend Server - OverTime" window
echo   Frontend: "Frontend Server - OverTime" window
echo.
echo   To stop servers:
echo   - Close the server windows, OR
echo   - Run this script again (it will restart them)
echo ========================================
echo.
echo Press any key to exit (servers will keep running)...
pause >nul
