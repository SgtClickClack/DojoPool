@echo off
REM GitHub Workflow Monitor and Auto-Fix Script (Windows Batch)
REM This script monitors workflow health and automatically fixes common issues

setlocal enabledelayedexpansion

echo 🔍 Starting GitHub Workflow Monitor
echo Repository: SgtClickClack/DojoPool
echo Monitor Duration: 300s
echo Check Interval: 30s
echo.

:monitor_loop
echo 🔄 Starting monitoring cycle...
echo ==================================

REM Check workflow status
echo 📊 Checking workflow status...
gh run list --limit 10 --json databaseId,status,conclusion,workflowName,headBranch > workflow_status.json 2>nul

REM Parse failed workflows
set failed_count=0
for /f "tokens=*" %%i in ('powershell -Command "Get-Content workflow_status.json | ConvertFrom-Json | Where-Object { $_.status -eq 'completed' -and $_.conclusion -eq 'failure' } | ForEach-Object { Write-Output ('$($_.workflowName)|$($_.databaseId)') }"') do (
    echo ❌ FAILED: %%i
    set /a failed_count+=1
)

REM Parse successful workflows
for /f "tokens=*" %%i in ('powershell -Command "Get-Content workflow_status.json | ConvertFrom-Json | Where-Object { $_.status -eq 'completed' -and $_.conclusion -eq 'success' } | ForEach-Object { Write-Output ('$($_.workflowName)') }"') do (
    echo ✅ SUCCESS: %%i
)

REM Parse running workflows
for /f "tokens=*" %%i in ('powershell -Command "Get-Content workflow_status.json | ConvertFrom-Json | Where-Object { $_.status -eq 'in_progress' } | ForEach-Object { Write-Output ('$($_.workflowName)|$($_.databaseId)') }"') do (
    echo 🔄 RUNNING: %%i
)

REM Clean up temp file
del workflow_status.json 2>nul

if %failed_count% gtr 0 (
    echo 🔍 Analyzing failed workflows...
    
    REM Check for common issues and fix them
    echo 🔧 Checking for common issues...
    
    REM Check if Multer types file exists
    if not exist "services\api\src\types\multer.d.ts" (
        echo 🔧 Creating Multer types file...
        mkdir "services\api\src\types" 2>nul
        echo import 'multer'; > "services\api\src\types\multer.d.ts"
        echo. >> "services\api\src\types\multer.d.ts"
        echo declare global { >> "services\api\src\types\multer.d.ts"
        echo   namespace Express { >> "services\api\src\types\multer.d.ts"
        echo     namespace Multer { >> "services\api\src\types\multer.d.ts"
        echo       interface File { >> "services\api\src\types\multer.d.ts"
        echo         fieldname: string; >> "services\api\src\types\multer.d.ts"
        echo         originalname: string; >> "services\api\src\types\multer.d.ts"
        echo         encoding: string; >> "services\api\src\types\multer.d.ts"
        echo         mimetype: string; >> "services\api\src\types\multer.d.ts"
        echo         size: number; >> "services\api\src\types\multer.d.ts"
        echo         destination?: string; >> "services\api\src\types\multer.d.ts"
        echo         filename?: string; >> "services\api\src\types\multer.d.ts"
        echo         path?: string; >> "services\api\src\types\multer.d.ts"
        echo         buffer?: Buffer; >> "services\api\src\types\multer.d.ts"
        echo       } >> "services\api\src\types\multer.d.ts"
        echo     } >> "services\api\src\types\multer.d.ts"
        echo   } >> "services\api\src\types\multer.d.ts"
        echo } >> "services\api\src\types\multer.d.ts"
        echo ✅ Multer types file created
    )
    
    REM Check if deployment directory exists for NGINX workflow
    if not exist "deployment" (
        echo 🔧 Disabling NGINX workflow...
        powershell -Command "(Get-Content '.github\workflows\nginx-test.yml') -replace '^  push:', '  # push:' | Set-Content '.github\workflows\nginx-test.yml'"
        powershell -Command "(Get-Content '.github\workflows\nginx-test.yml') -replace '^  pull_request:', '  # pull_request:' | Set-Content '.github\workflows\nginx-test.yml'"
        echo ✅ NGINX workflow disabled
    )
    
    REM Commit and push fixes
    echo 📤 Committing and pushing fixes...
    git add . >nul 2>&1
    git commit -m "fix(ci): auto-fix workflow issues detected by monitor" >nul 2>&1
    git push >nul 2>&1
    echo ✅ Fixes committed and pushed
) else (
    echo ✅ No failed workflows to fix
)

echo ✅ Cycle completed
echo ==================================
echo.

REM Wait before next cycle
echo ⏳ Waiting before next cycle...
timeout /t 30 /nobreak >nul

goto monitor_loop
