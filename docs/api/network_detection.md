# Network Quality Detection API

## Overview
The network quality detection module provides real-time monitoring and assessment of network conditions, with special handling for mobile devices. It tracks metrics like latency, bandwidth, packet loss, and jitter to provide quality scores and recommendations.

## Classes

### NetworkMetrics
A dataclass representing network quality metrics at a point in time.

#### Attributes
- `latency` (float): Round-trip time in milliseconds
- `bandwidth` (float): Available bandwidth in Mbps
- `packet_loss` (float): Packet loss percentage (0-100)
- `jitter` (float): Variation in latency in milliseconds
- `timestamp` (datetime): When the metrics were recorded

### NetworkQualityDetector
Main class for detecting and monitoring network quality.

#### Constructor
```python
detector = NetworkQualityDetector(window_size: int = 50)
```
- `window_size`: Number of metrics to keep in history per client (default: 50)

#### Methods

##### record_metrics
```python
def record_metrics(client_id: str, metrics: NetworkMetrics) -> None
```
Records network metrics for a client.
- `client_id`: Unique identifier for the client
- `metrics`: NetworkMetrics instance to record
- Returns: None

##### get_network_quality
```python
def get_network_quality(client_id: str, user_agent: str) -> Dict[str, Any]
```
Gets network quality assessment for a client.
- `client_id`: Unique identifier for the client
- `user_agent`: User agent string for device detection
- Returns: Dictionary containing:
  ```python
  {
      'quality': str,  # 'excellent', 'good', 'fair', 'poor', or 'unknown'
      'score': float,  # 0-100 quality score
      'metrics': {
          'latency': float,
          'bandwidth': float,
          'packet_loss': float,
          'jitter': float
      },
      'is_mobile': bool,
      'device_info': {
          'browser': str,
          'os': str,
          'device': str
      }
  }
  ```

## Quality Thresholds

### Mobile Devices
- Latency: 300ms
- Bandwidth: 1.5 Mbps
- Packet Loss: 2%
- Jitter: 50ms

### Desktop Devices
- Latency: 100ms
- Bandwidth: 5 Mbps
- Packet Loss: 1%
- Jitter: 30ms

## Quality Levels
- Excellent: Score >= 80
- Good: Score >= 60
- Fair: Score >= 40
- Poor: Score < 40

## Performance Characteristics

### Response Times
- Metrics Recording: < 1ms average, < 5ms P99
- Quality Assessment: < 10ms average, < 20ms P95
- Device Detection: < 5ms average, < 10ms P95
- Cleanup Operations: < 100ms

### Memory Usage
- Growth Rate: < 1MB per 100 clients per minute
- Cleanup Interval: Every 5 minutes
- History Retention: 1 hour

### Concurrency
- Supports 1000+ operations/second
- Thread-safe for concurrent access
- Independent client tracking

## Example Usage

```python
from dojopool.core.network.detection import NetworkQualityDetector, NetworkMetrics
from datetime import datetime

# Create detector
detector = NetworkQualityDetector(window_size=50)

# Record metrics
metrics = NetworkMetrics(
    latency=50.0,
    bandwidth=10.0,
    packet_loss=0.5,
    jitter=20.0,
    timestamp=datetime.now()
)
detector.record_metrics("client_123", metrics)

# Get quality assessment
user_agent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
quality = detector.get_network_quality("client_123", user_agent)
print(f"Network quality: {quality['quality']}")
```

## Best Practices

1. **Client Identification**
   - Use consistent client IDs across sessions
   - Consider privacy implications when generating IDs

2. **Metrics Collection**
   - Record metrics every 5-10 seconds
   - Include all metrics for accurate assessment
   - Use accurate timestamps

3. **Quality Assessment**
   - Check quality before critical operations
   - Consider device type in thresholds
   - Handle unknown quality gracefully

4. **Resource Management**
   - Monitor memory usage in production
   - Adjust window size based on needs
   - Clean up inactive clients

5. **Error Handling**
   - Handle invalid user agents
   - Validate metric values
   - Provide fallback quality levels

## Implementation Notes

1. **Thread Safety**
   - All methods are thread-safe
   - Uses atomic operations for updates
   - Maintains consistency under load

2. **Memory Management**
   - Uses weak references for caching
   - Implements periodic cleanup
   - Caps history size per client

3. **Device Detection**
   - Uses user-agents library
   - Caches parsed results
   - Handles unknown devices

4. **Quality Calculation**
   - Weighted scoring system
   - Device-specific thresholds
   - Statistical aggregation

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Reduce window size
   - Increase cleanup frequency
   - Check for client leaks

2. **Slow Response Times**
   - Reduce metrics history
   - Optimize cleanup timing
   - Check system resources

3. **Incorrect Quality**
   - Verify metric values
   - Check device detection
   - Validate thresholds

### Monitoring

1. **Key Metrics**
   - Response times
   - Memory usage
   - Client count
   - Quality distribution

2. **Warning Signs**
   - Growing memory usage
   - Increasing latency
   - Error rate spikes
   - Cleanup delays

3. **Resolution Steps**
   - Check logs
   - Monitor resources
   - Adjust parameters
   - Restart if needed 