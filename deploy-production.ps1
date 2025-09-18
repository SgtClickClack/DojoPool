# DojoPool Production Deployment Script (PowerShell)
# This script prepares the deployment configuration for Windows users

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP
)

Write-Host "🚀 Starting DojoPool Production Deployment..." -ForegroundColor Green

# Generate strong random secrets
$JWTSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$SessionSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

Write-Host "🔐 Generated secure secrets for production" -ForegroundColor Green

# Create production environment file
$envContent = @"
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@db:5432/dojopool?schema=public"

# Redis Configuration
REDIS_URL="redis://redis:6379"

# Security Secrets (Generated)
JWT_SECRET="$JWTSecret"
SESSION_SECRET="$SessionSecret"

# Google OAuth Configuration (Update these with your actual values)
GOOGLE_OAUTH_CLIENT_ID="your_google_client_id_here"
GOOGLE_OAUTH_CLIENT_SECRET="your_google_client_secret_here"
GOOGLE_OAUTH_REDIRECT_URI="http://$ServerIP:3002/api/v1/auth/google/callback"

# Application Configuration
PORT=3002
NODE_ENV=production
CORS_ORIGINS="http://$ServerIP:3000,https://your-vercel-domain.vercel.app"
FRONTEND_URL="https://your-vercel-domain.vercel.app"

# Optional: Cloudinary Configuration (for avatar uploads)
# CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
# CLOUDINARY_API_KEY="your_cloudinary_api_key"
# CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
# CLOUDINARY_FOLDER="dojopool/avatars"

# Optional: JWT Expiration Settings
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
"@

$envContent | Out-File -FilePath ".env.production" -Encoding UTF8

Write-Host "📝 Created production environment file" -ForegroundColor Green

# Display commands to run on the server
Write-Host "📋 Commands to run on your server:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. SSH into your server:" -ForegroundColor Cyan
Write-Host "   ssh root@$ServerIP" -ForegroundColor White
Write-Host ""
Write-Host "2. Clone the repository:" -ForegroundColor Cyan
Write-Host "   git clone https://github.com/SgtClickClack/DojoPool.git" -ForegroundColor White
Write-Host "   cd DojoPool" -ForegroundColor White
Write-Host ""
Write-Host "3. Copy the production environment file:" -ForegroundColor Cyan
Write-Host "   cat > .env << 'EOF'" -ForegroundColor White
Write-Host $envContent -ForegroundColor White
Write-Host "EOF" -ForegroundColor White
Write-Host ""
Write-Host "4. Build and start the services:" -ForegroundColor Cyan
Write-Host "   docker-compose build" -ForegroundColor White
Write-Host "   docker-compose run --rm api npx prisma migrate deploy" -ForegroundColor White
Write-Host "   docker-compose up -d db redis api" -ForegroundColor White
Write-Host ""
Write-Host "5. Verify the deployment:" -ForegroundColor Cyan
Write-Host "   curl http://localhost:3002/api/v1/health" -ForegroundColor White
Write-Host ""
Write-Host "6. Check logs if needed:" -ForegroundColor Cyan
Write-Host "   docker-compose logs api" -ForegroundColor White
Write-Host ""
Write-Host "✅ Deployment script completed!" -ForegroundColor Green
Write-Host "📝 Next: Follow the commands above on your server, then proceed to Part 2 (Vercel deployment)" -ForegroundColor Yellow
