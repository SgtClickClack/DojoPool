#!/bin/bash

# DojoPool Chaos Testing Runner
# This script orchestrates chaos testing for DojoPool in various environments

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHAOS_SCRIPT="$PROJECT_ROOT/services/api/scripts/chaos-testing-suite.js"

# Default values
INTENSITY="${CHAOS_INTENSITY:-medium}"
EXPERIMENTS="${CHAOS_EXPERIMENTS:-all}"
DURATION="${CHAOS_DURATION:-300}"
ENVIRONMENT="${CHAOS_ENVIRONMENT:-docker}"

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

# Show usage
show_usage() {
    cat << EOF
DojoPool Chaos Testing Runner

Usage: $0 [OPTIONS] [EXPERIMENTS]

EXPERIMENTS:
  database-failover     Test database failover scenarios
  network-latency       Test network latency handling
  job-queue-failure     Test job queue resilience
  dns-outage           Test DNS outage scenarios
  regional-outage      Test regional outage recovery
  load-spike           Test high load scenarios
  all                  Run all experiments (default)

OPTIONS:
  -i, --intensity LEVEL    Set chaos intensity: low, medium, high (default: medium)
  -d, --duration SECONDS   Set test duration in seconds (default: 300)
  -e, --environment ENV    Set environment: local, docker, ci (default: docker)
  -v, --verbose           Enable verbose output
  -h, --help             Show this help message

ENVIRONMENTS:
  local     Run against local services (requires running API server)
  docker    Run against Docker Compose environment (default)
  ci        Run in CI/CD environment

EXAMPLES:
  $0 --intensity high --duration 600 all
  $0 -i low -d 120 database-failover network-latency
  $0 --environment local --verbose database-failover

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -i|--intensity)
                INTENSITY="$2"
                shift 2
                ;;
            -d|--duration)
                DURATION="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            database-failover|network-latency|job-queue-failure|dns-outage|regional-outage|load-spike|all)
                EXPERIMENTS="$1"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Validate environment
validate_environment() {
    log_info "Validating environment: $ENVIRONMENT"

    case $ENVIRONMENT in
        local)
            # Check if local services are running
            if ! curl -s http://localhost:3002/api/v1/health > /dev/null 2>&1; then
                log_error "API server not running on localhost:3002"
                log_info "Start the API server first: cd services/api && yarn start:dev"
                exit 1
            fi

            if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
                log_error "PostgreSQL not running on localhost:5432"
                exit 1
            fi

            if ! redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
                log_error "Redis not running on localhost:6379"
                exit 1
            fi
            ;;

        docker)
            # Check if Docker is available
            if ! command -v docker &> /dev/null; then
                log_error "Docker is not installed or not in PATH"
                exit 1
            fi

            if ! command -v docker-compose &> /dev/null; then
                log_error "Docker Compose is not installed or not in PATH"
                exit 1
            fi
            ;;

        ci)
            # CI environment validation
            if [ -z "$CI" ] && [ -z "$GITHUB_ACTIONS" ]; then
                log_warning "CI environment not detected, but --environment ci was specified"
            fi
            ;;
    esac

    log_success "Environment validation passed"
}

# Setup Docker environment
setup_docker_environment() {
    log_info "Setting up Docker environment for chaos testing..."

    cd "$PROJECT_ROOT"

    # Start the chaos testing environment
    log_info "Starting Docker Compose environment..."
    docker-compose -f docker-compose.chaos.yml up -d

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts..."

        # Check API health
        if curl -s http://localhost:3002/api/v1/health > /dev/null 2>&1; then
            log_success "All services are healthy!"
            return 0
        fi

        sleep 10
        ((attempt++))
    done

    log_error "Services failed to become healthy after $max_attempts attempts"
    docker-compose -f docker-compose.chaos.yml logs
    exit 1
}

# Cleanup Docker environment
cleanup_docker_environment() {
    log_info "Cleaning up Docker environment..."

    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.chaos.yml down -v

    log_success "Docker environment cleaned up"
}

# Run chaos tests
run_chaos_tests() {
    log_info "Starting chaos testing suite..."
    log_info "Configuration:"
    log_info "  Intensity: $INTENSITY"
    log_info "  Experiments: $EXPERIMENTS"
    log_info "  Duration: $DURATION seconds"
    log_info "  Environment: $ENVIRONMENT"

    local node_cmd="node"
    local script_args="--$EXPERIMENTS --intensity=$INTENSITY --duration=$DURATION"

    if [ "$VERBOSE" = true ]; then
        script_args="$script_args --verbose"
    fi

    case $ENVIRONMENT in
        local)
            cd "$PROJECT_ROOT/services/api"
            $node_cmd scripts/chaos-testing-suite.js $script_args
            ;;

        docker)
            # Run chaos tests against Docker environment
            cd "$PROJECT_ROOT"

            # Set environment variables for Docker
            export API_BASE_URL="http://localhost:3002"

            # Run the chaos test script
            $node_cmd services/api/scripts/chaos-testing-suite.js $script_args
            ;;

        ci)
            # CI environment - assume services are already running
            cd "$PROJECT_ROOT/services/api"

            # Set CI-specific environment variables
            export API_BASE_URL="${API_BASE_URL:-http://localhost:3002}"
            export NODE_ENV="${NODE_ENV:-test}"

            $node_cmd scripts/chaos-testing-suite.js $script_args
            ;;
    esac
}

# Generate test report
generate_report() {
    local exit_code=$1

    log_info "Generating chaos testing report..."

    # Find the latest results file
    local results_file
    results_file=$(find "$PROJECT_ROOT" -name "chaos-testing-results-*.json" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

    if [ -n "$results_file" ] && [ -f "$results_file" ]; then
        log_info "Results file: $results_file"

        # Extract key metrics
        local total_time experiments_passed experiments_failed overall_success

        total_time=$(jq -r '.totalTime // "N/A"' "$results_file" 2>/dev/null || echo "N/A")
        experiments_passed=$(jq -r '.experiments | map(select(.success == true)) | length' "$results_file" 2>/dev/null || echo "N/A")
        experiments_failed=$(jq -r '.experiments | map(select(.success == false)) | length' "$results_file" 2>/dev/null || echo "N/A")
        overall_success=$(jq -r '.overallSuccess // false' "$results_file" 2>/dev/null || echo "false")

        echo ""
        echo "========================================"
        echo "      CHAOS TESTING RESULTS"
        echo "========================================"
        echo "Total Duration: $total_time seconds"
        echo "Tests Passed:   $experiments_passed"
        echo "Tests Failed:   $experiments_failed"
        echo "Overall Status: $([ "$overall_success" = "true" ] && echo "PASSED ✅" || echo "FAILED ❌")"
        echo "========================================"

        if [ "$exit_code" -eq 0 ]; then
            log_success "Chaos testing completed successfully!"
        else
            log_error "Chaos testing failed!"
        fi
    else
        log_warning "No results file found"
    fi
}

# Main execution
main() {
    # Set trap for cleanup
    trap 'cleanup_docker_environment' EXIT

    log_info "🧪 DojoPool Chaos Testing Runner"
    log_info "=================================="

    # Parse arguments
    parse_args "$@"

    # Validate environment
    validate_environment

    # Setup environment if needed
    if [ "$ENVIRONMENT" = "docker" ]; then
        setup_docker_environment
    fi

    # Run chaos tests
    local start_time
    start_time=$(date +%s)

    if run_chaos_tests; then
        local exit_code=0
    else
        local exit_code=$?
    fi

    local end_time
    end_time=$(date +%s)

    log_info "Chaos testing completed in $((end_time - start_time)) seconds"

    # Generate report
    generate_report "$exit_code"

    exit "$exit_code"
}

# Run main function with all arguments
main "$@"
