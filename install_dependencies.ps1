# Dependency Installation and Security Audit Script
# Run this script after activating the virtual environment

Write-Host "Dependency Installation & Security Audit" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if we're in a virtual environment
$pythonPath = python -c "import sys; print(sys.executable)" 2>&1
if ($pythonPath -notlike "*venv*") {
    Write-Host "❌ Virtual environment not activated" -ForegroundColor Red
    Write-Host "Please run: .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Virtual environment is active" -ForegroundColor Green
Write-Host "Python location: $pythonPath" -ForegroundColor White

# Check if requirements.txt exists
if (-not (Test-Path "requirements.txt")) {
    Write-Host "❌ requirements.txt not found" -ForegroundColor Red
    exit 1
}

Write-Host "✓ requirements.txt found" -ForegroundColor Green

# Install project dependencies
Write-Host ""
Write-Host "Installing project dependencies..." -ForegroundColor Yellow
try {
    pip install -r requirements.txt
    Write-Host "✓ Project dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install project dependencies" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Install pip-audit
Write-Host ""
Write-Host "Installing pip-audit security tool..." -ForegroundColor Yellow
try {
    pip install pip-audit
    Write-Host "✓ pip-audit installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install pip-audit" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Run security audit
Write-Host ""
Write-Host "Running security audit..." -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Cyan
try {
    pip-audit
    Write-Host ""
    Write-Host "✓ Security audit completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Security audit failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installation and Audit Summary:" -ForegroundColor Cyan
Write-Host "- Virtual environment: ✓ Active" -ForegroundColor Green
Write-Host "- Project dependencies: ✓ Installed" -ForegroundColor Green
Write-Host "- Security audit tool: ✓ Installed" -ForegroundColor Green
Write-Host "- Security scan: ✓ Completed" -ForegroundColor Green
Write-Host ""
Write-Host "Environment is ready for development!" -ForegroundColor Green