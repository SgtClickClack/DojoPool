# Image Compression Integration Guide

## Overview
This guide provides step-by-step instructions for integrating the Image Compression Service into your application. The service supports AVIF, WebP, and JPEG formats with memory-efficient batch processing capabilities.

## Prerequisites
- Python 3.8 or higher
- Pillow 10.1.0 or higher
- pillow-avif 1.3.1 or higher

## Installation

1. Install required packages:
```bash
pip install Pillow==10.1.0 pillow-avif==1.3.1
```

2. Import required modules:
```python
from dojopool.core.image.compression import (
    ImageCompressionService,
    ImageFormat,
    CompressionConfig,
    BatchProcessingResult
)
```

## Basic Integration

### 1. Single Image Processing

```python
def process_single_image(input_path: str, output_path: str) -> bool:
    try:
        # Initialize service
        service = ImageCompressionService()
        
        # Read input image
        with open(input_path, 'rb') as f:
            image_data = f.read()
        
        # Create compression config
        config = CompressionConfig(
            format=ImageFormat.AVIF,
            quality=85,
            target_size=(800, 600),
            strip_metadata=True
        )
        
        # Process image
        compressed, mime_type = service.compress_image(image_data, config)
        
        # Save result
        with open(output_path, 'wb') as f:
            f.write(compressed)
            
        return True
    except Exception as e:
        logging.error(f"Error processing image: {str(e)}")
        return False
```

### 2. Batch Processing

```python
def process_image_directory(input_dir: str, output_dir: str) -> dict:
    try:
        # Initialize service with custom config
        config = {
            'max_threads': 4,
            'chunk_size': 10,
            'avif_quality': 85,
            'size_variants': {
                'thumbnail': {'max_dimension': 150},
                'full': {'max_dimension': 1024}
            }
        }
        service = ImageCompressionService(config=config)
        
        # Process directory
        result = service.batch_compress_directory(
            input_dir=input_dir,
            output_dir=output_dir
        )
        
        # Calculate statistics
        compression_ratio = (
            (result.total_input_size - result.total_output_size) 
            / result.total_input_size
        ) if result.total_input_size > 0 else 0
        
        return {
            'success': True,
            'processed': len(result.successful),
            'failed': len(result.failed),
            'compression_ratio': f"{compression_ratio:.2%}",
            'failed_files': result.failed
        }
    except Exception as e:
        logging.error(f"Error processing directory: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
```

## Web Framework Integration

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
        
        # Configure compression
        config = CompressionConfig(
            format=ImageFormat.AVIF,
            quality=85,
            target_size=(800, 600)
        )
        
        # Process image
        compressed, mime_type = compression_service.compress_image(
            image_data=image_data,
            config=config
        )
        
        # Save result
        output_path = os.path.join(
            'processed',
            f"{os.path.splitext(file.filename)[0]}.avif"
        )
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

@app.route('/api/compress/batch', methods=['POST'])
def batch_compress():
    if 'input_dir' not in request.form:
        return jsonify({'error': 'No input directory specified'}), 400
        
    input_dir = request.form['input_dir']
    output_dir = request.form.get('output_dir', 'processed')
    
    try:
        result = compression_service.batch_compress_directory(
            input_dir=input_dir,
            output_dir=output_dir
        )
        
        return jsonify({
            'success': True,
            'processed': len(result.successful),
            'failed': len(result.failed),
            'compression_ratio': (
                (result.total_input_size - result.total_output_size)
                / result.total_input_size
            ) if result.total_input_size > 0 else 0
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

### FastAPI Integration

```python
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import shutil
import os

app = FastAPI()
compression_service = ImageCompressionService()

@app.post("/api/compress")
async def compress_image(file: UploadFile = File(...)):
    try:
        # Read image data
        image_data = await file.read()
        
        # Configure compression
        config = CompressionConfig(
            format=ImageFormat.AVIF,
            quality=85,
            target_size=(800, 600)
        )
        
        # Process image
        compressed, mime_type = compression_service.compress_image(
            image_data=image_data,
            config=config
        )
        
        # Save result
        output_path = os.path.join(
            'processed',
            f"{os.path.splitext(file.filename)[0]}.avif"
        )
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'wb') as f:
            f.write(compressed)
        
        return {
            'success': True,
            'path': output_path,
            'mime_type': mime_type,
            'size': len(compressed)
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={'success': False, 'error': str(e)}
        )

@app.post("/api/compress/batch")
async def batch_compress(
    input_dir: str = Form(...),
    output_dir: str = Form('processed')
):
    try:
        result = compression_service.batch_compress_directory(
            input_dir=input_dir,
            output_dir=output_dir
        )
        
        return {
            'success': True,
            'processed': len(result.successful),
            'failed': len(result.failed),
            'compression_ratio': (
                (result.total_input_size - result.total_output_size)
                / result.total_input_size
            ) if result.total_input_size > 0 else 0
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={'success': False, 'error': str(e)}
        )
```

## Advanced Integration

### Memory-Optimized Processing

```python
def process_large_directory(
    input_dir: str,
    output_dir: str,
    memory_limit_mb: int = 500
) -> dict:
    try:
        # Configure for memory efficiency
        config = {
            'max_threads': 2,        # Reduce thread count
            'chunk_size': 5,         # Process smaller chunks
            'avif_threads': 1,       # Single-threaded AVIF encoding
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
        
        service = ImageCompressionService(config=config)
        
        # Process directory
        result = service.batch_compress_directory(
            input_dir=input_dir,
            output_dir=output_dir
        )
        
        return {
            'success': True,
            'processed': len(result.successful),
            'failed': len(result.failed),
            'compression_ratio': (
                (result.total_input_size - result.total_output_size)
                / result.total_input_size
            ) if result.total_input_size > 0 else 0
        }
    except Exception as e:
        logging.error(f"Error processing directory: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
```

### Progress Tracking

```python
from tqdm import tqdm
import os

def process_with_progress(input_dir: str, output_dir: str) -> dict:
    try:
        # Get list of files to process
        files = [f for f in os.listdir(input_dir) 
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
        
        # Initialize progress bar
        with tqdm(total=len(files), desc="Processing images") as pbar:
            result = compression_service.batch_compress_directory(
                input_dir=input_dir,
                output_dir=output_dir
            )
            pbar.update(len(result.successful))
        
        return {
            'success': True,
            'processed': len(result.successful),
            'failed': len(result.failed),
            'compression_ratio': (
                (result.total_input_size - result.total_output_size)
                / result.total_input_size
            ) if result.total_input_size > 0 else 0
        }
    except Exception as e:
        logging.error(f"Error processing directory: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
```

## Best Practices

### 1. Memory Management
- Use appropriate chunk sizes based on image sizes
- Monitor memory usage during processing
- Clean up temporary files
- Use garbage collection between batches

### 2. Error Handling
- Implement proper exception handling
- Log errors with context
- Clean up resources in case of failures
- Implement retry mechanisms for transient errors

### 3. Performance Optimization
- Adjust thread counts based on system capabilities
- Use appropriate quality settings
- Monitor processing times
- Implement progress tracking for long operations

### 4. Format Selection
- Use AVIF for best compression
- Provide WebP fallback
- Keep JPEG for compatibility
- Consider browser support

## Troubleshooting

### Common Issues

1. **Memory Usage**
   - Symptom: High memory consumption
   - Solution: Reduce chunk size, decrease thread count
   
2. **Slow Processing**
   - Symptom: Long processing times
   - Solution: Adjust thread counts, optimize quality settings
   
3. **Failed Conversions**
   - Symptom: Images fail to process
   - Solution: Check input format support, validate image data

### Monitoring

1. **Memory Usage**
```python
import psutil

def monitor_memory():
    process = psutil.Process()
    return process.memory_info().rss / (1024 * 1024)  # MB
```

2. **Processing Time**
```python

@app.after_request
def add_security_headers(response):
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response

from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["example.com"])
app.add_middleware(HTTPSRedirectMiddleware)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response
import time

def monitor_processing_time(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        processing_time = end_time - start_time
        logging.info(f"Processing time: {processing_time:.2f} seconds")
        return result
    return wrapper
```

## Security Considerations

1. **Input Validation**
   - Validate file types
   - Check file sizes
   - Sanitize filenames
   
2. **Output Directory**
   - Use secure paths
   - Set proper permissions
   - Clean up temporary files

3. **Resource Limits**
   - Set maximum file sizes
   - Limit concurrent processes
   - Monitor resource usage
``` 