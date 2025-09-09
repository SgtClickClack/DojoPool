# Incident Response Playbook: Database Down

## Alert Details

- **Alert Name**: DojoPoolDatabaseDown
- **Severity**: Critical
- **Threshold**: Database unreachable for 2 minutes
- **Team**: Database Engineering / DevOps

## Overview

This alert indicates that the PostgreSQL database is unreachable, which will cause immediate service degradation across all DojoPool services.

## Immediate Actions (0-2 minutes)

### Step 1: Assess Impact

1. Confirm the alert and check affected services
2. Notify stakeholders immediately
3. Check if this is a planned maintenance or unexpected outage

### Step 2: Quick Status Check

```bash
# Check database pod status
kubectl get pods -n production -l app=postgresql

# Check database logs
kubectl logs -n production dojopool-postgresql-0 --tail=50

# Check if database is accepting connections
kubectl exec -n production dojopool-postgresql-0 -- pg_isready -U dojo_user -d dojopool
```

## Investigation (2-10 minutes)

### Step 3: Diagnose the Issue

1. **Pod Status**: Check if pods are running, crashing, or in pending state
2. **Resource Issues**: Check CPU, memory, and disk usage
3. **Network Issues**: Verify service networking and DNS resolution
4. **Storage Issues**: Check persistent volume status
5. **Configuration Issues**: Verify database configuration

### Step 4: Check Dependencies

```bash
# Check persistent volume status
kubectl get pvc -n production
kubectl describe pvc dojopool-postgresql-pvc -n production

# Check node status
kubectl get nodes
kubectl describe node <affected-node>

# Check cluster events
kubectl get events -n production --sort-by=.metadata.creationTimestamp
```

## Resolution Actions (10-30 minutes)

### If Pod Crashing

1. Check crash logs:

   ```bash
   kubectl logs -n production dojopool-postgresql-0 --previous
   ```

2. Common causes:
   - Out of memory
   - Configuration errors
   - Storage issues
   - Corruption

### If Resource Issues

1. Scale up resources:

   ```bash
   kubectl patch pvc dojopool-postgresql-pvc -n production -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'
   ```

2. Increase memory limits:
   ```bash
   kubectl patch deployment dojopool-postgresql -n production --type='json' -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/resources/limits/memory", "value": "4Gi"}]'
   ```

### If Network Issues

1. Restart networking:

   ```bash
   kubectl delete pod dojopool-postgresql-0 -n production
   ```

2. Check service endpoints:
   ```bash
   kubectl get endpoints -n production
   ```

### If Storage Issues

1. Check disk space:

   ```bash
   kubectl exec -n production dojopool-postgresql-0 -- df -h
   ```

2. Verify backup integrity if corruption suspected

### Emergency Recovery

1. **Failover** (if replica available):

   ```bash
   # Promote replica to primary
   kubectl exec -n production dojopool-postgresql-1 -- pg_ctl promote
   ```

2. **Restore from Backup**:
   ```bash
   # Use latest backup to restore
   kubectl exec -n production dojopool-postgresql-0 -- pg_restore /backups/latest.dump
   ```

## Recovery Verification (30+ minutes)

### Step 5: Verify Database Health

1. Check database connectivity:

   ```bash
   kubectl exec -n production dojopool-postgresql-0 -- psql -U dojo_user -d dojopool -c "SELECT version();"
   ```

2. Verify data integrity:

   ```bash
   kubectl exec -n production dojopool-postgresql-0 -- psql -U dojo_user -d dojopool -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM matches;"
   ```

3. Check replication status (if applicable):
   ```bash
   kubectl exec -n production dojopool-postgresql-0 -- psql -U dojo_user -d dojopool -c "SELECT * FROM pg_stat_replication;"
   ```

### Step 6: Service Recovery

1. Gradually restart dependent services:

   ```bash
   kubectl rollout restart deployment/dojopool-api -n production
   kubectl rollout restart deployment/dojopool-web -n production
   ```

2. Monitor service health during recovery

### Step 7: Performance Validation

1. Run health checks on all endpoints
2. Monitor response times and error rates
3. Validate critical user flows

## Communication

### Internal Communication

- Update incident channel with status every 5 minutes
- Notify engineering team of ETA
- Coordinate with stakeholders

### External Communication

- Prepare customer communication if outage > 15 minutes
- Update status page if available
- Send post-mortem summary

## Post-Incident Actions

### Step 8: Root Cause Analysis

1. Conduct blameless post-mortem
2. Identify contributing factors
3. Document lessons learned

### Step 9: Prevention Measures

1. Implement additional monitoring
2. Add automated failover procedures
3. Improve backup verification
4. Update disaster recovery plan

### Step 10: Documentation Updates

1. Update this runbook with new learnings
2. Add monitoring for newly discovered failure modes
3. Update escalation procedures if needed

## Escalation Path

- **2 minutes**: Database Engineer on call
- **10 minutes**: Database Engineering Lead
- **20 minutes**: DevOps Lead
- **30 minutes**: CTO

## Related Alerts

- DojoPoolDatabaseHighConnections
- DojoPoolDatabaseHighLatency
- DojoPoolDatabaseSlowQueries

## Key Metrics to Monitor

- Database connection status
- Replication lag (if applicable)
- Disk space usage
- Memory usage
- Active connections
- Query performance
- Backup status

## Prevention Checklist

- [ ] Regular backup verification
- [ ] Disk space monitoring alerts
- [ ] Resource usage monitoring
- [ ] Automated failover testing
- [ ] Regular disaster recovery drills
- [ ] Configuration drift detection
- [ ] Security patch management
- [ ] Performance baseline monitoring
