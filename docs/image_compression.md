# Image Compression Pipeline Documentation

## Overview
The Image Compression Pipeline is a high-performance system for processing, optimizing, and converting images. It supports multiple formats, size variants, and parallel processing capabilities.

## Features
- Multiple size variant generation (thumbnail, preview, full)
- WebP conversion with configurable quality settings
- Parallel processing for batch operations
- Transparent handling of RGBA images
- Configurable output directory structure
- Memory-efficient chunk processing

## Installation
Ensure you have the required dependencies installed:
```bash
pip install Pillow==10.1.0
```

## Configuration
The compression pipeline is configurable through a dictionary-based configuration system. Default settings are provided in `compression_config.py`.

### Default Configuration
```python
DEFAULT_COMPRESSION_CONFIG = {
    'max_dimension': 2048,      # Maximum dimension for any side
    'jpeg_quality': 85,         # JPEG compression quality (0-100)
    'webp_quality': 80,         # WebP compression quality (0-100)
    'webp_lossless': False,     # Whether to use lossless WebP
    
    # Size variants configuration
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
    },
    
    'convert_to_webp': True,    # Generate WebP versions
    'keep_original': True,      # Keep original format
    'max_threads': 4,           # Concurrent compression threads
    'chunk_size': 10,          # Images per batch
    
    'output_structure': {
        'use_subdirs': True,    # Use subdirectories
        'variant_subdir': True, # Variants in subdirectories
    }
}
```

## Usage

### Basic Usage
```python
from dojopool.services.image_compression import ImageCompressionService

# Initialize with default settings
compression_service = ImageCompressionService()

# Compress a single image
result = compression_service.compress_image(
    input_path='path/to/image.jpg',
    output_dir='path/to/output',
    filename='processed_image'
)

# Batch compress a directory
results = compression_service.batch_compress_directory(
    input_dir='path/to/images',
    output_dir='path/to/output'
)
```

### Custom Configuration
```python
custom_config = {
    'max_dimension': 1024,
    'jpeg_quality': 90,
    'webp_quality': 85,
    'size_variants': {
        'thumbnail': {'max_dimension': 200, 'jpeg_quality': 85, 'webp_quality': 80},
        'full': {'max_dimension': 1024, 'jpeg_quality': 90, 'webp_quality': 85}
    }
}

compression_service = ImageCompressionService(config=custom_config)
```

## API Reference

### ImageCompressionService

#### `__init__(config: Optional[Dict[str, Any]] = None)`
Initialize the compression service with optional custom configuration.

#### `compress_image(input_path: str, output_dir: str, filename: str) -> Dict[str, Dict[str, str]]`
Compress a single image with all configured size variants.

**Arguments:**
- `input_path`: Path to the input image file
- `output_dir`: Base directory for output
- `filename`: Original filename without extension

**Returns:**
Dictionary of variant paths by format:
```python
{
    'thumbnail': {
        'jpeg': 'path/to/thumbnail.jpg',
        'webp': 'path/to/thumbnail.webp'
    },
    'preview': {
        'jpeg': 'path/to/preview.jpg',
        'webp': 'path/to/preview.webp'
    },
    'full': {
        'jpeg': 'path/to/full.jpg',
        'webp': 'path/to/full.webp'
    }
}
```

#### `batch_compress_directory(input_dir: str, output_dir: str) -> List[Dict[str, Dict[str, str]]]`
Compress all images in a directory using parallel processing.

**Arguments:**
- `input_dir`: Directory containing input images
- `output_dir`: Directory to save compressed images

**Returns:**
List of compression results for each image, following the same format as `compress_image`.

## Performance Considerations

### Memory Usage
- Images are processed in chunks to manage memory usage
- Each chunk is processed in parallel using a thread pool
- Default chunk size is 10 images
- Maximum concurrent threads is 4 by default

### Optimization
- JPEG compression uses optimize=True for better compression
- WebP compression uses method=6 for highest compression effort
- Images are resized using LANCZOS resampling for best quality
- RGBA images are handled appropriately for each format

## Error Handling
The service includes comprehensive error handling:
- Invalid image files are detected and reported
- Missing files or directories trigger appropriate exceptions
- Processing errors are logged with detailed information
- Failed items in batch processing don't stop the entire batch

## Best Practices
1. **Memory Management**
   - Adjust `chunk_size` based on your average image size
   - Monitor memory usage and adjust `max_threads` accordingly

2. **Quality Settings**
   - Use lower quality for thumbnails (75-80)
   - Use higher quality for full-size images (85-90)
   - Enable WebP for better compression with transparency support

3. **Directory Structure**
   - Use subdirectories for better organization
   - Keep variants in separate directories for easier management

4. **Error Handling**
   - Always wrap compression calls in try-except blocks
   - Log errors for debugging
   - Implement retry logic for failed items in production

## Examples

### Processing with Custom Size Variants
```python
config = DEFAULT_COMPRESSION_CONFIG.copy()
config['size_variants'] = {
    'small': {
        'max_dimension': 300,
        'jpeg_quality': 80,
        'webp_quality': 75,
    },
    'medium': {
        'max_dimension': 800,
        'jpeg_quality': 85,
        'webp_quality': 80,
    }
}

service = ImageCompressionService(config=config)
result = service.compress_image('input.jpg', 'output', 'processed')
```

### Batch Processing with Progress Tracking
```python
import tqdm

service = ImageCompressionService()
results = []

# Get list of files
files = [f for f in os.listdir(input_dir) 
         if f.lower().endswith(('.jpg', '.png', '.webp'))]

# Process with progress bar
for file in tqdm.tqdm(files, desc="Processing images"):
    result = service.compress_image(
        os.path.join(input_dir, file),
        output_dir,
        os.path.splitext(file)[0]
    )
    results.append(result)
``` 