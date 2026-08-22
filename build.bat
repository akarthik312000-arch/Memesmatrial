@echo off
echo MemesMaterial Studio - Build
echo.

:: Build the Next.js application
echo Building production bundle...
npm run build

if %errorlevel% neq 0 (
    echo Error: Build failed.
    pause
    exit /b 1
)

echo Build completed successfully.
echo.
echo Output: .next/ directory
pause