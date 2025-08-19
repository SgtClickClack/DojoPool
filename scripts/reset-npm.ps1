# Reset NPM environment for DojoPool (Windows PowerShell)
# This script force-cleans npm cache, removes node_modules and package-lock.json, then reinstalls.
# Usage: npm run env:reset:npm

$ErrorActionPreference = 'Stop'

function Write-Step($message) {
  Write-Host "`n=== $message ===" -ForegroundColor Cyan
}

try {
  # 1) Force clean the cache (most important step)
  Write-Step "1) Force-cleaning npm cache"
  npm cache clean --force

  # 2) Delete local files (modules and lockfile) in one command, as per standard fix
  Write-Step "2) Removing node_modules and package-lock.json"
  Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue

  # 3) Re-install dependencies
  Write-Step "3) Re-installing dependencies"
  npm install

  Write-Host "`nNPM environment reset completed successfully." -ForegroundColor Green
  exit 0
} catch {
  Write-Error "NPM environment reset failed: $($_.Exception.Message)"
  exit 1
}
