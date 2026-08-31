@echo off
title AI Goal Journal ^& Accountability Coach
echo ======================================================================
echo           AI Goal Journal ^& Accountability Coach Launcher
echo ======================================================================
echo.

echo [1/3] Checking Docker ^& PostgreSQL Container...
docker compose up -d postgres 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Docker not running or not found. Continuing with Local MVP In-Memory / SQLite Persistence.
) else (
    echo [SUCCESS] PostgreSQL container started on port 5432.
)
echo.

echo [2/3] Starting FastAPI Backend Server on http://127.0.0.1:8000 ...
start "AI Goal Journal - FastAPI Backend" cmd /k "python -m uvicorn app.main:app --app-dir backend --reload --port 8000"

echo [3/3] Starting React Vite Frontend on http://localhost:5173 ...
start "AI Goal Journal - React Frontend" cmd /k "npm run dev"

echo.
echo Waiting for servers to initialize...
timeout /t 3 >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ======================================================================
echo Application has been launched!
echo ======================================================================
