# PowerShell script for testing NGINX in Docker

# Error handling
$ErrorActionPreference = "Stop"

# Set test ports
$env:TEST_PORT = "9080"
$env:TEST_SSL_PORT = "9443"

function Test-Command {
    param (
        [string]$Name
    )
    return [bool](Get-Command -Name $Name -ErrorAction SilentlyContinue)
}

function Write-Step {
    param (
        [string]$Message
    )
    Write-Host "`n==> $Message" -ForegroundColor Yellow
}

# Check prerequisites
Write-Step "Checking prerequisites..."

# Check Docker
if (-not (Test-Command "docker")) {
    Write-Host "Error: Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check Docker is running
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Error: Failed to check Docker status: $_" -ForegroundColor Red
    exit 1
}

# Create test directories
Write-Step "Creating test directories..."
try {
    $testDirs = @(
        "test/ssl/certs",
        "test/ssl/private",
        "test/static/css",
        "test/static/js",
        "test/static/img",
        "test/error",
        "test/nginx"
    )
    
    foreach ($dir in $testDirs) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    }
} catch {
    Write-Host "Error creating directories: $_" -ForegroundColor Red
    exit 1
}

# Create NGINX configurations
Write-Step "Creating NGINX configurations..."
try {
    # Backend configuration
    @"
server {
    listen 8000;
    server_name localhost;

    location /health {
        access_log off;
        add_header Content-Type text/plain;
        return 200 'OK';
    }

    location /api/auth/login {
        add_header Content-Type application/json;
        if (`$request_method = 'POST') {
            return 200 '{"token": "test-token"}';
        }
        return 405 '{"error": "Method not allowed"}';
    }

    location /ws/ {
        if (`$http_upgrade = "websocket") {
            add_header Upgrade `$http_upgrade;
            add_header Connection "Upgrade";
            return 101;
        }
        return 400 "Bad Request";
    }

    location / {
        return 404 '{"error": "Not found"}';
    }
}
"@ | Out-File -FilePath "test/nginx/backend.conf" -Encoding UTF8 -Force

    # Main NGINX configuration
    @"
user nginx;
worker_processes auto;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '`$remote_addr - `$remote_user [`$time_local] "`$request" '
                    '`$status `$body_bytes_sent "`$http_referer" '
                    '"`$http_user_agent" "`$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    ssl_dhparam /etc/nginx/ssl/certs/dhparam.pem;

    server {
        listen 80 default_server;
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        location /health {
            access_log off;
            add_header Content-Type text/plain;
            return 200 'OK';
        }

        location /static/ {
            alias /usr/share/nginx/html/static/;
            try_files `$uri =404;
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }

        location /api/ {
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
            proxy_intercept_errors on;
            error_page 404 = @error404;
        }

        location /ws/ {
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade `$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
        }

        location / {
            try_files `$uri `$uri/ @backend;
        }

        location @backend {
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
            proxy_intercept_errors on;
            error_page 404 = @error404;
        }

        location @error404 {
            return 404;
        }

        error_page 404 /error/404.html;
        error_page 500 502 503 504 /error/50x.html;

        location = /error/404.html {
            internal;
            root /usr/share/nginx/html;
        }

        location = /error/50x.html {
            internal;
            root /usr/share/nginx/html;
        }
    }

    server {
        listen 443 ssl http2 default_server;
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        ssl_certificate /etc/nginx/ssl/certs/dojopool.crt;
        ssl_certificate_key /etc/nginx/ssl/private/dojopool.key;

        location /health {
            access_log off;
            add_header Content-Type text/plain;
            return 200 'OK';
        }

        location /static/ {
            alias /usr/share/nginx/html/static/;
            try_files `$uri =404;
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }

        location /api/ {
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
            proxy_intercept_errors on;
            error_page 404 = @error404;
        }

        location /ws/ {
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade `$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
        }

        location / {
            try_files `$uri `$uri/ @backend;
        }

        location @backend {
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
            proxy_intercept_errors on;
            error_page 404 = @error404;
        }

        location @error404 {
            return 404;
        }

        error_page 404 /error/404.html;
        error_page 500 502 503 504 /error/50x.html;

        location = /error/404.html {
            internal;
            root /usr/share/nginx/html;
        }

        location = /error/50x.html {
            internal;
            root /usr/share/nginx/html;
        }
    }
}
"@ | Out-File -FilePath "test/nginx/nginx.conf" -Encoding UTF8 -Force

    Write-Host "NGINX configurations created successfully" -ForegroundColor Green
} catch {
    Write-Host "Error creating NGINX configurations: $_" -ForegroundColor Red
    exit 1
}

# Generate SSL certificates
Write-Step "Generating SSL certificates..."
try {
    # Generate SSL certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
        -keyout "test/ssl/private/dojopool.key" `
        -out "test/ssl/certs/dojopool.crt" `
        -subj "/CN=localhost" `
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

    # Generate DH parameters
    openssl dhparam -out "test/ssl/certs/dhparam.pem" 2048

    Write-Host "SSL certificates generated successfully" -ForegroundColor Green
} catch {
    Write-Host "Error generating SSL certificates: $_" -ForegroundColor Red
    exit 1
}

# Create test files
Write-Step "Creating test files..."
try {
    # Create test HTML files
    @"
<!DOCTYPE html>
<html>
<head>
    <title>404 Not Found</title>
</head>
<body>
    <h1>404 Not Found</h1>
    <p>The requested resource was not found on this server.</p>
</body>
</html>
"@ | Out-File -FilePath "test/error/404.html" -Encoding UTF8 -Force

    @"
<!DOCTYPE html>
<html>
<head>
    <title>Server Error</title>
</head>
<body>
    <h1>Server Error</h1>
    <p>An error occurred while processing your request.</p>
</body>
</html>
"@ | Out-File -FilePath "test/error/50x.html" -Encoding UTF8 -Force

    # Create test static files
    "body { background-color: #f0f0f0; }" | Out-File -FilePath "test/static/css/style.css" -Encoding UTF8 -Force
    "console.log('Hello, World!');" | Out-File -FilePath "test/static/js/main.js" -Encoding UTF8 -Force

    Write-Host "Test files created successfully" -ForegroundColor Green
} catch {
    Write-Host "Error creating test files: $_" -ForegroundColor Red
    exit 1
}

# Start Docker containers
Write-Step "Starting Docker containers..."
try {
    # Stop and remove existing containers
    docker-compose -f docker-compose.test.yml down

    # Start containers
    docker-compose -f docker-compose.test.yml up -d

    # Wait for containers to be ready
    Write-Host "Waiting for containers to be ready" -NoNewline
    $maxAttempts = 30
    $attempts = 0
    $ready = $false

    while (-not $ready -and $attempts -lt $maxAttempts) {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
        $attempts++

        # Check if containers are running
        $containers = docker-compose -f docker-compose.test.yml ps --format json | ConvertFrom-Json
        $allRunning = $true

        foreach ($container in $containers) {
            if ($container.State -ne "running") {
                $allRunning = $false
                break
            }
        }

        if ($allRunning) {
            # Check if NGINX is responding
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$env:TEST_PORT/health" -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    $ready = $true
                }
            } catch {
                # Keep waiting
            }
        }
    }

    Write-Host ""

    if (-not $ready) {
        Write-Host "Error starting containers: Containers failed to start properly" -ForegroundColor Red
        docker-compose -f docker-compose.test.yml down
        exit 1
    }

    Write-Host "Containers started successfully" -ForegroundColor Green
} catch {
    Write-Host "Error starting containers: $_" -ForegroundColor Red
    docker-compose -f docker-compose.test.yml down
    exit 1
} 