#!/bin/bash

# DojoPool Maintenance System Deployment Script
# This script deploys the complete maintenance and security framework

set -e

NAMESPACE="default"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi

    # Check if we're connected to a Kubernetes cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Not connected to a Kubernetes cluster"
        exit 1
    fi

    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace '$NAMESPACE' does not exist. Creating it..."
        kubectl create namespace "$NAMESPACE"
    fi

    # Check for required tools
    if ! command -v aws &> /dev/null; then
        log_warning "AWS CLI not found. Some backup features may not work."
    fi

    log_success "Prerequisites check passed"
}

# Deploy maintenance schedules
deploy_maintenance_schedules() {
    log_info "Deploying maintenance schedules..."

    if [ -f "$SCRIPT_DIR/maintenance-schedule.yaml" ]; then
        kubectl apply -f "$SCRIPT_DIR/maintenance-schedule.yaml" -n "$NAMESPACE"
        log_success "Maintenance schedules deployed"
    else
        log_error "Maintenance schedule file not found"
        exit 1
    fi
}

# Deploy security policies
deploy_security_policies() {
    log_info "Deploying security policies..."

    if [ -f "$SCRIPT_DIR/security-policy.yaml" ]; then
        kubectl apply -f "$SCRIPT_DIR/security-policy.yaml" -n "$NAMESPACE"
        log_success "Security policies deployed"
    else
        log_error "Security policy file not found"
        exit 1
    fi
}

# Deploy corrective maintenance procedures
deploy_corrective_maintenance() {
    log_info "Deploying corrective maintenance procedures..."

    if [ -f "$SCRIPT_DIR/corrective-maintenance.yaml" ]; then
        kubectl apply -f "$SCRIPT_DIR/corrective-maintenance.yaml" -n "$NAMESPACE"
        log_success "Corrective maintenance procedures deployed"
    else
        log_error "Corrective maintenance file not found"
        exit 1
    fi
}

# Deploy operational excellence framework
deploy_operational_excellence() {
    log_info "Deploying operational excellence framework..."

    if [ -f "$SCRIPT_DIR/operational-excellence.yaml" ]; then
        kubectl apply -f "$SCRIPT_DIR/operational-excellence.yaml" -n "$NAMESPACE"
        log_success "Operational excellence framework deployed"
    else
        log_error "Operational excellence file not found"
        exit 1
    fi
}

# Deploy automated maintenance
deploy_automated_maintenance() {
    log_info "Deploying automated maintenance system..."

    if [ -f "$SCRIPT_DIR/automated-maintenance.yaml" ]; then
        kubectl apply -f "$SCRIPT_DIR/automated-maintenance.yaml" -n "$NAMESPACE"
        log_success "Automated maintenance system deployed"
    else
        log_error "Automated maintenance file not found"
        exit 1
    fi
}

# Create required secrets
create_maintenance_secrets() {
    log_info "Creating maintenance secrets..."

    # Create backup credentials secret
    if ! kubectl get secret dojopool-backup-secret -n "$NAMESPACE" &> /dev/null; then
        kubectl create secret generic dojopool-backup-secret \
            --from-literal=aws-access-key-id="${AWS_ACCESS_KEY_ID:-placeholder}" \
            --from-literal=aws-secret-access-key="${AWS_SECRET_ACCESS_KEY:-placeholder}" \
            -n "$NAMESPACE"
        log_success "Backup credentials secret created"
    else
        log_info "Backup credentials secret already exists"
    fi

    # Create Slack webhook secret for alerts
    if ! kubectl get secret dojopool-alerts-secret -n "$NAMESPACE" &> /dev/null; then
        kubectl create secret generic dojopool-alerts-secret \
            --from-literal=slack-webhook="${SLACK_WEBHOOK_URL:-placeholder}" \
            --from-literal=email-smtp-password="${SMTP_PASSWORD:-placeholder}" \
            -n "$NAMESPACE"
        log_success "Alert credentials secret created"
    else
        log_info "Alert credentials secret already exists"
    fi
}

# Wait for deployments to be ready
wait_for_maintenance_system() {
    log_info "Waiting for maintenance system to be ready..."

    # Wait for CronJobs to be created
    sleep 10

    # Check CronJob status
    local cronjobs=("dojopool-daily-maintenance" "dojopool-weekly-maintenance" "dojopool-security-scan" "dojopool-backup-verification")

    for cronjob in "${cronjobs[@]}"; do
        if kubectl get cronjob "$cronjob" -n "$NAMESPACE" &> /dev/null; then
            log_success "CronJob $cronjob is ready"
        else
            log_warning "CronJob $cronjob not found - may be created by automation"
        fi
    done

    # Check ConfigMaps
    local configmaps=("dojopool-maintenance-schedule" "dojopool-security-policy" "dojopool-corrective-maintenance" "dojopool-operational-excellence")

    for configmap in "${configmaps[@]}"; do
        if kubectl get configmap "$configmap" -n "$NAMESPACE" &> /dev/null; then
            log_success "ConfigMap $configmap is ready"
        else
            log_error "ConfigMap $configmap not found"
            return 1
        fi
    done

    log_success "Maintenance system verification complete"
}

# Show post-deployment instructions
show_post_deployment_info() {
    echo
    log_success "Maintenance and Security System Deployment Complete!"
    echo
    echo "🔧 **Maintenance System Overview:**"
    echo
    echo "📅 **Scheduled Maintenance Windows:**"
    echo "   • Primary: Every Monday 2:00 AM UTC (4h window)"
    echo "   • Security: Immediate for critical patches"
    echo "   • Database: Every Sunday 3:00 AM UTC (6h window)"
    echo "   • Infrastructure: Monthly 1st day 1:00 AM UTC (8h window)"
    echo
    echo "🔄 **Automated Maintenance Jobs:**"
    echo "   • Daily maintenance: Database vacuum, cache cleanup, log rotation"
    echo "   • Weekly maintenance: Deep database maintenance, dependency updates"
    echo "   • Security scans: Every 6 hours with vulnerability detection"
    echo "   • Backup verification: Daily integrity checks"
    echo
    echo "📊 **Monitoring Commands:**"
    echo "   • View active maintenance: kubectl get cronjob -n $NAMESPACE"
    echo "   • Check maintenance logs: kubectl logs -f deployment/dojopool-maintenance-runner -n $NAMESPACE"
    echo "   • View security reports: kubectl get pvc dojopool-security-reports-pvc -n $NAMESPACE"
    echo "   • Monitor backup status: kubectl get cronjob dojopool-backup-verification -n $NAMESPACE"
    echo
    echo "🚨 **Alert Configuration:**"
    echo "   • Update Slack webhook: kubectl edit secret dojopool-alerts-secret -n $NAMESPACE"
    echo "   • Configure email alerts: Update SMTP settings in maintenance configs"
    echo "   • Customize alert thresholds: Edit ConfigMaps as needed"
    echo
    echo "🔐 **Security Notes:**"
    echo "   • Configure AWS credentials for backup operations"
    echo "   • Update vulnerability scan schedules as needed"
    echo "   • Review and update security policies quarterly"
    echo
    echo "📋 **Next Steps:**"
    echo "   1. Configure monitoring alerts and notification channels"
    echo "   2. Test backup and restore procedures"
    echo "   3. Schedule quarterly disaster recovery drills"
    echo "   4. Review and update maintenance procedures regularly"
    echo "   5. Monitor maintenance effectiveness and adjust schedules as needed"
    echo
    echo "For detailed documentation, see the ConfigMaps in namespace '$NAMESPACE'"
}

# Main deployment function
main() {
    log_info "Starting DojoPool Maintenance & Security System Deployment"
    log_info "Namespace: $NAMESPACE"
    log_info "Script Directory: $SCRIPT_DIR"
    log_info "Project Root: $PROJECT_ROOT"

    # Run deployment steps
    check_prerequisites
    deploy_maintenance_schedules
    deploy_security_policies
    deploy_corrective_maintenance
    deploy_operational_excellence
    deploy_automated_maintenance
    create_maintenance_secrets
    wait_for_maintenance_system

    show_post_deployment_info

    log_success "Maintenance and Security System deployment completed successfully!"
}

# Handle command line arguments
case "${1:-}" in
    "maintenance-only")
        log_info "Deploying maintenance schedules only..."
        check_prerequisites
        deploy_maintenance_schedules
        deploy_automated_maintenance
        wait_for_maintenance_system
        ;;
    "security-only")
        log_info "Deploying security policies only..."
        check_prerequisites
        deploy_security_policies
        create_maintenance_secrets
        ;;
    "verify")
        log_info "Verifying current maintenance deployment..."
        check_prerequisites
        wait_for_maintenance_system
        ;;
    *)
        main
        ;;
esac
