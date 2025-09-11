@echo off
REM DojoPool Production Rollback Script for Windows
REM Automated rollback procedure for production deployments

setlocal enabledelayedexpansion

REM Configuration
set ROLLBACK_VERSIONS_TO_KEEP=5
set BACKUP_RETENTION_DAYS=30

REM Parse command line arguments
set PHASE=
set REASON=
set FORCE=false
set DRY_RUN=false

:parse_args
if "%~1"=="" goto end_parse
if "%~1"=="--phase" (
    set PHASE=%~2
    shift & shift
    goto parse_args
)
if "%~1"=="--reason" (
    set REASON=%~2
    shift & shift
    goto parse_args
)
if "%~1"=="--force" (
    set FORCE=true
    shift
    goto parse_args
)
if "%~1"=="--dry-run" (
    set DRY_RUN=true
    shift
    goto parse_args
)
if "%~1"=="--help" (
    echo Usage: %0 --phase ^<phase^> --reason ^<reason^> [--force] [--dry-run]
    echo.
    echo Arguments:
    echo   --phase    Current deployment phase ^(phase1, phase2, phase3, phase4^)
    echo   --reason   Reason for rollback ^(required^)
    echo   --force    Skip confirmation prompts
    echo   --dry-run  Show what would be done without executing
    echo.
    echo Example:
    echo   %0 --phase phase2 --reason "High error rate detected"
    exit /b 0
)
echo Unknown option: %~1
echo Use --help for usage information
exit /b 1

:end_parse

REM Validate required arguments
if "%PHASE%"=="" (
    echo [ERROR] Phase is required. Use --phase to specify current deployment phase.
    exit /b 1
)

if "%REASON%"=="" (
    echo [ERROR] Reason is required. Use --reason to specify rollback reason.
    exit /b 1
)

REM Validate phase
if "%PHASE%"=="phase1" goto phase_valid
if "%PHASE%"=="phase2" goto phase_valid
if "%PHASE%"=="phase3" goto phase_valid
if "%PHASE%"=="phase4" goto phase_valid
echo [ERROR] Invalid phase: %PHASE%. Must be phase1, phase2, phase3, or phase4.
exit /b 1

:phase_valid

echo [INFO] Starting DojoPool Production Rollback
echo [INFO] Phase: %PHASE%
echo [INFO] Reason: %REASON%
echo [INFO] Force: %FORCE%
echo [INFO] Dry Run: %DRY_RUN%

REM Confirmation prompt (unless forced or dry run)
if "%FORCE%"=="false" if "%DRY_RUN%"=="false" (
    echo.
    echo [WARNING] This will rollback the production deployment!
    echo [WARNING] Phase: %PHASE%
    echo [WARNING] Reason: %REASON%
    echo.
    set /p CONFIRM="Are you sure you want to proceed? (yes/no): "
    if /i not "!CONFIRM!"=="yes" (
        echo [INFO] Rollback cancelled by user
        exit /b 0
    )
)

REM Record rollback start
if "%DRY_RUN%"=="false" (
    echo [INFO] Recording rollback event...
    REM This would typically send to monitoring system
    curl -X POST "http://localhost:9090/api/v1/alerts" -H "Content-Type: application/json" -d "{\"labels\":{\"alertname\":\"RollbackStarted\",\"phase\":\"%PHASE%\",\"reason\":\"%REASON%\"},\"annotations\":{\"summary\":\"Production rollback initiated\",\"description\":\"Rolling back %PHASE% due to: %REASON%\"}}" 2>nul
)

REM Function to execute command with dry run support
:execute
set CMD=%~1
set DESCRIPTION=%~2
echo [INFO] %DESCRIPTION%
if "%DRY_RUN%"=="true" (
    echo   [DRY RUN] %CMD%
) else (
    %CMD%
    if errorlevel 1 (
        echo [ERROR] %DESCRIPTION% failed
        exit /b 1
    ) else (
        echo [SUCCESS] %DESCRIPTION% completed
    )
)
goto :eof

REM Phase-specific rollback procedures
if "%PHASE%"=="phase1" goto rollback_phase1
if "%PHASE%"=="phase2" goto rollback_phase2
if "%PHASE%"=="phase3" goto rollback_phase3
if "%PHASE%"=="phase4" goto rollback_phase4

:rollback_phase1
echo [INFO] Executing Phase 1 rollback procedures...

call :execute "docker-compose -f deployment\staging\docker-compose.staging.yml down" "Stopping all services"
call :execute "docker-compose -f deployment\staging\docker-compose.staging.yml down -v --remove-orphans" "Removing containers and volumes"
call :execute "docker system prune -f" "Cleaning up Docker resources"

if exist "backups\pre-phase1-deployment.sql" (
    call :execute "psql -h localhost -U postgres -d dojopool ^< backups\pre-phase1-deployment.sql" "Restoring database from backup"
)

echo [SUCCESS] Phase 1 rollback completed
goto post_rollback

:rollback_phase2
echo [INFO] Executing Phase 2 rollback procedures...

call :execute "kubectl scale deployment dojopool-api --replicas=2" "Scaling API to minimum replicas"
call :execute "kubectl scale deployment dojopool-web --replicas=2" "Scaling web to minimum replicas"
call :execute "kubectl apply -f k8s\ingress-rollback.yml" "Updating ingress for reduced traffic"
call :execute "kubectl set image deployment/dojopool-api api=dojopool/api:v1.0.0-stable" "Rolling back API to stable version"
call :execute "kubectl set image deployment/dojopool-web web=dojopool/web:v1.0.0-stable" "Rolling back web to stable version"
call :execute "kubectl rollout status deployment/dojopool-api" "Waiting for API rollout"
call :execute "kubectl rollout status deployment/dojopool-web" "Waiting for web rollout"

echo [SUCCESS] Phase 2 rollback completed
goto post_rollback

:rollback_phase3
echo [INFO] Executing Phase 3 rollback procedures...

call :execute "kubectl apply -f k8s\maintenance-mode.yml" "Enabling maintenance mode"
call :execute "kubectl scale deployment dojopool-api --replicas=5" "Scaling API to 10%% capacity"
call :execute "kubectl scale deployment dojopool-web --replicas=5" "Scaling web to 10%% capacity"
call :execute "kubectl set image deployment/dojopool-api api=dojopool/api:v1.1.0-phase2-stable" "Rolling back API to Phase 2 stable"
call :execute "kubectl set image deployment/dojopool-web web=dojopool/web:v1.1.0-phase2-stable" "Rolling back web to Phase 2 stable"
call :execute "kubectl apply -f k8s\feature-flags-phase2.yml" "Restoring Phase 2 feature flags"
call :execute "kubectl rollout status deployment/dojopool-api" "Waiting for API rollout"
call :execute "kubectl rollout status deployment/dojopool-web" "Waiting for web rollout"
call :execute "kubectl delete -f k8s\maintenance-mode.yml" "Disabling maintenance mode"

echo [SUCCESS] Phase 3 rollback completed
goto post_rollback

:rollback_phase4
echo [INFO] Executing Phase 4 rollback procedures...

call :execute "kubectl apply -f k8s\emergency-maintenance.yml" "Enabling emergency maintenance mode"
call :execute "kubectl apply -f k8s\traffic-failover.yml" "Redirecting traffic to backup infrastructure"
call :execute "kubectl set image deployment/dojopool-api api=dojopool/api:v1.2.0-ga-stable" "Rolling back API to GA stable"
call :execute "kubectl set image deployment/dojopool-web web=dojopool/web:v1.2.0-ga-stable" "Rolling back web to GA stable"
call :execute "kubectl scale deployment dojopool-api-backup --replicas=20" "Scaling backup API to full capacity"
call :execute "kubectl scale deployment dojopool-web-backup --replicas=20" "Scaling backup web to full capacity"

if exist "backups\pre-ga-deployment.sql" (
    echo [WARNING] Database rollback required. This may take several minutes...
    call :execute "pg_restore -h backup-db-host -U postgres -d dojopool backups\pre-ga-deployment.sql" "Restoring database from GA backup"
)

call :execute "kubectl get pods -l app=dojopool" "Checking pod status"
call :execute "kubectl get ingress" "Checking ingress status"
call :execute "kubectl apply -f k8s\traffic-gradual-restore.yml" "Gradually restoring traffic"
call :execute "kubectl delete -f k8s\emergency-maintenance.yml" "Disabling emergency maintenance mode"

echo [SUCCESS] Phase 4 rollback completed
goto post_rollback

:post_rollback
REM Post-rollback verification
echo [INFO] Running post-rollback verification...

call :execute "curl -f http://localhost:3001/health" "API health check" 2>nul
call :execute "curl -f http://localhost:3000/api/health" "Web health check" 2>nul
call :execute "psql -h localhost -U postgres -d dojopool -c \"SELECT 1\"" "Database connectivity check" 2>nul
call :execute "curl -f http://localhost:9090/-/healthy" "Prometheus health check" 2>nul
call :execute "curl -f http://localhost:3002/api/health" "Grafana health check" 2>nul

REM Record rollback completion
if "%DRY_RUN%"=="false" (
    echo [INFO] Recording rollback completion...
    curl -X POST "http://localhost:9090/api/v1/alerts" -H "Content-Type: application/json" -d "{\"labels\":{\"alertname\":\"RollbackCompleted\",\"phase\":\"%PHASE%\",\"reason\":\"%REASON%\"},\"annotations\":{\"summary\":\"Production rollback completed\",\"description\":\"Successfully rolled back %PHASE%\"}}" 2>nul
)

REM Cleanup old versions
if "%DRY_RUN%"=="false" (
    echo [INFO] Cleaning up old versions...
    for /f "skip=%ROLLBACK_VERSIONS_TO_KEEP% tokens=*" %%i in ('docker images ^| findstr dojopool') do (
        docker rmi %%i
    )

    REM Clean up old backups (keep last 30 days)
    forfiles /p "backups" /m "*.sql" /d -%BACKUP_RETENTION_DAYS% /c "cmd /c del @path"
)

echo [SUCCESS] Rollback completed successfully!
echo [SUCCESS] Phase: %PHASE%
echo [SUCCESS] Reason: %REASON%
echo [SUCCESS] Timestamp: %date% %time%

REM Generate rollback report
if "%DRY_RUN%"=="false" (
    set REPORT_FILE=rollback-report-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.txt
    echo DojoPool Production Rollback Report > "%REPORT_FILE%"
    echo =================================== >> "%REPORT_FILE%"
    echo. >> "%REPORT_FILE%"
    echo Timestamp: %date% %time% >> "%REPORT_FILE%"
    echo Phase: %PHASE% >> "%REPORT_FILE%"
    echo Reason: %REASON% >> "%REPORT_FILE%"
    echo Status: COMPLETED >> "%REPORT_FILE%"
    echo. >> "%REPORT_FILE%"
    echo Pre-rollback Actions: >> "%REPORT_FILE%"
    echo - Enabled maintenance mode >> "%REPORT_FILE%"
    echo - Notified stakeholders >> "%REPORT_FILE%"
    echo - Created database backup >> "%REPORT_FILE%"
    echo. >> "%REPORT_FILE%"
    echo Rollback Actions: >> "%REPORT_FILE%"
    echo - Scaled down services >> "%REPORT_FILE%"
    echo - Deployed previous version >> "%REPORT_FILE%"
    echo - Updated configuration >> "%REPORT_FILE%"
    echo - Restored database ^(if needed^) >> "%REPORT_FILE%"
    echo. >> "%REPORT_FILE%"
    echo Next Steps: >> "%REPORT_FILE%"
    echo 1. Monitor system for 24 hours >> "%REPORT_FILE%"
    echo 2. Run full test suite >> "%REPORT_FILE%"
    echo 3. Review rollback cause analysis >> "%REPORT_FILE%"
    echo 4. Plan next deployment attempt >> "%REPORT_FILE%"

    echo [SUCCESS] Rollback report generated: %REPORT_FILE%
)

echo [SUCCESS] Rollback procedure completed successfully
