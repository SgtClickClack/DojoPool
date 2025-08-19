<#
  clean-pnpm-workspace.ps1
  Purpose: Safely reset Node-related artifacts for a pnpm monorepo and prune pnpm store.
  Usage:   powershell -ExecutionPolicy Bypass -File .\scripts\clean-pnpm-workspace.ps1
#>

$ErrorActionPreference = 'Continue'

Write-Host "[clean] Starting pnpm workspace cleanup..." -ForegroundColor Cyan

function Remove-IfExists {
  param(
    [string]$Path,
    [switch]$Recurse
  )
  if (Test-Path $Path) {
    try {
      if ($Recurse) {
        Remove-Item -Recurse -Force $Path
      } else {
        Remove-Item -Force $Path
      }
      Write-Host "[clean] Removed: $Path" -ForegroundColor DarkGray
    } catch {
      Write-Warning "[clean] Failed to remove $Path : $_"
    }
  } else {
    Write-Host "[clean] Skipped (not found): $Path" -ForegroundColor DarkGray
  }
}

# From repo root
$current = Get-Location
Write-Host "[clean] Working directory: $($current.Path)" -ForegroundColor DarkGray

# Common root artifacts
Remove-IfExists -Path "node_modules" -Recurse
Remove-IfExists -Path "pnpm-lock.yaml"
Remove-IfExists -Path ".next" -Recurse
Remove-IfExists -Path "dist" -Recurse

# Optional: clean typical workspace package caches if present
# Add more paths here if your packages build into other directories

Write-Host "[clean] Pruning pnpm store (global cache)..." -ForegroundColor Cyan
try {
  pnpm store prune
  Write-Host "[clean] pnpm store prune completed." -ForegroundColor Green
} catch {
  Write-Warning "[clean] pnpm store prune failed: $_"
}

Write-Host "[clean] Done. Next: run 'pnpm install' from repo root." -ForegroundColor Cyan
