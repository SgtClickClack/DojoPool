#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting DojoPool staging deployment..."

# Load environment variables
if [ -f .env.staging ]; then
    export $(cat .env.staging | grep -v '^#' | xargs)
else
    echo "❌ Error: .env.staging file not found"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs/staging
mkdir -p monitoring/grafana/provisioning
mkdir -p monitoring/prometheus

# Pull latest changes
echo "⬇️ Pulling latest changes..."
git pull origin main

# Build and deploy using docker-compose
echo "🏗️ Building and deploying services..."
docker-compose -f docker-compose.staging.yml down --remove-orphans
docker-compose -f docker-compose.staging.yml build --no-cache
docker-compose -f docker-compose.staging.yml up -d

# Wait for services to be healthy
echo "🏥 Waiting for services to be healthy..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
docker-compose -f docker-compose.staging.yml ps

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose -f docker-compose.staging.yml exec web flask db upgrade

# Initialize monitoring
echo "📊 Initializing monitoring..."
docker-compose -f docker-compose.staging.yml exec prometheus promtool check config /etc/prometheus/prometheus.yml
docker-compose -f docker-compose.staging.yml restart prometheus grafana

# Verify deployment
echo "✅ Verifying deployment..."
curl -f http://localhost:8080/health || (echo "❌ Health check failed" && exit 1)

echo "🎉 Staging deployment completed successfully!"
echo "📝 Services available at:"
echo "- Web: http://localhost:8080"
echo "- Grafana: http://localhost:3000"
echo "- Prometheus: http://localhost:9090"
echo "- PostgreSQL: localhost:5433"
echo "- Redis: localhost:6380"

# Log deployment
echo "$(date): Staging deployment completed successfully" >> logs/staging/deploy.log 