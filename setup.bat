@echo off
echo ===================================================
echo   Decision DNA - Backend Environment Setup
echo ===================================================

echo.
echo [1/3] Creating Python virtual environment...
python -m venv .venv
if %errorlevel% neq 0 (
    echo Error: Failed to create virtual environment. Ensure Python is installed and in your PATH.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Upgrading pip...
.venv\Scripts\python -m pip install --upgrade pip
if %errorlevel% neq 0 (
    echo Error: Failed to upgrade pip.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Installing backend dependencies...
.venv\Scripts\pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: Failed to install requirements.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo   Setup Complete!
echo   You can now start the application by running:
echo   npm run dev
echo ===================================================
pause
