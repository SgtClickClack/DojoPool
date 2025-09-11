# DojoPool Regional Failover & Multi-Region Database Guide

## Overview

The Regional Failover system is a critical component of DojoPool's global infrastructure, providing automatic database failover, multi-region read replicas, and intelligent connection routing to ensure 99.9%+ uptime and optimal performance worldwide.

## Architecture

### Core Components

1. **RegionalFailoverService** - Orchestrates failover operations and regional management
2. **ConnectionRouterService** - Intelligently routes queries to optimal database endpoints
3. **DatabaseHealthMonitorService** - Continuous health monitoring and alerting
4. **DatabaseController** - REST API for administration and monitoring

### Regional Topology

```
🌍 Global Infrastructure
├── 🇺🇸 US East (Primary - Priority 10)
│   ├── Primary DB (Read/Write)
│   ├── Replica 1 (Read-Only)
│   └── Replica 2 (Read-Only)
├── 🇪🇺 EU West (Secondary - Priority 8)
│   ├── Primary DB (Read/Write)
│   └── Replica 1 (Read-Only)
└── 🌏 Asia Pacific (Tertiary - Priority 6)
    ├── Primary DB (Read/Write)
    └── Replica 1 (Read-Only)
```

## Key Features

### 🚀 Automatic Failover

- **Health Monitoring**: Continuous monitoring of all database endpoints
- **Failure Detection**: Automatic detection of database outages
- **Smart Selection**: Chooses optimal replacement based on priority and health
- **Zero-Downtime**: Seamless transition with connection rerouting

### ⚡ Intelligent Routing

- **Read/Write Splitting**: Write queries → Primary, Read queries → Replicas
- **Latency Optimization**: Routes to geographically closest healthy replica
- **Load Balancing**: Distributes read load across available replicas
- **Connection Pooling**: Efficient connection management per region

### 📊 Advanced Monitoring

- **Real-time Health Checks**: 30-second intervals for all endpoints
- **Performance Metrics**: Response times, throughput, replication lag
- **Alert System**: Multi-level alerting (warning, critical, emergency)
- **Historical Tracking**: Comprehensive failover and performance history

## Configuration

### Environment Variables

```bash
# Primary Databases
DB_US_EAST_URL=postgresql://user:pass@db-us-east.dojo-pool.internal:5432/dojopool
DB_EU_WEST_URL=postgresql://user:pass@db-eu-west.dojo-pool.internal:5432/dojopool
DB_ASIA_PACIFIC_URL=postgresql://user:pass@db-asia-pacific.dojo-pool.internal:5432/dojopool

# Replica Databases
DB_US_EAST_REPLICA1_URL=postgresql://user:pass@db-us-east-replica-1.dojo-pool.internal:5432/dojopool
DB_US_EAST_REPLICA2_URL=postgresql://user:pass@db-us-east-replica-2.dojo-pool.internal:5432/dojopool
DB_EU_WEST_REPLICA1_URL=postgresql://user:pass@db-eu-west-replica-1.dojo-pool.internal:5432/dojopool
DB_ASIA_PACIFIC_REPLICA1_URL=postgresql://user:pass@db-asia-pacific-replica-1.dojo-pool.internal:5432/dojopool

# Optional Configuration
DB_US_EAST_HEALTH_INTERVAL=30000
DB_US_EAST_FAILOVER_TIMEOUT=300000
DB_US_EAST_SSL=true
```

### Regional Configuration

```typescript
// src/database/regional-config.ts
export const REGIONAL_DATABASE_CONFIG = {
  'us-east': {
    priority: 10, // Highest priority
    primary: {
      /* primary config */
    },
    replicas: [
      /* replica configs */
    ],
    healthCheckInterval: 30000,
    failoverTimeout: 300000,
  },
  'eu-west': {
    priority: 8,
    // ... similar configuration
  },
};
```

## API Endpoints

### Status & Monitoring

```bash
# Get complete database system status
GET /api/database/status

# Get health status and alerts
GET /api/database/health

# Get active alerts
GET /api/database/alerts?limit=20

# Get performance metrics
GET /api/database/metrics?endpoint=us-east-primary&limit=50

# Get failover history
GET /api/database/failover-history?limit=10

# Get performance summary
GET /api/database/performance
```

### Management Operations

```bash
# Manually trigger failover
POST /api/database/failover/{region}

# Force reconnect to specific region
POST /api/database/reconnect/{region}

# Force health check on all endpoints
POST /api/database/health-check

# Refresh connection pools
POST /api/database/connections/refresh

# Analyze database query
POST /api/database/analyze-query
{
  "query": "SELECT * FROM users WHERE id = $1"
}

# Export system report
GET /api/database/export
```

## Usage Examples

### Automatic Failover Flow

```typescript
// The system automatically handles failover
// No code changes required in application logic

// Example: Application continues to work during failover
const user = await prisma.user.findUnique({
  where: { id: userId },
});
// Query automatically routed to healthy database
```

### Manual Region Switching

```typescript
// For maintenance or testing
const response = await fetch('/api/database/failover/eu-west', {
  method: 'POST',
  headers: { Authorization: 'Bearer <admin-token>' },
});

const result = await response.json();
// { success: true, message: "Failover initiated to region: eu-west" }
```

### Health Monitoring

```typescript
// Get current system health
const health = await fetch('/api/database/health');
const status = await health.json();

console.log(`System Health: ${status.systemHealth.overall}`);
console.log(`Primary Healthy: ${status.systemHealth.primaryHealthy}`);
console.log(`Active Alerts: ${status.systemHealth.activeAlerts}`);
```

### Query Analysis

```typescript
// Analyze query routing
const analysis = await fetch('/api/database/analyze-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'SELECT * FROM matches WHERE tournament_id = $1',
  }),
});

const result = await analysis.json();
// {
//   query: "...",
//   analysis: { isRead: true, isWrite: false, estimatedComplexity: "simple" },
//   recommendation: "Route to nearest healthy replica for optimal performance"
// }
```

## Health Monitoring & Alerts

### Alert Types

- **endpoint_down**: Database endpoint unreachable
- **endpoint_slow**: Response time above threshold
- **replication_lag**: Replica lagging behind primary
- **failover_triggered**: Automatic failover initiated
- **failover_completed**: Failover operation successful
- **failover_failed**: Failover operation failed

### Alert Severities

- **low**: Minor issues, monitoring recommended
- **medium**: Performance degradation, investigation needed
- **high**: Service impact, immediate attention required
- **critical**: System down, immediate failover triggered

### Health Thresholds

```typescript
RESPONSE_TIME_WARNING = 1000ms
RESPONSE_TIME_CRITICAL = 5000ms
REPLICATION_LAG_WARNING = 30000ms  // 30 seconds
REPLICATION_LAG_CRITICAL = 300000ms // 5 minutes
ERROR_RATE_WARNING = 0.05  // 5%
ERROR_RATE_CRITICAL = 0.20 // 20%
```

## Performance Optimization

### Read Query Routing Strategy

1. **Geographic Proximity**: Route to closest healthy replica
2. **Load Balancing**: Distribute across multiple replicas
3. **Health Priority**: Prefer healthy, low-latency endpoints
4. **Fallback**: Use primary if no healthy replicas available

### Connection Pool Management

- **Primary Pool**: Single connection for write operations
- **Replica Pools**: Multiple connections per region for read scaling
- **Health-Based Routing**: Avoid unhealthy endpoints
- **Automatic Recovery**: Reconnect after endpoint recovery

### Caching Strategy

- **DNS Caching**: Short TTL for fast failover propagation
- **Connection Caching**: Reuse connections within regions
- **Health Cache**: Cache health status to reduce check frequency
- **Metrics Cache**: Cache performance metrics for dashboard

## Disaster Recovery

### Automatic Failover Process

1. **Detection**: Health monitor detects primary database failure
2. **Alert**: Critical alert triggered, notifications sent
3. **Selection**: Choose best available replacement region
4. **Promotion**: Promote replica to primary (if applicable)
5. **Routing**: Update DNS/application routing
6. **Verification**: Confirm new primary is healthy and serving traffic
7. **Notification**: Send success/failure notifications

### Recovery Time Objectives (RTO)

- **Automatic Failover**: < 5 minutes
- **DNS Propagation**: < 2 minutes
- **Application Recovery**: < 1 minute
- **Total RTO**: < 8 minutes

### Recovery Point Objectives (RPO)

- **Synchronous Replication**: < 1 second data loss
- **Asynchronous Replication**: < 30 seconds data loss
- **Cross-Region Backup**: < 1 hour data loss

## Testing & Validation

### Test Scenarios

```bash
# Run all regional failover tests
node scripts/test-regional-failover.js

# Test specific scenarios
node scripts/test-regional-failover.js --test-health-check --verbose
node scripts/test-regional-failover.js --test-simulated-failure
node scripts/test-regional-failover.js --test-manual-failover
```

### Chaos Engineering

- **Primary Failure**: Simulate primary database outage
- **Network Partition**: Simulate network isolation between regions
- **Replica Lag**: Simulate replication delays
- **High Load**: Test performance under load
- **Region Outage**: Simulate complete regional failure

## Monitoring & Observability

### Key Metrics

- **Health Status**: Endpoint availability and response times
- **Query Routing**: Read/write distribution and latency
- **Failover Events**: Success rate and duration
- **Replication Lag**: Data synchronization status
- **Connection Pools**: Pool utilization and health

### Dashboard Integration

```typescript
// Example dashboard data
{
  systemHealth: "healthy",
  primaryRegion: "us-east",
  activeAlerts: 2,
  avgResponseTime: 45,
  replicaHealth: 95,
  lastFailover: "2024-01-15T10:30:00Z"
}
```

## Security Considerations

### Authentication & Authorization

- **SSL/TLS**: All database connections use SSL encryption
- **IAM Integration**: Database credentials managed via AWS IAM or similar
- **Access Control**: Regional access restricted by IP and authentication
- **Audit Logging**: All failover operations logged for compliance

### Data Protection

- **Encryption at Rest**: Database storage encrypted
- **Encryption in Transit**: SSL for all data transmission
- **Backup Encryption**: Automated backups encrypted
- **Key Rotation**: Regular rotation of encryption keys

## Troubleshooting

### Common Issues

1. **Slow Query Performance**
   - Check replica health and lag
   - Verify connection routing logic
   - Monitor query patterns

2. **Failover Delays**
   - Check network connectivity
   - Verify DNS propagation
   - Monitor health check intervals

3. **Connection Pool Exhaustion**
   - Adjust pool sizes based on load
   - Implement connection pooling best practices
   - Monitor connection utilization

### Debugging Commands

```bash
# Force health check
curl -X POST /api/database/health-check

# Get detailed status
curl /api/database/status

# View active alerts
curl /api/database/alerts

# Check connection pools
curl /api/database/connections
```

## Future Enhancements

### Planned Features

- **Multi-Cloud Support**: AWS, GCP, Azure integration
- **Advanced Load Balancing**: AI-powered query routing
- **Predictive Failover**: Anticipate failures before they occur
- **Global Consistency**: Strong consistency across regions
- **Automated Scaling**: Auto-scale replicas based on demand

### Performance Improvements

- **Edge Computing**: Database endpoints at CDN edges
- **Query Optimization**: Automatic query optimization
- **Caching Layers**: Multi-level caching strategy
- **Compression**: Automatic data compression

## Support & Maintenance

### Regular Maintenance Tasks

1. **Health Check Tuning**: Adjust thresholds based on usage patterns
2. **Capacity Planning**: Monitor and scale replica instances
3. **Security Updates**: Regular security patching and updates
4. **Performance Optimization**: Query optimization and index maintenance

### Emergency Procedures

1. **Immediate Response**: Check system health dashboard
2. **Manual Failover**: Use API to manually trigger failover if needed
3. **Communication**: Notify stakeholders of any service impact
4. **Post-Mortem**: Analyze root cause and improve procedures

This regional failover system provides enterprise-grade reliability and global performance optimization for DojoPool's worldwide user base.
