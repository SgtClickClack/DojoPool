# DojoPool Server Deployment Commands
# Execute these commands on your server: 162.243.186.190

# 1. SSH into the server
ssh root@162.243.186.190

# 2. Clone the repository
git clone https://github.com/SgtClickClack/DojoPool.git
cd DojoPool

# 3. Create production environment file
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@db:5432/dojopool?schema=public"

# Redis Configuration
REDIS_URL="redis://redis:6379"

# Security Secrets (Generated)
JWT_SECRET="dojopool_jwt_secret_2024_production_secure_key_change_me"
SESSION_SECRET="dojopool_session_secret_2024_production_secure_key_change_me"

# Google OAuth Configuration (Update these with your actual values)
GOOGLE_OAUTH_CLIENT_ID="your_google_client_id_here"
GOOGLE_OAUTH_CLIENT_SECRET="your_google_client_secret_here"
GOOGLE_OAUTH_REDIRECT_URI="http://162.243.186.190:3002/api/v1/auth/google/callback"

# Application Configuration
PORT=3002
NODE_ENV=production
CORS_ORIGINS="http://162.243.186.190:3000,https://dojo-pool-julian-roberts-projects.vercel.app"
FRONTEND_URL="https://dojo-pool-julian-roberts-projects.vercel.app"

# Optional: Cloudinary Configuration (for avatar uploads)
# CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
# CLOUDINARY_API_KEY="your_cloudinary_api_key"
# CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
# CLOUDINARY_FOLDER="dojopool/avatars"

# Optional: JWT Expiration Settings
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
EOF

# 4. Build Docker images
docker-compose build

# 5. Run database migrations
docker-compose run --rm api npx prisma migrate deploy

# 6. Start services
docker-compose up -d db redis api

# 7. Verify deployment
curl http://localhost:3002/api/v1/health

# 8. Check service status
docker-compose ps

# 9. View logs if needed
docker-compose logs api
