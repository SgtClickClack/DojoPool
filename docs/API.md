# DojoPool API Documentation

## System Integration API

The DojoPool system provides a comprehensive API for managing and monitoring integrated WebGL context, memory, worker pool, and texture systems.

### SystemIntegrator

The main integration point for all DojoPool systems.

#### Initialization

```python
integrator = SystemIntegrator()
```

Creates a new system integrator instance with default configurations for all subsystems.

#### Core Methods

##### Start/Stop

```python
await integrator.start()
await integrator.stop()
```

Start or stop all integrated systems. Systems are started and stopped in the correct order to maintain dependencies.

##### System Status

```python
status = integrator.get_system_status()
```

Returns a comprehensive status of all systems including:
- System health status
- Memory metrics
- Context status
- Worker metrics
- Texture metrics
- Performance metrics

##### Resource Optimization

```python
await integrator.optimize_resources()
```

Triggers optimization across all systems:
- Worker pool scaling
- Memory cleanup
- Texture page eviction
- Resource reallocation

### Memory Management API

#### Memory Profiler

```python
memory_metrics = integrator.memory_profiler.get_metrics()
```

Returns memory usage metrics including:
- Current usage
- Peak usage
- Spike count
- System memory pressure

#### Context Manager

```python
context_status = integrator.context_manager.get_status()
```

Provides WebGL context status:
- Health status
- Resource usage
- Performance metrics
- Recovery statistics

### Worker Pool API

#### Task Management

```python
task_id = await integrator.worker_pool.submit_task(
    payload={"task": "data"},
    priority=TaskPriority.HIGH
)
```

Submit tasks to the worker pool with priorities:
- LOW
- MEDIUM
- HIGH
- CRITICAL

#### Worker Management

```python
worker_stats = integrator.worker_pool.get_worker_stats(worker_id)
```

Get statistics for specific workers:
- Status
- Task count
- Error count
- Resource usage

### Texture System API

#### Compression

```python
result = await integrator.texture_compression.compress_texture(
    image_data,
    compression_profile
)
```

Compress textures with configurable profiles:
- Format selection
- Quality settings
- Device tier optimization
- Performance metrics

#### Virtual Texturing

```python
texture_id = await integrator.virtual_texturing.create_texture(width, height)
```

Manage virtual textures:
- Page table management
- Memory mapping
- Cache optimization
- Priority management

### Performance Monitoring API

#### Metrics Collection

```python
metrics = integrator.performance_monitor.get_metrics()
```

Get comprehensive performance metrics:
- FPS
- Frame time
- Memory usage
- GPU utilization
- Cache hit rates

#### Alerting

```python
alerts = integrator.performance_monitor.get_alerts(
    severity=AlertSeverity.WARNING,
    acknowledged=False
)
```

Monitor system alerts:
- Multiple severity levels
- Customizable thresholds
- Alert acknowledgment
- Historical tracking

## Best Practices

### Resource Management

1. Monitor system health regularly
2. Handle alerts promptly
3. Optimize resources proactively
4. Scale workers based on load
5. Manage texture memory carefully

### Performance Optimization

1. Use appropriate compression formats
2. Monitor memory usage
3. Handle context loss gracefully
4. Optimize worker task distribution
5. Implement proper error handling

### Mobile Considerations

1. Use device-appropriate settings
2. Monitor battery impact
3. Optimize texture quality
4. Handle resource constraints
5. Implement proper fallbacks

## Error Handling

### System Errors

```python
try:
    await integrator.start()
except Exception as e:
    logger.error(f"System start failed: {str(e)}")
```

Handle various error types:
- Initialization errors
- Resource errors
- Context loss
- Worker failures
- Memory issues

### Recovery Strategies

1. Automatic context recovery
2. Worker pool scaling
3. Memory cleanup
4. Resource optimization
5. Error logging and monitoring

## Configuration

### System Configuration

```python
config = {
    "memory_threshold": 85.0,
    "cpu_threshold": 80.0,
    "monitoring_interval": 1000,
    "auto_recovery": True
}
```

Configurable parameters:
- Resource thresholds
- Monitoring intervals
- Recovery settings
- Performance targets

### Performance Tuning

1. Worker pool size
2. Memory thresholds
3. Texture quality
4. Monitoring frequency
5. Alert thresholds

## Integration Examples

### Basic Integration

```python
# Initialize system
integrator = SystemIntegrator()
await integrator.start()

# Submit work
task_id = await integrator.worker_pool.submit_task(payload)

# Monitor performance
metrics = integrator.get_system_status()

# Cleanup
await integrator.stop()
```

### Advanced Usage

```python
# Configure systems
integrator = SystemIntegrator()
await integrator.start()

# Monitor and optimize
while running:
    status = integrator.get_system_status()
    if status["system_health"]["issues"]:
        await integrator.optimize_resources()
    
    # Process alerts
    alerts = integrator.performance_monitor.get_alerts()
    for alert in alerts:
        handle_alert(alert)
    
    await asyncio.sleep(5)
```

## Versioning and Updates

The API follows semantic versioning:
- MAJOR version for incompatible changes
- MINOR version for new features
- PATCH version for bug fixes

## Support and Resources

- GitHub repository
- Documentation updates
- Issue tracking
- Community support
- Performance guides 