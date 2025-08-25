<#
.SYNOPSIS
  Safely terminates orphaned Node.js processes on Windows.

.DESCRIPTION
  This script specifically targets only "node" processes and stops them.
  It checks for administrative privileges and re-launches itself elevated if needed.
  This avoids broad pattern matching that could hit protected system processes (e.g., wlanext).

.USAGE
  1) Right-click Windows PowerShell and choose "Run as administrator" (recommended), then run:
       powershell -ExecutionPolicy Bypass -File scripts\cleanup-node-processes.ps1

  2) Or just double-click/run; if not elevated, it will prompt for elevation automatically.

.NOTES
  Author: DojoPool Team
  Date: 2025-08-20
#>

# Ensure script runs from repo root for consistent relative paths
Set-Location -Path (Split-Path -Parent $PSCommandPath)
Set-Location -Path (Resolve-Path ..)

function Test-IsAdmin {
  $currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdmin)) {
  Write-Host "⚠️  Administrator privileges are required to clean up orphan Node.js processes safely." -ForegroundColor Yellow
  Write-Host "Attempting to relaunch this script with elevated privileges..." -ForegroundColor Yellow
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "powershell.exe"
  $psi.Arguments = "-ExecutionPolicy Bypass -NoProfile -File `"$PSCommandPath`""
  $psi.Verb = "runas"
  try {
    [System.Diagnostics.Process]::Start($psi)
    exit 0
  } catch {
    Write-Error "Elevation was cancelled or failed. Please re-run PowerShell as Administrator and try again."
    exit 1
  }
}

try {
  $nodes = Get-Process -Name "node" -ErrorAction SilentlyContinue
  if (-not $nodes) {
    Write-Host "✅ No running Node.js processes found. Nothing to clean up." -ForegroundColor Green
    exit 0
  }

  Write-Host "🔎 Found $($nodes.Count) Node.js process(es):" -ForegroundColor Cyan
  foreach ($p in $nodes) {
    Write-Host (" - PID {0} | CPU {1} | WS {2} KB | StartTime {3}" -f $p.Id, ($p.CPU -as [string]), [int]($p.WorkingSet/1KB), ($p.StartTime -as [string]))
  }

  Write-Host "🧹 Stopping all Node.js processes..." -ForegroundColor Yellow
  $nodes | Stop-Process -Force -ErrorAction Stop
  Write-Host "✅ Successfully stopped all Node.js processes." -ForegroundColor Green

  # Verify
  Start-Sleep -Seconds 1
  $remaining = Get-Process -Name "node" -ErrorAction SilentlyContinue
  if ($remaining) {
    Write-Warning "Some Node.js processes are still running (likely re-spawned by watchers). You may need to close related terminals or tools."
    foreach ($r in $remaining) {
      Write-Host (" - Remaining PID {0}" -f $r.Id)
    }
    exit 2
  } else {
    Write-Host "🧾 Verification complete: no Node.js processes remain." -ForegroundColor Green
  }
} catch {
  Write-Error "An error occurred while attempting to stop Node.js processes: $($_.Exception.Message)"
  exit 1
}
