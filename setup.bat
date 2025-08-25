@echo off
echo 🚀 Setting up Employee Management System...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js (v16 or higher) first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed.
    pause
    exit /b 1
)

echo ✅ npm is installed
npm --version
echo.

REM Install root dependencies
echo 📦 Installing root dependencies...
npm install

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
npm install
cd ..

REM Install frontend dependencies  
echo 📦 Installing frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Update backend/.env file with your email credentials:
echo    - EMAIL_USER: Your Gmail address
echo    - EMAIL_PASS: Your Gmail App Password
echo.
echo 2. Start the development servers:
echo    npm run dev
echo.
echo 3. Open your browser and navigate to:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:5000
echo.
echo 4. Default admin login:
echo    Email: admin@company.com
echo    Password: admin123
echo.
echo 🚀 Happy coding!
pause
