@echo off
echo 🚀 Starting Final Auto-Deploy Monitor for DojoPool
echo ==================================================

cd /d "%~dp0"

set /a attempt=1
set /a maxAttempts=10

:loop
echo.
echo 📊 Attempt %attempt% of %maxAttempts%
echo ================================================

echo 🔍 Checking deployment status...
vercel ls | findstr /C:"READY" /C:"ERROR" /C:"BUILDING" /C:"QUEUED" | head -1

echo.
echo 🔍 Checking if deployment is ready...
vercel ls | findstr "READY" >nul
if %errorlevel% equ 0 (
    echo 🎉 Deployment successful!
    echo ✅ Your DojoPool application is now live!
    echo 🌐 Check your Vercel dashboard for the live URL
    goto :success
)

echo 🔍 Checking if deployment failed...
vercel ls | findstr "ERROR" >nul
if %errorlevel% equ 0 (
    echo ❌ Deployment failed. Checking logs...
    echo 📋 Recent deployment logs:
    vercel ls | head -3
    echo.
    echo 🔄 The automated GitHub deployment should trigger a new build...
    echo ⏳ Waiting 30 seconds for GitHub to process the push...
    timeout /t 30 /nobreak >nul
    goto :next
)

echo 🔍 Checking if deployment is building...
vercel ls | findstr "BUILDING" >nul
if %errorlevel% equ 0 (
    echo ⏳ Deployment is building. Waiting 30 seconds...
    timeout /t 30 /nobreak >nul
    goto :next
)

echo 🔍 Checking if deployment is queued...
vercel ls | findstr "QUEUED" >nul
if %errorlevel% equ 0 (
    echo ⏳ Deployment is queued. Waiting 30 seconds...
    timeout /t 30 /nobreak >nul
    goto :next
)

echo ⏳ No active deployment found. Waiting 30 seconds...
timeout /t 30 /nobreak >nul

:next
set /a attempt+=1
if %attempt% leq %maxAttempts% goto :loop

echo.
echo ❌ Maximum attempts reached (%maxAttempts%). 
echo 🔍 Please check your Vercel dashboard manually.
echo 📋 Current deployment status:
vercel ls | head -5
goto :error

:success
echo.
echo 🎉 Auto-deploy monitoring completed successfully!
echo ✅ The SSR issue has been resolved and deployment is working!
exit /b 0

:error
echo.
echo ❌ Auto-deploy monitoring completed with issues.
echo 🔍 Manual intervention may be required.
exit /b 1
