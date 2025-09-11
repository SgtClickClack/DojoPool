# CI/CD Chaos Testing Integration Guide

## Overview

This guide explains how to integrate DojoPool's chaos testing framework into your CI/CD pipeline for continuous validation of system resilience.

## 🚀 Quick Start

### Option 1: GitHub Actions (Recommended)

The chaos testing workflow is already configured in `.github/workflows/chaos-testing.yml`. To enable it:

1. **Manual Trigger**: Go to GitHub Actions → "Chaos Testing Suite" → "Run workflow"
2. **Automatic Scheduling**: The workflow runs weekly on Sundays at 3 AM UTC
3. **PR Integration**: Automatically runs on PRs that modify chaos-testing files

### Option 2: Local Development

```bash
# Run all chaos experiments with medium intensity
./scripts/run-chaos-tests.sh --intensity medium --duration 300 all

# Run specific experiments
./scripts/run-chaos-tests.sh database-failover network-latency

# Run with Docker environment
./scripts/run-chaos-tests.sh --environment docker --verbose all
```

### Option 3: Docker Compose

```bash
# Start chaos testing environment
docker-compose -f docker-compose.chaos.yml up -d

# Run chaos tests
docker-compose -f docker-compose.chaos.yml run --rm chaos-orchestrator

# View logs
docker-compose -f docker-compose.chaos.yml logs -f

# Cleanup
docker-compose -f docker-compose.chaos.yml down -v
```

## 📋 Pipeline Integration

### GitHub Actions Integration

Add to your existing workflow:

```yaml
# In your main CI workflow
- name: Run Chaos Testing
  uses: ./.github/workflows/chaos-testing.yml
  with:
    intensity: 'medium'
    experiments: 'all'
    duration: '300'
```

### Jenkins Integration

```groovy
pipeline {
    agent any

    stages {
        stage('Chaos Testing') {
            steps {
                script {
                    // Start chaos environment
                    sh 'docker-compose -f docker-compose.chaos.yml up -d'

                    // Wait for services
                    sh 'timeout 300 bash -c "until curl -f http://localhost:3002/api/v1/health; do sleep 10; done"'

                    // Run chaos tests
                    sh '''
                        cd services/api
                        node scripts/chaos-testing-suite.js --all --intensity=medium --duration=300 --verbose
                    '''
                }
            }
            post {
                always {
                    // Collect results
                    archiveArtifacts artifacts: 'chaos-testing-results-*.json', allowEmptyArchive: true

                    // Cleanup
                    sh 'docker-compose -f docker-compose.chaos.yml down -v'
                }
                failure {
                    // Notify on failure
                    slackSend channel: '#alerts',
                              message: "Chaos testing failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
                }
            }
        }
    }
}
```

### GitLab CI Integration

```yaml
stages:
  - test
  - chaos

chaos_testing:
  stage: chaos
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker-compose -f docker-compose.chaos.yml up -d
    - timeout 300 bash -c 'until curl -f http://localhost:3002/api/v1/health; do sleep 10; done'
    - cd services/api && node scripts/chaos-testing-suite.js --all --intensity=medium --duration=300
  artifacts:
    reports:
      junit: chaos-testing-results-*.json
    expire_in: 1 week
  only:
    - merge_requests
    - schedules # For scheduled chaos testing
```

## 🎛️ Configuration Options

### Chaos Testing Parameters

| Parameter     | Description              | Values                    | Default  |
| ------------- | ------------------------ | ------------------------- | -------- |
| `intensity`   | Failure intensity level  | `low`, `medium`, `high`   | `medium` |
| `experiments` | Which experiments to run | See experiment list below | `all`    |
| `duration`    | Test duration in seconds | `60`-`3600`               | `300`    |
| `environment` | Target environment       | `local`, `docker`, `ci`   | `docker` |

### Available Experiments

- `database-failover`: Multi-region database failover testing
- `network-latency`: Network latency and performance testing
- `job-queue-failure`: BullMQ job queue resilience testing
- `dns-outage`: DNS resolution failure testing
- `regional-outage`: Complete regional outage recovery
- `load-spike`: High traffic load testing
- `all`: Run all experiments

### Environment Variables

```bash
# API Configuration
API_BASE_URL=http://localhost:3002
NODE_ENV=test

# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/dojopool
REDIS_URL=redis://localhost:6379

# Chaos Testing Configuration
CHAOS_INTENSITY=medium
CHAOS_EXPERIMENTS=all
CHAOS_DURATION=300
```

## 🔧 Advanced Configuration

### Custom Docker Environment

Modify `docker-compose.chaos.yml` for your specific needs:

```yaml
# Add custom monitoring
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    ports:
      - '3001:3000'
```

### Multi-Region Testing

For production-like multi-region testing:

```yaml
# Use actual cloud databases
environment:
  DATABASE_URL_US_EAST: postgresql://host:port/db?sslmode=require
  DATABASE_URL_EU_WEST: postgresql://host:port/db?sslmode=require
  DATABASE_URL_ASIA_PACIFIC: postgresql://host:port/db?sslmode=require
```

### Custom Health Checks

Add custom health checks in `docker-compose.chaos.yml`:

```yaml
services:
  api:
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3002/api/v1/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

## 📊 Results and Reporting

### Automatic Reporting

The chaos testing framework automatically generates:

- **JSON Results**: `chaos-testing-results-YYYY-MM-DD.json`
- **GitHub Actions Summary**: Inline results in workflow runs
- **Artifact Storage**: Results stored for 30 days

### Slack Integration

Configure Slack notifications:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3.15.0
  with:
    status: ${{ job.status }}
    custom_payload: |
      {
        "attachments": [{
          "color": "${{ job.status == 'success' && 'good' || 'danger' }}",
          "title": "Chaos Testing ${{ job.status == 'success' && 'PASSED ✅' || 'FAILED ❌' }}",
          "fields": [
            {"title": "Intensity", "value": "${{ github.event.inputs.intensity }}", "short": true},
            {"title": "Duration", "value": "${{ github.event.inputs.duration }}s", "short": true}
          ]
        }]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Dashboard Integration

Send results to monitoring dashboards:

```bash
# Send to DataDog
curl -X POST "https://api.datadoghq.com/api/v1/series" \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -d @chaos-testing-results.json
```

## 🚨 Failure Handling

### Pipeline Failure Strategy

```yaml
# Allow chaos test failures in development
chaos_testing:
  continue-on-error: ${{ github.ref != 'refs/heads/main' }}

# Block production deployment on chaos test failure
deploy_production:
  needs: chaos_testing
  if: needs.chaos_testing.result == 'success'
```

### Alert Thresholds

Configure alerts for different scenarios:

```yaml
# Alert on any chaos test failure
- name: Alert on Chaos Failure
  if: failure() && contains(github.event_name, 'schedule')
  run: |
    echo "🚨 Chaos testing failed on scheduled run" >> $GITHUB_STEP_SUMMARY

# Alert on performance degradation
- name: Performance Alert
  if: steps.chaos-test.outputs.performance_degraded == 'true'
  run: |
    echo "⚠️ Performance degradation detected" >> $GITHUB_STEP_SUMMARY
```

## 🔒 Security Considerations

### Safe Chaos Testing

1. **Isolated Environment**: Run chaos tests in dedicated environments
2. **Resource Limits**: Set CPU and memory limits for test containers
3. **Timeout Protection**: Always set reasonable timeouts
4. **Rollback Capability**: Ensure easy rollback if tests cause issues

### Production Safety

```yaml
# Never run destructive chaos tests against production
- name: Safety Check
  if: github.ref == 'refs/heads/main'
  run: |
    if [[ "$CHAOS_INTENSITY" == "high" ]]; then
      echo "❌ High-intensity chaos testing not allowed on main branch"
      exit 1
    fi
```

## 📈 Best Practices

### Frequency Guidelines

- **Development**: Run on every PR that affects core services
- **Staging**: Run daily with medium intensity
- **Production**: Run weekly with low intensity during maintenance windows

### Intensity Levels

- **Low**: Safe for production, minimal disruption
- **Medium**: Good for staging, tests resilience without major disruption
- **High**: Development only, tests extreme failure scenarios

### Monitoring Integration

```yaml
# Integrate with existing monitoring
- name: Send Metrics to Monitoring
  if: always()
  run: |
    # Send results to your monitoring system
    ./scripts/send-chaos-metrics.sh chaos-testing-results-*.json
```

## 🐛 Troubleshooting

### Common Issues

1. **Services not healthy**: Increase `start_period` in health checks
2. **Network connectivity**: Check Docker network configuration
3. **Permission issues**: Ensure proper file permissions for result storage
4. **Resource exhaustion**: Monitor container resource usage

### Debug Mode

```bash
# Run with maximum verbosity
./scripts/run-chaos-tests.sh --verbose --environment docker --intensity low database-failover

# Check Docker logs
docker-compose -f docker-compose.chaos.yml logs -f api

# Manual health check
curl -v http://localhost:3002/api/v1/health
```

## 🎯 Success Metrics

### Key Performance Indicators

- **Mean Time to Recovery (MTTR)**: < 5 minutes for regional failover
- **Service Availability**: > 99.9% during chaos testing
- **Performance Degradation**: < 20% under network latency
- **Test Coverage**: All critical failure scenarios covered

### Continuous Improvement

- Track chaos test results over time
- Identify patterns in failure scenarios
- Update tests as system architecture evolves
- Share learnings across the team

## 📞 Support

For questions about chaos testing integration:

1. Check the [Chaos Testing Framework Documentation](./services/api/scripts/chaos-testing-suite.js)
2. Review [Milestones](./milestones/README.md)
3. Create an issue in the repository

---

_This guide is continuously updated as the chaos testing framework evolves. Last updated: $(date)_
