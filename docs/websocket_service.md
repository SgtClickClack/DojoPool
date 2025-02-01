# DojoPool WebSocket Service Documentation

## Overview

The DojoPool WebSocket service provides real-time ranking updates and notifications to connected clients. The service is built with type safety in mind, using Python's type hints and strict type checking with mypy.

## Type System

### Core Types

```python
# WebSocket connection mapping
Dict[int, Set[WebSocket]]  # user_id -> Set of WebSocket connections

# Statistics tracking
Dict[str, Any] = {
    "total_connections": int,
    "messages_sent": int,
    "errors": int,
    "last_update": Optional[str],
    "connected_users": Set[int],
    "peak_connections": int,
    "rate_limited_attempts": int,
    "last_error": Optional[str],
    "reconnection_attempts": int,
    "successful_reconnections": int,
    "failed_heartbeats": int,
    "compression_stats": {
        "compressed_messages": int,
        "total_bytes_raw": int,
        "total_bytes_compressed": int
    },
    "batch_stats": {
        "batches_sent": int,
        "messages_batched": int,
        "avg_batch_size": float
    }
}

# Rate limiting configuration
Dict[str, float] = {
    "max_connections_per_user": float,
    "max_total_connections": float,
    "update_cooldown": float,
    "broadcast_cooldown": float,
    "heartbeat_interval": float,
    "reconnect_timeout": float
}
```

## Features

### Connection Management

- Automatic reconnection with token-based authentication
- Connection limits per user and globally
- Heartbeat monitoring for connection health
- Graceful disconnection handling

### Message Optimization

- Message batching for efficient delivery
- Automatic compression for large messages
- Rate limiting to prevent overload
- Binary message support

### Performance Monitoring

- Real-time statistics tracking
- Compression ratio monitoring
- Batch size optimization
- Error tracking and reporting

## WebSocket Messages

### Client Messages

```typescript
interface PongMessage {
    type: "pong";
    timestamp: string;
}

interface RankingUpdate {
    type: "ranking_update";
    data: {
        rating: number;
        rank: number;
    };
    timestamp: string;
}

interface GlobalUpdate {
    type: "global_update";
    data: Array<{
        user_id: number;
        rating: number;
        rank: number;
    }>;
    timestamp: string;
}

interface SignificantChange {
    type: "significant_change";
    data: {
        old_rank: number;
        new_rank: number;
        change: number;
    };
    timestamp: string;
}
```

### Server Messages

```typescript
interface ConnectionToken {
    type: "connection_token";
    token: string;
}

interface ConnectionInfo {
    type: "connection_info";
    features: {
        compression: boolean;
        batching: boolean;
        batch_size: number;
    };
}

interface BatchMessage {
    type: "batch";
    messages: Array<RankingUpdate | GlobalUpdate | SignificantChange>;
    timestamp: string;
}

interface PingMessage {
    type: "ping";
    timestamp: string;
}
```

## Type Safety

### Static Type Checking

The codebase uses mypy for static type checking with strict settings:
- No implicit optionals
- No untyped definitions
- Strict equality checks
- Warning on unused ignores
- Warning on redundant casts

### Runtime Type Safety

- Type casting for dictionary access
- Safe type conversions
- Collection type validation
- Error boundary type checking

## Testing

### Type-Safe Tests

The test suite is fully typed with:
- Typed fixtures
- Type-safe assertions
- Mock type annotations
- Async type support

### CI Integration

Automated type checking in CI pipeline:
- mypy validation
- pytest with type checking
- Type cache for performance
- Multi-Python version support

## Best Practices

1. Always use type hints for function arguments and return values
2. Use `cast()` when accessing dictionary values with known types
3. Prefer concrete types over `Any` where possible
4. Document complex type relationships
5. Use type aliases for repeated complex types
6. Add runtime type checks for external data
7. Keep type definitions close to their usage
8. Use generics for reusable code

## Error Handling

### Type-Safe Error Handling

```python
try:
    result = await operation()
    cast(Dict[str, int], stats)["success"] += 1
except Exception as e:
    cast(Dict[str, int], stats)["errors"] += 1
    cast(Dict[str, Optional[str]], stats)["last_error"] = str(e)
```

### Error Boundaries

- Clear type transitions
- Safe type casting
- Error type propagation
- Exception type hierarchies

## Performance Considerations

1. Type checking overhead is minimal in production
2. mypy cache improves development performance
3. Type assertions are removed in production
4. Generic type erasure maintains runtime speed

## Development Workflow

1. Write type-annotated code
2. Run mypy locally
3. Add type-safe tests
4. Verify in CI pipeline
5. Document type changes
6. Review type coverage

## Monitoring and Debugging

### Type-Safe Metrics

```python
Stats = Dict[str, Union[int, str, Set[int], Dict[str, Any]]]
Metrics = Dict[str, Union[int, float]]

def get_metrics(stats: Stats) -> Metrics:
    return {
        "connection_count": cast(int, stats["total_connections"]),
        "error_rate": cast(int, stats["errors"]) / max(cast(int, stats["messages_sent"]), 1),
        "compression_ratio": get_compression_ratio(cast(Dict[str, int], stats["compression_stats"]))
    }
```

### Debug Information

- Type-aware logging
- Runtime type information
- Type assertion errors
- Type boundary violations 