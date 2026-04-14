@echo off
setlocal EnableDelayedExpansion

:: ============================================================
::  git_upload.bat  —  Stage, commit, and push changed files
::  Usage: git_upload.bat [commit message] [branch]
:: ============================================================

:: ---------- Configuration -----------------------------------
:: Set these if you want fixed defaults; otherwise they are
:: prompted at runtime or taken from command-line arguments.
set "DEFAULT_BRANCH=main"
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set "CURRENT_DATE=%%I"
set "DEFAULT_MSG=AgWater-AutoUpdate-%CURRENT_DATE%"
:: ------------------------------------------------------------

:: Check that Git is installed
where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed or not on PATH.
    echo         Download it from https://git-scm.com/
    pause
    exit /b 1
)

:: Make sure we are inside a Git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] This folder is not a Git repository.
    echo         Run "git init" first, or cd into your repo.
    pause
    exit /b 1
)

:: ---- Commit message ----------------------------------------
if "%~1"=="" (
    set "COMMIT_MSG=%DEFAULT_MSG%"
) else (
    set "COMMIT_MSG=%~1"
)

:: ---- Branch ------------------------------------------------
if "%~2"=="" (
    set "BRANCH=%DEFAULT_BRANCH%"
    echo [INFO] Using default branch: !BRANCH!
) else (
    set "BRANCH=%~2"
)

:: ---- Show status -------------------------------------------
echo.
echo ============================================================
echo  Repository: %CD%
echo  Branch    : %BRANCH%
echo  Message   : %COMMIT_MSG%
echo ============================================================
echo.
echo [INFO] Changed files:
git status --short
echo.

:: Abort if there is nothing to commit
git diff --quiet --cached -- >nul 2>&1
git diff --quiet -- >nul 2>&1
:: Check working tree AND index together
git status --porcelain > "%TEMP%\_git_status.tmp" 2>&1
set "HAS_CHANGES="
for /f %%L in ("%TEMP%\_git_status.tmp") do set "HAS_CHANGES=1"
del "%TEMP%\_git_status.tmp" >nul 2>&1

if not defined HAS_CHANGES (
    echo [INFO] Nothing to commit — working tree is clean.
    pause
    exit /b 0
)

:: ---- Stage all changes -------------------------------------
echo [STEP 1/3] Staging all changes...
git add --all
if errorlevel 1 (
    echo [ERROR] "git add" failed.
    pause
    exit /b 1
)

:: ---- Commit ------------------------------------------------
echo [STEP 2/3] Committing...
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo [ERROR] "git commit" failed.
    pause
    exit /b 1
)

:: ---- Push --------------------------------------------------
echo [STEP 3/3] Pushing to origin/%BRANCH%...
git push origin %BRANCH%
if errorlevel 1 (
    echo.
    echo [ERROR] Push failed.  Common reasons:
    echo   - No remote called "origin"  ^(run: git remote add origin ^<url^>^)
    echo   - Authentication error       ^(check your credentials / SSH key^)
    echo   - Branch does not exist yet  ^(first push? try: git push -u origin %BRANCH%^)
    pause
    exit /b 1
)

echo.
echo [SUCCESS] All changes pushed to origin/%BRANCH%.
echo.
exit /b 0
