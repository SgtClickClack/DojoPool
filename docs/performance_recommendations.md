# Image Compression Pipeline Performance Recommendations

## Overview

This document provides detailed recommendations for optimizing the performance of the Image Compression Pipeline in various deployment scenarios.

## Performance Metrics

### Current Benchmarks

- Average compression time: 200-300ms per image (single thread)
- Parallel processing improvement: 2.5-3x speedup with 4 threads
- Memory usage: ~30MB per image during processing
- Compression ratios:
  - JPEG: 60-80% reduction
  - WebP: 70-85% reduction with similar quality

## Hardware Recommendations

### Minimum Requirements

- CPU: 2 cores
- RAM: 4GB
- Storage: SSD recommended for I/O intensive operations

### Recommended Specifications

- CPU: 4+ cores for parallel processing
- RAM: 8GB+ for batch processing
- Storage: NVMe SSD for optimal I/O performance

## Configuration Optimization

### Memory Usage

#### Low Memory Environment (4GB RAM)

```python
config = {
    'max_threads': 2,
    'chunk_size': 5,
    'size_variants': {
        'thumbnail': {
            'max_dimension': 150,
            'jpeg_quality': 80,
            'webp_quality': 75,
        },
        'preview': {
            'max_dimension': 500,
            'jpeg_quality': 85,
            'webp_quality': 80,
        }
    }
}
```

#### High Memory Environment (16GB+ RAM)

```python
config = {
    'max_threads': 8,
    'chunk_size': 20,
    'size_variants': {
        'thumbnail': {
            'max_dimension': 150,
            'jpeg_quality': 80,
            'webp_quality': 75,
        },
        'preview': {
            'max_dimension': 500,
            'jpeg_quality': 85,
            'webp_quality': 80,
        },
        'full': {
            'max_dimension': 2048,
            'jpeg_quality': 90,
            'webp_quality': 85,
        }
    }
}
```

### CPU Utilization

#### Thread Count Guidelines

- Single Core: `max_threads = 1`
- Dual Core: `max_threads = 2`
- Quad Core: `max_threads = 4`
- 8+ Cores: `max_threads = cores - 2` (leave resources for system)

#### Chunk Size Guidelines

- Low Memory: 5-10 images per chunk
- Medium Memory: 10-20 images per chunk
- High Memory: 20-30 images per chunk

## Optimization Strategies

### 1. Batch Processing Optimization

#### Sequential vs Parallel Processing

```python
# Sequential processing for small batches
if len(images) < 5:
    for image in images:
        process_single_image(image)

# Parallel processing for larger batches
else:
    process_image_batch(images)
```

#### Memory-Aware Batch Sizing

```python
import psutil

def get_optimal_chunk_size():
    available_memory = psutil.virtual_memory().available
    memory_per_image = 30 * 1024 * 1024  # 30MB estimate
    return min(
        max(5, available_memory // (memory_per_image * 2)),  # Leave 50% buffer
        20  # Maximum chunk size
    )

config['chunk_size'] = get_optimal_chunk_size()
```

### 2. Image Size Optimization

#### Progressive Loading Strategy

```python
def process_with_progressive_loading(image_path):
    # First, generate thumbnail quickly
    thumbnail_result = compression_service.compress_image(
        image_path,
        output_dir,
        filename,
        variants=['thumbnail']
    )

    # Then process larger variants in background
    full_process_task = background_tasks.process_full_image.delay(
        image_path,
        output_dir,
        filename
    )

    return {
        'thumbnail': thumbnail_result,
        'task_id': full_process_task.id
    }
```

#### Adaptive Quality Settings

```python
def get_optimal_quality(file_size_bytes):
    """Adjust quality based on input file size"""
    size_mb = file_size_bytes / (1024 * 1024)

    if size_mb < 1:
        return {'jpeg_quality': 85, 'webp_quality': 80}
    elif size_mb < 5:
        return {'jpeg_quality': 80, 'webp_quality': 75}
    else:
        return {'jpeg_quality': 75, 'webp_quality': 70}
```

### 3. Storage Optimization

#### Efficient Directory Structure

```python
def create_optimized_directory_structure(base_path):
    """Create an efficient directory structure for image storage"""
    # Create date-based directories
    today = datetime.now().strftime('%Y/%m/%d')
    path = os.path.join(base_path, today)

    # Create subdirectories for variants
    variants = ['thumbnail', 'preview', 'full']
    for variant in variants:
        os.makedirs(os.path.join(path, variant), exist_ok=True)

    return path
```

#### Cleanup Strategy

```python
def implement_storage_cleanup():
    """Implement regular cleanup of temporary and processed files"""
    # Clean temporary files older than 1 hour
    temp_dir = 'uploads/temp'
    threshold = time.time() - 3600

    for file in os.listdir(temp_dir):
        file_path = os.path.join(temp_dir, file)
        if os.path.getctime(file_path) < threshold:
            os.remove(file_path)
```

## Monitoring and Optimization

### 1. Performance Monitoring

#### Basic Metrics Collection

```python
import time
from dataclasses import dataclass
from typing import Dict

@dataclass
class ProcessingMetrics:
    processing_time: float
    input_size: int
    output_size: int
    compression_ratio: float

def process_with_metrics(image_path: str) -> Dict:
    start_time = time.time()
    input_size = os.path.getsize(image_path)

    # Process image
    result = compression_service.compress_image(
        image_path,
        output_dir,
        filename
    )

    # Calculate metrics
    processing_time = time.time() - start_time
    output_size = sum(
        os.path.getsize(path)
        for variant in result.values()
        for path in variant.values()
    )

    metrics = ProcessingMetrics(
        processing_time=processing_time,
        input_size=input_size,
        output_size=output_size,
        compression_ratio=(input_size - output_size) / input_size
    )

    return {'result': result, 'metrics': metrics}
```

#### Advanced Monitoring

```python
from prometheus_client import Counter, Histogram

PROCESSING_TIME = Histogram(
    'image_processing_seconds',
    'Time spent processing images',
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0]
)

COMPRESSION_RATIO = Histogram(
    'image_compression_ratio',
    'Image compression ratio achieved',
    buckets=[0.3, 0.5, 0.7, 0.9]
)

def process_with_monitoring(image_path):
    with PROCESSING_TIME.time():
        result = compression_service.compress_image(
            image_path,
            output_dir,
            filename
        )

    # Record compression ratio
    input_size = os.path.getsize(image_path)
    output_size = sum(
        os.path.getsize(path)
        for variant in result.values()
        for path in variant.values()
    )
    ratio = (input_size - output_size) / input_size
    COMPRESSION_RATIO.observe(ratio)

    return result
```

### 2. Performance Tuning

#### Adaptive Configuration

```python
class AdaptiveCompressionService:
    def __init__(self):
        self.base_config = DEFAULT_COMPRESSION_CONFIG
        self.metrics_window = []

    def update_config_based_on_metrics(self):
        """Adjust configuration based on recent performance metrics"""
        if len(self.metrics_window) < 10:
            return

        avg_processing_time = sum(m.processing_time
                                for m in self.metrics_window) / len(self.metrics_window)

        # Adjust thread count if processing is slow
        if avg_processing_time > 1.0:  # More than 1 second per image
            self.base_config['max_threads'] = min(
                self.base_config['max_threads'] + 1,
                8  # Maximum threads
            )

        # Adjust chunk size based on memory usage
        memory_usage = psutil.virtual_memory().percent
        if memory_usage > 80:
            self.base_config['chunk_size'] = max(
                self.base_config['chunk_size'] - 2,
                5  # Minimum chunk size
            )
```

## Best Practices Summary

### Performance Optimization Checklist

1. **Hardware Configuration**
   - [ ] Verify CPU core count and adjust thread count
   - [ ] Monitor memory usage and adjust chunk size
   - [ ] Use SSD storage for better I/O performance

2. **Software Configuration**
   - [ ] Optimize quality settings for your use case
   - [ ] Configure appropriate number of size variants
   - [ ] Enable WebP conversion for supported clients

3. **Monitoring**
   - [ ] Implement basic metrics collection
   - [ ] Set up performance monitoring
   - [ ] Regular review of performance metrics

4. **Maintenance**
   - [ ] Regular cleanup of temporary files
   - [ ] Monitor disk space usage
   - [ ] Update configuration based on metrics

### Common Performance Pitfalls

1. **Memory Leaks**
   - Not closing file handles
   - Keeping too many images in memory
   - Not cleaning up temporary files

2. **CPU Bottlenecks**
   - Too many concurrent threads
   - Processing unnecessarily large images
   - Inefficient quality settings

3. **I/O Bottlenecks**
   - Slow storage devices
   - Inefficient directory structure
   - Too many small files

4. **Configuration Issues**
   - Suboptimal thread count
   - Too large chunk sizes
   - Unnecessary size variants
