# DojoPool Production Deployment Guide

This guide provides instructions for deploying the DojoPool application to a production environment.

## Prerequisites

Ensure your production server meets the following requirements:

- CPU: Minimum 4 cores (recommended 8 cores)
- RAM: Minimum 16GB (recommended 32GB)
- Storage: Minimum 100GB (recommended 250GB)
- Operating System: Ubuntu 20.04 LTS or later
- Python 3.9+
- Node.js 16+
- PostgreSQL 14+
- Redis 6+
- Nginx

## Deployment Files

The deployment configuration consists of the following files:

- `production_config.yml`: Production environment configuration
- `deploy.sh`: Main deployment script
- `setup_env.py`: Environment variables setup script
- `nginx/`: NGINX configuration directory (see [NGINX Configuration Guide](../docs/NGINX_CONFIGURATION.md))
  - `production.conf`: Main production configuration
  - `production/nginx.conf`: Production NGINX server configuration
  - `test/`: Test environment configurations
- `.env.production`: Production environment variables

## Deployment Steps

1. **Setup Environment Variables**

```bash
# Generate secure values for environment variables
python deployment/setup_env.py

# Review and update the generated .env.production file
# Replace placeholder values with actual production values
```

2. **SSL/TLS Certificates**

Ensure you have valid SSL certificates for your domain:
- Place the certificate at `/etc/ssl/certs/dojopool.crt`
- Place the private key at `/etc/ssl/private/dojopool.key`

3. **Database Setup**

```bash
# Create production database
sudo -u postgres createuser dojopool_prod_user
sudo -u postgres createdb dojopool_prod
sudo -u postgres psql -c "ALTER USER dojopool_prod_user WITH PASSWORD 'your_secure_password';"
```

4. **Redis Setup**

```bash
# Install and configure Redis
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl enable redis-server
```

5. **Run Deployment**

```bash
# Make deployment scripts executable
chmod +x deployment/deploy.sh deployment/setup_env.py

# Run deployment script
./deployment/deploy.sh
```

## Post-Deployment Verification

1. **Check Application Status**

```bash
# Check application status
curl -k https://localhost/health
curl -k https://localhost/api/system/status
```

2. **Monitor Logs**

```bash
# Check application logs
tail -f /var/log/dojopool/access.log
tail -f /var/log/dojopool/error.log
```

3. **Verify Services**

- Database connection
- Redis connection
- WebSocket functionality
- Static file serving
- API endpoints
- Authentication system

## Monitoring & Maintenance

1. **Performance Monitoring**

Access the monitoring dashboard at:
- https://your-domain.com/admin/monitoring

2. **Backup Schedule**

Automated backups are configured for:
- Database: Daily backup with 30-day retention
- File storage: Daily backup with 30-day retention

3. **Scaling**

The application is configured for auto-scaling:
- Minimum instances: 2
- Maximum instances: 10
- Scale up threshold: 75% CPU/Memory
- Scale down threshold: 25% CPU/Memory
- Cooldown period: 300 seconds

## Troubleshooting

1. **Common Issues**

- **Database Connection Issues**
  ```bash
  # Check database status
  sudo systemctl status postgresql
  # Check database logs
  sudo tail -f /var/log/postgresql/postgresql-14-main.log
  ```

- **Redis Connection Issues**
  ```bash
  # Check Redis status
  sudo systemctl status redis-server
  # Check Redis logs
  sudo tail -f /var/log/redis/redis-server.log
  ```

- **Nginx Issues**
  See [NGINX Configuration Guide - Troubleshooting](../docs/NGINX_CONFIGURATION.md#troubleshooting) for detailed information.
  ```bash
  # Quick checks
  sudo nginx -t
  sudo tail -f /var/log/nginx/error.log
  ```

2. **Security Issues**

- **SSL/TLS**
  ```bash
  # Test SSL configuration
  openssl s_client -connect localhost:443 -tls1_2
  ```

- **Firewall**
  ```bash
  # Check firewall status
  sudo ufw status
  ```

## Support

For deployment issues or questions, contact:
- Email: devops@dojopool.com
- Slack: #dojopool-devops

## Rollback Procedure

In case of deployment issues:

1. **Stop Application**
```bash
sudo systemctl stop dojopool
```

2. **Restore Database**
```bash
# Restore from latest backup
pg_restore -d dojopool_prod /path/to/backup
```

3. **Restore Code**
```bash
# Switch to last known good version
git checkout <last-known-good-tag>
```

4. **Restart Services**
```bash
sudo systemctl restart dojopool
sudo systemctl restart nginx
```

## Security Notes

1. **Access Control**
- All production endpoints require authentication
- Rate limiting is enabled for all API endpoints
- Firewall is configured to allow only necessary ports

2. **Monitoring**
- System metrics are collected every 30 seconds
- Alerts are configured for critical thresholds
- Performance anomalies trigger notifications

3. **Compliance**
- All data is encrypted at rest
- SSL/TLS is enforced for all connections
- Regular security audits are performed 