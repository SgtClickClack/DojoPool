@echo off
REM DojoPool Maintenance System Deployment Script (Windows)
REM This script deploys the complete maintenance and security framework

setlocal enabledelayedexpansion

set "NAMESPACE=default"
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\..\..\.."

REM Colors for output (Windows CMD)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

REM Logging functions
:log_info
echo %BLUE%[INFO]%RESET% %~1
goto :eof

:log_success
echo %GREEN%[SUCCESS]%RESET% %~1
goto :eof

:log_warning
echo %YELLOW%[WARNING]%RESET% %~1
goto :eof

:log_error
echo %RED%[ERROR]%RESET% %~1
goto :eof

REM Check prerequisites
:check_prerequisites
call :log_info "Checking prerequisites..."

REM Check if kubectl is available
where kubectl >nul 2>nul
if %ERRORLEVEL% neq 0 (
    call :log_error "kubectl is not installed or not in PATH"
    exit /b 1
)

REM Check if we're connected to a Kubernetes cluster
kubectl cluster-info >nul 2>nul
if %ERRORLEVEL% neq 0 (
    call :log_error "Not connected to a Kubernetes cluster"
    exit /b 1
)

REM Check if namespace exists
kubectl get namespace "%NAMESPACE%" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    call :log_warning "Namespace '%NAMESPACE%' does not exist. Creating it..."
    kubectl create namespace "%NAMESPACE%"
)

call :log_success "Prerequisites check passed"
goto :eof

REM Deploy maintenance schedules
:deploy_maintenance_schedules
call :log_info "Deploying maintenance schedules..."

if exist "%SCRIPT_DIR%maintenance-schedule.yaml" (
    kubectl apply -f "%SCRIPT_DIR%maintenance-schedule.yaml" -n "%NAMESPACE%"
    call :log_success "Maintenance schedules deployed"
) else (
    call :log_error "Maintenance schedule file not found"
    exit /b 1
)
goto :eof

REM Deploy security policies
:deploy_security_policies
call :log_info "Deploying security policies..."

if exist "%SCRIPT_DIR%security-policy.yaml" (
    kubectl apply -f "%SCRIPT_DIR%security-policy.yaml" -n "%NAMESPACE%"
    call :log_success "Security policies deployed"
) else (
    call :log_error "Security policy file not found"
    exit /b 1
)
goto :eof

REM Deploy corrective maintenance
:deploy_corrective_maintenance
call :log_info "Deploying corrective maintenance procedures..."

if exist "%SCRIPT_DIR%corrective-maintenance.yaml" (
    kubectl apply -f "%SCRIPT_DIR%corrective-maintenance.yaml" -n "%NAMESPACE%"
    call :log_success "Corrective maintenance procedures deployed"
) else (
    call :log_error "Corrective maintenance file not found"
    exit /b 1
)
goto :eof

REM Deploy operational excellence
:deploy_operational_excellence
call :log_info "Deploying operational excellence framework..."

if exist "%SCRIPT_DIR%operational-excellence.yaml" (
    kubectl apply -f "%SCRIPT_DIR%operational-excellence.yaml" -n "%NAMESPACE%"
    call :log_success "Operational excellence framework deployed"
) else (
    call :log_error "Operational excellence file not found"
    exit /b 1
)
goto :eof

REM Deploy automated maintenance
:deploy_automated_maintenance
call :log_info "Deploying automated maintenance system..."

if exist "%SCRIPT_DIR%automated-maintenance.yaml" (
    kubectl apply -f "%SCRIPT_DIR%automated-maintenance.yaml" -n "%NAMESPACE%"
    call :log_success "Automated maintenance system deployed"
) else (
    call :log_error "Automated maintenance file not found"
    exit /b 1
)
goto :eof

REM Create maintenance secrets
:create_maintenance_secrets
call :log_info "Creating maintenance secrets..."

REM Create backup credentials secret
kubectl get secret dojopool-backup-secret -n "%NAMESPACE%" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    kubectl create secret generic dojopool-backup-secret ^
        --from-literal=aws-access-key-id="%AWS_ACCESS_KEY_ID%" ^
        --from-literal=aws-secret-access-key="%AWS_SECRET_ACCESS_KEY%" ^
        -n "%NAMESPACE%"
    call :log_success "Backup credentials secret created"
) else (
    call :log_info "Backup credentials secret already exists"
)

REM Create alerts secret
kubectl get secret dojopool-alerts-secret -n "%NAMESPACE%" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    kubectl create secret generic dojopool-alerts-secret ^
        --from-literal=slack-webhook="%SLACK_WEBHOOK_URL%" ^
        --from-literal=email-smtp-password="%SMTP_PASSWORD%" ^
        -n "%NAMESPACE%"
    call :log_success "Alert credentials secret created"
) else (
    call :log_info "Alert credentials secret already exists"
)
goto :eof

REM Wait for maintenance system
:wait_for_maintenance_system
call :log_info "Waiting for maintenance system to be ready..."

REM Wait a bit for resources to be created
timeout /t 10 /nobreak >nul

REM Check ConfigMaps
set "configmaps=dojopool-maintenance-schedule dojopool-security-policy dojopool-corrective-maintenance dojopool-operational-excellence"

for %%c in (%configmaps%) do (
    kubectl get configmap %%c -n "%NAMESPACE%" >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        call :log_success "ConfigMap %%c is ready"
    ) else (
        call :log_error "ConfigMap %%c not found"
        exit /b 1
    )
)

call :log_success "Maintenance system verification complete"
goto :eof

REM Show post-deployment info
:show_post_deployment_info
echo.
call :log_success "Maintenance and Security System Deployment Complete!"
echo.
echo Maintenance System Overview:
echo.
echo Scheduled Maintenance Windows:
echo   • Primary: Every Monday 2:00 AM UTC (4h window)
echo   • Security: Immediate for critical patches
echo   • Database: Every Sunday 3:00 AM UTC (6h window)
echo   • Infrastructure: Monthly 1st day 1:00 AM UTC (8h window)
echo.
echo Automated Maintenance Jobs:
echo   • Daily maintenance: Database vacuum, cache cleanup, log rotation
echo   • Weekly maintenance: Deep database maintenance, dependency updates
echo   • Security scans: Every 6 hours with vulnerability detection
echo   • Backup verification: Daily integrity checks
echo.
echo Monitoring Commands:
echo   • View active maintenance: kubectl get cronjob -n %NAMESPACE%
echo   • Check maintenance logs: kubectl logs -f deployment/dojopool-maintenance-runner -n %NAMESPACE%
echo   • View security reports: kubectl get pvc dojopool-security-reports-pvc -n %NAMESPACE%
echo.
echo Next Steps:
echo   1. Configure monitoring alerts and notification channels
echo   2. Test backup and restore procedures
echo   3. Schedule quarterly disaster recovery drills
echo   4. Review and update maintenance procedures regularly
goto :eof

REM Main deployment function
:main
call :log_info "Starting DojoPool Maintenance & Security System Deployment"
call :log_info "Namespace: %NAMESPACE%"
call :log_info "Script Directory: %SCRIPT_DIR%"

call :check_prerequisites
call :deploy_maintenance_schedules
call :deploy_security_policies
call :deploy_corrective_maintenance
call :deploy_operational_excellence
call :deploy_automated_maintenance
call :create_maintenance_secrets
call :wait_for_maintenance_system
call :show_post_deployment_info

call :log_success "Maintenance and Security System deployment completed successfully!"
goto :eof

REM Handle command line arguments
if "%1"=="maintenance-only" (
    call :log_info "Deploying maintenance schedules only..."
    call :check_prerequisites
    call :deploy_maintenance_schedules
    call :deploy_automated_maintenance
    call :wait_for_maintenance_system
) else if "%1"=="security-only" (
    call :log_info "Deploying security policies only..."
    call :check_prerequisites
    call :deploy_security_policies
    call :create_maintenance_secrets
) else if "%1"=="verify" (
    call :log_info "Verifying current maintenance deployment..."
    call :check_prerequisites
    call :wait_for_maintenance_system
) else (
    call :main
)
