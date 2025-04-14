# Set error action preference to stop on any error
$ErrorActionPreference = "Stop"

Write-Host "Setting up environment for network transport benchmark..."

# Get the directory of this script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Ensure node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

# Ensure ts-node is installed locally
if (-not (Test-Path "node_modules/ts-node")) {
    Write-Host "Installing ts-node..."
    npm install ts-node @types/node typescript
}

Write-Host "Running network transport benchmark..."

try {
    # Use local ts-node with proper path escaping
    $env:TS_NODE_PROJECT = "./tsconfig.json"
    $benchmarkPath = "./src/tests/benchmarks/NetworkTransport.bench.ts"
    
    # Run the benchmark using npx to ensure we use the local ts-node
    npx ts-node `
        --project tsconfig.json `
        --transpile-only `
        --require tsconfig-paths/register `
        $benchmarkPath

    Write-Host "Benchmark completed successfully."
} catch {
    Write-Host "Error running benchmark: $_" -ForegroundColor Red
    exit 1
} 