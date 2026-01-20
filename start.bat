@echo off
echo Starting Gesture Control Platform...
echo.

echo [1/3] Starting Backend Server...
start "Backend" cmd /k "cd backend && uv run python main.py"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend Development Server...
start "Frontend" cmd /k "cd frontend && bun dev"

echo [3/3] Opening Application...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ✅ Gesture Control Platform is starting!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause >nul