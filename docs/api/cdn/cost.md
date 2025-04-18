# CDN Cost API Documentation

## Overview

The CDN Cost API provides endpoints for managing and optimizing CDN costs, including cost analysis, usage patterns, and optimization recommendations.

## Base URL

```
/api/cdn/cost
```

## Authentication

All endpoints require authentication using a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Get Cost Report

Retrieves the current CDN cost report with optimization details, usage patterns, and projections.

```http
GET /api/cdn/cost
```

#### Response

```json
{
  "optimization": {
    "optimized": true,
    "costs": {
      "total_cost": 1000.0,
      "bandwidth_cost": 600.0,
      "request_cost": 400.0
    },
    "savings": 200.0,
    "optimization_time": 1.5,
    "timestamp": "2024-01-16T12:00:00Z"
  },
  "usage": {
    "hourly_usage": [
      { "hour": 0, "value": 100 },
      { "hour": 1, "value": 150 }
      // ... 24 hours of data
    ],
    "daily_usage": {
      "2024-01-01": 2400
    },
    "weekly_usage": {
      "2024-W01": 16800
    }
  },
  "projections": {
    "daily": {
      "2024-01-02": 2500
    },
    "weekly": {
      "2024-W02": 17500
    },
    "monthly": {
      "2024-01": 70000
    }
  },
  "timestamp": "2024-01-16T12:00:00Z"
}
```

#### Response Fields

| Field                             | Type    | Description                                |
| --------------------------------- | ------- | ------------------------------------------ |
| optimization.optimized            | boolean | Whether costs are currently optimized      |
| optimization.costs.total_cost     | number  | Total CDN cost in USD                      |
| optimization.costs.bandwidth_cost | number  | Cost from bandwidth usage in USD           |
| optimization.costs.request_cost   | number  | Cost from request count in USD             |
| optimization.savings              | number  | Potential savings from optimization in USD |
| optimization.optimization_time    | number  | Time taken for optimization in seconds     |
| optimization.timestamp            | string  | ISO timestamp of last optimization         |
| usage.hourly_usage                | array   | Hourly usage data for last 24 hours        |
| usage.daily_usage                 | object  | Daily usage data by date                   |
| usage.weekly_usage                | object  | Weekly usage data by week                  |
| projections.daily                 | object  | Daily cost projections                     |
| projections.weekly                | object  | Weekly cost projections                    |
| projections.monthly               | object  | Monthly cost projections                   |
| timestamp                         | string  | ISO timestamp of report generation         |

#### Status Codes

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 500  | Internal Server Error |

### Optimize Costs

Triggers a cost optimization process based on current usage patterns.

```http
POST /api/cdn/cost/optimize
```

#### Request Body

```json
{
  "threshold": 1000.0,
  "optimization_level": "aggressive",
  "timeframe": "daily"
}
```

#### Request Fields

| Field              | Type   | Description                                                      |
| ------------------ | ------ | ---------------------------------------------------------------- |
| threshold          | number | Cost threshold in USD                                            |
| optimization_level | string | Optimization strategy ("conservative", "balanced", "aggressive") |
| timeframe          | string | Time period for optimization ("daily", "weekly", "monthly")      |

#### Response

```json
{
  "success": true,
  "optimization_id": "opt_123",
  "estimated_savings": 150.0,
  "start_time": "2024-01-16T12:00:00Z",
  "end_time": "2024-01-16T12:01:30Z"
}
```

#### Status Codes

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 500  | Internal Server Error |

### Get Optimization Status

Retrieves the status of a cost optimization process.

```http
GET /api/cdn/cost/optimize/{optimization_id}
```

#### Response

```json
{
  "status": "completed",
  "progress": 100,
  "estimated_savings": 150.0,
  "start_time": "2024-01-16T12:00:00Z",
  "end_time": "2024-01-16T12:01:30Z",
  "details": {
    "optimizations_applied": 5,
    "cost_reduction": 15.0,
    "recommendations": [
      {
        "type": "cache_ttl",
        "savings": 50.0,
        "description": "Increase cache TTL for static assets"
      }
    ]
  }
}
```

#### Status Codes

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 500  | Internal Server Error |

### Get Usage Patterns

Retrieves detailed usage patterns for cost analysis.

```http
GET /api/cdn/cost/usage
```

#### Query Parameters

| Parameter  | Type   | Description                                             |
| ---------- | ------ | ------------------------------------------------------- |
| timeframe  | string | Time period for analysis ("daily", "weekly", "monthly") |
| start_date | string | Start date in ISO format                                |
| end_date   | string | End date in ISO format                                  |

#### Response

```json
{
  "patterns": {
    "hourly": [
      { "hour": 0, "requests": 1000, "bandwidth": 5000 },
      { "hour": 1, "requests": 1500, "bandwidth": 7500 }
    ],
    "daily": [{ "date": "2024-01-01", "requests": 24000, "bandwidth": 120000 }],
    "weekly": [{ "week": "2024-W01", "requests": 168000, "bandwidth": 840000 }]
  },
  "analysis": {
    "peak_hours": [14, 15, 16],
    "cost_drivers": ["bandwidth", "requests"],
    "optimization_opportunities": [
      {
        "type": "cache_optimization",
        "potential_savings": 100.0,
        "priority": "high"
      }
    ]
  }
}
```

#### Status Codes

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 500  | Internal Server Error |

## Rate Limiting

- 100 requests per minute per user
- 1000 requests per hour per user

## Error Responses

All endpoints may return the following error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common Error Codes

| Code                     | Description                      |
| ------------------------ | -------------------------------- |
| RATE_LIMIT_EXCEEDED      | Rate limit exceeded              |
| INVALID_PARAMETERS       | Invalid request parameters       |
| OPTIMIZATION_IN_PROGRESS | Optimization already in progress |
| INSUFFICIENT_PERMISSIONS | User lacks required permissions  |

## Best Practices

1. Cache responses for 5 minutes to avoid excessive API calls
2. Use appropriate timeframes for usage pattern analysis
3. Monitor optimization status before triggering new optimizations
4. Implement exponential backoff for retries
5. Handle rate limiting gracefully

## Examples

### Fetching Cost Report

```typescript
const response = await fetch("/api/cdn/cost", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const data = await response.json();
```

### Triggering Cost Optimization

```typescript
const response = await fetch("/api/cdn/cost/optimize", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    threshold: 1000.0,
    optimization_level: "balanced",
    timeframe: "daily",
  }),
});
const data = await response.json();
```

### Monitoring Optimization Status

```typescript
const checkStatus = async (optimizationId: string) => {
  const response = await fetch(`/api/cdn/cost/optimize/${optimizationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (data.status === "completed") {
    return data;
  }

  // Retry after delay
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return checkStatus(optimizationId);
};
```
