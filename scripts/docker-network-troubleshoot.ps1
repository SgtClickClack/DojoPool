# Docker Network Troubleshooting Script for DojoPool (PowerShell)
# This script helps diagnose and fix DNS issues in Docker builds

Write-Host "🔍 DojoPool Docker Network Troubleshooting" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check DNS resolution from host
Write-Host ""
Write-Host "🌐 Testing DNS resolution from host:" -ForegroundColor Yellow
try {
    $result = nslookup registry.yarnpkg.com 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ registry.yarnpkg.com resolves from host" -ForegroundColor Green
    } else {
        Write-Host "❌ registry.yarnpkg.com does not resolve from host" -ForegroundColor Red
        Write-Host "   This might be a network connectivity issue" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ DNS lookup failed" -ForegroundColor Red
}

# Test Docker network DNS
Write-Host ""
Write-Host "🐳 Testing DNS resolution from Docker container:" -ForegroundColor Yellow
try {
    docker run --rm alpine nslookup registry.yarnpkg.com 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ registry.yarnpkg.com resolves from Docker container" -ForegroundColor Green
    } else {
        Write-Host "❌ registry.yarnpkg.com does not resolve from Docker container" -ForegroundColor Red
        Write-Host "   This indicates a Docker DNS configuration issue" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Docker DNS test failed" -ForegroundColor Red
}

# Check Docker daemon DNS settings
Write-Host ""
Write-Host "⚙️  Docker daemon DNS configuration:" -ForegroundColor Yellow
try {
    $dnsInfo = docker info | Select-String -Pattern "DNS"
    if ($dnsInfo) {
        Write-Host $dnsInfo -ForegroundColor Cyan
    } else {
        Write-Host "No custom DNS configuration found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not retrieve Docker DNS configuration" -ForegroundColor Red
}

# Provide solutions
Write-Host ""
Write-Host "🛠️  Solutions to try:" -ForegroundColor Yellow
Write-Host "1. Use the updated Dockerfile with DNS configuration" -ForegroundColor White
Write-Host "2. Try building with: docker-compose build --no-cache" -ForegroundColor White
Write-Host "3. If still failing, try the alternative Dockerfile:" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.yml -f docker-compose.alternative.yml build" -ForegroundColor White
Write-Host "4. Check your firewall/antivirus settings" -ForegroundColor White
Write-Host "5. Try using a VPN if you are behind a corporate firewall" -ForegroundColor White

# Test network connectivity
Write-Host ""
Write-Host "🌍 Testing network connectivity:" -ForegroundColor Yellow
try {
    docker run --rm alpine ping -c 3 8.8.8.8 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Internet connectivity works from Docker" -ForegroundColor Green
    } else {
        Write-Host "❌ Internet connectivity issues from Docker" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Network connectivity test failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: docker-compose build --no-cache" -ForegroundColor White
Write-Host "2. If that fails, try: docker system prune -a" -ForegroundColor White
Write-Host "3. Then rebuild: docker-compose build" -ForegroundColor White
