#!/bin/bash
# Docker E2E Build Script
# This script builds and tests the Docker containers for E2E testing

set -e

echo "Building Docker containers for E2E testing..."

# Clean up any existing containers
echo "Cleaning up existing containers..."
docker-compose -f docker-compose.e2e.yml down -v 2>/dev/null || true
docker system prune -f

# Build Docker images
echo "Building API E2E image..."
docker build -f Dockerfile.e2e --target api-e2e -t dojopool-api-e2e .

echo "Building Web E2E image..."
docker build -f Dockerfile.e2e --target web-e2e -t dojopool-web-e2e .

# Start services
echo "Starting E2E test environment..."
docker-compose -f docker-compose.e2e.yml up -d --build

# Wait for services to be ready
echo "Waiting for services to be ready..."
timeout 120 bash -c 'until curl -f http://localhost:3001 > /dev/null 2>&1; do sleep 5; done'
timeout 120 bash -c 'until curl -f http://localhost:3003/api/v1/health > /dev/null 2>&1; do sleep 5; done'

echo "E2E test environment is ready!"
echo "API: http://localhost:3003"
echo "Web: http://localhost:3001"
echo "Database: localhost:5433"
echo "Redis: localhost:6380"

# Run tests if requested
if [ "$1" = "--test" ]; then
    echo "Running E2E tests..."
    yarn cypress:run --config baseUrl=http://localhost:3001
fi

echo "Docker E2E build complete!"
