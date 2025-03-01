# PowerShell script for running DojoPool Frontend tests

Write-Host "==== Running DojoPool Frontend Tests ====" -ForegroundColor Yellow
Write-Host "==== $(Get-Date) ====" -ForegroundColor Yellow
Write-Host ""

# Run tests with npx to ensure we use the local jest installation
Write-Host "Running tests with ts-jest preset..." -ForegroundColor Yellow

# Run Jest directly with the ts-jest preset and specify config file
npx jest --config=jest.config.js

# Check if all tests passed
if ($LASTEXITCODE -eq 0) {
  Write-Host "All tests passed!" -ForegroundColor Green
} else {
  Write-Host "Some tests failed. See above for details." -ForegroundColor Red
}

Write-Host ""
Write-Host "==== Test Run Complete ====" -ForegroundColor Yellow
Write-Host "==== $(Get-Date) ====" -ForegroundColor Yellow 