# PowerShell script to start DojoPool servers
Write-Host "Starting DojoPool servers..."

# Start backend API server
Write-Host "Starting backend API server..."
$backendJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\RescueAdmin\OneDrive\Documents\GitHub\dojopool\services\api"
    npm run start:dev
}

# Start frontend web server
Write-Host "Starting frontend web server..."
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\RescueAdmin\OneDrive\Documents\GitHub\dojopool\apps\web"
    npm run dev
}

Write-Host "Servers starting in background..."
Write-Host "Backend: http://localhost:3002"
Write-Host "Frontend: http://localhost:3000"

# Wait a moment for servers to start
Start-Sleep -Seconds 5

# Check if servers are running
Write-Host "Checking server status..."
$backendListening = netstat -ano | findstr :3002
$frontendListening = netstat -ano | findstr :3000

if ($backendListening) {
    Write-Host "✓ Backend API server is running on port 3002"
} else {
    Write-Host "✗ Backend API server not found on port 3002"
}

if ($frontendListening) {
    Write-Host "✓ Frontend web server is running on port 3000"
} else {
    Write-Host "✗ Frontend web server not found on port 3000"
}

Write-Host "Press Ctrl+C to stop servers"
