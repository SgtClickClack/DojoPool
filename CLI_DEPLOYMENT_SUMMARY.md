# DojoPool CLI Deployment Summary

## ✅ Completed Steps

1. **Vercel Project Linked**: Successfully linked to `julian-roberts-projects/dojo-pool`
2. **Production Environment**: Created `env.production` with secure configuration
3. **Vercel Configuration**: Updated `vercel.json` for monorepo structure
4. **Deployment Scripts**: Created PowerShell and Bash deployment scripts

## 🔄 Next Steps (Manual)

### Step 1: Provision Cloud Server
Since DigitalOcean CLI has connectivity issues, manually create a server:

1. **Go to DigitalOcean Console**: https://cloud.digitalocean.com/
2. **Create Droplet**:
   - Image: "Docker on Ubuntu 20.04"
   - Size: Basic $6/month (1GB RAM, 1 CPU)
   - Region: Choose closest to your users
   - Authentication: SSH Key or Password
3. **Note the IP address** (e.g., 157.245.123.45)

### Step 2: Deploy Backend (On Server)

**SSH into your server:**
```bash
ssh root@YOUR_SERVER_IP
```

**Run these commands on the server:**
```bash
# Clone repository
git clone https://github.com/SgtClickClack/DojoPool.git
cd DojoPool

# Create production environment file
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@db:5432/dojopool?schema=public"

# Redis Configuration
REDIS_URL="redis://redis:6379"

# Security Secrets
JWT_SECRET="dojopool_jwt_secret_2024_production_secure_key_change_me"
SESSION_SECRET="dojopool_session_secret_2024_production_secure_key_change_me"

# Google OAuth Configuration (Update these)
GOOGLE_OAUTH_CLIENT_ID="your_google_client_id_here"
GOOGLE_OAUTH_CLIENT_SECRET="your_google_client_secret_here"
GOOGLE_OAUTH_REDIRECT_URI="http://YOUR_SERVER_IP:3002/api/v1/auth/google/callback"

# Application Configuration
PORT=3002
NODE_ENV=production
CORS_ORIGINS="http://YOUR_SERVER_IP:3000,https://dojo-pool-julian-roberts-projects.vercel.app"
FRONTEND_URL="https://dojo-pool-julian-roberts-projects.vercel.app"
EOF

# Build and start services
docker-compose build
docker-compose run --rm api npx prisma migrate deploy
docker-compose up -d db redis api

# Verify deployment
curl http://localhost:3002/api/v1/health
```

### Step 3: Configure Vercel Environment Variables

**On your local machine:**
```bash
# Add API URL (replace YOUR_SERVER_IP with actual IP)
vercel env add NEXT_PUBLIC_API_URL "http://YOUR_SERVER_IP:3002/api/v1" production

# Add WebSocket URL
vercel env add NEXT_PUBLIC_WEBSOCKET_URL "http://YOUR_SERVER_IP:3002" production
```

### Step 4: Deploy Frontend

**On your local machine:**
```bash
# Commit and push changes
git add .
git commit -m "feat: prepare for production deployment"
git push origin main

# Deploy to Vercel
vercel --prod
```

### Step 5: Update CORS Configuration

**On your server, update the .env file:**
```bash
# Edit .env file
nano .env

# Update CORS_ORIGINS with your actual Vercel domain
CORS_ORIGINS="https://dojo-pool-julian-roberts-projects.vercel.app"

# Restart API service
docker-compose restart api
```

## 🔍 Verification Commands

### Backend Health Check:
```bash
curl http://YOUR_SERVER_IP:3002/api/v1/health
```

### Check Services:
```bash
docker-compose ps
docker-compose logs api
```

### Frontend Test:
- Visit: https://dojo-pool-julian-roberts-projects.vercel.app
- Check browser console for API connection errors

## 🚨 Troubleshooting

### If API is not accessible:
1. Check server firewall: `ufw status`
2. Open port 3002: `ufw allow 3002`
3. Check Docker logs: `docker-compose logs api`

### If Vercel deployment fails:
1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Check `vercel.json` configuration

### If CORS errors:
1. Update CORS_ORIGINS in server .env
2. Restart API service
3. Clear browser cache

## 📋 Current Status

- ✅ Vercel project linked
- ✅ Production environment configured
- ✅ Deployment scripts created
- ⏳ Waiting for server IP
- ⏳ Backend deployment pending
- ⏳ Vercel environment variables pending
- ⏳ Frontend deployment pending

## 🎯 Expected Result

After completion:
- Backend API running on `http://YOUR_SERVER_IP:3002`
- Frontend deployed on `https://dojo-pool-julian-roberts-projects.vercel.app`
- Full-stack application accessible globally
- Real-time features working via WebSocket
