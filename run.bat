@echo off
title AI Goal Journal ^& Accountability Coach
cd /d "%~dp0"

echo ======================================================================
echo           AI Goal Journal ^& Accountability Coach Launcher
echo ======================================================================
:: 1. Check for Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [X] Error: Python is not installed or not added to your PATH.
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

:: 2. Check for Node.js / npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [X] Error: Node.js / npm is not installed or not added to your PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

:: 3. Check for .env file
if not exist ".env" (
    echo [!] Warning: .env file not found.
    if exist ".env.example" (
        echo [*] Creating .env from .env.example
        copy ".env.example" ".env" >nul
        echo [*] Created .env template. Please ensure your GEMINI_API_KEY is configured.
    )
)

:: 4. Check for frontend node_modules
if not exist "node_modules\" (
    echo [*] Frontend dependencies not found. Installing node_modules...
    call npm install
    if errorlevel 1 (
        echo [X] Error: npm install failed.
        pause
        exit /b 1
    )
)

echo [1/2] Starting FastAPI Backend Server on http://127.0.0.1:8000 ...
start "AI Goal Journal - FastAPI Backend" cmd /k "set PYTHONPATH=backend&& python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "AI Goal Journal - React Frontend" cmd /k "npm run dev"

echo.
echo Waiting for servers to initialize...
ping -n 5 127.0.0.1 >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ======================================================================
echo Application successfully launched!
echo - Web Application:       http://localhost:5173
echo - Interactive API Docs:  http://127.0.0.1:8000/docs
echo - Backend Health Check:  http://127.0.0.1:8000/api/v1/health
echo ======================================================================
