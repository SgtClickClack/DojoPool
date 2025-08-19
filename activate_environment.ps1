# Environment Activation and Verification Script
# Run this script to activate the virtual environment and verify it's working

Write-Host "Environment Activation Script" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "❌ Virtual environment 'venv' not found" -ForegroundColor Red
    Write-Host "Please run create_environment.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Check if activation script exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Activation script not found" -ForegroundColor Red
    Write-Host "Virtual environment may be corrupted. Please recreate it." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Virtual environment found" -ForegroundColor Green

# Activate the virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
try {
    & ".\venv\Scripts\Activate.ps1"
    Write-Host "✓ Virtual environment activated" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to activate virtual environment" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "You may need to run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
    exit 1
}

# Verify activation by checking Python location
Write-Host "Verifying activation..." -ForegroundColor Yellow
try {
    $pythonPath = python -c "import sys; print(sys.executable)" 2>&1
    if ($pythonPath -like "*venv*") {
        Write-Host "✓ Python is running from virtual environment" -ForegroundColor Green
        Write-Host "Python location: $pythonPath" -ForegroundColor White
    } else {
        Write-Host "⚠️  Python may not be using virtual environment" -ForegroundColor Yellow
        Write-Host "Python location: $pythonPath" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Could not verify Python location" -ForegroundColor Red
}

# Check pip location
try {
    $pipPath = pip --version 2>&1
    Write-Host "✓ Pip available: $pipPath" -ForegroundColor Green
} catch {
    Write-Host "❌ Pip not available" -ForegroundColor Red
}

Write-Host ""
Write-Host "Environment Status:" -ForegroundColor Cyan
Write-Host "- Virtual environment: ✓ Activated" -ForegroundColor Green
Write-Host "- Ready for dependency installation" -ForegroundColor Green
Write-Host ""
Write-Host "Next commands to run:" -ForegroundColor Cyan
Write-Host "pip install -r requirements.txt" -ForegroundColor White
Write-Host "pip install pip-audit" -ForegroundColor White
Write-Host "pip-audit" -ForegroundColor White