# Simple Environment Fix Script
Write-Host "DojoPool Environment Fix" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
try {
    $version = python --version 2>&1
    Write-Host "Python check result: $version" -ForegroundColor White
} catch {
    Write-Host "Python command failed" -ForegroundColor Red
}

# Check for Microsoft Store shortcuts
Write-Host "Checking for Microsoft Store shortcuts..." -ForegroundColor Yellow
$shortcuts = Get-Command python* -ErrorAction SilentlyContinue | Where-Object { $_.Source -like "*WindowsApps*" }
if ($shortcuts) {
    Write-Host "Microsoft Store shortcuts found:" -ForegroundColor Red
    foreach ($s in $shortcuts) {
        Write-Host "  $($s.Name): $($s.Source)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "SOLUTION REQUIRED:" -ForegroundColor Yellow
    Write-Host "1. Install Python from https://python.org/downloads/" -ForegroundColor White
    Write-Host "2. Check 'Add Python to PATH' during installation" -ForegroundColor White
    Write-Host "3. Restart PowerShell and run this script again" -ForegroundColor White
} else {
    Write-Host "No Microsoft Store shortcuts blocking Python" -ForegroundColor Green
}

Write-Host ""
Write-Host "Environment diagnosis complete." -ForegroundColor Cyan