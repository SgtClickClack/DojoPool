#!/bin/bash

# DojoPool Production Deployment Script
# This script deploys the backend services to a cloud server

set -e  # Exit on any error

echo "🚀 Starting DojoPool Production Deployment..."

# Check if server IP is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide the server IP address as the first argument"
    echo "Usage: ./deploy-production.sh <SERVER_IP>"
    exit 1
fi

SERVER_IP=$1
echo "📡 Deploying to server: $SERVER_IP"

# Generate strong random secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

echo "🔐 Generated secure secrets for production"

# Create production environment file
cat > .env.production << EOF
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@db:5432/dojopool?schema=public"

# Redis Configuration
REDIS_URL="redis://redis:6379"

# Security Secrets (Generated)
JWT_SECRET="$JWT_SECRET"
SESSION_SECRET="$SESSION_SECRET"

# Google OAuth Configuration (Update these with your actual values)
GOOGLE_OAUTH_CLIENT_ID="your_google_client_id_here"
GOOGLE_OAUTH_CLIENT_SECRET="your_google_client_secret_here"
GOOGLE_OAUTH_REDIRECT_URI="http://$SERVER_IP:3002/api/v1/auth/google/callback"

# Application Configuration
PORT=3002
NODE_ENV=production
CORS_ORIGINS="http://$SERVER_IP:3000,https://your-vercel-domain.vercel.app"
FRONTEND_URL="https://your-vercel-domain.vercel.app"

# Optional: Cloudinary Configuration (for avatar uploads)
# CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
# CLOUDINARY_API_KEY="your_cloudinary_api_key"
# CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
# CLOUDINARY_FOLDER="dojopool/avatars"

# Optional: JWT Expiration Settings
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
EOF

echo "📝 Created production environment file"

# Commands to run on the server
echo "📋 Commands to run on your server:"
echo ""
echo "1. SSH into your server:"
echo "   ssh root@$SERVER_IP"
echo ""
echo "2. Clone the repository:"
echo "   git clone https://github.com/SgtClickClack/DojoPool.git"
echo "   cd DojoPool"
echo ""
echo "3. Copy the production environment file:"
echo "   cat > .env << 'EOF'"
cat .env.production
echo "EOF"
echo ""
echo "4. Build and start the services:"
echo "   docker-compose build"
echo "   docker-compose run --rm api npx prisma migrate deploy"
echo "   docker-compose up -d db redis api"
echo ""
echo "5. Verify the deployment:"
echo "   curl http://localhost:3002/api/v1/health"
echo ""
echo "6. Check logs if needed:"
echo "   docker-compose logs api"
echo ""
echo "✅ Deployment script completed!"
echo "📝 Next: Follow the commands above on your server, then proceed to Part 2 (Vercel deployment)"
