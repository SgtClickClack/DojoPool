## Deployment Guide

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
For detailed NGINX configuration instructions, see [NGINX Configuration Guide](../docs/NGINX_CONFIGURATION.md)

Quick setup:
```bash
# Copy configuration
cp nginx/production/nginx.conf /etc/nginx/conf.d/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

4. Deploy containers:
```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Monitor logs
docker-compose logs -f

# Deploy with production config
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec web flask db upgrade

# Health check
curl https://your-domain.com/health
```

### Rollback Procedures
- Database: Use alembic downgrade
- Application: Switch to previous image tag

### Security
- Enable application security measures
- Configure infrastructure security

### Performance
- Enable caching
- Optimize database queries

### Maintenance
- Regular updates
- Log rotation 