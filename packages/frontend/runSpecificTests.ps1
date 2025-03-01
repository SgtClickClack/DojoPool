# PowerShell script for running only our specific DojoPool Frontend tests

Write-Host "==== Running DojoPool Frontend Wallet & Tournament Tests ====" -ForegroundColor Yellow
Write-Host "==== $(Get-Date) ====" -ForegroundColor Yellow
Write-Host ""

# Run only our specific tests
Write-Host "Running tests for wallet and tournament components..." -ForegroundColor Yellow

# Run specific tests with explicit config
npx jest "src/tests/(useWallet|crossChainTournamentService|TournamentRegistration)" --config=jest.config.js

# Check if all tests passed
if ($LASTEXITCODE -eq 0) {
  Write-Host "All tests passed!" -ForegroundColor Green
} else {
  Write-Host "Some tests failed. See above for details." -ForegroundColor Red
}

Write-Host ""
Write-Host "==== Test Run Complete ====" -ForegroundColor Yellow
Write-Host "==== $(Get-Date) ====" -ForegroundColor Yellow 