@echo off
echo 🚀 Starting Simple Auto-Deploy Monitor for DojoPool
echo ==================================================

cd /d "%~dp0"

set /a attempt=1
set /a maxAttempts=8

:loop
echo.
echo 📊 Attempt %attempt% of %maxAttempts%
echo ================================================

echo 🔍 Checking deployment status...
vercel ls --json > temp_deployments.json 2>nul

if %errorlevel% neq 0 (
    echo ❌ Error checking deployment status
    goto :wait
)

echo 📋 Latest deployment status:
vercel ls | findstr /C:"READY" /C:"ERROR" /C:"BUILDING" /C:"QUEUED" | head -1

echo.
echo 🔍 Checking if deployment is ready...
vercel ls | findstr "READY" >nul
if %errorlevel% equ 0 (
    echo 🎉 Deployment successful!
    echo ✅ Your DojoPool application is now live!
    goto :success
)

echo 🔍 Checking if deployment failed...
vercel ls | findstr "ERROR" >nul
if %errorlevel% equ 0 (
    echo ❌ Deployment failed. Triggering new deployment...
    echo 📋 Fetching build logs...
    vercel logs
    echo.
    echo 🔄 Triggering new deployment...
    vercel --prod
    if %errorlevel% equ 0 (
        echo ✅ New deployment triggered successfully
    ) else (
        echo ❌ Failed to trigger new deployment
        goto :error
    )
)

echo 🔍 Checking if deployment is building...
vercel ls | findstr "BUILDING" >nul
if %errorlevel% equ 0 (
    echo ⏳ Deployment is building. Waiting 20 seconds...
    timeout /t 20 /nobreak >nul
    goto :next
)

echo 🔍 Checking if deployment is queued...
vercel ls | findstr "QUEUED" >nul
if %errorlevel% equ 0 (
    echo ⏳ Deployment is queued. Waiting 20 seconds...
    timeout /t 20 /nobreak >nul
    goto :next
)

:wait
echo ⏳ Waiting 20 seconds before next check...
timeout /t 20 /nobreak >nul

:next
set /a attempt+=1
if %attempt% leq %maxAttempts% goto :loop

echo.
echo ❌ Maximum attempts reached (%maxAttempts%). Deployment monitoring stopped.
echo 🔍 Please check your Vercel dashboard for manual intervention.
goto :error

:success
echo.
echo 🎉 Auto-deploy monitoring completed successfully!
del temp_deployments.json 2>nul
exit /b 0

:error
echo.
echo ❌ Auto-deploy monitoring failed.
del temp_deployments.json 2>nul
exit /b 1
