# Set error action preference to stop on any error
$ErrorActionPreference = "Stop"

Write-Host "Starting DojoPool development environment..."

# Get the directory of this script and navigate to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

# Start backend server
Write-Host "Starting backend server..."
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:projectRoot
    npm run start
}

# Start frontend development server
Write-Host "Starting frontend development server..."
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:projectRoot
    npm run dev
}

Write-Host "Development environment is starting up..."
Write-Host "Frontend will be available at: http://localhost:3000"
Write-Host "Backend API will be available at: http://localhost:3001"

# Wait for user input to stop servers
Write-Host "Press Enter to stop the servers..."
Read-Host

# Stop the jobs
Stop-Job $backendJob
Stop-Job $frontendJob
Remove-Job $backendJob
Remove-Job $frontendJob

Write-Host "Development servers stopped." 