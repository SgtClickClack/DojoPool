# Deployment Guide

### Prerequisites
- Docker installed
- Access to production environment
- SSL certificates
- Environment variables configured

### Steps

1. Build Docker image:
   ```bash
   docker build -t dojopool:latest .
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

3. Configure Nginx:
   For detailed NGINX configuration instructions, see [NGINX Configuration Guide](./NGINX_CONFIGURATION.md)

   Quick setup:
   ```bash
   cp nginx/production/nginx.conf /etc/nginx/sites-available/dojopool
   ln -s /etc/nginx/sites-available/dojopool /etc/nginx/sites-enabled/
   
   nginx -t
   systemctl reload nginx
   ```

4. Deploy containers:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. Run database migrations:
   ```bash
   docker-compose exec web flask db upgrade
   ```

6. Verify deployment:
   ```bash
   curl https://your-domain.com/health
   ``` 