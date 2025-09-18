# DojoPool Hybrid Deployment Checklist

## Pre-Deployment Setup ✅

- [x] Created deployment scripts (PowerShell and Bash)
- [x] Generated secure production environment configuration
- [x] Updated Vercel configuration for monorepo
- [x] Created comprehensive deployment guide
- [x] Prepared troubleshooting documentation

## Part 1: Backend Deployment

### Server Provisioning
- [ ] Create cloud server with Docker pre-installed
- [ ] Note server IP address
- [ ] Ensure port 3002 is open in firewall

### Backend Deployment
- [ ] Run deployment script: `.\deploy-production.ps1 YOUR_SERVER_IP`
- [ ] SSH into server: `ssh root@YOUR_SERVER_IP`
- [ ] Clone repository: `git clone https://github.com/SgtClickClack/DojoPool.git`
- [ ] Navigate to project: `cd DojoPool`
- [ ] Create production .env file with generated secrets
- [ ] Build Docker images: `docker-compose build`
- [ ] Run database migrations: `docker-compose run --rm api npx prisma migrate deploy`
- [ ] Start services: `docker-compose up -d db redis api`
- [ ] Verify API health: `curl http://localhost:3002/api/v1/health`

### Backend Verification
- [ ] API responds with `{"status":"ok"}`
- [ ] Database container is running
- [ ] Redis container is running
- [ ] API container is running
- [ ] Check logs for any errors: `docker-compose logs api`

## Part 2: Frontend Deployment

### Vercel Configuration
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Login to Vercel: `vercel login`
- [ ] Add API URL: `vercel env add NEXT_PUBLIC_API_URL http://YOUR_SERVER_IP:3002/api/v1 production`
- [ ] Add WebSocket URL: `vercel env add NEXT_PUBLIC_WEBSOCKET_URL http://YOUR_SERVER_IP:3002 production`

### Frontend Deployment
- [ ] Commit changes: `git add . && git commit -m "feat: prepare for production deployment"`
- [ ] Push to trigger deployment: `git push origin main`
- [ ] Monitor Vercel dashboard for deployment status
- [ ] Note the Vercel domain URL

### CORS Configuration Update
- [ ] Update server .env with actual Vercel domain
- [ ] Update CORS_ORIGINS with Vercel domain
- [ ] Update FRONTEND_URL with Vercel domain
- [ ] Restart API service: `docker-compose restart api`

## Final Verification

### Backend Tests
- [ ] Health check: `curl http://YOUR_SERVER_IP:3002/api/v1/health`
- [ ] Database connection: `docker-compose exec db psql -U postgres -d dojopool -c "SELECT 1;"`
- [ ] Redis connection: `docker-compose exec redis redis-cli ping`

### Frontend Tests
- [ ] Visit Vercel domain
- [ ] Check browser console for errors
- [ ] Test API connection from frontend
- [ ] Verify WebSocket connection

### Integration Tests
- [ ] Test user registration/login flow
- [ ] Test API endpoints from frontend
- [ ] Verify real-time features work
- [ ] Check error handling and logging

## Security Checklist

- [ ] Strong JWT_SECRET generated and configured
- [ ] Strong SESSION_SECRET generated and configured
- [ ] Google OAuth credentials configured
- [ ] CORS properly configured with actual domains
- [ ] Database passwords changed from defaults (recommended)
- [ ] Server firewall configured
- [ ] SSL certificate configured (recommended)

## Post-Deployment

### Monitoring Setup
- [ ] Set up application monitoring
- [ ] Configure log aggregation
- [ ] Set up alerts for service failures

### Backup Strategy
- [ ] Configure database backups
- [ ] Set up automated backup schedules
- [ ] Test restore procedures

### Domain Configuration (Optional)
- [ ] Set up custom domain in Vercel
- [ ] Configure DNS records
- [ ] Update CORS settings with custom domain
- [ ] Set up SSL certificate for server

## Troubleshooting Commands

### Server Issues
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs api
docker-compose logs db
docker-compose logs redis

# Restart services
docker-compose restart api
docker-compose restart db
docker-compose restart redis

# Check system resources
docker stats
```

### Vercel Issues
```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Redeploy
vercel --prod
```

### Network Issues
```bash
# Test API connectivity
curl -v http://YOUR_SERVER_IP:3002/api/v1/health

# Test from Vercel domain
curl -v https://your-vercel-domain.vercel.app/api/health
```
