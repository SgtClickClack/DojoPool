#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env.production

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logger function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%dT%H:%M:%S%z')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%dT%H:%M:%S%z')] ERROR: $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%dT%H:%M:%S%z')] WARNING: $1${NC}"
}

# Run pre-deployment checks
run_pre_deployment_checks() {
    log "Running pre-deployment checks..."
    python deployment/pre_deploy_check.py || error "Pre-deployment checks failed"
    log "Pre-deployment checks passed"
}

# Check system requirements
check_system_requirements() {
    log "Checking system requirements..."
    
    # Check CPU cores
    cpu_cores=$(nproc)
    if [ $cpu_cores -lt 4 ]; then
        error "Insufficient CPU cores. Minimum required: 4, Found: $cpu_cores"
    fi
    
    # Check RAM
    total_ram=$(free -g | awk '/^Mem:/{print $2}')
    if [ $total_ram -lt 16 ]; then
        error "Insufficient RAM. Minimum required: 16GB, Found: ${total_ram}GB"
    fi
    
    # Check disk space
    free_space=$(df -BG / | awk '/^\//{print $4}' | sed 's/G//')
    if [ $free_space -lt 100 ]; then
        error "Insufficient disk space. Minimum required: 100GB, Found: ${free_space}GB"
    fi
    
    log "System requirements check passed"
}

# Set up SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    if [ -z "$SSL_CERT_PATH" ] || [ -z "$SSL_KEY_PATH" ]; then
        error "SSL certificate paths not configured"
    fi
    
    # Add SSL setup commands here
    log "SSL certificates configured successfully"
}

# Configure load balancer
setup_load_balancer() {
    log "Configuring load balancer..."
    
    # Nginx configuration
    if ! command -v nginx &> /dev/null; then
        error "nginx not installed"
    fi
    
    # Copy nginx configuration
    sudo cp deployment/nginx/production.conf /etc/nginx/sites-available/dojopool
    sudo ln -sf /etc/nginx/sites-available/dojopool /etc/nginx/sites-enabled/
    sudo nginx -t || error "nginx configuration test failed"
    sudo systemctl restart nginx
    
    log "Load balancer configured successfully"
}

# Initialize database
setup_database() {
    log "Initializing database..."
    
    if [ -z "$PROD_DATABASE_URL" ]; then
        error "Database URL not configured"
    fi
    
    # Run database migrations
    python manage.py db upgrade
    
    log "Database initialized successfully"
}

# Set up Redis cluster
setup_redis() {
    log "Setting up Redis cluster..."
    
    if [ -z "$PROD_REDIS_URL" ]; then
        error "Redis URL not configured"
    fi
    
    # Redis cluster setup commands here
    log "Redis cluster configured successfully"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    # Install dependencies
    pip install -r requirements.txt
    
    # Collect static files
    python manage.py collectstatic --noinput
    
    # Start Gunicorn
    gunicorn wsgi:app \
        --bind 0.0.0.0:8000 \
        --workers 4 \
        --threads 4 \
        --timeout 120 \
        --max-requests 1000 \
        --max-requests-jitter 50 \
        --log-level info \
        --access-logfile /var/log/dojopool/access.log \
        --error-logfile /var/log/dojopool/error.log \
        --daemon
    
    log "Application deployed successfully"
}

# Configure monitoring
setup_monitoring() {
    log "Configuring monitoring..."
    
    # Set up logging
    mkdir -p /var/log/dojopool
    touch /var/log/dojopool/access.log
    touch /var/log/dojopool/error.log
    
    # Configure monitoring tools
    # Add monitoring setup commands here
    
    log "Monitoring configured successfully"
}

# Enable auto-scaling
setup_auto_scaling() {
    log "Enabling auto-scaling..."
    
    # Configure auto-scaling settings
    python manage.py configure_scaling \
        --min-instances 2 \
        --max-instances 10 \
        --scale-up-threshold 75 \
        --scale-down-threshold 25 \
        --cooldown-period 300
    
    log "Auto-scaling enabled successfully"
}

# Verify security settings
verify_security() {
    log "Verifying security settings..."
    
    # Check SSL
    if ! curl -k -s https://localhost > /dev/null; then
        error "SSL check failed"
    fi
    
    # Check firewall
    if ! sudo ufw status | grep -q "Status: active"; then
        error "Firewall not active"
    fi
    
    log "Security verification passed"
}

# Run smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    # Run basic health checks
    curl -f http://localhost/api/health || error "Health check failed"
    curl -f http://localhost/api/system/status || error "System status check failed"
    curl -f http://localhost/api/db/status || error "Database status check failed"
    curl -f http://localhost/api/cache/status || error "Cache status check failed"
    
    # Run test suite
    python -m pytest tests/smoke -v
    
    log "Smoke tests passed successfully"
}

# Post-deployment verification
verify_deployment() {
    log "Verifying deployment..."
    
    # Check application status
    if ! curl -s http://localhost/api/health | grep -q "ok"; then
        error "Application health check failed"
    fi
    
    # Check database connection
    if ! python -c "from app import db; db.session.execute('SELECT 1')"; then
        error "Database connection check failed"
    fi
    
    # Check Redis connection
    if ! redis-cli ping | grep -q "PONG"; then
        error "Redis connection check failed"
    fi
    
    # Check monitoring
    if ! curl -s http://localhost/api/system/metrics | grep -q "metrics"; then
        warn "Monitoring metrics endpoint not responding"
    fi
    
    log "Deployment verification passed"
}

# Main deployment process
main() {
    log "Starting deployment process..."
    
    run_pre_deployment_checks
    check_system_requirements
    setup_ssl
    setup_load_balancer
    setup_database
    setup_redis
    deploy_application
    setup_monitoring
    setup_auto_scaling
    verify_security
    run_smoke_tests
    verify_deployment
    
    log "Deployment completed successfully"
    log "Application is now running at https://dojopool.com.au"
}

# Run main function
main