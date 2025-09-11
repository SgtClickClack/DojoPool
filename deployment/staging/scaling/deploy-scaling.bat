@echo off
REM DojoPool Infrastructure Scaling Deployment Script (Windows)
REM This script deploys all scaling configurations to the staging environment

setlocal enabledelayedexpansion

set "NAMESPACE=staging"
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

REM Deploy HPA configurations
:deploy_hpa
call :log_info "Deploying Horizontal Pod Autoscalers..."

if exist "%SCRIPT_DIR%hpa-configs.yaml" (
    kubectl apply -f "%SCRIPT_DIR%hpa-configs.yaml" -n "%NAMESPACE%"
    call :log_success "HPA configurations deployed"
) else (
    call :log_error "HPA configuration file not found: %SCRIPT_DIR%hpa-configs.yaml"
    exit /b 1
)
goto :eof

REM Deploy database scaling
:deploy_database_scaling
call :log_info "Deploying database scaling configurations..."

if exist "%SCRIPT_DIR%database-scaling.yaml" (
    kubectl apply -f "%SCRIPT_DIR%database-scaling.yaml" -n "%NAMESPACE%"
    call :log_success "Database scaling configurations deployed"
) else (
    call :log_error "Database scaling configuration file not found"
    exit /b 1
)
goto :eof

REM Deploy connection pooling
:deploy_pgbouncer
call :log_info "Deploying PgBouncer connection pooling..."

if exist "%SCRIPT_DIR%pgbouncer-config.yaml" (
    kubectl apply -f "%SCRIPT_DIR%pgbouncer-config.yaml" -n "%NAMESPACE%"
    call :log_success "PgBouncer configuration deployed"
) else (
    call :log_error "PgBouncer configuration file not found"
    exit /b 1
)
goto :eof

REM Deploy cost optimization
:deploy_cost_optimization
call :log_info "Deploying cost optimization configurations..."

if exist "%SCRIPT_DIR%cost-optimization.yaml" (
    kubectl apply -f "%SCRIPT_DIR%cost-optimization.yaml" -n "%NAMESPACE%"
    call :log_success "Cost optimization configurations deployed"
) else (
    call :log_error "Cost optimization configuration file not found"
    exit /b 1
)
goto :eof

REM Deploy performance baseline
:deploy_performance_baseline
call :log_info "Deploying performance baseline monitoring..."

if exist "%SCRIPT_DIR%performance-baseline.yaml" (
    kubectl apply -f "%SCRIPT_DIR%performance-baseline.yaml" -n "%NAMESPACE%"
    call :log_success "Performance baseline monitoring deployed"
) else (
    call :log_error "Performance baseline configuration file not found"
    exit /b 1
)
goto :eof

REM Wait for deployments to be ready
:wait_for_deployments
call :log_info "Waiting for deployments to be ready..."

set "deployments=dojopool-cost-optimizer dojopool-performance-monitor dojopool-pgbouncer"

for %%d in (%deployments%) do (
    call :log_info "Waiting for deployment: %%d"
    kubectl rollout status deployment/%%d -n "%NAMESPACE%" --timeout=300s
    if %ERRORLEVEL% neq 0 (
        call :log_error "Deployment %%d failed to become ready"
        exit /b 1
    )
    call :log_success "Deployment %%d is ready"
)

REM Check for StatefulSet
kubectl get statefulset dojopool-postgres-replica -n "%NAMESPACE%" >nul 2>nul
if %ERRORLEVEL% equ 0 (
    call :log_info "Waiting for PostgreSQL replica StatefulSet..."
    kubectl rollout status statefulset/dojopool-postgres-replica -n "%NAMESPACE%" --timeout=600s
    if %ERRORLEVEL% neq 0 (
        call :log_error "PostgreSQL replica failed to become ready"
        exit /b 1
    )
    call :log_success "PostgreSQL replica is ready"
)
goto :eof

REM Verify deployment
:verify_deployment
call :log_info "Verifying scaling deployment..."

call :log_info "Checking HPA status..."
kubectl get hpa -n "%NAMESPACE%"

call :log_info "Checking pod status..."
kubectl get pods -n "%NAMESPACE%" -l "app in (dojopool-cost-optimizer,dojopool-performance-monitor,dojopool-pgbouncer)"

call :log_info "Checking service status..."
kubectl get svc -n "%NAMESPACE%" -l "app in (dojopool-pgbouncer)"

call :log_success "Scaling deployment verification complete"
goto :eof

REM Show post-deployment instructions
:show_post_deployment_info
echo.
call :log_success "Infrastructure scaling deployment completed!"
echo.
echo Next steps:
echo 1. Monitor HPA scaling behavior:
echo    kubectl get hpa -n %NAMESPACE% -w
echo.
echo 2. Check scaling metrics:
echo    kubectl top pods -n %NAMESPACE%
echo.
echo 3. View cost optimization recommendations:
echo    kubectl logs -f deployment/dojopool-cost-optimizer -n %NAMESPACE%
echo.
echo 4. Monitor performance baselines:
echo    kubectl logs -f deployment/dojopool-performance-monitor -n %NAMESPACE%
echo.
echo 5. Run load tests:
echo    k6 run %SCRIPT_DIR%load-test-scenarios.js
echo.
echo For Grafana dashboards:
echo    HPA Metrics: http://grafana-url/d/hpa-metrics
echo    Cost Analysis: http://grafana-url/d/cost-analysis
echo    Performance Baseline: http://grafana-url/d/performance-baseline
goto :eof

REM Main deployment function
:main
call :log_info "Starting DojoPool Infrastructure Scaling Deployment"
call :log_info "Namespace: %NAMESPACE%"
call :log_info "Script Directory: %SCRIPT_DIR%"
call :log_info "Project Root: %PROJECT_ROOT%"

call :check_prerequisites
call :deploy_hpa
call :deploy_database_scaling
call :deploy_pgbouncer
call :deploy_cost_optimization
call :deploy_performance_baseline
call :wait_for_deployments
call :verify_deployment
call :show_post_deployment_info

call :log_success "Infrastructure scaling deployment completed successfully!"
goto :eof

REM Handle command line arguments
if "%1"=="hpa-only" (
    call :log_info "Deploying HPA configurations only..."
    call :check_prerequisites
    call :deploy_hpa
    call :verify_deployment
) else if "%1"=="database-only" (
    call :log_info "Deploying database scaling only..."
    call :check_prerequisites
    call :deploy_database_scaling
    call :deploy_pgbouncer
    call :wait_for_deployments
    call :verify_deployment
) else if "%1"=="verify" (
    call :log_info "Verifying current scaling deployment..."
    call :check_prerequisites
    call :verify_deployment
) else (
    call :main
)
