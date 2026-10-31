@echo off
TITLE LegalSaathi AI - Windows Launcher
COLOR 0B

echo ==========================================================
echo        LegalSaathi AI — Windows Startup Script
echo ==========================================================
echo.

:: 1. Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.11+ from https://www.python.org/downloads/
    echo Be sure to check "Add Python to PATH" during installation.
    echo Or install via PowerShell: winget install Python.Python.3.11
    echo.
    pause
    exit /b 1
)
echo [OK] Python is available.

:: 2. Check Node.js
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js and npm are not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    echo Or install via PowerShell: winget install OpenJS.NodeJS.LTS
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js & npm are available.

echo.
echo ----------------------------------------------------------
echo Launching Backend Server on http://localhost:8000 ...
echo ----------------------------------------------------------
start "LegalSaathi AI - Backend Server" cmd /k "cd /d "%~dp0backend" && if not exist venv (python -m venv venv) && call venv\Scripts\activate && pip install -r requirements.txt && python app\main.py"

echo.
echo ----------------------------------------------------------
echo Launching Frontend Development Server on http://localhost:5173 ...
echo ----------------------------------------------------------
start "LegalSaathi AI - Frontend Dev Server" cmd /k "cd /d "%~dp0frontend" && if not exist node_modules (npm install) && npm run dev"

echo.
echo ==========================================================
echo  Servers are launching in separate windows!
echo  👉 Web Application: http://localhost:5173
echo  👉 Backend REST API: http://localhost:8000/docs
echo ==========================================================
echo.
pause
