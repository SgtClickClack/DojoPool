# Incident Response Playbook: WebSocket Connection Issues

## Alert Details

- **Alert Name**: DojoPoolWebSocketConnections
- **Severity**: Warning (Critical if >50% connection loss)
- **Threshold**: Connection failures or degraded performance
- **Team**: Backend Engineering / DevOps

## Overview

This alert indicates issues with WebSocket connections, which are critical for real-time features like player proximity, live matches, and multiplayer interactions.

## Initial Assessment (0-5 minutes)

### Step 1: Confirm the Issue

1. Check WebSocket connection metrics in Grafana
2. Verify alert details and affected users
3. Check recent deployment or configuration changes

### Step 2: Quick Health Check

```bash
# Check API pod status
kubectl get pods -n production -l app=dojopool-api
kubectl describe pod -n production dojopool-postgresql-0

# Check WebSocket connection count
kubectl exec -n production deployment/dojopool-api -- node -e "
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3002 });
console.log('Active connections:', wss.clients.size);
wss.close();
"
```

## Investigation (5-15 minutes)

### Step 3: Analyze Connection Issues

1. **Connection Establishment**:

   ```bash
   # Check for connection errors in logs
   kubectl logs -n production deployment/dojopool-api --tail=1000 | grep -i "websocket\|connection\|upgrade"
   ```

2. **Authentication Issues**:

   ```bash
   # Check JWT validation errors
   kubectl logs -n production deployment/dojopool-api --tail=1000 | grep -i "auth\|token\|jwt"
   ```

3. **Network Issues**:
   ```bash
   # Check for network-related errors
   kubectl logs -n production deployment/dojopool-api --tail=1000 | grep -i "network\|timeout\|disconnect"
   ```

### Step 4: Load Analysis

1. Check current connection count:

   ```bash
   # Monitor active WebSocket connections
   kubectl exec -n production deployment/dojopool-api -- curl -s http://localhost:3001/metrics | grep websocket
   ```

2. Check for connection spikes:
   ```bash
   # Analyze connection patterns
   kubectl logs -n production deployment/dojopool-api --tail=10000 --since=1h | grep "WebSocket connection" | wc -l
   ```

### Step 5: Resource Check

```bash
# Check resource usage
kubectl top pods -n production -l app=dojopool-api

# Check memory usage specifically
kubectl exec -n production deployment/dojopool-api -- ps aux | grep node
```

## Resolution Actions (15-30 minutes)

### If Authentication Issues

1. Check JWT configuration:

   ```bash
   kubectl describe configmap dojopool-api-config -n production
   ```

2. Verify token validation:
   ```bash
   # Test JWT validation manually
   kubectl exec -n production deployment/dojopool-api -- node -e "
   const jwt = require('jsonwebtoken');
   const token = process.env.JWT_SECRET;
   console.log('JWT secret configured:', !!token);
   "
   ```

### If Resource Issues

1. Scale up API pods:

   ```bash
   kubectl scale deployment dojopool-api --replicas=5 -n production
   ```

2. Check memory limits:
   ```bash
   kubectl describe deployment dojopool-api -n production
   ```

### If Network Configuration Issues

1. Check ingress configuration:

   ```bash
   kubectl describe ingress dojopool-api-ingress -n production
   ```

2. Verify WebSocket upgrade handling:
   ```bash
   # Check nginx configuration
   kubectl exec -n production deployment/nginx -- nginx -T | grep -A 10 websocket
   ```

### If Application Issues

1. Check for memory leaks:

   ```bash
   # Monitor heap usage
   kubectl logs -n production deployment/dojopool-api --tail=100 | grep "heap\|memory"
   ```

2. Restart affected pods:
   ```bash
   kubectl rollout restart deployment/dojopool-api -n production
   ```

## Specific WebSocket Issues

### Connection Limits

1. Check configured connection limits:

   ```bash
   kubectl exec -n production deployment/dojopool-api -- node -e "
   console.log('Max listeners:', process.getMaxListeners());
   console.log('Active handles:', process._getActiveHandles().length);
   "
   ```

2. Increase limits if needed:
   ```bash
   kubectl set env deployment/dojopool-api NODE_OPTIONS="--max-old-space-size=2048 --max-listeners=10000" -n production
   ```

### Message Queue Issues

1. Check for message backlogs:

   ```bash
   kubectl logs -n production deployment/dojopool-api --tail=1000 | grep "queue\|backlog\|overflow"
   ```

2. Monitor Redis pub/sub if applicable:
   ```bash
   kubectl exec -n production dojopool-redis-0 -- redis-cli pubsub channels
   ```

## Recovery and Monitoring (30+ minutes)

### Step 6: Implement Monitoring Improvements

1. Add detailed WebSocket metrics:

   ```typescript
   // Add to application metrics
   websocket_connections_total: Counter;
   websocket_messages_total: Counter;
   websocket_connection_duration: Histogram;
   websocket_errors_total: Counter;
   ```

2. Set up connection health monitoring

### Step 7: Load Testing

1. Implement WebSocket load testing:

   ```bash
   # Use artillery or similar tool
   artillery quick --count 1000 --num 10 ws://api.dojopool.com/world
   ```

2. Monitor connection stability under load

### Step 8: Documentation Updates

1. Update WebSocket configuration docs
2. Add connection troubleshooting guide
3. Document scaling procedures

## Communication Plan

### Internal Communication

- Notify engineering team immediately
- Update incident channel every 5 minutes
- Coordinate with frontend team for client-side issues

### User Communication

- If affecting >10% of users, post service status
- Provide estimated resolution time
- Suggest temporary workarounds if available

## Escalation Path

- **5 minutes**: Backend Engineer on call
- **15 minutes**: Backend Engineering Lead
- **30 minutes**: Engineering Manager
- **45 minutes**: CTO

## Prevention Measures

1. **Connection Pooling**: Implement proper connection pooling
2. **Load Balancing**: Distribute connections across multiple pods
3. **Circuit Breakers**: Add circuit breakers for WebSocket endpoints
4. **Resource Limits**: Set appropriate resource limits and requests
5. **Health Checks**: Implement WebSocket-specific health checks
6. **Auto-scaling**: Configure horizontal pod autoscaling for WebSocket load
7. **Monitoring**: Add comprehensive WebSocket metrics and alerting

## Related Alerts

- DojoPoolHighWebSocketConnections
- DojoPoolAPIHighErrorRate
- DojoPoolAPIHighLatency

## Metrics to Monitor

- Active WebSocket connections
- Connection establishment rate
- Message throughput
- Connection duration
- Error rates by type
- Memory usage per connection
- CPU usage per connection

## Testing Checklist

- [ ] Connection establishment under load
- [ ] Message broadcasting performance
- [ ] Connection recovery after network issues
- [ ] Memory usage with high connection counts
- [ ] Authentication performance
- [ ] SSL/TLS handshake performance
- [ ] Cross-region connection latency
- [ ] Mobile device compatibility
- [ ] Browser compatibility matrix
