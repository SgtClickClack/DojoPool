<#
.SYNOPSIS
  Starts the dev server and captures all console output to a timestamped log while auto-triggering a request to reproduce a crash-on-load.

.DESCRIPTION
  This script helps diagnose issues where the dev server reports "Ready" and then crashes upon first page load.
  It will:
   1) Ensure a ./logs directory exists.
   2) Start `npm run dev` and tee all stdout/stderr to a log file.
   3) Wait until port 3000 is listening.
   4) Automatically request http://localhost:3000 to trigger the crash.
   5) Wait briefly and report the log location.

.USAGE
  powershell -ExecutionPolicy Bypass -File scripts\dev-capture.ps1

.NOTES
  Author: DojoPool Team
  Date: 2025-08-20
#>

# Run from repo root
Set-Location -Path (Split-Path -Parent $PSCommandPath)
Set-Location -Path (Resolve-Path ..)

$logsDir = Join-Path (Get-Location) "logs"
if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = Join-Path $logsDir "dev-capture-$timestamp.log"

Write-Host "📝 Capturing dev server output to: $logFile" -ForegroundColor Cyan

# Start npm run dev in a background job and tee output to the log
$jobScript = @"
  npm run dev 2>&1 | Tee-Object -FilePath "$logFile" -Append
"@

$devJob = Start-Job -Name "dojopool-dev" -ScriptBlock { param($script, $pwd)
  Set-Location $pwd
  Invoke-Expression $script
} -ArgumentList $jobScript, (Get-Location)

# Wait for port 3000 to be ready (timeout ~45s)
Write-Host "⏳ Waiting for localhost:3000 to become ready..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 45; $i++) {
  try {
    $tnc = Test-NetConnection -ComputerName "localhost" -Port 3000 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($tnc -and $tnc.TcpTestSucceeded) { $ready = $true; break }
  } catch {}
  Start-Sleep -Seconds 1
}

if (-not $ready) {
  Write-Warning "Server did not open port 3000 within the timeout. Check the log for details: $logFile"
  Receive-Job -Job $devJob -Keep | Out-Null
  Write-Host "📄 Log saved to: $logFile" -ForegroundColor Green
  exit 1
}

Write-Host "✅ Port 3000 is open. Triggering initial request to reproduce crash..." -ForegroundColor Green

try {
  # Trigger the first render; allow small timeout
  Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 | Out-Null
} catch {
  # We expect the request might fail if the server crashes
  Write-Host "(Note) Initial request may fail if the server crashes; continuing..." -ForegroundColor DarkYellow
}

# Give the server a few seconds to crash and flush logs
Start-Sleep -Seconds 5

# Check job state and drain any remaining output to the log
Receive-Job -Job $devJob -Keep | Out-Null

$jobState = (Get-Job -Id $devJob.Id).State
Write-Host "🧪 Dev process job state: $jobState" -ForegroundColor Cyan

Write-Host "📄 All output has been recorded to: $logFile" -ForegroundColor Green
Write-Host "➡️  Please share the contents of this log to diagnose the crash-on-load." -ForegroundColor Yellow

# Optional: keep the job running so user can keep server active; otherwise, stop it here
# Stop-Job -Job $devJob | Out-Null
# Remove-Job -Job $devJob | Out-Null
