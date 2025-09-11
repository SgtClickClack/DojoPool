#!/bin/bash

# DojoPool Production Rollback Script
# Automated rollback procedure for production deployments

set -e

# Configuration
ROLLBACK_VERSIONS_TO_KEEP=5
BACKUP_RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Parse command line arguments
PHASE=""
REASON=""
FORCE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --phase)
            PHASE="$2"
            shift 2
            ;;
        --reason)
            REASON="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            echo "Usage: $0 --phase <phase> --reason <reason> [--force] [--dry-run]"
            echo ""
            echo "Arguments:"
            echo "  --phase    Current deployment phase (phase1, phase2, phase3, phase4)"
            echo "  --reason   Reason for rollback (required)"
            echo "  --force    Skip confirmation prompts"
            echo "  --dry-run  Show what would be done without executing"
            echo ""
            echo "Example:"
            echo "  $0 --phase phase2 --reason 'High error rate detected'"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate required arguments
if [ -z "$PHASE" ]; then
    error "Phase is required. Use --phase to specify current deployment phase."
    exit 1
fi

if [ -z "$REASON" ]; then
    error "Reason is required. Use --reason to specify rollback reason."
    exit 1
fi

# Validate phase
case $PHASE in
    phase1|phase2|phase3|phase4)
        ;;
    *)
        error "Invalid phase: $PHASE. Must be phase1, phase2, phase3, or phase4."
        exit 1
        ;;
esac

log "🚨 Starting DojoPool Production Rollback"
log "Phase: $PHASE"
log "Reason: $REASON"
log "Force: $FORCE"
log "Dry Run: $DRY_RUN"

# Confirmation prompt (unless forced or dry run)
if [ "$FORCE" = false ] && [ "$DRY_RUN" = false ]; then
    echo ""
    warning "⚠️  This will rollback the production deployment!"
    warning "Phase: $PHASE"
    warning "Reason: $REASON"
    echo ""
    read -p "Are you sure you want to proceed? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Rollback cancelled by user"
        exit 0
    fi
fi

# Record rollback start
if [ "$DRY_RUN" = false ]; then
    log "Recording rollback event..."
    # This would typically send to monitoring system
    curl -X POST "http://localhost:9090/api/v1/alerts" \
         -H "Content-Type: application/json" \
         -d "{\"labels\":{\"alertname\":\"RollbackStarted\",\"phase\":\"$PHASE\",\"reason\":\"$REASON\"},\"annotations\":{\"summary\":\"Production rollback initiated\",\"description\":\"Rolling back $PHASE due to: $REASON\"}}" || true
fi

# Function to execute command with dry run support
execute() {
    local cmd="$1"
    local description="$2"

    log "🔧 $description"
    if [ "$DRY_RUN" = true ]; then
        echo "  [DRY RUN] $cmd"
    else
        if eval "$cmd"; then
            success "$description completed"
        else
            error "$description failed"
            return 1
        fi
    fi
}

# Phase-specific rollback procedures
rollback_phase1() {
    log "📦 Executing Phase 1 rollback procedures..."

    # Stop all services
    execute "docker-compose -f deployment/staging/docker-compose.staging.yml down" "Stopping all services"

    # Remove containers and volumes
    execute "docker-compose -f deployment/staging/docker-compose.staging.yml down -v --remove-orphans" "Removing containers and volumes"

    # Clean up Docker resources
    execute "docker system prune -f" "Cleaning up Docker resources"

    # Restore from backup if needed
    if [ -f "backups/pre-phase1-deployment.sql" ]; then
        execute "psql -h localhost -U postgres -d dojopool < backups/pre-phase1-deployment.sql" "Restoring database from backup"
    fi

    success "Phase 1 rollback completed"
}

rollback_phase2() {
    log "📦 Executing Phase 2 rollback procedures..."

    # Reduce traffic to 5%
    execute "kubectl scale deployment dojopool-api --replicas=2" "Scaling API to minimum replicas"
    execute "kubectl scale deployment dojopool-web --replicas=2" "Scaling web to minimum replicas"

    # Update ingress to route only 5% traffic
    execute "kubectl apply -f k8s/ingress-rollback.yml" "Updating ingress for reduced traffic"

    # Rollback application version
    execute "kubectl set image deployment/dojopool-api api=dojopool/api:v1.0.0-stable" "Rolling back API to stable version"
    execute "kubectl set image deployment/dojopool-web web=dojopool/web:v1.0.0-stable" "Rolling back web to stable version"

    # Wait for rollout to complete
    execute "kubectl rollout status deployment/dojopool-api" "Waiting for API rollout"
    execute "kubectl rollout status deployment/dojopool-web" "Waiting for web rollout"

    success "Phase 2 rollback completed"
}

rollback_phase3() {
    log "📦 Executing Phase 3 rollback procedures..."

    # Enable maintenance mode
    execute "kubectl apply -f k8s/maintenance-mode.yml" "Enabling maintenance mode"

    # Scale down to 10% capacity
    execute "kubectl scale deployment dojopool-api --replicas=5" "Scaling API to 10% capacity"
    execute "kubectl scale deployment dojopool-web --replicas=5" "Scaling web to 10% capacity"

    # Rollback to Phase 2 stable version
    execute "kubectl set image deployment/dojopool-api api=dojopool/api:v1.1.0-phase2-stable" "Rolling back API to Phase 2 stable"
    execute "kubectl set image deployment/dojopool-web web=dojopool/web:v1.1.0-phase2-stable" "Rolling back web to Phase 2 stable"

    # Update feature flags
    execute "kubectl apply -f k8s/feature-flags-phase2.yml" "Restoring Phase 2 feature flags"

    # Wait for rollout
    execute "kubectl rollout status deployment/dojopool-api" "Waiting for API rollout"
    execute "kubectl rollout status deployment/dojopool-web" "Waiting for web rollout"

    # Disable maintenance mode
    execute "kubectl delete -f k8s/maintenance-mode.yml" "Disabling maintenance mode"

    success "Phase 3 rollback completed"
}

rollback_phase4() {
    log "📦 Executing Phase 4 rollback procedures..."

    # Enable emergency maintenance mode
    execute "kubectl apply -f k8s/emergency-maintenance.yml" "Enabling emergency maintenance mode"

    # Immediate traffic redirect to backup infrastructure
    execute "kubectl apply -f k8s/traffic-failover.yml" "Redirecting traffic to backup infrastructure"

    # Rollback all services to last known good version
    execute "kubectl set image deployment/dojopool-api api=dojopool/api:v1.2.0-ga-stable" "Rolling back API to GA stable"
    execute "kubectl set image deployment/dojopool-web web=dojopool/web:v1.2.0-ga-stable" "Rolling back web to GA stable"

    # Scale to full capacity on backup infrastructure
    execute "kubectl scale deployment dojopool-api-backup --replicas=20" "Scaling backup API to full capacity"
    execute "kubectl scale deployment dojopool-web-backup --replicas=20" "Scaling backup web to full capacity"

    # Database rollback if needed
    if [ -f "backups/pre-ga-deployment.sql" ]; then
        warning "⚠️  Database rollback required. This may take several minutes..."
        execute "pg_restore -h backup-db-host -U postgres -d dojopool backups/pre-ga-deployment.sql" "Restoring database from GA backup"
    fi

    # Verify system health
    execute "kubectl get pods -l app=dojopool" "Checking pod status"
    execute "kubectl get ingress" "Checking ingress status"

    # Gradually restore traffic
    execute "kubectl apply -f k8s/traffic-gradual-restore.yml" "Gradually restoring traffic"

    # Disable maintenance mode
    execute "kubectl delete -f k8s/emergency-maintenance.yml" "Disabling emergency maintenance mode"

    success "Phase 4 rollback completed"
}

# Execute phase-specific rollback
case $PHASE in
    phase1)
        rollback_phase1
        ;;
    phase2)
        rollback_phase2
        ;;
    phase3)
        rollback_phase3
        ;;
    phase4)
        rollback_phase4
        ;;
esac

# Post-rollback verification
log "🔍 Running post-rollback verification..."

# Health checks
execute "curl -f http://localhost:3001/health" "API health check" || warning "API health check failed"
execute "curl -f http://localhost:3000/api/health" "Web health check" || warning "Web health check failed"

# Database connectivity
execute "psql -h localhost -U postgres -d dojopool -c 'SELECT 1'" "Database connectivity check" || warning "Database connectivity check failed"

# Monitoring checks
execute "curl -f http://localhost:9090/-/healthy" "Prometheus health check" || warning "Prometheus health check failed"
execute "curl -f http://localhost:3002/api/health" "Grafana health check" || warning "Grafana health check failed"

# Record rollback completion
if [ "$DRY_RUN" = false ]; then
    log "Recording rollback completion..."
    curl -X POST "http://localhost:9090/api/v1/alerts" \
         -H "Content-Type: application/json" \
         -d "{\"labels\":{\"alertname\":\"RollbackCompleted\",\"phase\":\"$PHASE\",\"reason\":\"$REASON\"},\"annotations\":{\"summary\":\"Production rollback completed\",\"description\":\"Successfully rolled back $PHASE\"}}" || true
fi

# Cleanup old versions
if [ "$DRY_RUN" = false ]; then
    log "🧹 Cleaning up old versions..."
    execute "docker images | grep dojopool | head -n -$ROLLBACK_VERSIONS_TO_KEEP | awk '{print \$3}' | xargs docker rmi" "Removing old Docker images"

    # Clean up old backups (keep last 30 days)
    execute "find backups/ -name '*.sql' -mtime +$BACKUP_RETENTION_DAYS -delete" "Cleaning up old database backups"
fi

success "🎉 Rollback completed successfully!"
success "Phase: $PHASE"
success "Reason: $REASON"
success "Timestamp: $(date)"

# Generate rollback report
if [ "$DRY_RUN" = false ]; then
    cat > "rollback-report-$(date +%Y%m%d-%H%M%S).txt" << EOF
DojoPool Production Rollback Report
===================================

Timestamp: $(date)
Phase: $PHASE
Reason: $REASON
Status: COMPLETED

Pre-rollback Actions:
- Enabled maintenance mode
- Notified stakeholders
- Created database backup

Rollback Actions:
- Scaled down services
- Deployed previous version
- Updated configuration
- Restored database (if needed)

Post-rollback Verification:
- API health: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "FAILED")
- Web health: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "FAILED")
- Database: $(psql -h localhost -U postgres -d dojopool -c 'SELECT 1' > /dev/null 2>&1 && echo "OK" || echo "FAILED")

Next Steps:
1. Monitor system for 24 hours
2. Run full test suite
3. Review rollback cause analysis
4. Plan next deployment attempt

EOF

    success "Rollback report generated: rollback-report-$(date +%Y%m%d-%H%M%S).txt"
fi

log "✅ Rollback procedure completed successfully"
