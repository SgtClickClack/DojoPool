# Image Compression Pipeline Integration Guide

## Introduction
This guide will help you integrate the Image Compression Pipeline into your application. The pipeline provides efficient image processing capabilities with support for multiple formats, size variants, and parallel processing.

## Prerequisites
- Python 3.7 or higher
- Pillow 10.1.0 or higher
- Sufficient disk space for processed images
- (Optional) WebP support in your target environment

## Step-by-Step Integration

### 1. Basic Setup

#### Install Dependencies
```bash
pip install Pillow==10.1.0
```

#### Import Required Modules
```python
from dojopool.services.image_compression import ImageCompressionService
from dojopool.config.compression_config import DEFAULT_COMPRESSION_CONFIG
```

### 2. Configuration Setup

#### Default Configuration
The default configuration works well for most use cases:
```python
compression_service = ImageCompressionService()
```

#### Custom Configuration
For specific requirements, create a custom configuration:
```python
custom_config = {
    'max_dimension': 1024,
    'jpeg_quality': 90,
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

compression_service = ImageCompressionService(config=custom_config)
```

### 3. Basic Integration Patterns

#### Single Image Processing
```python
def process_uploaded_image(upload_path: str, output_dir: str) -> dict:
    try:
        # Generate a unique filename
        filename = f"img_{int(time.time())}"
        
        # Process the image
        result = compression_service.compress_image(
            input_path=upload_path,
            output_dir=output_dir,
            filename=filename
        )
        
        return {
            'success': True,
            'variants': result
        }
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
```

#### Batch Processing
```python
def process_image_directory(input_dir: str, output_dir: str) -> dict:
    try:
        # Process all images in directory
        results = compression_service.batch_compress_directory(
            input_dir=input_dir,
            output_dir=output_dir
        )
        
        # Count successes and failures
        successes = len([r for r in results if r is not None])
        failures = len([r for r in results if r is None])
        
        return {
            'success': True,
            'total_processed': len(results),
            'successful': successes,
            'failed': failures,
            'results': results
        }
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
```

### 4. Web Framework Integration

#### Flask Integration
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
        
    # Save uploaded file temporarily
    temp_path = os.path.join('uploads', file.filename)
    file.save(temp_path)
    
    try:
        # Process the image
        result = compression_service.compress_image(
            temp_path,
            'processed',
            os.path.splitext(file.filename)[0]
        )
        
        # Clean up temporary file
        os.remove(temp_path)
        
        return jsonify({
            'success': True,
            'variants': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

#### Django Integration
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
        
    image_file = request.FILES['image']
    
    # Save uploaded file temporarily
    temp_path = os.path.join('uploads', image_file.name)
    with open(temp_path, 'wb+') as destination:
        for chunk in image_file.chunks():
            destination.write(chunk)
    
    try:
        # Process the image
        result = compression_service.compress_image(
            temp_path,
            'processed',
            os.path.splitext(image_file.name)[0]
        )
        
        # Clean up temporary file
        os.remove(temp_path)
        
        return JsonResponse({
            'success': True,
            'variants': result
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
```

### 5. Advanced Integration Patterns

#### Background Processing with Celery
```python
from celery import Celery
from typing import Dict, Any

app = Celery('tasks', broker='redis://localhost:6379/0')
compression_service = ImageCompressionService()

@app.task
def compress_image_task(input_path: str, 
                       output_dir: str, 
                       filename: str) -> Dict[str, Any]:
    try:
        result = compression_service.compress_image(
            input_path=input_path,
            output_dir=output_dir,
            filename=filename
        )
        
        return {
            'success': True,
            'variants': result
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Usage in your application
task = compress_image_task.delay(
    input_path='uploads/image.jpg',
    output_dir='processed',
    filename='processed_image'
)
```

#### Webhook Integration
```python
import requests
from typing import Dict, Any

def process_and_notify(input_path: str, 
                      output_dir: str, 
                      filename: str,
                      webhook_url: str) -> None:
    try:
        # Process image
        result = compression_service.compress_image(
            input_path=input_path,
            output_dir=output_dir,
            filename=filename
        )
        
        # Prepare webhook payload
        payload = {
            'success': True,
            'filename': filename,
            'variants': result
        }
    except Exception as e:
        payload = {
            'success': False,
            'filename': filename,
            'error': str(e)
        }
    
    # Send webhook notification
    try:
        response = requests.post(webhook_url, json=payload)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send webhook: {str(e)}")
```

### 6. Error Handling and Logging

#### Comprehensive Error Handling
```python
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class ImageProcessor:
    def __init__(self):
        self.compression_service = ImageCompressionService()
    
    def process_image(self,
                     input_path: str,
                     output_dir: str,
                     filename: str) -> Dict[str, Any]:
        try:
            # Validate input
            if not os.path.exists(input_path):
                raise FileNotFoundError(f"Input file not found: {input_path}")
            
            # Ensure output directory exists
            os.makedirs(output_dir, exist_ok=True)
            
            # Process image
            result = self.compression_service.compress_image(
                input_path=input_path,
                output_dir=output_dir,
                filename=filename
            )
            
            # Log success
            logger.info(f"Successfully processed image: {filename}")
            
            return {
                'success': True,
                'variants': result
            }
            
        except FileNotFoundError as e:
            logger.error(f"File error: {str(e)}")
            return {
                'success': False,
                'error': 'File not found',
                'details': str(e)
            }
            
        except Exception as e:
            logger.error(f"Processing error for {filename}: {str(e)}")
            return {
                'success': False,
                'error': 'Processing failed',
                'details': str(e)
            }
```

### 7. Testing Integration

#### Unit Testing
```python
import pytest
from unittest.mock import Mock, patch

def test_image_processor():
    # Mock compression service
    mock_service = Mock()
    mock_service.compress_image.return_value = {
        'thumbnail': {'jpeg': 'path/to/thumb.jpg'},
        'preview': {'jpeg': 'path/to/preview.jpg'}
    }
    
    # Create processor with mock service
    processor = ImageProcessor()
    processor.compression_service = mock_service
    
    # Test successful processing
    result = processor.process_image(
        'test.jpg',
        'output',
        'test'
    )
    
    assert result['success'] is True
    assert 'variants' in result
    
    # Test file not found
    result = processor.process_image(
        'nonexistent.jpg',
        'output',
        'test'
    )
    
    assert result['success'] is False
    assert result['error'] == 'File not found'
```

## Best Practices

### 1. Memory Management
- Process large batches in smaller chunks
- Monitor memory usage during processing
- Clean up temporary files promptly

### 2. Error Handling
- Implement comprehensive error handling
- Log errors with sufficient context
- Provide meaningful error messages to users

### 3. Performance
- Use background processing for large files
- Implement caching where appropriate
- Monitor processing times and optimize as needed

### 4. Security
- Validate input files before processing
- Sanitize filenames
- Implement proper access controls

## Troubleshooting

### Common Issues and Solutions

1. **Memory Issues**
   - Reduce chunk size
   - Decrease max_threads
   - Process larger images individually

2. **Performance Issues**
   - Enable parallel processing
   - Optimize quality settings
   - Use appropriate size variants

3. **Quality Issues**
   - Adjust quality settings
   - Use appropriate resampling method
   - Check input image quality

4. **Integration Issues**
   - Verify file permissions
   - Check path configurations
   - Validate input/output handling 