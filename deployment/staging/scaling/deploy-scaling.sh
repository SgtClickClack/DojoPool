#!/bin/bash

# DojoPool Infrastructure Scaling Deployment Script
# This script deploys all scaling configurations to the staging environment

set -e

NAMESPACE="staging"
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

    log_success "Prerequisites check passed"
}

# Deploy HPA configurations
deploy_hpa() {
    log_info "Deploying Horizontal Pod Autoscalers..."

    if [ -f "$SCRIPT_DIR/hpa-configs.yaml" ]; then
        kubectl apply -f "$SCRIPT_DIR/hpa-configs.yaml" -n "$NAMESPACE"
        log_success "HPA configurations deployed"
    else
        log_error "HPA configuration file not found: $SCRIPT_DIR/hpa-configs.yaml"
        return 1
    fi
}

# Deploy database scaling
deploy_database_scaling() {
    log_info "Deploying database scaling configurations..."

    if [ -f "$SCRIPT_DIR/database-scaling.yaml" ]; then
        kubectl apply -f "$SCRIPT_DIR/database-scaling.yaml" -n "$NAMESPACE"
        log_success "Database scaling configurations deployed"
    else
        log_error "Database scaling configuration file not found"
        return 1
    fi
}

# Deploy connection pooling
deploy_pgbouncer() {
    log_info "Deploying PgBouncer connection pooling..."

    if [ -f "$SCRIPT_DIR/pgbouncer-config.yaml" ]; then
        kubectl apply -f "$SCRIPT_DIR/pgbouncer-config.yaml" -n "$NAMESPACE"
        log_success "PgBouncer configuration deployed"
    else
        log_error "PgBouncer configuration file not found"
        return 1
    fi
}

# Deploy cost optimization
deploy_cost_optimization() {
    log_info "Deploying cost optimization configurations..."

    if [ -f "$SCRIPT_DIR/cost-optimization.yaml" ]; then
        kubectl apply -f "$SCRIPT_DIR/cost-optimization.yaml" -n "$NAMESPACE"
        log_success "Cost optimization configurations deployed"
    else
        log_error "Cost optimization configuration file not found"
        return 1
    fi
}

# Deploy performance baseline
deploy_performance_baseline() {
    log_info "Deploying performance baseline monitoring..."

    if [ -f "$SCRIPT_DIR/performance-baseline.yaml" ]; then
        kubectl apply -f "$SCRIPT_DIR/performance-baseline.yaml" -n "$NAMESPACE"
        log_success "Performance baseline monitoring deployed"
    else
        log_error "Performance baseline configuration file not found"
        return 1
    fi
}

# Deploy scaling alerts
deploy_scaling_alerts() {
    log_info "Deploying scaling alerts..."

    if [ -f "$SCRIPT_DIR/scaling-alerts.yaml" ]; then
        # This would typically be applied to the monitoring stack
        log_info "Scaling alerts configuration ready for PrometheusRule"
        log_success "Scaling alerts configuration prepared"
    else
        log_error "Scaling alerts configuration file not found"
        return 1
    fi
}

# Wait for deployments to be ready
wait_for_deployments() {
    log_info "Waiting for deployments to be ready..."

    local deployments=(
        "dojopool-cost-optimizer"
        "dojopool-performance-monitor"
        "dojopool-pgbouncer"
    )

    for deployment in "${deployments[@]}"; do
        log_info "Waiting for deployment: $deployment"

        # Wait for rollout to complete
        if kubectl rollout status deployment/"$deployment" -n "$NAMESPACE" --timeout=300s; then
            log_success "Deployment $deployment is ready"
        else
            log_error "Deployment $deployment failed to become ready"
            return 1
        fi
    done

    # Wait for StatefulSets
    if kubectl get statefulset dojopool-postgres-replica -n "$NAMESPACE" &> /dev/null; then
        log_info "Waiting for PostgreSQL replica StatefulSet..."
        if kubectl rollout status statefulset/dojopool-postgres-replica -n "$NAMESPACE" --timeout=600s; then
            log_success "PostgreSQL replica is ready"
        else
            log_error "PostgreSQL replica failed to become ready"
            return 1
        fi
    fi
}

# Verify deployment
verify_deployment() {
    log_info "Verifying scaling deployment..."

    # Check HPA status
    log_info "Checking HPA status..."
    kubectl get hpa -n "$NAMESPACE"

    # Check pod status
    log_info "Checking pod status..."
    kubectl get pods -n "$NAMESPACE" -l "app in (dojopool-cost-optimizer,dojopool-performance-monitor,dojopool-pgbouncer)"

    # Check services
    log_info "Checking service status..."
    kubectl get svc -n "$NAMESPACE" -l "app in (dojopool-pgbouncer)"

    log_success "Scaling deployment verification complete"
}

# Show post-deployment instructions
show_post_deployment_info() {
    echo
    log_success "Infrastructure scaling deployment completed!"
    echo
    echo "Next steps:"
    echo "1. Monitor HPA scaling behavior:"
    echo "   kubectl get hpa -n $NAMESPACE -w"
    echo
    echo "2. Check scaling metrics:"
    echo "   kubectl top pods -n $NAMESPACE"
    echo
    echo "3. View cost optimization recommendations:"
    echo "   kubectl logs -f deployment/dojopool-cost-optimizer -n $NAMESPACE"
    echo
    echo "4. Monitor performance baselines:"
    echo "   kubectl logs -f deployment/dojopool-performance-monitor -n $NAMESPACE"
    echo
    echo "5. Run load tests:"
    echo "   k6 run $SCRIPT_DIR/load-test-scenarios.js"
    echo
    echo "For Grafana dashboards:"
    echo "   HPA Metrics: http://grafana-url/d/hpa-metrics"
    echo "   Cost Analysis: http://grafana-url/d/cost-analysis"
    echo "   Performance Baseline: http://grafana-url/d/performance-baseline"
}

# Main deployment function
main() {
    log_info "Starting DojoPool Infrastructure Scaling Deployment"
    log_info "Namespace: $NAMESPACE"
    log_info "Script Directory: $SCRIPT_DIR"
    log_info "Project Root: $PROJECT_ROOT"

    # Run deployment steps
    check_prerequisites
    deploy_hpa
    deploy_database_scaling
    deploy_pgbouncer
    deploy_cost_optimization
    deploy_performance_baseline
    deploy_scaling_alerts
    wait_for_deployments
    verify_deployment

    show_post_deployment_info

    log_success "Infrastructure scaling deployment completed successfully!"
}

# Handle command line arguments
case "${1:-}" in
    "hpa-only")
        log_info "Deploying HPA configurations only..."
        check_prerequisites
        deploy_hpa
        verify_deployment
        ;;
    "database-only")
        log_info "Deploying database scaling only..."
        check_prerequisites
        deploy_database_scaling
        deploy_pgbouncer
        wait_for_deployments
        verify_deployment
        ;;
    "verify")
        log_info "Verifying current scaling deployment..."
        check_prerequisites
        verify_deployment
        ;;
    *)
        main
        ;;
esac
