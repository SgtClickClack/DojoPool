# Image Compression Pipeline Documentation

## Overview

The Image Compression Pipeline is a high-performance system for processing, optimizing, and converting images. It supports multiple formats, size variants, and parallel processing capabilities with memory optimization.

## Features

- Multiple size variant generation (thumbnail, preview, full)
- AVIF, WebP, and JPEG format support with configurable quality settings
- Parallel processing for batch operations with memory optimization
- Transparent handling of RGBA images
- Configurable output directory structure
- Memory-efficient chunk processing
- Automatic garbage collection between batches

## Installation

Ensure you have the required dependencies installed:

```bash
pip install Pillow==10.1.0 pillow-avif==1.3.1
```

## Configuration

The compression pipeline is configurable through a dictionary-based configuration system. Default settings are provided in `compression_config.py`.

### Default Configuration

```python
DEFAULT_COMPRESSION_CONFIG = {
    'max_dimension': 2048,      # Maximum dimension for any side
    'jpeg_quality': 85,         # JPEG compression quality (0-100)
    'webp_quality': 80,         # WebP compression quality (0-100)
    'avif_quality': 75,         # AVIF compression quality (0-100)
    'webp_lossless': False,     # Whether to use lossless WebP
    'avif_speed': 6,           # AVIF encoding speed (0-10, higher is faster)

    # Size variants configuration
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
        },
        'full': {
            'max_dimension': 2048,
            'jpeg_quality': 90,
            'webp_quality': 85,
            'avif_quality': 80,
        }
    },

    'convert_to_webp': True,    # Generate WebP versions
    'convert_to_avif': True,    # Generate AVIF versions
    'keep_original': True,      # Keep original format
    'max_threads': 4,           # Concurrent compression threads
    'chunk_size': 10,          # Images per batch
    'avif_threads': 2,         # Threads for AVIF encoding

    'output_structure': {
        'use_subdirs': True,    # Use subdirectories
        'variant_subdir': True, # Variants in subdirectories
    }
}
```

## Usage

### Basic Usage

```python
from dojopool.core.image.compression import ImageCompressionService, ImageFormat, CompressionConfig

# Initialize with default settings
compression_service = ImageCompressionService()

# Compress a single image
config = CompressionConfig(
    format=ImageFormat.AVIF,
    quality=85,
    target_size=(800, 600)
)
compressed, mime_type = compression_service.compress_image(image_data, config)

# Batch compress a directory
result = compression_service.batch_compress_directory(
    input_dir='path/to/images',
    output_dir='path/to/output',
    chunk_size=10  # Optional: override default chunk size
)

# Check batch processing results
print(f"Successfully processed: {len(result.successful)} images")
print(f"Failed to process: {len(result.failed)} images")
print(f"Total compression ratio: {(result.total_input_size - result.total_output_size) / result.total_input_size:.2%}")
```

### Custom Configuration

```python
custom_config = {
    'max_dimension': 1024,
    'jpeg_quality': 90,
    'webp_quality': 85,
    'avif_quality': 80,
    'size_variants': {
        'thumbnail': {
            'max_dimension': 200,
            'jpeg_quality': 85,
            'webp_quality': 80,
            'avif_quality': 75
        },
        'full': {
            'max_dimension': 1024,
            'jpeg_quality': 90,
            'webp_quality': 85,
            'avif_quality': 80
        }
    },
    'max_threads': 2,
    'chunk_size': 5
}

compression_service = ImageCompressionService(config=custom_config)
```

## Memory Management

The service includes several features for efficient memory usage:

1. **Chunk Processing**: Images are processed in configurable chunks to limit memory usage
2. **Garbage Collection**: Automatic garbage collection between chunks
3. **Parallel Processing**: Configurable thread count for balancing performance and memory usage
4. **Resource Cleanup**: Proper cleanup of image resources after processing

### Memory Usage Guidelines

- Adjust `chunk_size` based on your average image size and available memory
- Monitor memory usage and adjust `max_threads` accordingly
- For large images, use smaller chunk sizes
- For high-resolution AVIF encoding, consider reducing `avif_threads`

## Format Support

### AVIF

- High compression ratio
- Excellent quality retention
- Configurable encoding speed
- RGB mode conversion for RGBA images
- Multi-threaded encoding support

### WebP

- Good balance of compression and quality
- Fast encoding and decoding
- Optional lossless compression
- Wide browser support

### JPEG

- Universal compatibility
- Configurable quality settings
- Optimized compression

## Error Handling

The service includes comprehensive error handling:

- Invalid image detection
- Format compatibility checks
- Memory usage monitoring
- Batch processing error isolation
- Detailed error logging

## Best Practices

### Quality Settings

- Use lower quality for thumbnails (70-80)
- Use medium quality for previews (75-85)
- Use higher quality for full-size images (85-90)
- Adjust AVIF speed based on your performance requirements

### Performance Optimization

- Set appropriate thread counts based on CPU cores
- Use chunk sizes that fit your memory constraints
- Enable AVIF for best compression results
- Keep original format for compatibility

### Directory Structure

- Use subdirectories for better organization
- Separate variants into directories for easier management
- Use consistent naming conventions

### Error Handling

- Implement retry logic for failed items
- Log errors with sufficient context
- Monitor batch processing results
- Clean up temporary files

## Examples

### Processing with Progress Tracking

```python
from tqdm import tqdm
import os

def process_with_progress(input_dir: str, output_dir: str):
    service = ImageCompressionService()

    # Get list of files
    files = [f for f in os.listdir(input_dir)
             if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]

    # Process with progress bar
    with tqdm(total=len(files), desc="Processing images") as pbar:
        result = service.batch_compress_directory(
            input_dir=input_dir,
            output_dir=output_dir
        )
        pbar.update(len(result.successful))

    return result
```

### Memory-Optimized Processing

```python
def process_large_directory(input_dir: str, output_dir: str):
    config = DEFAULT_COMPRESSION_CONFIG.copy()
    config.update({
        'chunk_size': 5,        # Small chunks for memory efficiency
        'max_threads': 2,       # Limit concurrent processing
        'avif_threads': 1       # Single-threaded AVIF encoding
    })

    service = ImageCompressionService(config=config)
    return service.batch_compress_directory(input_dir, output_dir)
```
