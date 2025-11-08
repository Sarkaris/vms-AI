@echo off
echo 🚀 Starting VMS Visitor Management System...

REM Check if we're in the server directory
if not exist "package.json" (
    echo ❌ Please run this script from the server directory
    exit /b 1
)

REM Copy demo environment file if it doesn't exist
if not exist ".env" (
    echo 📋 Setting up demo environment...
    copy .env.demo .env
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing server dependencies...
    call npm install
)

REM Check if client directory exists and install dependencies
if exist "..\client" (
    if not exist "..\client\node_modules" (
        echo 📦 Installing client dependencies...
        cd ..\client
        call npm install
        cd ..\server
    )
)

REM Start the server
echo 🎯 Starting server in demo mode...
echo 💡 Demo mode provides read-only access to showcase all features
echo 🔗 Frontend will be available at: http://localhost:3000
echo 🔗 Backend API will be available at: http://localhost:5000
echo 📊 Health check: http://localhost:5000/api/health
echo 🔍 Demo status: http://localhost:5000/api/demo-status
echo.

npm run dev