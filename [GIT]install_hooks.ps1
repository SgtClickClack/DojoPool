# Install pre-commit
Write-Host "Installing pre-commit..."
python -m pip install pre-commit

# Install pre-commit hooks
Write-Host "`nInstalling pre-commit hooks..."
pre-commit install

# Run pre-commit hooks on all files
Write-Host "`nRunning pre-commit hooks on all files..."
pre-commit run --all-files

# Check result
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nPre-commit hooks installed and run successfully!" -ForegroundColor Green
} else {
    Write-Host "`nPre-commit hooks installation or run failed!" -ForegroundColor Red
    exit 1
}
