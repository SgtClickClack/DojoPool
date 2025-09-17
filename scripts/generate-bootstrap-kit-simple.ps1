# Simplified DojoPool Bootstrap Kit Generator
# This script creates a temporary cloud server, generates the offline cache,
# downloads it, and cleans up - all automatically

param(
    [string]$SshKeyFingerprint,
    [string]$CacheFile = "dojopool-yarn-cache.zip"
)

# Configuration
$DropletName = "dojo-cache-builder-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$DropletSize = "s-1vcpu-1gb"
$DropletRegion = "nyc3"
$DropletImage = "ubuntu-22-04-x64"
$RepoUrl = "https://github.com/SgtClickClack/DojoPool.git"

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
        # Update system and install basic tools
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

# Main execution
function Main {
    Write-Host "DojoPool Bootstrap Kit Generator (Simplified)" -ForegroundColor $Colors.Green
    Write-Host "=============================================" -ForegroundColor $Colors.Green
    Write-Host ""
    
    if ([string]::IsNullOrEmpty($SshKeyFingerprint)) {
        Write-Error "SSH_KEY_FINGERPRINT parameter is required."
        Write-Host "Usage: .\scripts\generate-bootstrap-kit-simple.ps1 -SshKeyFingerprint 'your_fingerprint'" -ForegroundColor $Colors.White
        exit 1
    }
    
    Write-Success "SSH key fingerprint is set: $SshKeyFingerprint"
    
    $Droplet = $null
    try {
        # Execute the workflow
        $Droplet = New-Droplet
        Invoke-ServerSetup -DropletIp $Droplet.Ip
        Get-CacheFile -DropletIp $Droplet.Ip
        
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
