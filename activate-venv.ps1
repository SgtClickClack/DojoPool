# PowerShell script to activate the DojoPool virtual environment
Write-Host "Activating DojoPool virtual environment..." -ForegroundColor Green
& ".\venv\Scripts\Activate.ps1"
Write-Host "Virtual environment activated! Use 'deactivate' to exit." -ForegroundColor Yellow
Write-Host "Python version: $(python --version)" -ForegroundColor Cyan

