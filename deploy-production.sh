#!/bin/bash

# DojoPool Production Deployment Script
# Handles phased rollout with monitoring and rollback capabilities

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_DIR="$PROJECT_ROOT/deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check required tools
    local tools=("docker" "kubectl" "helm" "curl")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            error "$tool is not installed or not in PATH"
            exit 1
        fi
    done

    # Check kubectl context
    if ! kubectl cluster-info >/dev/null 2>&1; then
        error "kubectl is not configured or cannot connect to cluster"
        exit 1
    fi

    success "Prerequisites check passed"
}

# Function to validate environment
validate_environment() {
    local phase="$1"
    log "Validating environment for $phase..."

    # Check required environment variables
    local required_vars=("DATABASE_URL" "REDIS_URL" "JWT_SECRET" "API_URL")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done

    # Validate cluster resources
    if ! kubectl get nodes >/dev/null 2>&1; then
        error "Cannot access Kubernetes nodes"
        exit 1
    fi

    success "Environment validation passed"
}

# Function to create backup
create_backup() {
    local phase="$1"
    log "Creating backup before $phase deployment..."

    local backup_dir="backups/pre-$phase-deployment-$(date +%Y%m%d-%H%M%S)"

    mkdir -p "$backup_dir"

    # Database backup
    if [ -n "$DATABASE_URL" ]; then
        log "Creating database backup..."
        # This would be replaced with actual database backup command
        echo "BACKUP DATABASE $DATABASE_URL" > "$backup_dir/database.sql"
    fi

    # Configuration backup
    cp -r "$DEPLOYMENT_DIR" "$backup_dir/deployment-config"

    # Application state backup
    kubectl get all -o yaml > "$backup_dir/kubernetes-state.yaml"

    success "Backup created in $backup_dir"
    echo "$backup_dir" > ".last-backup-$phase"
}

# Function to deploy phase
deploy_phase() {
    local phase="$1"
    log "Starting $phase deployment..."

    case $phase in
        phase1)
            deploy_phase1
            ;;
        phase2)
            deploy_phase2
            ;;
        phase3)
            deploy_phase3
            ;;
        phase4)
            deploy_phase4
            ;;
        *)
            error "Unknown phase: $phase"
            exit 1
            ;;
    esac
}

# Phase 1: Internal deployment
deploy_phase1() {
    log "Deploying Phase 1 (Internal/Dogfooding)..."

    # Deploy infrastructure
    helm upgrade --install dojopool-infra "$DEPLOYMENT_DIR/helm/dojopool-infra" \
        --namespace dojopool \
        --create-namespace \
        --set phase=phase1

    # Wait for infrastructure
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=dojopool-infra --timeout=300s

    # Deploy application
    helm upgrade --install dojopool-app "$DEPLOYMENT_DIR/helm/dojopool-app" \
        --namespace dojopool \
        --set phase=phase1 \
        --set traffic.percentage=5

    # Wait for application
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=dojopool-app --timeout=300s

    success "Phase 1 deployment completed"
}

# Phase 2: Limited beta
deploy_phase2() {
    log "Deploying Phase 2 (Limited Beta)..."

    # Update traffic percentage
    helm upgrade dojopool-app "$DEPLOYMENT_DIR/helm/dojopool-app" \
        --namespace dojopool \
        --set phase=phase2 \
        --set traffic.percentage=10

    # Enable beta features
    kubectl apply -f "$DEPLOYMENT_DIR/k8s/feature-flags-phase2.yaml"

    # Wait for rollout
    kubectl rollout status deployment/dojopool-api
    kubectl rollout status deployment/dojopool-web

    success "Phase 2 deployment completed"
}

# Phase 3: Open beta
deploy_phase3() {
    log "Deploying Phase 3 (Open Beta)..."

    # Update traffic percentage
    helm upgrade dojopool-app "$DEPLOYMENT_DIR/helm/dojopool-app" \
        --namespace dojopool \
        --set phase=phase3 \
        --set traffic.percentage=50

    # Enable additional features
    kubectl apply -f "$DEPLOYMENT_DIR/k8s/feature-flags-phase3.yaml"

    # Scale services
    kubectl scale deployment dojopool-api --replicas=5
    kubectl scale deployment dojopool-web --replicas=5

    # Wait for scaling
    kubectl rollout status deployment/dojopool-api
    kubectl rollout status deployment/dojopool-web

    success "Phase 3 deployment completed"
}

# Phase 4: General availability
deploy_phase4() {
    log "Deploying Phase 4 (General Availability)..."

    # Full traffic release
    helm upgrade dojopool-app "$DEPLOYMENT_DIR/helm/dojopool-app" \
        --namespace dojopool \
        --set phase=phase4 \
        --set traffic.percentage=100

    # Enable all features
    kubectl apply -f "$DEPLOYMENT_DIR/k8s/feature-flags-ga.yaml"

    # Scale to production capacity
    kubectl scale deployment dojopool-api --replicas=10
    kubectl scale deployment dojopool-web --replicas=10

    # Enable production monitoring
    kubectl apply -f "$DEPLOYMENT_DIR/k8s/monitoring-production.yaml"

    # Wait for full rollout
    kubectl rollout status deployment/dojopool-api
    kubectl rollout status deployment/dojopool-web

    success "Phase 4 deployment completed"
}

# Function to run health checks
run_health_checks() {
    local phase="$1"
    log "Running health checks for $phase..."

    # API health check
    if curl -f -s http://api.dojopool.com/health >/dev/null 2>&1; then
        success "API health check passed"
    else
        error "API health check failed"
        return 1
    fi

    # Web health check
    if curl -f -s http://app.dojopool.com/api/health >/dev/null 2>&1; then
        success "Web health check passed"
    else
        error "Web health check failed"
        return 1
    fi

    # Database connectivity
    if kubectl exec -it deployment/dojopool-api -- curl -f -s http://localhost:3001/health/db >/dev/null 2>&1; then
        success "Database connectivity check passed"
    else
        error "Database connectivity check failed"
        return 1
    fi

    success "All health checks passed"
}

# Function to monitor deployment
monitor_deployment() {
    local phase="$1"
    local duration="${2:-300}"  # Default 5 minutes

    log "Monitoring $phase deployment for $duration seconds..."

    local end_time=$((SECONDS + duration))
    local alert_count=0

    while [ $SECONDS -lt $end_time ]; do
        # Check for critical alerts
        local alerts=$(curl -s "http://prometheus.dojopool.com/api/v1/alerts" | grep -c '"alertstate":"firing"')

        if [ "$alerts" -gt "$alert_count" ]; then
            warning "New alerts detected: $alerts total"
            alert_count=$alerts
        fi

        # Check response times
        local response_time=$(curl -s -o /dev/null -w "%{time_total}" http://api.dojopool.com/health)

        if (( $(echo "$response_time > 1.0" | bc -l) )); then
            warning "Slow response time detected: ${response_time}s"
        fi

        sleep 30
    done

    if [ $alert_count -eq 0 ]; then
        success "No critical alerts during monitoring period"
    else
        warning "$alert_count alerts detected during monitoring"
    fi
}

# Function to generate deployment report
generate_report() {
    local phase="$1"
    local status="$2"
    local report_file="deployment-report-$phase-$(date +%Y%m%d-%H%M%S).md"

    cat > "$report_file" << EOF
# DojoPool Deployment Report - $phase
## $(date)

### Deployment Status: $status

### Environment Information
- Phase: $phase
- Cluster: $(kubectl config current-context)
- Namespace: dojopool
- Timestamp: $(date)

### Deployment Details
- Start Time: $(date -d "@$START_TIME")
- End Time: $(date)
- Duration: $((SECONDS - START_TIME)) seconds

### Health Check Results
$(run_health_checks "$phase" 2>/dev/null || echo "Health checks completed with issues")

### Monitoring Summary
- Alerts during deployment: $(curl -s "http://prometheus.dojopool.com/api/v1/alerts" | grep -c '"alertstate":"firing"')
- Average response time: $(curl -s -o /dev/null -w "%{time_total}" http://api.dojopool.com/health)s

### Next Steps
1. Monitor system for 24 hours
2. Review application logs
3. Validate user-facing functionality
4. Update monitoring dashboards if needed

### Rollback Information
- Last backup: $(cat ".last-backup-$phase" 2>/dev/null || echo "No backup found")
- Rollback command: ./rollback-production.sh --phase $phase --reason "Deployment issues"
EOF

    success "Deployment report generated: $report_file"
}

# Main deployment flow
main() {
    local phase=""
    local skip_checks=false
    local skip_backup=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --phase)
                phase="$2"
                shift 2
                ;;
            --skip-checks)
                skip_checks=true
                shift
                ;;
            --skip-backup)
                skip_backup=true
                shift
                ;;
            --help)
                echo "Usage: $0 --phase <phase> [--skip-checks] [--skip-backup]"
                echo ""
                echo "Phases: phase1, phase2, phase3, phase4"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    if [ -z "$phase" ]; then
        error "Phase is required. Use --phase to specify deployment phase."
        exit 1
    fi

    START_TIME=$SECONDS

    log "🚀 Starting DojoPool Production Deployment"
    log "Phase: $phase"

    # Pre-deployment checks
    if [ "$skip_checks" = false ]; then
        check_prerequisites
        validate_environment "$phase"
    fi

    # Create backup
    if [ "$skip_backup" = false ]; then
        create_backup "$phase"
    fi

    # Execute deployment
    deploy_phase "$phase"

    # Post-deployment health checks
    if run_health_checks "$phase"; then
        success "Health checks passed"
    else
        error "Health checks failed - consider rollback"
        exit 1
    fi

    # Monitor deployment
    monitor_deployment "$phase" 300

    # Generate report
    generate_report "$phase" "SUCCESS"

    success "🎉 $phase deployment completed successfully!"
    log "Duration: $((SECONDS - START_TIME)) seconds"
    log "Monitor system health at: http://grafana.dojopool.com"
    log "View application at: http://app.dojopool.com"
}

# Run main function with all arguments
main "$@"
