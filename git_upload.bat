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



:: ---- Commit message ----------------------------------------
if "%~1"=="" (
    set "COMMIT_MSG=%DEFAULT_MSG%"
) else (
    set "COMMIT_MSG=%~1"
)

:: ---- Branch ------------------------------------------------
if "%~2"=="" (
    set "BRANCH=%DEFAULT_BRANCH%"
    echo [INFO] Using default branch: %BRANCH%
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

:: Since the previous git_upload.bat script was encountering issues when being run
:: on a schedule, I have removed all of the extra checks and prompts, parsing the script
:: down to the simplest form possible.  This script will now simply stage, commit, and push
:: any changes to the specified branch.

:: ---- Stage, commit, and push -------------------------------
git add -A
git commit -m "%COMMIT_MSG%"
git push origin "%BRANCH%"
