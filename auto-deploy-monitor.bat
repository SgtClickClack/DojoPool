@echo off
echo 🚀 Starting Auto-Deploy Monitor for DojoPool
echo ================================================

cd /d "%~dp0..\DojoPool"

powershell -ExecutionPolicy Bypass -File "scripts\auto-deploy-monitor.ps1" -MaxAttempts 15 -CheckInterval 20

pause
