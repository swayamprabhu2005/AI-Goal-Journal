@echo off
title AI Goal Journal ^& Accountability Coach
cd /d "%~dp0"

echo ======================================================================
echo           AI Goal Journal ^& Accountability Coach Launcher
echo ======================================================================
:: Check for .env file
if not exist ".env" (
    echo [!] Warning: .env file not found.
    if exist ".env.example" (
        echo [*] Creating .env from .env.example ...
        copy ".env.example" ".env" >nul
        echo [*] Created .env template. Please ensure your GEMINI_API_KEY is configured.
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
