# PowerShell script to organize test files
$testDirs = @(
    "unit",
    "integration",
    "performance"
)

# Create test directories if they don't exist
foreach ($dir in $testDirs) {
    $path = "../src/__tests__/$dir"
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Force -Path $path
    }
}

# Move performance test files
Get-ChildItem -Path "../src" -Recurse -Filter "*performance*.test.*" | ForEach-Object {
    $destination = "../src/__tests__/performance/$($_.Name)"
    Move-Item $_.FullName $destination -Force
}

# Move integration test files
Get-ChildItem -Path "../src" -Recurse -Filter "*integration*.test.*" | ForEach-Object {
    $destination = "../src/__tests__/integration/$($_.Name)"
    Move-Item $_.FullName $destination -Force
}

# Move remaining test files to unit tests
Get-ChildItem -Path "../src" -Recurse -Filter "*.test.*" | ForEach-Object {
    $destination = "../src/__tests__/unit/$($_.Name)"
    Move-Item $_.FullName $destination -Force
}

Write-Host "Test files have been organized into their respective directories." 