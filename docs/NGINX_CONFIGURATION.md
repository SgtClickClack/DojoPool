# NGINX Configuration Guide

## Overview

This document details the NGINX configuration setup for both production and test environments of the DojoPool application.

## Directory Structure

```
deployment/
├── nginx/
│   ├── production/
│   │   └── nginx.conf        # Production NGINX configuration
│   ├── production.conf       # Main production configuration
│   └── test/
│       ├── nginx.conf        # Test environment configuration
│       └── nginx/
│           └── backend.conf  # Mock backend for testing
```

## Production Configuration

The production environment uses two main configuration files:

### Main Production Configuration (`production.conf`)

Key features:
- SSL/TLS configuration with modern security settings
- Rate limiting for different endpoints
- WebSocket support with dedicated configuration
- Advanced caching strategies
- Real-time analytics support
- Health monitoring endpoints
- Enhanced security headers
- Optimized static file serving

Rate Limits:
- API endpoints: 100 requests/second with burst=20
- Authentication: 10 requests/second with burst=5
- WebSocket: 60 requests/minute with burst=10

Security Features:
- TLS 1.2/1.3 only
- Strong cipher suite configuration
- HTTP/2 support
- Strict security headers
- Content Security Policy (CSP)
- Cross-Origin Resource Sharing (CORS) controls

### Production NGINX Configuration (`nginx/production/nginx.conf`)

Handles:
- Load balancing configuration
- SSL termination
- Static file serving
- Proxy settings for the application
- WebSocket proxying
- Health check endpoints

## Test Environment

### Test Configuration (`test/nginx.conf`)

Features:
- Simplified SSL configuration
- Development-friendly rate limits
- Mock backend support
- WebSocket testing support
- Static file serving for development
- Health check endpoints

Rate Limits (Test):
- API endpoints: 10 requests/second
- WebSocket: 5 requests/second
- Analytics: 20 requests/second

### Mock Backend (`test/nginx/backend.conf`)

Provides:
- Mock API responses
- WebSocket connection simulation
- Authentication endpoint simulation
- Health check responses

## Common Features

Both environments support:
- WebSocket connections
- Static file serving
- Health monitoring
- Rate limiting
- Security headers
- Gzip compression
- PWA support

## Deployment

### Production Deployment

1. SSL Certificate Setup:
```bash
# Place SSL certificates
sudo cp dojopool.crt /etc/nginx/ssl/
sudo cp dojopool.key /etc/nginx/ssl/
```

2. Configuration Setup:
```bash
# Copy configuration files
sudo cp deployment/nginx/production.conf /etc/nginx/conf.d/
sudo cp deployment/nginx/production/nginx.conf /etc/nginx/sites-available/dojopool
sudo ln -s /etc/nginx/sites-available/dojopool /etc/nginx/sites-enabled/
```

3. Verify Configuration:
```bash
sudo nginx -t
```

4. Restart NGINX:
```bash
sudo systemctl restart nginx
```

### Test Environment Setup

1. Configuration Setup:
```bash
# Copy test configurations
cp deployment/nginx/test/nginx.conf /path/to/test/environment/
cp deployment/nginx/test/nginx/backend.conf /path/to/test/environment/
```

2. Start Test Environment:
```bash
docker-compose -f docker-compose.test.yml up
```

## Monitoring

### Health Checks

Production:
```bash
curl -k https://yourdomain.com/health
```

Test:
```bash
curl http://localhost/health
```

### Log Locations

Production:
- Access Log: `/var/log/nginx/access.log`
- Error Log: `/var/log/nginx/error.log`

Test:
- Access Log: `/var/log/nginx/test-access.log`
- Error Log: `/var/log/nginx/test-error.log`

## Maintenance

### SSL Certificate Renewal

```bash
# Using Certbot
sudo certbot renew
```

### Configuration Testing

```bash
# Test configuration
sudo nginx -t

# Test with specific configuration
sudo nginx -t -c /path/to/nginx.conf
```

### Performance Tuning

Key settings to monitor and adjust:
- `worker_processes`
- `worker_connections`
- `keepalive_timeout`
- Rate limiting values
- Buffer sizes
- Caching parameters

## Troubleshooting

Common issues and solutions:

1. 502 Bad Gateway
   - Check upstream service health
   - Verify proxy settings
   - Check error logs

2. WebSocket Connection Issues
   - Verify upgrade headers
   - Check timeout settings
   - Review proxy settings

3. SSL/TLS Issues
   - Verify certificate paths
   - Check certificate validity
   - Review SSL configuration

## Security Considerations

1. Regular Updates
   - Keep NGINX updated
   - Update SSL certificates
   - Review security headers

2. Access Control
   - Review rate limits
   - Check IP restrictions
   - Audit access logs

3. SSL/TLS Security
   - Use modern protocols
   - Maintain strong cipher suites
   - Enable HSTS

## References

- [NGINX Documentation](https://nginx.org/en/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [NGINX Security Guide](https://www.nginx.com/resources/wiki/start/topics/examples/full/) 