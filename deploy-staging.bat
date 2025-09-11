@echo off
REM DojoPool Staging Deployment Script for Windows
REM This script deploys the application to a production-like staging environment

echo 🚀 Starting DojoPool Staging Deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Change to project root directory
cd /d "%~dp0"

REM Load environment variables from env.staging
if exist "env.staging" (
    echo 📄 Loading staging environment configuration...
    for /f "tokens=*" %%a in (env.staging) do (
        set "%%a"
    )
) else (
    echo ❌ env.staging file not found. Please create it first.
    exit /b 1
)

REM Kill any existing staging containers
echo 🛑 Stopping any existing staging containers...
docker-compose -f deployment/staging/docker-compose.staging.yml down --remove-orphans

REM Clean up any dangling resources
echo 🧹 Cleaning up dangling Docker resources...
docker system prune -f

REM Build the staging images
echo 🔨 Building staging Docker images...
docker-compose -f deployment/staging/docker-compose.staging.yml build --parallel

REM Start the staging environment
echo 🚀 Starting staging environment...
docker-compose -f deployment/staging/docker-compose.staging.yml up -d

REM Wait for services to be healthy
echo ⏳ Waiting for services to become healthy...
timeout /t 30 /nobreak >nul

REM Check service health
echo 🏥 Checking service health...

REM Check API health
echo Checking API service...
curl -f http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API service is healthy
) else (
    echo ❌ API service health check failed
)

REM Check Web service
echo Checking Web service...
curl -f http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Web service is healthy
) else (
    echo ❌ Web service health check failed
)

REM Check PostgreSQL
echo Checking PostgreSQL...
docker-compose -f deployment/staging/docker-compose.staging.yml exec -T postgres pg_isready -U dojo_staging_user -d dojopool_staging >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL is healthy
) else (
    echo ❌ PostgreSQL health check failed
)

REM Check Redis
echo Checking Redis...
docker-compose -f deployment/staging/docker-compose.staging.yml exec -T redis redis-cli ping | findstr PONG >nul
if %errorlevel% equ 0 (
    echo ✅ Redis is healthy
) else (
    echo ❌ Redis health check failed
)

echo.
echo 🎉 Staging deployment completed!
echo.
echo 📊 Monitoring URLs:
echo   - Grafana: http://localhost:3002 (admin/staging_admin_password)
echo   - Prometheus: http://localhost:9090
echo   - AlertManager: http://localhost:9093
echo.
echo 🌐 Application URLs:
echo   - Frontend: http://localhost:3000
echo   - API: http://localhost:3001
echo   - API Docs: http://localhost:3001/api/docs
echo.
echo 📋 Useful commands:
echo   - View logs: docker-compose -f deployment/staging/docker-compose.staging.yml logs -f
echo   - Stop staging: docker-compose -f deployment/staging/docker-compose.staging.yml down
echo   - Restart services: docker-compose -f deployment/staging/docker-compose.staging.yml restart
echo.
echo ✅ Staging environment is ready for testing!

pause
