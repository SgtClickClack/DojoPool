#!/bin/bash
# Kill any running Next.js processes
pkill -f "next"

# Wait a moment to ensure ports are released
sleep 2

# Set proper environment
export NODE_ENV=development
export PORT=3001
export HOSTNAME=0.0.0.0

# Start the development server with specific host and port
echo "Starting Next.js server on http://0.0.0.0:3001"
npx next dev -p 3001 -H 0.0.0.0