#!/bin/bash

# Docker Network Troubleshooting Script for DojoPool
# This script helps diagnose and fix DNS issues in Docker builds

echo "🔍 DojoPool Docker Network Troubleshooting"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"

# Check DNS resolution from host
echo ""
echo "🌐 Testing DNS resolution from host:"
if nslookup registry.yarnpkg.com > /dev/null 2>&1; then
    echo "✅ registry.yarnpkg.com resolves from host"
else
    echo "❌ registry.yarnpkg.com does not resolve from host"
    echo "   This might be a network connectivity issue"
fi

# Test Docker network DNS
echo ""
echo "🐳 Testing DNS resolution from Docker container:"
docker run --rm alpine nslookup registry.yarnpkg.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ registry.yarnpkg.com resolves from Docker container"
else
    echo "❌ registry.yarnpkg.com does not resolve from Docker container"
    echo "   This indicates a Docker DNS configuration issue"
fi

# Check Docker daemon DNS settings
echo ""
echo "⚙️  Docker daemon DNS configuration:"
docker info | grep -i dns || echo "No custom DNS configuration found"

# Provide solutions
echo ""
echo "🛠️  Solutions to try:"
echo "1. Use the updated Dockerfile with DNS configuration"
echo "2. Try building with: docker-compose build --no-cache"
echo "3. If still failing, try the alternative Dockerfile:"
echo "   docker-compose -f docker-compose.yml -f docker-compose.alternative.yml build"
echo "4. Check your firewall/antivirus settings"
echo "5. Try using a VPN if you're behind a corporate firewall"

# Test network connectivity
echo ""
echo "🌍 Testing network connectivity:"
docker run --rm alpine ping -c 3 8.8.8.8 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Internet connectivity works from Docker"
else
    echo "❌ Internet connectivity issues from Docker"
fi

echo ""
echo "📋 Next steps:"
echo "1. Run: docker-compose build --no-cache"
echo "2. If that fails, try: docker system prune -a"
echo "3. Then rebuild: docker-compose build"
