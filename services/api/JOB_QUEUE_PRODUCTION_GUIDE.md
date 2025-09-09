# DojoPool Job Queue Production Deployment Guide

## Overview

This guide covers the production deployment and scaling strategies for the BullMQ job queue system integrated into DojoPool. The system handles heavy asynchronous tasks like AI analysis, batch operations, and analytics processing.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Server    │    │     Redis       │    │   Worker(s)     │
│                 │    │                 │    │                 │
│ • Job Producer  │◄──►│ • Job Queues    │◄──►│ • Job Consumers │
│ • Controllers   │    │ • Persistence   │    │ • Processors    │
│ • Bull Board    │    │ • Monitoring    │    │ • Results       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### System Requirements

- **Node.js**: 18+ (recommended 20+)
- **Redis**: 6.0+ with persistence enabled
- **Memory**: Minimum 2GB RAM per worker instance
- **CPU**: At least 2 cores per worker instance

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Queue Configuration
AI_QUEUE_CONCURRENCY=3
BATCH_QUEUE_CONCURRENCY=2
ANALYTICS_QUEUE_CONCURRENCY=2

# Bull Board (Optional)
BULL_BOARD_USERNAME=admin
BULL_BOARD_PASSWORD=secure-password

# Monitoring
NODE_ENV=production
LOG_LEVEL=info
```

## Production Deployment

### 1. Redis Setup

#### Single Redis Instance

```bash
# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: supervised systemd
# Set: maxmemory 512mb
# Set: maxmemory-policy allkeys-lru

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis
```

#### Redis Cluster (High Availability)

```yaml
# docker-compose.redis-cluster.yml
version: '3.8'
services:
  redis-1:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf
    ports:
      - '7001:6379'
    volumes:
      - redis-data-1:/data

  redis-2:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf
    ports:
      - '7002:6379'
    volumes:
      - redis-data-2:/data

  # Add more Redis nodes...
```

### 2. Application Deployment

#### PM2 Configuration

```json
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'dojopool-api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_log: '/var/log/dojopool/api-error.log',
      out_log: '/var/log/dojopool/api-out.log',
      log_log: '/var/log/dojopool/api-combined.log'
    },
    {
      name: 'dojopool-worker',
      script: 'dist/worker.js',
      instances: 3,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_log: '/var/log/dojopool/worker-error.log',
      out_log: '/var/log/dojopool/worker-out.log'
    }
  ]
};
```

#### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3002

CMD ["npm", "run", "start:prod"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - '3002:3002'
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
    depends_on:
      - redis
    restart: unless-stopped

  worker:
    build: .
    command: npm run worker:prod
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
    depends_on:
      - redis
    restart: unless-stopped
    deploy:
      replicas: 3

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

volumes:
  redis-data:
```

### 3. Scaling Strategies

#### Horizontal Scaling

**Worker Scaling:**

```bash
# Scale workers based on queue length
pm2 scale dojopool-worker 5

# Auto-scaling with PM2
pm2 monit
```

**Load Balancer Configuration:**

```nginx
# nginx.conf
upstream api_backend {
    server api1:3002;
    server api2:3002;
    server api3:3002;
}

server {
    listen 80;
    server_name api.dojopool.com;

    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Bull Board
    location /admin/queues {
        proxy_pass http://api_backend;
        auth_basic "Bull Board";
        auth_basic_user_file /etc/nginx/.htpasswd;
    }
}
```

#### Vertical Scaling

**Resource Allocation:**

```javascript
// Queue configuration based on instance size
const queueConfig = {
  small: {
    aiConcurrency: 2,
    batchConcurrency: 1,
    analyticsConcurrency: 1,
  },
  medium: {
    aiConcurrency: 4,
    batchConcurrency: 2,
    analyticsConcurrency: 2,
  },
  large: {
    aiConcurrency: 8,
    batchConcurrency: 4,
    analyticsConcurrency: 4,
  },
};
```

### 4. Monitoring and Observability

#### Key Metrics to Monitor

```javascript
// Custom metrics collection
const metrics = {
  queueLength: await queueService.getAllQueueStats(),
  processingTime: job.processedOn - job.processedOn,
  failureRate: (failedJobs / totalJobs) * 100,
  throughput: jobsPerMinute,
  memoryUsage: process.memoryUsage(),
  redisConnections: await redis.info('clients'),
};
```

#### Prometheus Metrics

```javascript
// BullMQ Prometheus integration
const { BullMQMetrics } = require('bullmq-prometheus-exporter');

const metrics = new BullMQMetrics(queue);
app.use('/metrics', metrics.router);
```

#### Alerting Rules

```yaml
# prometheus-rules.yml
groups:
  - name: dojopool_job_queue
    rules:
      - alert: HighQueueLength
        expr: bullmq_queue_waiting > 100
        for: 5m
        labels:
          severity: warning

      - alert: JobFailures
        expr: rate(bullmq_job_failed_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning

      - alert: WorkerDown
        expr: up{job="dojopool-worker"} == 0
        for: 5m
        labels:
          severity: critical
```

### 5. Performance Optimization

#### Queue Optimization

```javascript
// Optimized queue configuration
const optimizedQueues = {
  ai: {
    concurrency: 3,
    limiter: {
      max: 10,
      duration: 1000,
    },
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  },
};
```

#### Database Optimization

```sql
-- Create indexes for job-related queries
CREATE INDEX idx_match_analysis_match_id ON match_analysis(match_id);
CREATE INDEX idx_match_analysis_created_at ON match_analysis(created_at);
CREATE INDEX idx_job_status ON job_status(queue_name, status);

-- Optimize match queries
CREATE INDEX idx_matches_winner_player_a ON matches(winner_id, player_a_id);
CREATE INDEX idx_matches_player_b ON matches(player_b_id);
```

#### Caching Strategy

```javascript
// Multi-level caching
const cacheStrategy = {
  l1: 'memory', // Fast in-memory cache
  l2: 'redis', // Distributed Redis cache
  l3: 'database', // Fallback to database
  ttl: {
    analysis: 3600, // 1 hour
    statistics: 300, // 5 minutes
    leaderboard: 60, // 1 minute
  },
};
```

### 6. Backup and Recovery

#### Redis Persistence

```redis.conf
# Redis persistence configuration
save 900 1
save 300 10
save 60 10000

# AOF configuration
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
```

#### Database Backup

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/var/backups/dojopool"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -h localhost -U dojopool -d dojopool > $BACKUP_DIR/db_$DATE.sql

# Redis backup
redis-cli --rdb $BACKUP_DIR/redis_$DATE.rdb

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete
```

### 7. Troubleshooting

#### Common Issues

**High Queue Length:**

```bash
# Check worker status
pm2 status

# Scale workers
pm2 scale dojopool-worker +2

# Check Redis memory
redis-cli info memory
```

**Job Failures:**

```bash
# Check worker logs
pm2 logs dojopool-worker

# Monitor Bull Board
curl http://localhost:3002/admin/queues
```

**Memory Issues:**

```bash
# Monitor memory usage
pm2 monit

# Restart workers
pm2 restart dojopool-worker
```

### 8. Security Considerations

#### Authentication

```javascript
// Bull Board authentication
const basicAuth = require('express-basic-auth');

app.use(
  '/admin/queues',
  basicAuth({
    users: {
      [process.env.BULL_BOARD_USERNAME]: process.env.BULL_BOARD_PASSWORD,
    },
    challenge: true,
  })
);
```

#### Network Security

```nginx
# Restrict Bull Board access
location /admin/queues {
    allow 192.168.1.0/24;  # Internal network only
    deny all;
    proxy_pass http://api_backend;
}
```

#### Data Encryption

```javascript
// Encrypt sensitive job data
const encryptJobData = (data) => {
  return crypto.encrypt(data, process.env.JOB_ENCRYPTION_KEY);
};
```

## Deployment Checklist

- [ ] Redis cluster configured with persistence
- [ ] Environment variables set
- [ ] SSL certificates installed
- [ ] Monitoring tools configured
- [ ] Backup strategy implemented
- [ ] Load balancer configured
- [ ] Security policies applied
- [ ] Performance baseline established

## Maintenance Procedures

### Daily

- Monitor queue lengths and processing times
- Review error logs
- Check Redis memory usage

### Weekly

- Review performance metrics
- Update dependencies
- Test backup restoration

### Monthly

- Analyze job failure patterns
- Review scaling policies
- Update security patches

## Support and Monitoring

- **Bull Board**: `http://your-api/admin/queues`
- **Health Checks**: `http://your-api/api/v1/health`
- **Metrics**: `http://your-api/metrics` (if Prometheus enabled)
- **Logs**: PM2 logs and application logs

This guide provides a comprehensive foundation for deploying and scaling the DojoPool job queue system in production. Regular monitoring and performance tuning will ensure optimal operation as the system grows.
