@echo off
title GameSite Launcher
echo ============================================== 
echo   Starting GameSite (Backend + Frontend)         
echo ============================================== 
echo [1/2] Starting Backend on http://localhost:8000 ...
start "GameSite - Backend" /D "%~dp0backend" cmd /k "set PYTHONPATH=. && ..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"
echo [2/2] Starting Frontend on http://localhost:5173 ...
start "GameSite - Frontend" /D "%~dp0frontend" cmd /k "npm run dev"
echo ============================================== 
echo Both servers launched in separate windows!      
echo Open your browser at: http://localhost:5173     
echo ============================================== 
