# Deployment Guide

## Overview
This guide covers the deployment process for DojoPool, including both development and production environments.

## Prerequisites
- Docker and Docker Compose
- Node.js 16+ and npm
- Python 3.9+
- PostgreSQL 13+
- Redis 6+

## Environment Setup

### Development Environment
1. Clone the repository:
   ```bash
   git clone https://github.com/organization/dojopool.git
   cd dojopool
   ```

2. Set up Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Linux/Mac
   .venv\Scripts\activate     # Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   cd src/frontend && npm install
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Production Environment

1. Server Requirements:
   - Ubuntu 20.04 LTS or newer
   - 4GB RAM minimum
   - 2 CPU cores minimum
   - 40GB SSD storage

2. Security Setup:
   - Configure firewall (UFW)
   - Set up SSL certificates
   - Configure secure PostgreSQL access
   - Set up Redis password

3. Domain and SSL:
   ```bash
   # Install Certbot
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   
   # Generate SSL certificate
   sudo certbot --nginx -d yourdomain.com
   ```

## Database Setup

1. Initialize database:
   ```bash
   flask db upgrade
   ```

2. Create initial data:
   ```bash
   flask seed-db
   ```

## Application Deployment

### Using Docker (Recommended)

1. Build containers:
   ```bash
   docker-compose build
   ```

2. Start services:
   ```bash
   docker-compose up -d
   ```

3. Monitor logs:
   ```bash
   docker-compose logs -f
   ```

### Manual Deployment

1. Build frontend:
   ```bash
   cd src/frontend
   npm run build
   ```

2. Set up Gunicorn:
   ```bash
   gunicorn --bind 0.0.0.0:5000 wsgi:app
   ```

3. Configure Nginx:
   For detailed NGINX configuration instructions, see [NGINX Configuration Guide](NGINX_CONFIGURATION.md)
   
   Quick setup:
   ```bash
   # Copy configuration files
   sudo cp deployment/nginx/production.conf /etc/nginx/conf.d/
   sudo cp deployment/nginx/production/nginx.conf /etc/nginx/sites-available/dojopool
   
   # Create symbolic link
   sudo ln -s /etc/nginx/sites-available/dojopool /etc/nginx/sites-enabled/
   
   # Test configuration
   sudo nginx -t
   
   # Restart NGINX
   sudo systemctl restart nginx
   ```

## Monitoring Setup

1. Configure Prometheus:
   ```yaml
   global:
     scrape_interval: 15s
   
   scrape_configs:
     - job_name: 'dojopool'
       static_configs:
         - targets: ['localhost:5000']
   ```

2. Set up Grafana dashboards:
   - Import provided dashboard templates
   - Configure alerting rules
   - Set up notification channels

## Backup Configuration

1. Database backups:
   ```bash
   # Add to crontab
   0 2 * * * /path/to/backup.sh
   ```

2. File backups:
   ```bash
   # Configure daily backups
   rsync -avz /path/to/app /backup/location
   ```

## Scaling Considerations

1. Load Balancing:
   - Configure Nginx load balancing
   - Set up multiple application instances
   - Configure session sharing

2. Database Scaling:
   - Set up read replicas
   - Configure connection pooling
   - Implement caching strategy

## Troubleshooting

### Common Issues

1. Database Connection:
   ```bash
   # Check database status
   sudo systemctl status postgresql
   
   # Check logs
   sudo tail -f /var/log/postgresql/postgresql-13-main.log
   ```

2. Application Errors:
   ```bash
   # Check application logs
   docker-compose logs app
   
   # Check nginx logs
   sudo tail -f /var/log/nginx/error.log
   ```

### Health Checks

1. Backend Health:
   ```bash
   curl http://localhost:5000/health
   ```

2. Database Health:
   ```bash
   pg_isready -h localhost -p 5432
   ```

## Rollback Procedures

1. Database Rollback:
   ```bash
   flask db downgrade
   ```

2. Application Rollback:
   ```bash
   docker-compose down
   docker-compose up -d --force-recreate
   ```

## Security Considerations

1. Application Security:
   - Enable CSRF protection
   - Configure CSP headers
   - Set up rate limiting

2. Infrastructure Security:
   - Regular security updates
   - Firewall configuration
   - Access control

## Performance Optimization

1. Caching Strategy:
   - Configure Redis caching
   - Set up CDN for static assets
   - Implement browser caching

2. Database Optimization:
   - Index optimization
   - Query optimization
   - Connection pooling

## Maintenance Procedures

1. Regular Updates:
   ```bash
   # Update dependencies
   pip install -r requirements.txt --upgrade
   npm update
   
   # Rebuild containers
   docker-compose build --no-cache
   ```

2. Log Rotation:
   ```bash
   # Configure logrotate
   sudo nano /etc/logrotate.d/dojopool
   ```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Security measures implemented
- [ ] Performance optimized
- [ ] Documentation updated 