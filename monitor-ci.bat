@echo off
echo DojoPool CI/CD Workflow Monitor
echo ================================

:menu
echo.
echo Select an option:
echo 1. Check current workflow status
echo 2. Start monitoring (5 min intervals)
echo 3. Start monitoring with auto-fix
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo Checking workflow status...
    powershell -ExecutionPolicy Bypass -File scripts/workflow-monitor.ps1 -Action check
    goto menu
)

if "%choice%"=="2" (
    echo Starting monitoring...
    powershell -ExecutionPolicy Bypass -File scripts/workflow-monitor.ps1 -Action monitor
    goto menu
)

if "%choice%"=="3" (
    echo Starting monitoring with auto-fix...
    powershell -ExecutionPolicy Bypass -File scripts/workflow-monitor.ps1 -Action monitor -AutoFix
    goto menu
)

if "%choice%"=="4" (
    echo Exiting...
    exit
)

echo Invalid choice. Please try again.
goto menu
