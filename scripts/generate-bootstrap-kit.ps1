# DojoPool Bootstrap Kit Generator (PowerShell)
# This script creates a temporary cloud server, generates the offline cache,
# downloads it, and cleans up - all automatically

param(
    [string]$SshKeyFingerprint,
    [string]$DropletSize = "s-1vcpu-1gb",
    [string]$DropletRegion = "nyc3",
    [string]$DropletImage = "ubuntu-22-04-x64",
    [string]$RepoUrl = "https://github.com/SgtClickClack/DojoPool.git",
    [string]$CacheFile = "dojopool-yarn-cache.zip",
    [switch]$Help
)

if ($Help) {
    Write-Host @"
DojoPool Bootstrap Kit Generator (PowerShell)

This script creates a temporary DigitalOcean droplet, generates the offline cache,
downloads it, and cleans up - all automatically.

Usage:
    .\scripts\generate-bootstrap-kit.ps1 -SshKeyFingerprint <fingerprint> [options]

Required Parameters:
    -SshKeyFingerprint    Your DigitalOcean SSH key fingerprint

Optional Parameters:
    -DropletSize          Droplet size (default: s-1vcpu-1gb)
    -DropletRegion        Droplet region (default: nyc3)
    -DropletImage         Droplet image (default: ubuntu-22-04-x64)
    -RepoUrl              Repository URL (default: GitHub DojoPool)
    -CacheFile            Output cache file name (default: dojopool-yarn-cache.zip)
    -Help                 Show this help message

Prerequisites:
    1. Install doctl CLI tool
    2. Authenticate with DigitalOcean: doctl auth init
    3. Add SSH key to DigitalOcean account
    4. Get SSH key fingerprint: doctl compute ssh-key list

Example:
    .\scripts\generate-bootstrap-kit.ps1 -SshKeyFingerprint "aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99"
"@
    exit 0
}

# Configuration
$DropletName = "dojo-cache-builder-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

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

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Function to check if doctl is installed and authenticated
function Test-Doctl {
    try {
        $null = Get-Command doctl -ErrorAction Stop
    }
    catch {
        Write-Error "doctl is not installed. Please install it first:"
        Write-Host "  Visit: https://docs.digitalocean.com/reference/doctl/how-to/install/" -ForegroundColor $Colors.White
        exit 1
    }
    
    try {
        $null = doctl account get 2>$null
    }
    catch {
        Write-Error "doctl is not authenticated. Please run:"
        Write-Host "  doctl auth init" -ForegroundColor $Colors.White
        exit 1
    }
    
    Write-Success "doctl is installed and authenticated"
}

# Function to validate SSH key fingerprint
function Test-SshKey {
    if ([string]::IsNullOrEmpty($SshKeyFingerprint)) {
        Write-Error "SSH_KEY_FINGERPRINT parameter is required."
        Write-Host "Please provide your DigitalOcean SSH key fingerprint:" -ForegroundColor $Colors.White
        Write-Host "  doctl compute ssh-key list" -ForegroundColor $Colors.White
        exit 1
    }
    
    Write-Success "SSH key fingerprint is set: $SshKeyFingerprint"
}

# Function to create the droplet
function New-Droplet {
    Write-Status "Creating temporary cloud server..."
    
    try {
        $DropletId = doctl compute droplet create $DropletName `
            --image $DropletImage `
            --size $DropletSize `
            --region $DropletRegion `
            --ssh-keys $SshKeyFingerprint `
            --wait `
            --format "ID" `
            --no-header
        
        if ([string]::IsNullOrEmpty($DropletId)) {
            throw "Failed to create droplet"
        }
        
        Write-Success "Server created with ID: $DropletId"
        
        # Wait for server to be fully ready
        Write-Status "Waiting for server to be ready..."
        Start-Sleep -Seconds 30
        
        # Get the server's IP address
        $DropletIp = doctl compute droplet get $DropletId --format "PublicIPv4" --no-header
        Write-Success "Server IP is: $DropletIp"
        
        # Wait for SSH to be available
        Write-Status "Waiting for SSH to be available..."
        $SshReady = $false
        for ($i = 1; $i -le 30; $i++) {
            try {
                $null = ssh -o "StrictHostKeyChecking=no" -o "ConnectTimeout=5" root@$DropletIp "echo 'SSH ready'" 2>$null
                $SshReady = $true
                break
            }
            catch {
                Write-Host "." -NoNewline
                Start-Sleep -Seconds 2
            }
        }
        Write-Host ""
        
        if (-not $SshReady) {
            throw "SSH connection failed after 60 seconds"
        }
        
        return @{
            Id = $DropletId
            Ip = $DropletIp
        }
    }
    catch {
        Write-Error "Failed to create droplet: $_"
        exit 1
    }
}

# Function to setup server and generate cache
function Invoke-ServerSetup {
    param([string]$DropletIp)
    
    Write-Status "Setting up server and generating cache..."
    
    try {
        # Update system packages
        Write-Status "Updating system packages..."
        ssh -o "StrictHostKeyChecking=no" root@$DropletIp "apt update && apt install git zip curl wget -y"
        
        # Install Node.js 20
        Write-Status "Installing Node.js 20..."
        ssh -o "StrictHostKeyChecking=no" root@$DropletIp "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
        ssh -o "StrictHostKeyChecking=no" root@$DropletIp "apt-get install -y nodejs"
        
        # Enable Corepack for Yarn
        Write-Status "Enabling Corepack for Yarn..."
        ssh -o "StrictHostKeyChecking=no" root@$DropletIp "corepack enable"
        
        # Verify Node.js and Yarn are working
        Write-Status "Verifying Node.js and Yarn installation..."
        ssh -o "StrictHostKeyChecking=no" root@$DropletIp "node --version && yarn --version"
        
        # Clone repository
        Write-Status "Cloning DojoPool repository..."
        ssh -o "StrictHostKeyChecking=no" root@$DropletIp "git clone $RepoUrl"
        
        # Temporarily enable network access for cache generation
        Write-Status "Enabling network access for cache generation..."
        ssh -o "StrictHostKeyChecking=no" root@$DropletIp "cd DojoPool && sed -i 's/enableNetwork: false/enableNetwork: true/' .yarnrc.yml"
        
        # Install dependencies and populate cache
        Write-Status "Installing dependencies to populate cache..."
        ssh -o "StrictHostKeyChecking=no" root@$DropletIp "cd DojoPool && yarn install"
        
        # Verify cache directory exists and is populated
        Write-Status "Verifying cache directory..."
        ssh -o "StrictHostKeyChecking=no" root@$DropletIp "cd DojoPool && ls -la .yarn/cache | head -10"
        
        # Disable network access again
        Write-Status "Disabling network access..."
        ssh -o "StrictHostKeyChecking=no" root@$DropletIp "cd DojoPool && sed -i 's/enableNetwork: true/enableNetwork: false/' .yarnrc.yml"
        
        # Create cache archive
        Write-Status "Creating cache archive..."
        ssh -o "StrictHostKeyChecking=no" root@$DropletIp "cd DojoPool && zip -r $CacheFile .yarn/cache"
        
        # Verify archive
        Write-Status "Verifying cache archive..."
        ssh -o "StrictHostKeyChecking=no" root@$DropletIp "cd DojoPool && ls -lh $CacheFile"
        
        Write-Success "Cache has been generated and zipped on the server"
    }
    catch {
        Write-Error "Failed to setup server and generate cache: $_"
        throw
    }
}

# Function to download the cache file
function Get-CacheFile {
    param([string]$DropletIp)
    
    Write-Status "Downloading cache file..."
    
    try {
        scp -o "StrictHostKeyChecking=no" root@${DropletIp}:/root/DojoPool/$CacheFile .
        
        if (Test-Path $CacheFile) {
            $FileSize = (Get-Item $CacheFile).Length
            $FileSizeMB = [math]::Round($FileSize / 1MB, 2)
            Write-Success "Cache file downloaded: $CacheFile ($FileSizeMB MB)"
        }
        else {
            throw "Cache file not found after download"
        }
    }
    catch {
        Write-Error "Failed to download cache file: $_"
        throw
    }
}

# Function to destroy the droplet
function Remove-Droplet {
    param([string]$DropletId)
    
    Write-Status "Destroying temporary server..."
    
    try {
        doctl compute droplet delete $DropletId --force
        Write-Success "Server destroyed successfully"
    }
    catch {
        Write-Warning "Failed to destroy server: $_"
    }
}

# Function to verify the downloaded cache
function Test-CacheFile {
    Write-Status "Verifying downloaded cache..."
    
    if (-not (Test-Path $CacheFile)) {
        Write-Error "Cache file not found: $CacheFile"
        return $false
    }
    
    # Check if it's a valid zip file
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $null = [System.IO.Compression.ZipFile]::OpenRead($CacheFile)
        Write-Success "Cache verification passed: Valid zip file"
        return $true
    }
    catch {
        Write-Error "Cache file is corrupted or not a valid zip file: $_"
        return $false
    }
}

# Main execution
function Main {
    Write-Host "DojoPool Bootstrap Kit Generator (PowerShell)" -ForegroundColor $Colors.Green
    Write-Host "===============================================" -ForegroundColor $Colors.Green
    Write-Host ""
    
    # Pre-flight checks
    Test-Doctl
    Test-SshKey
    
    $Droplet = $null
    try {
        # Execute the workflow
        $Droplet = New-Droplet
        Invoke-ServerSetup -DropletIp $Droplet.Ip
        Get-CacheFile -DropletIp $Droplet.Ip
        $CacheValid = Test-CacheFile
        
        if ($CacheValid) {
            Write-Host ""
            Write-Success "Bootstrap kit generation completed successfully!"
            Write-Host ""
            Write-Host "Your cache file: $CacheFile" -ForegroundColor $Colors.White
            $FileSize = (Get-Item $CacheFile).Length
            $FileSizeMB = [math]::Round($FileSize / 1MB, 2)
            Write-Host "File size: $FileSizeMB MB" -ForegroundColor $Colors.White
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor $Colors.Cyan
            Write-Host "  1. Extract the cache: Expand-Archive $CacheFile -DestinationPath .yarn/" -ForegroundColor $Colors.White
            Write-Host "  2. Build with Docker: docker-compose build" -ForegroundColor $Colors.White
            Write-Host ""
            Write-Host "Your Docker builds will now be instant and offline!" -ForegroundColor $Colors.Green
        }
        else {
            Write-Error "Cache verification failed"
            exit 1
        }
    }
    catch {
        Write-Error "Script execution failed: $_"
        exit 1
    }
    finally {
        # Always cleanup the droplet
        if ($Droplet) {
            Remove-Droplet -DropletId $Droplet.Id
        }
    }
}

# Run the main function
Main