# Image Compression API Documentation

## Overview
The Image Compression API provides high-performance image processing capabilities with support for AVIF, WebP, and JPEG formats. It includes memory-efficient batch processing and quality optimization features.

## Classes

### ImageCompressionService

#### Constructor
```python
ImageCompressionService(config: Optional[Dict[str, Any]] = None)
```
- `config`: Optional configuration dictionary. If not provided, uses `DEFAULT_COMPRESSION_CONFIG`

#### Methods

##### compress_image
```python
def compress_image(image_data: bytes, config: CompressionConfig) -> Tuple[bytes, str]
```
Compresses a single image according to the specified configuration.

**Parameters:**
- `image_data`: Raw image bytes
- `config`: CompressionConfig instance

**Returns:**
- Tuple of (compressed image bytes, mime type)

**Example:**
```python
service = ImageCompressionService()
config = CompressionConfig(
    format=ImageFormat.AVIF,
    quality=85,
    target_size=(800, 600)
)
compressed, mime_type = service.compress_image(image_data, config)
```

##### batch_compress_directory
```python
def batch_compress_directory(
    input_dir: str,
    output_dir: str,
    chunk_size: Optional[int] = None
) -> BatchProcessingResult
```
Processes all images in a directory with memory-efficient batching.

**Parameters:**
- `input_dir`: Directory containing input images
- `output_dir`: Directory for output images
- `chunk_size`: Optional override for batch size

**Returns:**
- BatchProcessingResult containing processing statistics

**Example:**
```python
result = service.batch_compress_directory(
    input_dir="uploads",
    output_dir="processed",
    chunk_size=10
)
print(f"Processed {len(result.successful)} images")
```

### CompressionConfig

#### Constructor
```python
@dataclass
class CompressionConfig:
    format: ImageFormat
    quality: int  # 1-100
    target_size: Optional[Tuple[int, int]] = None
    maintain_aspect_ratio: bool = True
    strip_metadata: bool = True
    optimize: bool = True
```

**Parameters:**
- `format`: Target format (AVIF, WebP, JPEG, PNG)
- `quality`: Compression quality (1-100)
- `target_size`: Optional (width, height) tuple
- `maintain_aspect_ratio`: Whether to maintain aspect ratio during resize
- `strip_metadata`: Whether to remove EXIF data
- `optimize`: Whether to apply additional optimizations

### BatchProcessingResult

#### Constructor
```python
@dataclass
class BatchProcessingResult:
    successful: List[str]
    failed: List[Tuple[str, str]]
    total_input_size: int
    total_output_size: int
```

**Fields:**
- `successful`: List of successfully processed file paths
- `failed`: List of (filename, error_message) tuples
- `total_input_size`: Total size of input files in bytes
- `total_output_size`: Total size of output files in bytes

## Configuration

### Default Configuration
```python
DEFAULT_COMPRESSION_CONFIG = {
    'max_dimension': 2048,
    'jpeg_quality': 85,
    'webp_quality': 80,
    'avif_quality': 75,
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
        },
        'full': {
            'max_dimension': 2048,
            'jpeg_quality': 90,
            'webp_quality': 85,
            'avif_quality': 80,
        }
    },
    'max_threads': 4,
    'chunk_size': 10,
    'avif_threads': 2
}
```

## Error Handling

The API uses Python's built-in exception handling. Common exceptions include:

- `IOError`: File read/write errors
- `ValueError`: Invalid configuration values
- `Image.UnidentifiedImageError`: Invalid image data
- `OSError`: File system errors

All operations are logged using Python's logging module.

## Performance Considerations

1. **Memory Usage:**
   - Images are processed in chunks to limit memory usage
   - Garbage collection runs between chunks
   - Weak references used for temporary data

2. **Threading:**
   - Parallel processing with configurable thread count
   - Separate thread pool for AVIF encoding
   - Thread count should be adjusted based on CPU cores

3. **Format Selection:**
   - AVIF: Best compression, slower encoding
   - WebP: Good compression, fast encoding
   - JPEG: Universal compatibility

## Best Practices

1. **Configuration:**
   - Adjust quality settings based on image content
   - Use appropriate thread counts for your hardware
   - Set chunk size based on available memory

2. **Format Selection:**
   - Use AVIF for best compression
   - Use WebP as fallback
   - Keep JPEG for universal compatibility

3. **Memory Management:**
   - Process large batches in smaller chunks
   - Monitor memory usage during batch processing
   - Clean up temporary files promptly

4. **Error Handling:**
   - Implement retry logic for failed items
   - Log errors with context for debugging
   - Handle format-specific edge cases
``` 