# DojoPool Edge Caching Strategy

## Overview

This document outlines the comprehensive edge caching strategy implemented for DojoPool to reduce global latency and improve user experience. The strategy focuses on intelligent caching of read-most endpoints while ensuring data freshness through automated revalidation hooks.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │      CDN        │    │   API Server    │    │   Redis Cache   │
│   Cache         │◄──►│   Edge Cache    │◄──►│   (NestJS)      │◄──►│   (Primary)     │
│                 │    │                 │    │                 │    │                 │
│ • 1-5 min TTL   │    │ • 5-30 min TTL  │    │ • Smart Cache   │    │ • 5-60 min TTL  │
│ • User-specific │    │ • Global data   │    │ • Revalidation  │    │ • Fallback      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. Edge Cache Service (`edge-cache.service.ts`)

- **HTTP Cache Headers Generation**: Creates appropriate Cache-Control, Surrogate-Control, and Vary headers
- **Smart Cache Keys**: Generates consistent cache keys based on request parameters
- **Cache Analytics**: Tracks hit rates, response times, and performance metrics
- **CDN Integration**: Supports Fastly, Cloudflare, and other CDN providers

### 2. Cache Revalidation Service (`cache-revalidation.service.ts`)

- **Entity-Based Patterns**: Automatically invalidates related cache entries when data changes
- **Bulk Revalidation**: Handles multiple related invalidations efficiently
- **Emergency Purge**: Complete cache purge for critical situations
- **Pattern Matching**: Flexible pattern-based cache invalidation

### 3. Edge Cache Interceptor (`edge-cache.interceptor.ts`)

- **Request Interception**: Automatically handles caching for decorated endpoints
- **Response Caching**: Stores responses with appropriate TTL and headers
- **Revalidation Hooks**: Triggers cache invalidation on write operations
- **Fallback Handling**: Graceful degradation when cache is unavailable

### 4. Cache Management Service (`cache-management.service.ts`)

- **Performance Monitoring**: Real-time metrics and health checks
- **Automated Maintenance**: Scheduled cache optimization and cleanup
- **Cache Warming**: Pre-populates frequently accessed data
- **Health Monitoring**: Detects and alerts on cache performance issues

## Caching Strategy by Endpoint Type

### Read-Heavy Endpoints (High Cache Priority)

#### Venue Endpoints

```typescript
@VenueCache()
GET /api/v1/venues
- TTL: 5 minutes
- Browser Cache: 1 minute
- CDN Cache: 5 minutes
- Invalidation: venues:list, venues:detail:*
```

#### Clan Endpoints

```typescript
@ClanCache()
GET /api/v1/clans
- TTL: 5 minutes
- Browser Cache: 1 minute
- CDN Cache: 5 minutes
- Invalidation: clans:list, clans:detail:*
```

#### Territory Endpoints

```typescript
@TerritoryCache()
GET /api/v1/territories
- TTL: 3 minutes (faster-changing data)
- Browser Cache: 30 seconds
- CDN Cache: 3 minutes
- Invalidation: territories:*, territories:map, strategic-map:*
```

#### Strategic Map

```typescript
@MapCache()
GET /api/v1/territories/map
GET /api/v1/strategic-map/overview
- TTL: 2 minutes (real-time game data)
- Browser Cache: 30 seconds
- CDN Cache: 2 minutes
- Invalidation: strategic-map:*, territories:map
```

### User-Specific Content

#### Profile Data

```typescript
@UserSpecific()
GET /api/v1/users/me
- TTL: 3 minutes
- Browser Cache: Disabled (personalized)
- CDN Cache: 3 minutes
- Vary: Authorization
```

#### Journal/Activity Data

```typescript
@UserSpecific()
GET /api/v1/users/me/journal
- TTL: 1 minute (frequently changing)
- Browser Cache: Disabled
- CDN Cache: 1 minute
- Vary: Authorization
```

### Static Content

#### Reference Data

```typescript
@StaticContent(3600) // 1 hour
GET /api/v1/reference/game-rules
GET /api/v1/reference/scoring-system
- TTL: 1 hour
- Browser Cache: 1 hour
- CDN Cache: 2 hours
- Cache-Control: immutable
```

### Write Operations (Cache Invalidation)

#### Venue Updates

```typescript
@CacheInvalidate(['venues:list', 'venues:detail:*'])
POST/PUT/PATCH /api/v1/venues/:id
DELETE /api/v1/venues/:id
```

#### Clan Operations

```typescript
@CacheInvalidate(['clans:list', 'clans:detail:*'])
POST /api/v1/clans
POST /api/v1/clans/:id/join
DELETE /api/v1/clans/:id/leave
```

#### Territory Changes

```typescript
@CacheInvalidate(['territories:*', 'territories:map', 'strategic-map:*'])
POST /api/v1/territories/claim
POST /api/v1/territories/:id/manage
POST /api/v1/territories/challenge
```

## Cache Key Strategy

### Base Cache Keys

```
venues:list:{search}:{city}:{state}:{page}:{limit}
clans:detail:{clanId}
territories:map:{bbox}
users:profile:{userId}
strategic-map:overview
```

### Parameter Handling

- **Query Parameters**: Sorted and included in cache key
- **Path Parameters**: Directly included in cache key
- **User Context**: Added for personalized content
- **Sensitive Data**: Excluded from cache keys (API keys, tokens)

### Cache Key Examples

```
venues:list:pool hall:New York:NY:1:12
clans:detail:clan-123:user-456
territories:map:-74.0,40.7,-73.9,40.8
users:profile:user-789
```

## Revalidation Patterns

### Entity-Based Revalidation

```typescript
const revalidationPatterns = [
  {
    entityType: 'venue',
    patterns: ['venues:list', 'venues:detail:*', 'strategic-map:*'],
  },
  {
    entityType: 'clan',
    patterns: ['clans:list', 'clans:detail:*', 'territories:clan:*'],
  },
  {
    entityType: 'territory',
    patterns: ['territories:*', 'territories:map', 'strategic-map:*'],
  },
];
```

### Automatic Revalidation Triggers

- **Create Operations**: Invalidate list caches
- **Update Operations**: Invalidate specific entity and related caches
- **Delete Operations**: Invalidate specific entity and list caches
- **Bulk Operations**: Invalidate all related patterns

## CDN Configuration

### Cloudflare Configuration

```javascript
// Cloudflare Worker for custom cache rules
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Custom cache logic for DojoPool
  const response = await fetch(request);

  // Add DojoPool-specific cache headers
  response.headers.set('X-Dojopool-Cache', 'enabled');

  return response;
}
```

### Fastly Configuration

```vcl
# Fastly VCL for DojoPool
sub vcl_recv {
  # Custom cache key generation
  set req.hash += req.url;
  set req.hash += req.http.Authorization;

  # Set cache TTL based on endpoint
  if (req.url ~ "^/api/v1/venues") {
    set beresp.ttl = 300s;
    set beresp.http.Cache-Control = "max-age=60, s-maxage=300";
  }
}
```

## Performance Optimization

### Cache Hit Rate Optimization

1. **Consistent Cache Keys**: Ensure identical requests generate same cache key
2. **Query Parameter Normalization**: Sort and normalize query parameters
3. **User Context Handling**: Properly handle authenticated vs anonymous requests
4. **Cache Key Compression**: Minimize cache key length while maintaining uniqueness

### Memory Management

1. **TTL Optimization**: Balance cache freshness with hit rate
2. **Size Limits**: Implement cache size limits to prevent memory issues
3. **Eviction Policies**: Use LRU (Least Recently Used) eviction
4. **Memory Monitoring**: Track memory usage and alert on high usage

### Network Optimization

1. **Compression**: Enable gzip/brotli compression for cached responses
2. **Chunked Transfer**: Use chunked encoding for large responses
3. **Connection Reuse**: Maintain persistent connections to cache backends
4. **CDN Edge Optimization**: Choose optimal CDN edge locations

## Monitoring and Analytics

### Key Metrics to Monitor

#### Cache Performance

- **Hit Rate**: `(cache_hits / total_requests) * 100`
- **Miss Rate**: `(cache_misses / total_requests) * 100`
- **Average Response Time**: Time from request to response
- **Cache Size**: Current cache memory usage

#### Cache Effectiveness

- **Bandwidth Savings**: Data transferred vs total requests
- **Origin Request Reduction**: Requests reaching origin server
- **User Experience**: Perceived latency improvements
- **Error Rate**: Cache-related errors and failures

### Monitoring Dashboard

#### Real-time Metrics

```
Cache Hit Rate: 94.2%
Average Response Time: 45ms
Cache Size: 2.3GB
Active Connections: 1,247
```

#### Historical Trends

- Daily/weekly cache performance graphs
- Peak usage time analysis
- Cache invalidation frequency
- Error rate trends

#### Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: dojopool_cache
    rules:
      - alert: LowCacheHitRate
        expr: dojopool_cache_hit_rate < 0.85
        for: 5m
        labels:
          severity: warning

      - alert: HighCacheResponseTime
        expr: dojopool_cache_response_time > 1000
        for: 5m
        labels:
          severity: warning

      - alert: CacheMemoryHigh
        expr: dojopool_cache_memory_usage > 0.9
        for: 5m
        labels:
          severity: critical
```

## Cache Warming Strategy

### Automated Cache Warming

```typescript
const warmupConfigs = [
  {
    endpoint: '/api/v1/venues',
    method: 'GET',
    frequency: 'hourly',
    priority: 'high',
  },
  {
    endpoint: '/api/v1/clans',
    method: 'GET',
    frequency: 'hourly',
    priority: 'high',
  },
  {
    endpoint: '/api/v1/territories/map',
    method: 'GET',
    frequency: 'daily',
    priority: 'medium',
  },
];
```

### Manual Cache Warming

```bash
# Warm up critical endpoints
curl -X POST http://localhost:3002/admin/cache/warmup

# Warm up specific endpoint
curl "http://localhost:3002/api/v1/venues" # First request warms cache
```

## Security Considerations

### Cache Poisoning Prevention

1. **Input Validation**: Validate all request parameters used in cache keys
2. **Key Sanitization**: Clean and normalize cache keys
3. **Rate Limiting**: Prevent cache key exhaustion attacks
4. **Access Control**: Restrict cache management endpoints

### Sensitive Data Handling

1. **No Sensitive Data in Keys**: Never include passwords, tokens, or PII in cache keys
2. **Encrypted Cache Values**: Encrypt sensitive cached data
3. **Access Logging**: Log cache access for security auditing
4. **Cache Isolation**: Separate caches for different security contexts

## Troubleshooting Guide

### Common Issues

#### Low Cache Hit Rate

```
Symptoms: High miss rate, slow response times
Solutions:
1. Review cache key generation
2. Check TTL settings
3. Analyze request patterns
4. Consider cache warming
```

#### Cache Memory Issues

```
Symptoms: High memory usage, cache evictions
Solutions:
1. Reduce TTL values
2. Implement size limits
3. Use LRU eviction
4. Monitor memory usage
```

#### Stale Data Issues

```
Symptoms: Users seeing old data
Solutions:
1. Check revalidation hooks
2. Verify invalidation patterns
3. Review TTL settings
4. Test cache invalidation
```

#### CDN Issues

```
Symptoms: CDN not caching properly
Solutions:
1. Verify cache headers
2. Check CDN configuration
3. Review Vary headers
4. Test with different CDNs
```

## Testing Strategy

### Unit Tests

```typescript
describe('EdgeCacheService', () => {
  it('should generate correct cache headers', () => {
    const headers = edgeCacheService.generateCacheHeaders({
      ttl: 300,
      browserMaxAge: 60,
    });

    expect(headers['Cache-Control']).toContain('max-age=60');
    expect(headers['Surrogate-Control']).toContain('max-age=300');
  });
});
```

### Integration Tests

```typescript
describe('Cache Endpoints', () => {
  it('should cache venue list', async () => {
    const response1 = await request(app.getHttpServer())
      .get('/api/v1/venues')
      .expect(200);

    const response2 = await request(app.getHttpServer())
      .get('/api/v1/venues')
      .expect(200);

    expect(response1.headers['x-cache-status']).toBe('MISS');
    expect(response2.headers['x-cache-status']).toBe('HIT');
  });
});
```

### Performance Tests

```typescript
describe('Cache Performance', () => {
  it('should handle high concurrent load', async () => {
    const promises = Array(100)
      .fill()
      .map(() => request(app.getHttpServer()).get('/api/v1/venues'));

    const responses = await Promise.all(promises);
    const avgResponseTime = calculateAverageResponseTime(responses);

    expect(avgResponseTime).toBeLessThan(500);
  });
});
```

## Deployment Checklist

### Pre-deployment

- [ ] Configure Redis cluster with persistence
- [ ] Set up CDN with custom rules
- [ ] Configure monitoring and alerting
- [ ] Test cache invalidation patterns
- [ ] Verify cache key generation
- [ ] Set up cache warming schedules

### Deployment

- [ ] Deploy API with cache interceptors
- [ ] Enable CDN integration
- [ ] Configure cache headers
- [ ] Set up monitoring dashboards
- [ ] Enable automated cache warming

### Post-deployment

- [ ] Monitor cache hit rates
- [ ] Track performance improvements
- [ ] Monitor for stale data issues
- [ ] Optimize TTL settings
- [ ] Set up alerting rules

## Future Enhancements

### Advanced Features

1. **Predictive Caching**: Use ML to predict and cache likely future requests
2. **Dynamic TTL**: Adjust TTL based on data change frequency
3. **Cache Compression**: Automatically compress cached responses
4. **Multi-region Caching**: Global cache replication
5. **Cache Analytics**: Advanced analytics and insights

### Performance Improvements

1. **HTTP/3 Support**: Upgrade to HTTP/3 for better performance
2. **Edge Computing**: Move cache logic closer to users
3. **AI-powered Caching**: Use AI to optimize cache strategies
4. **Real-time Invalidation**: Instant cache invalidation via WebSocket
5. **Cache Federation**: Distributed cache across multiple providers

This comprehensive edge caching strategy provides DojoPool with the scalability and performance needed to deliver a world-class gaming experience to players globally.
