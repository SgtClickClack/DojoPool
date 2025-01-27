# Install test dependencies
Write-Host "Installing test dependencies..."
python -m pip install -r test-requirements.txt

# Run tests with coverage
Write-Host "`nRunning tests with coverage..."
python -m pytest src/core/matchmaking/tests/run_tests.py -v --cov=src/core/matchmaking --cov-report=term-missing --cov-report=html

# Check test result
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nAll tests passed successfully!" -ForegroundColor Green
    
    # Open coverage report
    Write-Host "`nOpening coverage report..."
    Start-Process "coverage_html_report/index.html"
} else {
    Write-Host "`nSome tests failed!" -ForegroundColor Red
    exit 1
}
