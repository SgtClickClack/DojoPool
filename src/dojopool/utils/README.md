# Image Processing Module

## Overview

The image processing module provides a robust solution for optimizing images for web delivery. It handles WebP conversion, responsive image generation, and image optimization with quality controls and compression ratio tracking.

## Features

- WebP conversion with configurable quality settings
- Responsive image generation in multiple sizes (sm, md, lg, xl)
- Original format optimization with format-specific settings
- Compression ratio tracking and reporting
- Detailed error handling and logging
- Support for both JPEG and PNG input formats

## Installation

Ensure you have the required dependencies installed:

```bash
pip install Pillow==10.1.0
```

## Usage

### Basic Usage

```python
from dojopool.utils.image_processor import ImageProcessor

# Initialize the processor with input and output directories
processor = ImageProcessor(
    input_dir="path/to/input/images",
    output_dir="static/images"
)

# Process all images in the directory
results = processor.process_directory(quality=80)

# Check results
for result in results['webp']:
    if result.success:
        print(f"WebP conversion successful: {result.output_path}")
        print(f"Compression ratio: {result.compression_ratio:.2%}")
    else:
        print(f"WebP conversion failed: {result.error}")
```

### Command Line Usage

```bash
python -m dojopool.scripts.process_images input_directory -o output_directory -q 80 -v
```

Options:

- `-o, --output-dir`: Output directory (default: static/images)
- `-q, --quality`: Quality setting (0-100, default: 80)
- `-v, --verbose`: Enable verbose logging

## Output Structure

The processor creates the following directory structure:

```
output_directory/
├── webp/
│   ├── sm/  # 400px width
│   ├── md/  # 800px width
│   ├── lg/  # 1200px width
│   └── xl/  # 1600px width
└── optimized/
    ├── sm/
    ├── md/
    ├── lg/
    └── xl/
```

## Size Variants

- sm: 400px width
- md: 800px width
- lg: 1200px width
- xl: 1600px width

Aspect ratio is maintained for all size variants.

## Performance Considerations

- WebP conversion typically achieves 40-60% size reduction compared to JPEG
- Progressive JPEG is used for optimized JPEG files
- PNG optimization includes lossless compression
- Memory usage is optimized by processing one image at a time

## Error Handling

The processor provides detailed error information through the `ProcessingResult` class:

```python
@dataclass
class ProcessingResult:
    success: bool
    output_path: Optional[str]
    error: Optional[str]
    compression_ratio: Optional[float]
    metadata: Optional[ImageMetadata]
```

## Best Practices

1. Use appropriate quality settings:
   - JPEG/WebP: 80-85 for photos
   - PNG: Use lossless compression
2. Monitor compression ratios to ensure optimal settings
3. Consider implementing a cache invalidation strategy
4. Use responsive images with appropriate sizes for different devices
5. Enable verbose logging during development for detailed insights

## Troubleshooting

Common issues and solutions:

1. **Memory Issues**
   - Process fewer images at once
   - Reduce maximum image dimensions
   - Monitor system resources

2. **Quality Issues**
   - Adjust quality settings based on image content
   - Use higher quality for important images
   - Check compression ratios for outliers

3. **Performance Issues**
   - Process images in batches
   - Implement caching
   - Use async processing for large directories

## Contributing

When contributing to this module:

1. Add tests for new functionality
2. Update documentation
3. Follow existing code style
4. Add error handling for edge cases

## Future Improvements

- AVIF format support
- Async processing
- Content-aware quality settings
- Integration with CDN providers
- Advanced caching mechanisms
