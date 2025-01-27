# Image Compression Integration Guide

## 1. Installation

### Dependencies
```bash
pip install Pillow==10.1.0 pillow-avif==1.3.1
```

### Import Statements
```python
from dojopool.core.image.compression import (
    ImageCompressionService,
    ImageFormat,
    CompressionConfig,
    BatchProcessingResult
)
```

## 2. Configuration

### Default Configuration
The default configuration includes support for JPEG, WebP, and AVIF formats with memory optimization:

```python
custom_config = {
    'max_dimension': 1024,
    'jpeg_quality': 90,
    'webp_quality': 85,
    'avif_quality': 80,
    'avif_speed': 6,
    'size_variants': {
        'thumbnail': {
            'max_dimension': 150,
            'jpeg_quality': 80,
            'webp_quality': 75,
            'avif_quality': 70,
        },
        'preview': {
            'max_dimension': 500,
            'jpeg_quality': 85,
            'webp_quality': 80,
            'avif_quality': 75,
        }
    },
    'max_threads': 4,
    'chunk_size': 10,
    'avif_threads': 2
}

compression_service = ImageCompressionService(config=custom_config)
```

## 3. Basic Integration Patterns

### Single Image Processing
```python
def process_uploaded_image(upload_data: bytes, output_dir: str) -> dict:
    try:
        # Create compression config
        config = CompressionConfig(
            format=ImageFormat.AVIF,
            quality=85,
            target_size=(800, 600),
            strip_metadata=True
        )
        
        # Process the image
        compressed, mime_type = compression_service.compress_image(
            image_data=upload_data,
            config=config
        )
        
        # Save the compressed image
        output_path = os.path.join(output_dir, f"processed.avif")
        with open(output_path, 'wb') as f:
            f.write(compressed)
        
        return {
            'success': True,
            'path': output_path,
            'mime_type': mime_type,
            'size': len(compressed)
        }
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
```

### Batch Processing
```python
def process_image_directory(input_dir: str, output_dir: str) -> dict:
    try:
        # Process all images in directory
        result = compression_service.batch_compress_directory(
            input_dir=input_dir,
            output_dir=output_dir,
            chunk_size=10  # Optional: override chunk size
        )
        
        # Calculate compression ratio
        if result.total_input_size > 0:
            ratio = (result.total_input_size - result.total_output_size) / result.total_input_size
        else:
            ratio = 0
        
        return {
            'success': True,
            'processed': len(result.successful),
            'failed': len(result.failed),
            'compression_ratio': f"{ratio:.2%}",
            'failed_files': result.failed
        }
    except Exception as e:
        logger.error(f"Error processing directory: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
```

## 4. Web Framework Integration

### Flask Integration
```python
from flask import Flask, request, jsonify
import os

app = Flask(__name__)
compression_service = ImageCompressionService()

@app.route('/api/compress', methods=['POST'])
def compress_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
        
    file = request.files['image']
    if not file.filename:
        return jsonify({'error': 'No filename provided'}), 400
    
    try:
        # Read image data
        image_data = file.read()
        
        # Create compression config
        config = CompressionConfig(
            format=ImageFormat.AVIF,
            quality=85,
            target_size=(800, 600)
        )
        
        # Process the image
        compressed, mime_type = compression_service.compress_image(
            image_data=image_data,
            config=config
        )
        
        # Save the result
        output_path = os.path.join('processed', f"{os.path.splitext(file.filename)[0]}.avif")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(compressed)
        
        return jsonify({
            'success': True,
            'path': output_path,
            'mime_type': mime_type,
            'size': len(compressed)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

### Django Integration
```python
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os

compression_service = ImageCompressionService()

@csrf_exempt
def compress_image(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if 'image' not in request.FILES:
        return JsonResponse({'error': 'No image provided'}, status=400)
    
    try:
        # Read image data
        image_data = request.FILES['image'].read()
        
        # Create compression config
        config = CompressionConfig(
            format=ImageFormat.AVIF,
            quality=85,
            target_size=(800, 600)
        )
        
        # Process the image
        compressed, mime_type = compression_service.compress_image(
            image_data=image_data,
            config=config
        )
        
        # Save the result
        filename = os.path.splitext(request.FILES['image'].name)[0]
        output_path = os.path.join('processed', f"{filename}.avif")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(compressed)
        
        return JsonResponse({
            'success': True,
            'path': output_path,
            'mime_type': mime_type,
            'size': len(compressed)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
```

## 5. Memory Management

### Batch Processing with Memory Monitoring
```python
import psutil
import time

def process_large_directory(input_dir: str, output_dir: str, memory_limit_mb: int = 500):
    process = psutil.Process()
    initial_memory = process.memory_info().rss / (1024 * 1024)  # MB
    
    try:
        # Start with conservative settings
        config = DEFAULT_COMPRESSION_CONFIG.copy()
        config.update({
            'chunk_size': 5,
            'max_threads': 2,
            'avif_threads': 1
        })
        
        service = ImageCompressionService(config=config)
        start_time = time.time()
        
        # Process images
        result = service.batch_compress_directory(
            input_dir=input_dir,
            output_dir=output_dir
        )
        
        # Calculate metrics
        end_time = time.time()
        final_memory = process.memory_info().rss / (1024 * 1024)
        memory_increase = final_memory - initial_memory
        processing_time = end_time - start_time
        
        return {
            'success': True,
            'processed': len(result.successful),
            'failed': len(result.failed),
            'memory_increase_mb': memory_increase,
            'processing_time': processing_time,
            'compression_ratio': (result.total_input_size - result.total_output_size) / result.total_input_size
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

## 6. Error Handling and Logging

### Comprehensive Error Handling
```python
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class ImageProcessingError(Exception):
    """Custom exception for image processing errors."""
    pass

def safe_process_image(
    image_data: bytes,
    format: ImageFormat,
    quality: int,
    target_size: Optional[tuple] = None
) -> Dict[str, Any]:
    try:
        # Validate input
        if not image_data:
            raise ImageProcessingError("Empty image data")
        
        if quality < 1 or quality > 100:
            raise ImageProcessingError(f"Invalid quality value: {quality}")
        
        # Create config
        config = CompressionConfig(
            format=format,
            quality=quality,
            target_size=target_size
        )
        
        # Process image
        compressed, mime_type = compression_service.compress_image(
            image_data=image_data,
            config=config
        )
        
        # Log success
        logger.info(
            "Successfully compressed image: format=%s, quality=%d, size_reduction=%.2f%%",
            format.value,
            quality,
            (1 - len(compressed) / len(image_data)) * 100
        )
        
        return {
            'success': True,
            'data': compressed,
            'mime_type': mime_type,
            'original_size': len(image_data),
            'compressed_size': len(compressed)
        }
        
    except Exception as e:
        logger.error(
            "Failed to process image: %s",
            str(e),
            exc_info=True
        )
        raise ImageProcessingError(f"Image processing failed: {str(e)}")
```

## 7. Performance Monitoring

### Basic Metrics Collection
```python
from dataclasses import dataclass
from datetime import datetime
import statistics

@dataclass
class ProcessingMetrics:
    timestamp: datetime
    processing_time: float
    memory_usage: float
    compression_ratio: float
    format: str

class MetricsCollector:
    def __init__(self, window_size: int = 100):
        self.metrics = []
        self.window_size = window_size
    
    def add_metric(self, metric: ProcessingMetrics):
        self.metrics.append(metric)
        if len(self.metrics) > self.window_size:
            self.metrics.pop(0)
    
    def get_average_metrics(self) -> dict:
        if not self.metrics:
            return {}
        
        return {
            'avg_processing_time': statistics.mean(m.processing_time for m in self.metrics),
            'avg_memory_usage': statistics.mean(m.memory_usage for m in self.metrics),
            'avg_compression_ratio': statistics.mean(m.compression_ratio for m in self.metrics),
            'format_distribution': {
                format: len([m for m in self.metrics if m.format == format])
                for format in set(m.format for m in self.metrics)
            }
        }

# Usage
metrics_collector = MetricsCollector()

def process_with_metrics(image_data: bytes, format: ImageFormat, quality: int) -> dict:
    process = psutil.Process()
    start_time = time.time()
    initial_memory = process.memory_info().rss
    
    try:
        result = safe_process_image(image_data, format, quality)
        
        # Collect metrics
        end_time = time.time()
        final_memory = process.memory_info().rss
        
        metrics_collector.add_metric(ProcessingMetrics(
            timestamp=datetime.now(),
            processing_time=end_time - start_time,
            memory_usage=(final_memory - initial_memory) / (1024 * 1024),
            compression_ratio=1 - result['compressed_size'] / result['original_size'],
            format=format.value
        ))
        
        return result
    except Exception as e:
        logger.error("Processing failed: %s", str(e))
        raise 