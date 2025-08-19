# Dojo Pool E2E Test Runner
# This script sets up and runs Cypress end-to-end tests

Write-Host "🏆 Dojo Pool E2E Test Runner" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Check if Cypress is installed
if (-not (Test-Path "node_modules/cypress")) {
    Write-Host "📦 Installing Cypress..." -ForegroundColor Yellow
    npm install cypress --save-dev
}

# Check if frontend is running
Write-Host "🔍 Checking if frontend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Frontend is running on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend not running on http://localhost:3000" -ForegroundColor Yellow
    Write-Host "   Please start the frontend with: npm run dev" -ForegroundColor Yellow
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Check if backend is running
Write-Host "🔍 Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is running on http://localhost:3001" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend not running on http://localhost:3001" -ForegroundColor Yellow
    Write-Host "   Please start the backend with: npm run dev --filter api" -ForegroundColor Yellow
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Run E2E tests
Write-Host "🧪 Running E2E tests..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if user wants interactive mode
$interactive = Read-Host "Do you want to run tests in interactive mode? (y/n)"

if ($interactive -eq "y" -or $interactive -eq "Y") {
    Write-Host "🚀 Starting Cypress in interactive mode..." -ForegroundColor Green
    npm run cypress:open
} else {
    Write-Host "🚀 Running tests in headless mode..." -ForegroundColor Green
    npm run test:e2e
}

Write-Host "✅ E2E test execution completed!" -ForegroundColor Green
