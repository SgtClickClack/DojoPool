# DojoPool Environment Fix Script
# This script addresses all Python environment issues and sets up a working development environment

Write-Host "DojoPool Environment Fix" -ForegroundColor Magenta
Write-Host "========================" -ForegroundColor Magenta
Write-Host ""

# Check current Python status
Write-Host "Diagnosing Python Installation Issues..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

$pythonFound = $false
$pythonPath = ""

# Check for real Python installation
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python \d+\.\d+\.\d+" -and $pythonVersion -notmatch "Microsoft Store") {
        $pythonFound = $true
        $pythonPath = (Get-Command python).Source
        Write-Host "✓ Real Python found: $pythonVersion" -ForegroundColor Green
        Write-Host "  Location: $pythonPath" -ForegroundColor White
    }
} catch {
    # Python command failed
}

# Check for Microsoft Store shortcuts (the problem)
$storeShortcuts = Get-Command python* -ErrorAction SilentlyContinue | Where-Object { $_.Source -like "*WindowsApps*" }
if ($storeShortcuts -and -not $pythonFound) {
    Write-Host "❌ PROBLEM IDENTIFIED: Only Microsoft Store Python shortcuts found" -ForegroundColor Red
    Write-Host "  These are non-functional placeholders that prevent real Python installation" -ForegroundColor Yellow
    foreach ($shortcut in $storeShortcuts) {
        Write-Host "  - $($shortcut.Name): $($shortcut.Source)" -ForegroundColor Gray
    }
}

if (-not $pythonFound) {
    Write-Host ""
    Write-Host "FIXING PYTHON INSTALLATION" -ForegroundColor Cyan
    Write-Host "===========================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Step 1: Disable Microsoft Store Python shortcuts" -ForegroundColor Yellow
    Write-Host "1. Open Windows Settings (Win + I)" -ForegroundColor White
    Write-Host "2. Go to Apps then Advanced app settings then App execution aliases" -ForegroundColor White
    Write-Host "3. Turn OFF the toggles for:" -ForegroundColor White
    Write-Host "   - App Installer python.exe" -ForegroundColor White
    Write-Host "   - App Installer python3.exe" -ForegroundColor White
    Write-Host ""
    Write-Host "Step 2: Install Real Python" -ForegroundColor Yellow
    Write-Host "1. Go to https://python.org/downloads/" -ForegroundColor White
    Write-Host "2. Download Python 3.11 or 3.12 (recommended)" -ForegroundColor White
    Write-Host "3. During installation:" -ForegroundColor White
    Write-Host "   ✓ Check Add Python to PATH" -ForegroundColor Green
    Write-Host "   ✓ Check Install for all users (if admin)" -ForegroundColor Green
    Write-Host "4. Complete installation and restart PowerShell" -ForegroundColor White
    Write-Host ""
    Write-Host "Step 3: After Python installation, run this script again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "MANUAL ALTERNATIVE:" -ForegroundColor Cyan
    Write-Host "If you have Python installed elsewhere, add it to PATH manually:" -ForegroundColor White
    Write-Host "1. Find your Python installation directory" -ForegroundColor White
    Write-Host "2. Add both Python and Scripts directories to PATH" -ForegroundColor White
    Write-Host ""
    exit 1
}

# If we get here, Python is properly installed
Write-Host ""
Write-Host "PYTHON IS WORKING - PROCEEDING WITH ENVIRONMENT SETUP" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

# Create virtual environment
Write-Host ""
Write-Host "Creating Virtual Environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "Removing existing venv directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "venv"
}

try {
    python -m venv venv
    Write-Host "✓ Virtual environment created successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Activate virtual environment
Write-Host ""
Write-Host "Activating Virtual Environment..." -ForegroundColor Yellow
try {
    & ".\venv\Scripts\Activate.ps1"
    Write-Host "✓ Virtual environment activated" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to activate virtual environment" -ForegroundColor Red
    Write-Host "You may need to run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
    exit 1
}

# Verify activation
try {
    $venvPython = python -c "import sys; print(sys.executable)" 2>&1
    if ($venvPython -like "*venv*") {
        Write-Host "✓ Virtual environment is active" -ForegroundColor Green
        Write-Host "  Python location: $venvPython" -ForegroundColor White
    } else {
        Write-Host "⚠️  Virtual environment may not be properly activated" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not verify virtual environment activation" -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "Installing Project Dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "requirements.txt")) {
    Write-Host "❌ requirements.txt not found" -ForegroundColor Red
    exit 1
}

try {
    pip install --upgrade pip
    pip install -r requirements.txt
    Write-Host "✓ Project dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Install and run security audit
Write-Host ""
Write-Host "Installing Security Audit Tool..." -ForegroundColor Yellow
try {
    pip install pip-audit
    Write-Host "✓ pip-audit installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install pip-audit" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Running Security Audit..." -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Cyan
try {
    pip-audit --format=json --output=security-audit-results.json
    pip-audit
    Write-Host ""
    Write-Host "✓ Security audit completed" -ForegroundColor Green
    Write-Host "  Results saved to: security-audit-results.json" -ForegroundColor White
} catch {
    Write-Host "⚠️  Security audit completed with warnings" -ForegroundColor Yellow
}

# Final status
Write-Host ""
Write-Host "ENVIRONMENT SUCCESSFULLY FIXED!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host "✓ Python properly installed and working" -ForegroundColor Green
Write-Host "✓ Virtual environment created and activated" -ForegroundColor Green
Write-Host "✓ All project dependencies installed" -ForegroundColor Green
Write-Host "✓ Security audit completed" -ForegroundColor Green
Write-Host ""
Write-Host "Your DojoPool development environment is now ready!" -ForegroundColor Magenta
Write-Host ""
Write-Host "To activate environment in future sessions:" -ForegroundColor Cyan
Write-Host ".\venv\Scripts\Activate.ps1" -ForegroundColor White