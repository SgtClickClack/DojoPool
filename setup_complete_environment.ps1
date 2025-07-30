# Complete Environment Setup Master Script
# This script orchestrates the entire environment activation process

Write-Host "DojoPool Environment Setup" -ForegroundColor Magenta
Write-Host "==========================" -ForegroundColor Magenta
Write-Host ""

# Step 1: Check Python Installation
Write-Host "Step 1: Checking Python Installation" -ForegroundColor Cyan
Write-Host "------------------------------------" -ForegroundColor Cyan

try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python \d+\.\d+\.\d+") {
        Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Python not properly installed" -ForegroundColor Red
        Write-Host ""
        Write-Host "REQUIRED ACTION:" -ForegroundColor Yellow
        Write-Host "1. Install Python from https://python.org/downloads/" -ForegroundColor White
        Write-Host "2. During installation, check 'Add Python to PATH'" -ForegroundColor White
        Write-Host "3. Restart WebStorm/PowerShell" -ForegroundColor White
        Write-Host "4. Run this script again" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "❌ Python not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "REQUIRED ACTION:" -ForegroundColor Yellow
    Write-Host "1. Install Python from https://python.org/downloads/" -ForegroundColor White
    Write-Host "2. During installation, check 'Add Python to PATH'" -ForegroundColor White
    Write-Host "3. Restart WebStorm/PowerShell" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
    exit 1
}

Write-Host ""

# Step 2: Create Virtual Environment
Write-Host "Step 2: Creating Virtual Environment" -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Cyan

if (Test-Path "venv") {
    Write-Host "⚠️  Virtual environment already exists" -ForegroundColor Yellow
    $response = Read-Host "Recreate virtual environment? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Remove-Item -Recurse -Force "venv"
        Write-Host "Removed existing virtual environment" -ForegroundColor Yellow
    } else {
        Write-Host "Using existing virtual environment" -ForegroundColor Green
    }
}

if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    try {
        python -m venv venv
        Write-Host "✓ Virtual environment created" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 3: Activate Virtual Environment
Write-Host "Step 3: Activating Virtual Environment" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Activation script not found" -ForegroundColor Red
    exit 1
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
try {
    & ".\venv\Scripts\Activate.ps1"
    Write-Host "✓ Virtual environment activated" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to activate virtual environment" -ForegroundColor Red
    Write-Host "You may need to run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 4: Install Dependencies
Write-Host "Step 4: Installing Dependencies" -ForegroundColor Cyan
Write-Host "-------------------------------" -ForegroundColor Cyan

if (-not (Test-Path "requirements.txt")) {
    Write-Host "❌ requirements.txt not found" -ForegroundColor Red
    exit 1
}

Write-Host "Installing project dependencies..." -ForegroundColor Yellow
try {
    pip install -r requirements.txt
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Install and Run Security Audit
Write-Host "Step 5: Security Audit" -ForegroundColor Cyan
Write-Host "----------------------" -ForegroundColor Cyan

Write-Host "Installing pip-audit..." -ForegroundColor Yellow
try {
    pip install pip-audit
    Write-Host "✓ pip-audit installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install pip-audit" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Running security audit..." -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Cyan
try {
    pip-audit
    Write-Host ""
    Write-Host "✓ Security audit completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Security audit encountered issues" -ForegroundColor Red
}

Write-Host ""
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Green
Write-Host "✓ Python installed and configured" -ForegroundColor Green
Write-Host "✓ Virtual environment created and activated" -ForegroundColor Green
Write-Host "✓ Project dependencies installed" -ForegroundColor Green
Write-Host "✓ Security audit completed" -ForegroundColor Green
Write-Host ""
Write-Host "Your DojoPool development environment is ready!" -ForegroundColor Magenta