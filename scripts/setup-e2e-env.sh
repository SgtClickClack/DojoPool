#!/bin/bash
# E2E Test Environment Setup Script for DojoPool
# This script sets up the proper environment for E2E testing

set -e

echo "Setting up E2E test environment..."

# Set test environment variables
export NODE_ENV=test
export PORT=3002
export NEXT_PUBLIC_API_URL=http://localhost:3003/api/v1
export NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiZG9qb3Bvb2wiLCJhIjoiY21lZng2YmxkMHk1aTJub2VsaXUyeXRlcyJ9.JTlUI6gaKKorGBm-4p-G6g
export CORS_ORIGINS=http://localhost:3001
export SESSION_SECRET=e2e-session-secret-test
export JWT_SECRET=e2e-jwt-secret-test
export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/dojopool_test
export REDIS_URL=redis://localhost:6380
export LOG_LEVEL=error
export ENABLE_LOGGING=false
export ENABLE_METRICS=false
export DISABLE_EMAIL=true
export DISABLE_SMS=true
export DISABLE_PUSH_NOTIFICATIONS=true
export SEED_TEST_DATA=true
export CLEAR_DB_ON_START=true

echo "E2E test environment variables set successfully"

# Generate Prisma client for test environment
echo "Generating Prisma client for E2E tests..."
yarn workspace @dojopool/api prisma:generate

echo "E2E test environment setup complete!"
