# Temporarily set execution policy to Bypass for this process
$oldPolicy = Get-ExecutionPolicy -Scope Process
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

try {
  Write-Host "[INFO] Running NetworkErrorRecovery test suite with policy bypass..."
  npm test -- --runInBand --detectOpenHandles --verbose src/core/network/__tests__/NetworkErrorRecovery.test.ts
} catch {
  Write-Host "[ERROR] Test run failed: $_"
} finally {
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy $oldPolicy
  Write-Host "[INFO] Restored previous execution policy: $oldPolicy"
}