Write-Host "==============================================" -ForegroundColor Yellow
Write-Host "  Запуск GameSite (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Yellow

$projectRoot = $PSScriptRoot

Write-Host "[1/2] Запуск Backend (FastAPI на http://localhost:8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; `$env:PYTHONPATH='.'; & '$projectRoot\.venv\Scripts\python.exe' -m uvicorn main:app --reload --port 8000"

Write-Host "[2/2] Запуск Frontend (Vite на http://localhost:5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Оба сервера запущены в отдельных окнах!" -ForegroundColor Cyan
Write-Host "Откройте в браузере: http://localhost:5173" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Yellow
