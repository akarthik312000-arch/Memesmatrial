@echo off
echo MemesMaterial Studio - Installation
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo Node.js detected: %NODE_VERSION%

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed.
    pause
    exit /b 1
)

echo npm detected: %npm_VERSION%

:: Install dependencies
echo Installing npm dependencies...
npm install

if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies.
    pause
    exit /b 1
)

echo Dependencies installed successfully.

:: Generate .env.example if it doesn't exist
if not exist .env.example (
    echo Generating .env.example...
    copy .env.example.new .env.example 2>nul
)

echo.
echo Installation complete!
echo.
start.bat