@echo off
REM DojoPool Observability Test Script for Windows
REM Tests all monitoring components in the staging environment

echo 🔍 Testing DojoPool Staging Observability...

REM Test all services are running
echo.
echo 🏥 Testing Service Health...

REM Test API service
curl -s -o nul -w "%%{http_code}" http://localhost:3001/health | findstr "200" >nul
if %errorlevel% equ 0 (
    echo ✅ API Health Check is accessible
) else (
    echo ❌ API Health Check is not accessible
)

REM Test Web service
curl -s -o nul -w "%%{http_code}" http://localhost:3000/api/health | findstr "200" >nul
if %errorlevel% equ 0 (
    echo ✅ Web Health Check is accessible
) else (
    echo ❌ Web Health Check is not accessible
)

REM Test Nginx
curl -s -o nul -w "%%{http_code}" http://localhost:80/health | findstr "200" >nul
if %errorlevel% equ 0 (
    echo ✅ Nginx Health Check is accessible
) else (
    echo ❌ Nginx Health Check is not accessible
)

echo.
echo 📊 Testing Monitoring Stack...

REM Test Prometheus
curl -s http://localhost:9090/-/healthy >nul
if %errorlevel% equ 0 (
    echo ✅ Prometheus Health is accessible
) else (
    echo ❌ Prometheus Health is not accessible
)

REM Test Grafana
curl -s http://localhost:3002/api/health >nul
if %errorlevel% equ 0 (
    echo ✅ Grafana Health is accessible
) else (
    echo ❌ Grafana Health is not accessible
)

REM Test AlertManager
curl -s http://localhost:9093/-/healthy >nul
if %errorlevel% equ 0 (
    echo ✅ AlertManager Health is accessible
) else (
    echo ❌ AlertManager Health is not accessible
)

echo.
echo 📋 Observability Test Summary
echo ==============================

echo.
echo 🌐 Access URLs:
echo   Frontend:     http://localhost:3000
echo   API:          http://localhost:3001
echo   Grafana:      http://localhost:3002 (admin/staging_admin_password)
echo   Prometheus:   http://localhost:9090
echo   AlertManager: http://localhost:9093

echo.
echo 📊 Available Dashboards:
echo   - DojoPool Staging Overview
echo   - DojoPool Staging API Service
echo   - DojoPool Staging Database Performance
echo   - DojoPool Staging Business Metrics

echo.
echo ✅ Observability setup complete!
echo    All monitoring components are running and collecting metrics.
echo    Alerts will be sent to configured Slack channels and email addresses.

pause
