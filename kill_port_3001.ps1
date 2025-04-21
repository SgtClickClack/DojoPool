# PowerShell script to kill all processes using port 3001
$port = 3001
$netstat = netstat -ano | Select-String ":$port"
$lines = $netstat | ForEach-Object { $_.ToString() }
$pids = $lines | ForEach-Object {
    if ($_ -match '\s+(\d+)$') { $matches[1] } else { $null }
} | Where-Object { $_ -ne $null } | Sort-Object -Unique
if ($pids.Count -eq 0) {
    Write-Host "No processes found using port $port."
} else {
    foreach ($pid in $pids) {
        try {
            Stop-Process -Id $pid -Force
            Write-Host "Killed process with PID $pid using port $port."
        } catch {
            Write-Host ("Failed to kill PID $pid: " + $_.Exception.Message)
        }
    }
}
