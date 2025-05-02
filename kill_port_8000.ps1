# PowerShell script to kill all processes using port 8000
$port = 8000 # Changed port to 8000
$netstat = netstat -ano | Select-String ":$port"
$lines = $netstat | ForEach-Object { $_.ToString() }
$pids = $lines | ForEach-Object {
    if ($_ -match '\s+(\d+)$') { $matches[1] } else { $null }
} | Where-Object { $_ -ne $null } | Sort-Object -Unique
if ($pids.Count -eq 0) {
    Write-Host "No processes found using port $port."
} else {
    # Use a different variable name instead of $pid
    foreach ($processId in $pids) {
        try {
            Stop-Process -Id $processId -Force
            Write-Host "Killed process with PID $processId using port $port."
        } catch {
            # Assign the error message to a variable first
            $errorMessage = $_.Exception.Message
            # Explicitly delimit the variable name using ${}
            Write-Host "Failed to kill PID ${processId}: $errorMessage"
        }
    }
} 