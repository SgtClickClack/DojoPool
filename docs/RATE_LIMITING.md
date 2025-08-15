# DojoPool Rate Limiting System

## Overview
This document outlines the rate limiting configuration for the DojoPool application to protect against abuse and ensure fair resource usage.

## Rate Limiting Configuration

### Global Defaults
- 200 requests per day per IP
- 50 requests per hour per IP

### Endpoint-Specific Limits

#### Public Endpoints
- `/` (Index): 1000 requests per day
- `/health`: 100 requests per minute

### Implementation Details
- Uses Redis as the storage backend
- Fixed-window with elastic expiry strategy
- IP-based rate limiting by default

## Rate Limit Headers
The following headers are included in API responses:
- `X-RateLimit-Limit`: Maximum requests allowed in the current time window
- `X-RateLimit-Remaining`: Remaining requests in the current time window
- `X-RateLimit-Reset`: Time when the current window resets (Unix timestamp)

## Rate Limit Response
When rate limit is exceeded:
```json
{
    "error": "rate limit exceeded",
    "message": "specific limit description"
}
```
HTTP Status Code: 429 Too Many Requests

## Monitoring

### Metrics
- `flask_rate_limit_exceeded_total`: Counter of rate limit exceeded events
- Available in Prometheus metrics at `/metrics`

### Alerts
- Rate limit exceeded events are:
  - Logged to application logs
  - Tracked in Prometheus metrics
  - Visible in Grafana dashboards

## Exemptions
- Health check endpoints have higher limits
- Monitoring systems are exempted from rate limits
- Internal services use authentication tokens

## Best Practices

### For API Users
1. Implement exponential backoff
2. Cache responses when possible
3. Use bulk operations where available
4. Monitor rate limit headers

### For Operations
1. Monitor rate limit metrics
2. Adjust limits based on usage patterns
3. Review logs for abuse patterns
4. Configure alerts for excessive rate limiting

## Troubleshooting

### Common Issues
1. Sudden increase in rate limit errors
   - Check for traffic spikes
   - Review access patterns
   - Look for potential abuse

2. False positives
   - Verify client IP detection
   - Check Redis connectivity
   - Review rate limit configuration

### Useful Commands
```bash
# Check current rate limits
redis-cli -h redis keys *rate-limit*

# View rate limit metrics
curl http://localhost:5000/metrics | grep rate_limit

# Monitor rate limit logs
docker-compose logs web | grep "rate limit exceeded"
```

## Configuration Updates
To modify rate limits:
1. Update the limits in `src/app.py`
2. Restart the web service:
   ```bash
   docker-compose restart web
   ```

## Security Considerations
- Rate limits are part of defense in depth
- Combined with other security measures:
  - WAF rules
  - DDoS protection
  - Input validation
  - Authentication/Authorization 