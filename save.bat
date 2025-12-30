@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cls
echo ========================================
echo   Save and Push Updates to GitHub
echo ========================================
echo.

:: Check Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed!
    echo Please install Git from: https://git-scm.com/downloads
    pause
    exit /b 1
)

:: Check .git
if not exist ".git" (
    echo [ERROR] This folder is not a Git repository!
    echo Please run: git init
    pause
    exit /b 1
)

:: Check Remote
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Project is not linked to GitHub
    echo.
    set /p REPO_URL="Enter Repository URL (or press Enter to skip): "
    if not "!REPO_URL!"=="" (
        git remote add origin !REPO_URL!
        if errorlevel 1 (
            git remote set-url origin !REPO_URL!
        )
        git branch -M main 2>nul
        echo [OK] Linked to GitHub
        echo.
    ) else (
        echo [WARNING] Changes will be saved locally only (no push)
        echo.
    )
)

echo [1/4] Checking for changes...
git status --short >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Error checking status
    pause
    exit /b 1
)

:: Show changes
echo.
echo Detected changes:
git status --short
echo.

:: Check for changes
for /f %%i in ('git status --porcelain') do set HAS_CHANGES=1
if not defined HAS_CHANGES (
    echo [INFO] No new changes to save.
    echo.
    goto :check_remote
)

echo [2/4] Adding all changes...
git add .
if errorlevel 1 (
    echo [ERROR] Failed to add files
    pause
    exit /b 1
)
echo [OK] All files added
echo.

:: Generate Commit Message
set "COMMIT_MSG=Auto Update - %date% %time%"
set "COMMIT_MSG=!COMMIT_MSG: =!"

:: Improve Commit Message based on file paths
for /f "tokens=*" %%i in ('git diff --cached --name-only') do (
    set "FILE_NAME=%%i"
    if "!FILE_NAME:frontend=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=Update Frontend - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:backend-new=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=Update Backend API (Laravel) - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:app\Services=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=Update Services Layer - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:contracts=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=Update Contracts System - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:daily-reports=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=Update Daily Reports - %date%"
        goto :commit_done
    )
)

:commit_done
echo [3/4] Committing changes...
git commit -m "!COMMIT_MSG!"
if errorlevel 1 (
    echo [WARNING] No changes to commit or commit failed
    echo.
    goto :check_remote
)
echo [OK] Changes saved successfully
echo.

:check_remote
:: Check Remote again
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [INFO] No GitHub repository linked.
    echo Changes are saved locally only.
    echo.
    goto :success
)

echo [4/4] Pushing to GitHub...
echo.

:: Push
git push origin main 2>&1
if errorlevel 1 (
    :: Try push with -u checks
    git push -u origin main 2>&1
    if errorlevel 1 (
        echo.
        echo [WARNING] Failed to push to GitHub
        echo.
        echo It seems your local project is different from GitHub history.
        echo commonly happens if you re-initialized the project.
        echo.
        set /p FORCE_PUSH="Do you want to FORCE push (Overwrite GitHub with Local)? (Y/N): "
        if /i "!FORCE_PUSH!"=="Y" (
             git push -f origin main
             if not errorlevel 1 goto :success
        )
        
        echo.
        echo [WARNING] Push failed or cancelled.
        echo Possible reasons:
        echo - Internet connection missing
        echo - Authentication failed
        echo - No permission
        echo.
        echo Changes are saved LOCALLY. You can retry pushing later with:
        echo   git push
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   [OK] Success!
echo ========================================
echo.
echo [OK] Saved locally
echo [OK] Pushed to GitHub
echo.
echo Project URL:
git remote get-url origin
echo.
echo Last Commit:
git log -1 --oneline
echo.

:success
echo ========================================
echo   Operation Completed Successfully!
echo ========================================
echo.
timeout /t 3 >nul
exit /b 0

