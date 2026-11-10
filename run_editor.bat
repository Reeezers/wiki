@echo off
title ES2 Localization Wiki Editor
cd /d "%~dp0"

echo ===================================================
echo   Endless Space 2 Localization Wiki Content Editor
echo   Security Protected: Password is 17ExTra
echo ===================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Starting Python server on port 8000...
    python server.py
    goto end
)

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Starting Node.js server on port 8000...
    node server.js
    goto end
)

echo ERROR: Neither Python nor Node.js was found in your PATH.
echo Please install Python 3.8+ or Node.js 18+ to run the editor server.
pause

:end
