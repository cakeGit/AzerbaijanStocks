@echo off
echo 🚀 Starting AZT Stock Exchange Simulator (Combined)...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed. Please install npm and try again.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...

REM Install all dependencies
npm run install:all

echo.
echo ✅ Dependencies installed successfully!
echo.

REM Choose mode
echo Select mode:
echo [1] Development (Frontend + Backend separately)
echo [2] Production (Combined in single server)
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo 🔥 Starting development mode...
    npm run dev
) else if "%choice%"=="2" (
    echo 🏭 Starting production mode...
    echo Building frontend...
    npm run build
    echo Starting combined server...
    npm start
) else (
    echo Invalid choice. Starting development mode...
    npm run dev
)

echo.
echo 🎉 AZT Stock Exchange is running!
echo.
echo 📈 Application: http://localhost:3001
echo 🔧 API: http://localhost:3001/api
echo.
echo Press any key to exit...
pause >nul
