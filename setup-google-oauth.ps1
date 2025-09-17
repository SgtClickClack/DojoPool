# Google OAuth Setup Script for DojoPool
# Run this script in PowerShell as Administrator if needed

Write-Host "🚀 DojoPool Google OAuth Setup Script" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".\services\api")) {
    Write-Host "❌ Error: Please run this script from the DojoPool root directory" -ForegroundColor Red
    exit 1
}

# Function to create .env file
function Create-EnvFile {
    $envPath = ".\services\api\.env"
    
    if (Test-Path $envPath) {
        Write-Host "⚠️  .env file already exists at $envPath" -ForegroundColor Yellow
        $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
        if ($overwrite -ne 'y') {
            Write-Host "Keeping existing .env file" -ForegroundColor Green
            return
        }
    }
    
    Write-Host ""
    Write-Host "📝 Let's set up your Google OAuth credentials" -ForegroundColor Cyan
    Write-Host "You'll need to get these from https://console.cloud.google.com/" -ForegroundColor Gray
    Write-Host ""
    
    # Collect required values
    $clientId = Read-Host "Enter your Google OAuth Client ID"
    $clientSecret = Read-Host "Enter your Google OAuth Client Secret" -AsSecureString
    $clientSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($clientSecret))
    
    # Set default values
    $databaseUrl = "postgresql://postgres:password@localhost:5432/dojopool"
    $jwtSecret = [System.Web.Security.Membership]::GeneratePassword(32, 8)
    $jwtRefreshSecret = [System.Web.Security.Membership]::GeneratePassword(32, 8)
    
    # Create .env content
    $envContent = @"
# Database
DATABASE_URL=$databaseUrl

# JWT Authentication
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=$jwtRefreshSecret
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=$clientId
GOOGLE_OAUTH_CLIENT_SECRET=$clientSecretPlain
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3002/api/v1/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Redis (optional for development)
REDIS_URL=redis://localhost:6379

# Server Port
PORT=3002

# Node Environment
NODE_ENV=development
"@
    
    # Write to file
    $envContent | Out-File -FilePath $envPath -Encoding utf8
    Write-Host "✅ Created .env file at $envPath" -ForegroundColor Green
}

# Function to create frontend .env.local
function Create-FrontendEnv {
    $envPath = ".\apps\web\.env.local"
    
    if (Test-Path $envPath) {
        Write-Host "⚠️  .env.local already exists at $envPath" -ForegroundColor Yellow
        return
    }
    
    $envContent = @"
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
"@
    
    $envContent | Out-File -FilePath $envPath -Encoding utf8
    Write-Host "✅ Created .env.local file at $envPath" -ForegroundColor Green
}

# Main execution
Write-Host "🔍 Checking current setup..." -ForegroundColor Cyan
Write-Host ""

# Create .env files
Create-EnvFile
Create-FrontendEnv

Write-Host ""
Write-Host "📋 Google Cloud Console Setup Instructions:" -ForegroundColor Cyan
Write-Host "1. Go to https://console.cloud.google.com/" -ForegroundColor White
Write-Host "2. Create or select a project" -ForegroundColor White
Write-Host "3. Go to APIs & Services > Credentials" -ForegroundColor White
Write-Host "4. Create OAuth 2.0 Client ID (Web application)" -ForegroundColor White
Write-Host "5. Add these to your OAuth client:" -ForegroundColor White
Write-Host "   Authorized JavaScript origins:" -ForegroundColor Gray
Write-Host "   - http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Authorized redirect URIs:" -ForegroundColor Gray
Write-Host "   - http://localhost:3002/api/v1/auth/google/callback" -ForegroundColor Yellow
Write-Host ""

# Test the configuration
Write-Host "🧪 Testing configuration..." -ForegroundColor Cyan
Push-Location ".\services\api"
if (Test-Path ".\test-google-auth.js") {
    node test-google-auth.js
} else {
    Write-Host "⚠️  Test script not found, skipping test" -ForegroundColor Yellow
}
Pop-Location

Write-Host ""
Write-Host "🚀 Ready to start the application!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: cd services/api && npm run start:dev" -ForegroundColor Gray
Write-Host "Frontend: cd apps/web && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Then navigate to http://localhost:3000/login" -ForegroundColor Cyan
