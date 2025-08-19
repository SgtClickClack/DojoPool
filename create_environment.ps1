# Virtual Environment Creation Script
# Run this script after Python is properly installed

Write-Host "Checking Python installation..." -ForegroundColor Yellow

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python \d+\.\d+\.\d+") {
        Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Python not properly installed" -ForegroundColor Red
        Write-Host "Please install Python from https://python.org/downloads/" -ForegroundColor Yellow
        Write-Host "Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Python not found in PATH" -ForegroundColor Red
    Write-Host "Please install Python from https://python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check if virtual environment already exists
if (Test-Path "venv") {
    Write-Host "⚠️  Virtual environment 'venv' already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to recreate it? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "Removing existing virtual environment..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "venv"
    } else {
        Write-Host "Using existing virtual environment" -ForegroundColor Green
        exit 0
    }
}

# Create virtual environment
Write-Host "Creating virtual environment..." -ForegroundColor Yellow
try {
    python -m venv venv
    Write-Host "✓ Virtual environment created successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Verify virtual environment creation
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "✓ Virtual environment activation script found" -ForegroundColor Green
    Write-Host "" 
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Activate environment: .\venv\Scripts\Activate.ps1" -ForegroundColor White
    Write-Host "2. Install dependencies: pip install -r requirements.txt" -ForegroundColor White
    Write-Host "3. Run security audit: pip install pip-audit && pip-audit" -ForegroundColor White
} else {
    Write-Host "❌ Virtual environment creation failed" -ForegroundColor Red
    exit 1
}