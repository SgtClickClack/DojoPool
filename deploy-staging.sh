#!/bin/bash

# DojoPool Staging Deployment Script
# This script deploys the application to a production-like staging environment

set -e

echo "🚀 Starting DojoPool Staging Deployment..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Change to project root directory
cd "$(dirname "$0")"

# Load environment variables
if [ -f "env.staging" ]; then
    echo "📄 Loading staging environment configuration..."
    export $(grep -v '^#' env.staging | xargs)
else
    echo "❌ env.staging file not found. Please create it first."
    exit 1
fi

# Kill any existing staging containers
echo "🛑 Stopping any existing staging containers..."
docker-compose -f deployment/staging/docker-compose.staging.yml down --remove-orphans || true

# Clean up any dangling resources
echo "🧹 Cleaning up dangling Docker resources..."
docker system prune -f || true

# Build the staging images
echo "🔨 Building staging Docker images..."
docker-compose -f deployment/staging/docker-compose.staging.yml build --parallel

# Start the staging environment
echo "🚀 Starting staging environment..."
docker-compose -f deployment/staging/docker-compose.staging.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to become healthy..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check API health
echo "Checking API service..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API service is healthy"
else
    echo "❌ API service health check failed"
fi

# Check Web service
echo "Checking Web service..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Web service is healthy"
else
    echo "❌ Web service health check failed"
fi

# Check PostgreSQL
echo "Checking PostgreSQL..."
if docker-compose -f deployment/staging/docker-compose.staging.yml exec -T postgres pg_isready -U dojo_staging_user -d dojopool_staging > /dev/null 2>&1; then
    echo "✅ PostgreSQL is healthy"
else
    echo "❌ PostgreSQL health check failed"
fi

# Check Redis
echo "Checking Redis..."
if docker-compose -f deployment/staging/docker-compose.staging.yml exec -T redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
fi

echo ""
echo "🎉 Staging deployment completed!"
echo ""
echo "📊 Monitoring URLs:"
echo "  - Grafana: http://localhost:3002 (admin/staging_admin_password)"
echo "  - Prometheus: http://localhost:9090"
echo "  - AlertManager: http://localhost:9093"
echo ""
echo "🌐 Application URLs:"
echo "  - Frontend: http://localhost:3000"
echo "  - API: http://localhost:3001"
echo "  - API Docs: http://localhost:3001/api/docs"
echo ""
echo "📋 Useful commands:"
echo "  - View logs: docker-compose -f deployment/staging/docker-compose.staging.yml logs -f"
echo "  - Stop staging: docker-compose -f deployment/staging/docker-compose.staging.yml down"
echo "  - Restart services: docker-compose -f deployment/staging/docker-compose.staging.yml restart"
echo ""
echo "✅ Staging environment is ready for testing!"
