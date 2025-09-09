# Incident Response Playbook: API High Error Rate

## Alert Details

- **Alert Name**: DojoPoolAPIHighErrorRate
- **Severity**: Critical
- **Threshold**: >5% error rate for 5 minutes
- **Team**: Backend Engineering

## Overview

This alert indicates that the DojoPool API is experiencing a high error rate, which may indicate service degradation, database issues, or application problems.

## Initial Assessment (0-5 minutes)

### Step 1: Confirm the Alert

1. Check the alert details in PagerDuty/Slack
2. Verify the error rate in Grafana dashboard
3. Identify affected endpoints using:
   ```bash
   # Check error distribution by endpoint
   kubectl logs -n production deployment/dojopool-api --tail=1000 | grep "ERROR\|500\|502\|503"
   ```

### Step 2: Quick Health Check

1. Check API service status:

   ```bash
   kubectl get pods -n production -l app=dojopool-api
   kubectl describe pod -n production -l app=dojopool-api
   ```

2. Check recent deployments:

   ```bash
   kubectl rollout history deployment/dojopool-api -n production
   ```

3. Check resource usage:
   ```bash
   kubectl top pods -n production -l app=dojopool-api
   ```

## Investigation (5-15 minutes)

### Step 3: Analyze Logs

1. Check application logs for error patterns:

   ```bash
   # Get recent error logs
   kubectl logs -n production deployment/dojopool-api --tail=1000 --since=10m | grep -i error

   # Check specific error types
   kubectl logs -n production deployment/dojopool-api --tail=1000 | grep "500\|502\|503"
   ```

2. Check for common error patterns:
   - Database connection errors
   - Authentication failures
   - Rate limiting issues
   - External service failures (Gemini API, Mapbox, etc.)

### Step 4: Check Dependencies

1. Database connectivity:

   ```bash
   # Check database pod status
   kubectl get pods -n production -l app=postgresql
   kubectl logs -n production -l app=postgresql --tail=100

   # Test database connection from API pod
   kubectl exec -n production deployment/dojopool-api -- nc -zv dojopool-postgresql 5432
   ```

2. Redis cache:

   ```bash
   kubectl get pods -n production -l app=redis
   kubectl exec -n production deployment/dojopool-api -- nc -zv dojopool-redis 6379
   ```

3. External services:
   - Check Gemini API status
   - Check Mapbox API status
   - Check AWS services (S3, etc.)

### Step 5: Traffic Analysis

1. Check request patterns:

   ```bash
   # Check for unusual traffic patterns
   kubectl logs -n production deployment/dojopool-api --tail=1000 | grep -c "GET\|POST\|PUT\|DELETE" | sort -nr
   ```

2. Check for DDoS or abuse patterns:
   ```bash
   # Check rate limiting logs
   kubectl logs -n production deployment/dojopool-api --tail=1000 | grep "rate.limit"
   ```

## Resolution Actions (15-30 minutes)

### If Database Issues

1. Restart database connections:

   ```bash
   kubectl rollout restart deployment/dojopool-api -n production
   ```

2. Check database performance:
   ```bash
   kubectl exec -n production -it dojopool-postgresql-0 -- psql -U dojo_user -d dojopool -c "SELECT * FROM pg_stat_activity WHERE state != 'idle';"
   ```

### If Memory/CPU Issues

1. Check resource usage:

   ```bash
   kubectl describe nodes
   kubectl top nodes
   ```

2. Scale up if needed:
   ```bash
   kubectl scale deployment dojopool-api --replicas=5 -n production
   ```

### If Application Issues

1. Rollback recent deployment:

   ```bash
   kubectl rollout undo deployment/dojopool-api -n production
   ```

2. Check application configuration:
   ```bash
   kubectl describe configmap dojopool-api-config -n production
   ```

### If External Service Issues

1. Check circuit breaker status
2. Implement fallback responses
3. Update service endpoints if needed

## Recovery and Monitoring (30+ minutes)

### Step 6: Verify Resolution

1. Monitor error rate in Grafana
2. Check API response times
3. Verify all endpoints are responding

### Step 7: Implement Fixes

1. Apply permanent fixes based on root cause
2. Update monitoring if needed
3. Add additional logging for future incidents

### Step 8: Communication

1. Update stakeholders on resolution
2. Document the incident and resolution
3. Update runbook if needed

## Escalation Path

- **5 minutes**: Backend Engineering Lead
- **15 minutes**: Engineering Manager
- **30 minutes**: CTO/Head of Engineering

## Prevention Measures

1. Implement circuit breakers for external services
2. Add more granular error monitoring
3. Implement auto-scaling based on error rates
4. Regular load testing and chaos engineering
5. Improve error handling and fallback mechanisms

## Related Alerts

- DojoPoolAPIHighLatency
- DojoPoolDatabaseHighConnections
- DojoPoolRedisDown

## Metrics to Monitor

- HTTP 5xx error rate
- API response time percentiles
- Database connection pool usage
- External service response times
- Application memory/CPU usage
