# Flushes the Windows DNS resolver cache.
# Usage: Run this script in an elevated PowerShell (Run as Administrator).

# Check for administrative privileges
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$hasAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $hasAdmin) {
  Write-Warning "This script must be run as Administrator. Right-click PowerShell and choose 'Run as administrator'."
  exit 1
}

Write-Host "Flushing DNS resolver cache..." -ForegroundColor Cyan
ipconfig /flushdns | Out-Host

if ($LASTEXITCODE -eq 0) {
  Write-Host "Successfully flushed the DNS Resolver Cache." -ForegroundColor Green
  exit 0
} else {
  Write-Error "Failed to flush DNS cache. Exit code: $LASTEXITCODE"
  exit $LASTEXITCODE
}
