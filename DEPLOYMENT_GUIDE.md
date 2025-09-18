# DojoPool Hybrid Deployment Guide

## Part 1: Backend Deployment to Cloud Server

### Step 1: Provision a Cloud Server
Create a server with Docker pre-installed (DigitalOcean "Docker on Ubuntu" or AWS EC2 with Docker).

### Step 2: Deploy Backend Services

**On your local machine, run:**
```bash
# Navigate to DojoPool directory
cd DojoPool

# Run the deployment script (replace SERVER_IP with your actual server IP)
./deploy-production.sh YOUR_SERVER_IP
```

**Then SSH into your server and execute the commands provided by the script:**

1. **Connect to server:**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

2. **Clone repository:**
   ```bash
   git clone https://github.com/SgtClickClack/DojoPool.git
   cd DojoPool
   ```

3. **Create production environment file:**
   ```bash
   cat > .env << 'EOF'
   # Database Configuration
   DATABASE_URL="postgresql://postgres:postgres@db:5432/dojopool?schema=public"
   
   # Redis Configuration
   REDIS_URL="redis://redis:6379"
   
   # Security Secrets (Generated)
   JWT_SECRET="YOUR_GENERATED_JWT_SECRET"
   SESSION_SECRET="YOUR_GENERATED_SESSION_SECRET"
   
   # Google OAuth Configuration (Update these with your actual values)
   GOOGLE_OAUTH_CLIENT_ID="your_google_client_id_here"
   GOOGLE_OAUTH_CLIENT_SECRET="your_google_client_secret_here"
   GOOGLE_OAUTH_REDIRECT_URI="http://YOUR_SERVER_IP:3002/api/v1/auth/google/callback"
   
   # Application Configuration
   PORT=3002
   NODE_ENV=production
   CORS_ORIGINS="http://YOUR_SERVER_IP:3000,https://your-vercel-domain.vercel.app"
   FRONTEND_URL="https://your-vercel-domain.vercel.app"
   EOF
   ```

4. **Build and start services:**
   ```bash
   docker-compose build
   docker-compose run --rm api npx prisma migrate deploy
   docker-compose up -d db redis api
   ```

5. **Verify deployment:**
   ```bash
   curl http://localhost:3002/api/v1/health
   ```

6. **Check logs if needed:**
   ```bash
   docker-compose logs api
   ```

---

## Part 2: Frontend Deployment to Vercel

### Step 1: Configure Vercel Environment Variables

**On your local machine:**

1. **Install Vercel CLI (if not already installed):**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Add API URL environment variable:**
   ```bash
   vercel env add NEXT_PUBLIC_API_URL http://YOUR_SERVER_IP:3002/api/v1 production
   ```

4. **Add WebSocket URL environment variable:**
   ```bash
   vercel env add NEXT_PUBLIC_WEBSOCKET_URL http://YOUR_SERVER_IP:3002 production
   ```

### Step 2: Deploy Frontend

1. **Push changes to trigger deployment:**
   ```bash
   git add .
   git commit -m "feat: prepare for production deployment"
   git push origin main
   ```

2. **Monitor deployment:**
   - Check Vercel dashboard for deployment status
   - Verify the frontend is accessible at your Vercel domain

### Step 3: Update Backend CORS Configuration

**On your server, update the .env file with your actual Vercel domain:**

```bash
# Edit the .env file
nano .env

# Update CORS_ORIGINS and FRONTEND_URL with your actual Vercel domain
CORS_ORIGINS="https://your-actual-vercel-domain.vercel.app"
FRONTEND_URL="https://your-actual-vercel-domain.vercel.app"
```

**Restart the API service:**
```bash
docker-compose restart api
```

---

## Verification Steps

1. **Backend Health Check:**
   ```bash
   curl http://YOUR_SERVER_IP:3002/api/v1/health
   ```

2. **Frontend Access:**
   - Visit your Vercel domain
   - Check browser console for any API connection errors

3. **Database Connection:**
   ```bash
   docker-compose exec db psql -U postgres -d dojopool -c "SELECT 1;"
   ```

4. **Redis Connection:**
   ```bash
   docker-compose exec redis redis-cli ping
   ```

---

## Troubleshooting

### Common Issues:

1. **API not accessible from Vercel:**
   - Check server firewall settings
   - Ensure port 3002 is open
   - Verify CORS configuration

2. **Database connection issues:**
   - Check if database container is running: `docker-compose ps`
   - Check database logs: `docker-compose logs db`

3. **Environment variable issues:**
   - Verify all required variables are set in `.env`
   - Check API logs: `docker-compose logs api`

### Security Notes:

- Change default database passwords in production
- Use strong, unique secrets for JWT_SECRET and SESSION_SECRET
- Configure proper firewall rules
- Consider using HTTPS with a reverse proxy (nginx) for production
- Update Google OAuth redirect URIs with your actual domains

---

## Next Steps After Deployment

1. **Configure Domain (Optional):**
   - Set up custom domain in Vercel
   - Configure DNS records
   - Update CORS settings with custom domain

2. **SSL Certificate (Recommended):**
   - Set up SSL certificate for your server
   - Configure reverse proxy with nginx

3. **Monitoring:**
   - Set up application monitoring
   - Configure log aggregation
   - Set up alerts for service failures

4. **Backup Strategy:**
   - Configure database backups
   - Set up automated backup schedules
   - Test restore procedures
