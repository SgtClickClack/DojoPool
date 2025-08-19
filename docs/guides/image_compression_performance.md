# Image Compression Performance Guide

## Overview

This guide provides detailed recommendations for optimizing the performance of the Image Compression Service, covering memory management, CPU utilization, and throughput optimization.

## Performance Metrics

### 1. Memory Usage

- Target: < 500MB base memory usage
- Peak: < 1GB during batch processing
- Cleanup: < 50MB memory growth after garbage collection

### 2. Processing Speed

- AVIF: 2-5 images/second (quality-focused)
- WebP: 5-10 images/second (balanced)
- JPEG: 10-20 images/second (speed-focused)

### 3. Compression Ratios

- AVIF: 50-80% size reduction
- WebP: 30-50% size reduction
- JPEG: 20-40% size reduction

## Optimization Strategies

### 1. Memory Management

#### Chunk Size Optimization

```python
def optimize_chunk_size(avg_image_size_mb: float, available_memory_mb: float) -> int:
    """Calculate optimal chunk size based on available memory."""
    # Reserve 20% memory for overhead
    usable_memory = available_memory_mb * 0.8

    # Estimate memory per image (2x for processing overhead)
    memory_per_image = avg_image_size_mb * 2

    # Calculate safe chunk size
    return max(1, int(usable_memory / memory_per_image))

# Usage
import psutil

def get_optimal_config():
    available_memory = psutil.virtual_memory().available / (1024 * 1024)
    avg_image_size = 5  # MB, adjust based on your use case

    return {
        'chunk_size': optimize_chunk_size(avg_image_size, available_memory),
        'max_threads': min(4, psutil.cpu_count()),
        'avif_threads': min(2, psutil.cpu_count())
    }
```

#### Memory Monitoring

```python
def monitor_memory_usage(func):
    """Decorator to monitor memory usage during processing."""
    def wrapper(*args, **kwargs):
        process = psutil.Process()
        initial_memory = process.memory_info().rss

        try:
            result = func(*args, **kwargs)

            final_memory = process.memory_info().rss
            memory_increase = (final_memory - initial_memory) / (1024 * 1024)

            logging.info(f"Memory increase: {memory_increase:.2f}MB")

            if memory_increase > 100:  # MB
                logging.warning("High memory growth detected")
                gc.collect()

            return result
        except Exception as e:
            logging.error(f"Error during processing: {str(e)}")
            gc.collect()
            raise

    return wrapper
```

### 2. CPU Optimization

#### Thread Pool Management

```python
def optimize_thread_pools(image_count: int) -> dict:
    """Calculate optimal thread pool sizes."""
    cpu_count = psutil.cpu_count()

    if image_count < 10:
        return {
            'max_threads': 2,
            'avif_threads': 1
        }
    elif image_count < 50:
        return {
            'max_threads': min(4, cpu_count),
            'avif_threads': min(2, cpu_count)
        }
    else:
        return {
            'max_threads': min(8, cpu_count),
            'avif_threads': min(2, cpu_count)
        }
```

#### Format-Specific Optimization

```python
def optimize_format_settings(format: ImageFormat, priority: str = 'balanced') -> dict:
    """Get optimal settings for specific formats."""
    settings = {
        'quality': {
            'speed': {'avif': 70, 'webp': 75, 'jpeg': 80},
            'balanced': {'avif': 80, 'webp': 80, 'jpeg': 85},
            'quality': {'avif': 90, 'webp': 85, 'jpeg': 90}
        },
        'speed': {
            'speed': {'avif': 8, 'webp': 4, 'jpeg': 1},
            'balanced': {'avif': 6, 'webp': 4, 'jpeg': 1},
            'quality': {'avif': 4, 'webp': 6, 'jpeg': 1}
        }
    }

    format_name = format.value
    return {
        'quality': settings['quality'][priority][format_name],
        'speed': settings['speed'][priority][format_name]
    }
```

### 3. I/O Optimization

#### Buffered Processing

```python
def process_with_buffer(
    input_dir: str,
    output_dir: str,
    buffer_size_mb: int = 100
) -> None:
    """Process images with buffered I/O."""
    buffer_size = buffer_size_mb * 1024 * 1024  # Convert to bytes
    current_buffer = 0
    buffered_files = []

    service = ImageCompressionService()

    for filename in os.listdir(input_dir):
        file_path = os.path.join(input_dir, filename)
        file_size = os.path.getsize(file_path)

        if current_buffer + file_size > buffer_size:
            # Process buffered files
            service.batch_compress_directory(
                input_files=buffered_files,
                output_dir=output_dir
            )

            # Reset buffer
            current_buffer = 0
            buffered_files = []

            # Force garbage collection
            gc.collect()

        buffered_files.append(file_path)
        current_buffer += file_size

    # Process remaining files
    if buffered_files:
        service.batch_compress_directory(
            input_files=buffered_files,
            output_dir=output_dir
        )
```

#### Parallel I/O

```python
from concurrent.futures import ThreadPoolExecutor
from typing import List, Tuple

def parallel_file_processing(
    files: List[str],
    chunk_size: int,
    max_workers: int
) -> List[Tuple[str, bytes]]:
    """Process files in parallel with controlled I/O."""
    def read_file(path: str) -> Tuple[str, bytes]:
        with open(path, 'rb') as f:
            return (path, f.read())

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        return list(executor.map(read_file, files))
```

## Performance Monitoring

### 1. Metrics Collection

```python
from dataclasses import dataclass
from datetime import datetime
import statistics

@dataclass
class PerformanceMetrics:
    timestamp: datetime
    processing_time: float
    memory_usage: float
    compression_ratio: float
    format: str
    image_size: int

class PerformanceMonitor:
    def __init__(self, window_size: int = 100):
        self.metrics = []
        self.window_size = window_size

    def add_metric(self, metric: PerformanceMetrics):
        self.metrics.append(metric)
        if len(self.metrics) > self.window_size:
            self.metrics.pop(0)

    def get_statistics(self) -> dict:
        if not self.metrics:
            return {}

        return {
            'avg_processing_time': statistics.mean(
                m.processing_time for m in self.metrics
            ),
            'avg_memory_usage': statistics.mean(
                m.memory_usage for m in self.metrics
            ),
            'avg_compression_ratio': statistics.mean(
                m.compression_ratio for m in self.metrics
            ),
            'format_distribution': {
                format: len([m for m in self.metrics if m.format == format])
                for format in set(m.format for m in self.metrics)
            },
            'throughput': len(self.metrics) / sum(
                m.processing_time for m in self.metrics
            )
        }
```

### 2. Performance Logging

```python
def log_performance_metrics(func):
    """Decorator to log performance metrics."""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss

        try:
            result = func(*args, **kwargs)

            end_time = time.time()
            end_memory = psutil.Process().memory_info().rss

            metrics = {
                'processing_time': end_time - start_time,
                'memory_usage': (end_memory - start_memory) / (1024 * 1024),
                'success': True
            }

            if hasattr(result, 'total_input_size'):
                metrics['compression_ratio'] = (
                    (result.total_input_size - result.total_output_size)
                    / result.total_input_size
                )

            logging.info(f"Performance metrics: {metrics}")
            return result

        except Exception as e:
            logging.error(f"Performance monitoring error: {str(e)}")
            raise

    return wrapper
```

## Optimization Examples

### 1. High-Throughput Configuration

```python
def configure_for_throughput() -> dict:
    """Configure for maximum throughput."""
    return {
        'max_threads': min(8, psutil.cpu_count()),
        'chunk_size': 20,
        'avif_threads': 1,
        'avif_speed': 8,
        'size_variants': {
            'thumbnail': {
                'max_dimension': 150,
                'jpeg_quality': 80,
                'webp_quality': 75,
                'avif_quality': 70
            },
            'full': {
                'max_dimension': 1024,
                'jpeg_quality': 85,
                'webp_quality': 80,
                'avif_quality': 75
            }
        }
    }
```

### 2. Quality-Focused Configuration

```python
def configure_for_quality() -> dict:
    """Configure for maximum quality."""
    return {
        'max_threads': min(4, psutil.cpu_count()),
        'chunk_size': 10,
        'avif_threads': 2,
        'avif_speed': 4,
        'size_variants': {
            'thumbnail': {
                'max_dimension': 200,
                'jpeg_quality': 85,
                'webp_quality': 80,
                'avif_quality': 75
            },
            'full': {
                'max_dimension': 2048,
                'jpeg_quality': 90,
                'webp_quality': 85,
                'avif_quality': 80
            }
        }
    }
```

### 3. Memory-Efficient Configuration

```python
def configure_for_memory_efficiency() -> dict:
    """Configure for minimum memory usage."""
    return {
        'max_threads': 2,
        'chunk_size': 5,
        'avif_threads': 1,
        'avif_speed': 6,
        'size_variants': {
            'thumbnail': {
                'max_dimension': 150,
                'jpeg_quality': 80,
                'webp_quality': 75,
                'avif_quality': 70
            },
            'full': {
                'max_dimension': 1024,
                'jpeg_quality': 85,
                'webp_quality': 80,
                'avif_quality': 75
            }
        }
    }
```

## Troubleshooting Performance Issues

### 1. Memory Leaks

- Monitor memory growth over time
- Check for unclosed files or resources
- Verify garbage collection effectiveness
- Profile memory usage patterns

### 2. CPU Bottlenecks

- Monitor CPU usage per thread
- Check for thread contention
- Verify thread pool sizing
- Profile CPU-intensive operations

### 3. I/O Bottlenecks

- Monitor disk I/O rates
- Check for file handle limits
- Verify buffer sizes
- Profile I/O patterns

### 4. Quality vs Speed

- Monitor compression ratios
- Check processing times
- Verify format selection
- Profile quality settings impact

```

```
