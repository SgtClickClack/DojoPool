# PowerShell script to start DojoPool servers
Write-Host "🚀 Starting DojoPool servers..." -ForegroundColor Green

# Function to start a service
function Start-Service {
    param (
        [string]$Path,
        [string]$Command,
        [string]$Name
    )

    Write-Host "Starting $Name..." -ForegroundColor Yellow
    $job = Start-Job -ScriptBlock {
        param($path, $cmd)
        Set-Location $path
        Invoke-Expression $cmd
    } -ArgumentList $Path, $Command

    return $job
}

# Start backend API server
$backendPath = "C:\Users\RescueAdmin\OneDrive\Documents\GitHub\dojopool\services\api"
$backendJob = Start-Service -Path $backendPath -Command "npm run start:dev" -Name "Backend API"

# Wait a moment before starting frontend
Start-Sleep -Seconds 3

# Start frontend web server
$frontendPath = "C:\Users\RescueAdmin\OneDrive\Documents\GitHub\dojopool\apps\web"
$frontendJob = Start-Service -Path $frontendPath -Command "npm run dev" -Name "Frontend Web"

Write-Host "⏳ Servers are starting up..." -ForegroundColor Blue
Write-Host "Backend API: http://localhost:3002" -ForegroundColor Cyan
Write-Host "Frontend Web: http://localhost:3000" -ForegroundColor Cyan

# Wait for servers to start
Start-Sleep -Seconds 10

# Check server status
Write-Host "📊 Checking server status..." -ForegroundColor Blue

$backendStatus = Test-NetConnection -ComputerName localhost -Port 3002 -InformationLevel Quiet
$frontendStatus = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet

if ($backendStatus) {
    Write-Host "✅ Backend API server is running on port 3002" -ForegroundColor Green
} else {
    Write-Host "❌ Backend API server not responding on port 3002" -ForegroundColor Red
}

if ($frontendStatus) {
    Write-Host "✅ Frontend web server is running on port 3000" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend web server not responding on port 3000" -ForegroundColor Red
}

if ($backendStatus -and $frontendStatus) {
    Write-Host "🎉 All servers are running successfully!" -ForegroundColor Green
    Write-Host "🌐 Access your DojoPool app at: http://localhost:3000" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some servers failed to start. Check the job outputs above." -ForegroundColor Yellow
}

Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Gray
