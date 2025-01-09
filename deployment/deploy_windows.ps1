# Windows Deployment Script for DojoPool

# Enable error handling
$ErrorActionPreference = "Stop"

# Configure paths
$projectRoot = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $projectRoot "src"
$configPath = Join-Path $projectRoot "config"
$logsPath = Join-Path $projectRoot "logs"

# Import environment variables
Get-Content .env.production | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Function definitions
function Log-Message {
    param([string]$message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $message" -ForegroundColor Green
}

function Log-Error {
    param([string]$message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: $message" -ForegroundColor Red
    exit 1
}

function Check-SystemRequirements {
    Log-Message "Checking system requirements..."
    
    # Check Python version
    $pythonVersion = python --version 2>&1
    if (-not $pythonVersion) {
        Log-Error "Python is not installed"
    }
    
    # Check available memory
    $memory = Get-CimInstance Win32_OperatingSystem
    $availableMemoryGB = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
    if ($availableMemoryGB -lt 4) {
        Log-Error "Insufficient memory. Required: 4GB, Available: $availableMemoryGB GB"
    }
    
    Log-Message "System requirements check passed"
}

function Install-RequiredSoftware {
    Log-Message "Installing required software..."
    
    # Install PostgreSQL if not installed
    Log-Message "Installing PostgreSQL..."
    choco install postgresql14 -y
    
    # Install Redis if not installed
    Log-Message "Installing Redis..."
    choco install redis-64 -y
    
    # Install Nginx if not installed
    Log-Message "Installing Nginx..."
    choco install nginx -y
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Log-Message "Required software installation completed"
}

function Setup-Database {
    Log-Message "Setting up database..."
    
    try {
        # Wait for PostgreSQL service to be ready
        Start-Sleep -Seconds 5
        
        # Stop PostgreSQL service
        Stop-Service postgresql-x64-14
        
        # Modify pg_hba.conf to allow trust authentication temporarily
        $pgHbaPath = "C:\Program Files\PostgreSQL\14\data\pg_hba.conf"
        $pgHbaContent = Get-Content $pgHbaPath
        $pgHbaContent = $pgHbaContent -replace "scram-sha-256", "trust"
        Set-Content $pgHbaPath $pgHbaContent
        
        # Start PostgreSQL service
        Start-Service postgresql-x64-14
        Start-Sleep -Seconds 5
        
        # Set the password
        psql -U postgres -c "ALTER USER postgres WITH PASSWORD '3996efd780a84a9cb2bbac6d5893a030';"
        
        # Create database if it doesn't exist
        psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='dojopool'" | Out-Null
        if ($LASTEXITCODE -ne 0) {
            psql -U postgres -c "CREATE DATABASE dojopool;"
        }
        
        # Stop PostgreSQL service
        Stop-Service postgresql-x64-14
        
        # Restore pg_hba.conf to use md5 authentication
        $pgHbaContent = $pgHbaContent -replace "trust", "md5"
        Set-Content $pgHbaPath $pgHbaContent
        
        # Start PostgreSQL service
        Start-Service postgresql-x64-14
        Start-Sleep -Seconds 5
        
        # Set environment variable for future commands
        $env:PGPASSWORD = "3996efd780a84a9cb2bbac6d5893a030"
        
        # Run database initialization script
        python init_db_script.py
        
        Log-Message "Database setup completed"
    }
    catch {
        Log-Error "Database setup failed: $_"
    }
}

function Setup-Redis {
    Log-Message "Setting up Redis (Memurai)..."
    
    try {
        # Check if Memurai is running
        $memuraiCli = "C:\Program Files\Memurai\memurai-cli.exe"
        
        if (-not (Test-Path $memuraiCli)) {
            Log-Error "Memurai CLI not found at $memuraiCli"
        }
        
        # Test Memurai connection
        $result = Start-Process $memuraiCli -ArgumentList "ping" -NoNewWindow -Wait -PassThru
        if ($result.ExitCode -ne 0) {
            Log-Error "Memurai connection test failed"
        }
        
        Log-Message "Redis (Memurai) setup completed"
    }
    catch {
        Log-Error "Redis (Memurai) setup failed: $_"
    }
}

function Setup-Nginx {
    Log-Message "Setting up Nginx..."
    
    try {
        $nginxPath = "C:\tools\nginx"
        $nginxConfPath = Join-Path $nginxPath "conf\nginx.conf"
        
        # Create SSL directory if it doesn't exist
        $sslPath = Join-Path $nginxPath "conf\ssl"
        New-Item -ItemType Directory -Force -Path $sslPath | Out-Null
        
        # Copy SSL certificates
        Copy-Item -Path $env:SSL_CERT_PATH -Destination $sslPath -Force
        Copy-Item -Path $env:SSL_KEY_PATH -Destination $sslPath -Force
        
        # Stop Nginx if running
        $nginxProcess = Get-Process nginx -ErrorAction SilentlyContinue
        if ($nginxProcess) {
            Stop-Process -Name nginx -Force
        }
        
        # Start Nginx
        Set-Location $nginxPath
        Start-Process "nginx.exe"
        
        Log-Message "Nginx setup completed"
    }
    catch {
        Log-Error "Nginx setup failed: $_"
    }
}

function Deploy-Application {
    Log-Message "Deploying application..."
    
    try {
        # Install Python dependencies
        pip install -r requirements.txt
        
        # Install waitress if not already installed
        pip install waitress
        
        # Create logs directory
        New-Item -ItemType Directory -Force -Path $logsPath | Out-Null
        
        # Stop existing waitress process if running
        $waitressProcess = Get-Process waitress-serve -ErrorAction SilentlyContinue
        if ($waitressProcess) {
            Stop-Process -Name waitress-serve -Force
        }
        
        # Start application with waitress
        $startScript = @"
cd $projectRoot
waitress-serve --host=0.0.0.0 --port=8000 --threads=4 src.app:app
"@
        
        $startScriptPath = Join-Path $projectRoot "start_server.ps1"
        $startScript | Out-File -FilePath $startScriptPath -Encoding UTF8
        
        Start-Process powershell -ArgumentList "-NoExit", "-File", $startScriptPath
        
        Log-Message "Application deployed successfully"
    }
    catch {
        Log-Error "Application deployment failed: $_"
    }
}

function Verify-Deployment {
    Log-Message "Verifying deployment..."
    
    # Wait for services to be fully started
    Start-Sleep -Seconds 10
    
    try {
        # Check application status
        $response = Invoke-WebRequest "http://localhost:8000/api/health" -UseBasicParsing
        if ($response.StatusCode -ne 200) {
            Log-Error "Application health check failed"
        }
        
        # Check database connection
        python -c "from src.app import create_app; app = create_app(); from src.extensions import db; with app.app_context(): db.session.execute('SELECT 1')"
        
        # Check Redis connection
        redis-cli ping
        
        Log-Message "Deployment verification passed"
    }
    catch {
        Log-Error "Deployment verification failed: $_"
    }
}

# Main deployment process
function Main {
    Log-Message "Starting deployment process..."
    
    try {
        Check-SystemRequirements
        Install-RequiredSoftware
        Setup-Database
        Setup-Redis
        Setup-Nginx
        Deploy-Application
        Verify-Deployment
        
        Log-Message "Deployment completed successfully"
    }
    catch {
        Log-Error "Deployment failed: $_"
    }
}

# Run main function
Main