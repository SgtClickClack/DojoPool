# Local DojoPool Bootstrap Kit Generator
# This script generates the offline cache locally and creates a zip file

param(
    [string]$CacheFile = "dojopool-yarn-cache.zip"
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Function to check if we're in the right directory
function Test-ProjectDirectory {
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found. Please run this script from the DojoPool project root."
        exit 1
    }
    
    if (-not (Test-Path ".yarnrc.yml")) {
        Write-Error ".yarnrc.yml not found. Please run this script from the DojoPool project root."
        exit 1
    }
    
    Write-Success "Project directory verified"
}

# Function to temporarily enable network access
function Enable-NetworkAccess {
    Write-Status "Temporarily enabling network access..."
    
    $yarnrcContent = Get-Content ".yarnrc.yml" -Raw
    if ($yarnrcContent -match "enableNetwork:\s*false") {
        $yarnrcContent = $yarnrcContent -replace "enableNetwork:\s*false", "enableNetwork: true"
        Set-Content ".yarnrc.yml" $yarnrcContent
        Write-Success "Network access enabled"
        return $true
    }
    else {
        Write-Status "Network access already enabled"
        return $false
    }
}

# Function to disable network access
function Disable-NetworkAccess {
    Write-Status "Disabling network access..."
    
    $yarnrcContent = Get-Content ".yarnrc.yml" -Raw
    if ($yarnrcContent -match "enableNetwork:\s*true") {
        $yarnrcContent = $yarnrcContent -replace "enableNetwork:\s*true", "enableNetwork: false"
        Set-Content ".yarnrc.yml" $yarnrcContent
        Write-Success "Network access disabled"
    }
}

# Function to install dependencies and populate cache
function Install-Dependencies {
    Write-Status "Installing dependencies to populate cache..."
    
    try {
        # Run yarn install
        $process = Start-Process -FilePath "yarn.ps1" -ArgumentList "install" -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0) {
            Write-Success "Dependencies installed successfully"
        }
        else {
            throw "yarn install failed with exit code $($process.ExitCode)"
        }
        
        # Verify cache directory exists
        if (Test-Path ".yarn/cache") {
            $cacheFiles = (Get-ChildItem ".yarn/cache" -File | Measure-Object).Count
            Write-Success "Cache directory populated with $cacheFiles files"
        }
        else {
            throw "Cache directory not created"
        }
    }
    catch {
        Write-Error "Failed to install dependencies: $_"
        throw
    }
}

# Function to create cache archive
function New-CacheArchive {
    Write-Status "Creating cache archive..."
    
    try {
        if (Test-Path $CacheFile) {
            Remove-Item $CacheFile -Force
        }
        
        # Create zip archive
        Compress-Archive -Path ".yarn/cache/*" -DestinationPath $CacheFile -Force
        
        if (Test-Path $CacheFile) {
            $FileSize = (Get-Item $CacheFile).Length
            $FileSizeMB = [math]::Round($FileSize / 1MB, 2)
            Write-Success "Cache archive created: $CacheFile ($FileSizeMB MB)"
        }
        else {
            throw "Failed to create cache archive"
        }
    }
    catch {
        Write-Error "Failed to create cache archive: $_"
        throw
    }
}

# Main execution
function Main {
    Write-Host "DojoPool Local Bootstrap Kit Generator" -ForegroundColor $Colors.Green
    Write-Host "======================================" -ForegroundColor $Colors.Green
    Write-Host ""
    
    $networkWasEnabled = $false
    
    try {
        # Pre-flight checks
        Test-ProjectDirectory
        
        # Enable network access temporarily
        $networkWasEnabled = Enable-NetworkAccess
        
        # Install dependencies
        Install-Dependencies
        
        # Create cache archive
        New-CacheArchive
        
        Write-Host ""
        Write-Success "Bootstrap kit generation completed successfully!"
        Write-Host ""
        Write-Host "Your cache file: $CacheFile" -ForegroundColor $Colors.White
        $FileSize = (Get-Item $CacheFile).Length
        $FileSizeMB = [math]::Round($FileSize / 1MB, 2)
        Write-Host "File size: $FileSizeMB MB" -ForegroundColor $Colors.White
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor $Colors.Cyan
        Write-Host "  1. Your cache is already in place at .yarn/cache/" -ForegroundColor $Colors.White
        Write-Host "  2. Build with Docker: docker-compose build" -ForegroundColor $Colors.White
        Write-Host ""
        Write-Host "Your Docker builds will now be instant and offline!" -ForegroundColor $Colors.Green
    }
    catch {
        Write-Error "Script execution failed: $_"
        exit 1
    }
    finally {
        # Always disable network access if we enabled it
        if ($networkWasEnabled) {
            Disable-NetworkAccess
        }
    }
}

# Run the main function
Main
