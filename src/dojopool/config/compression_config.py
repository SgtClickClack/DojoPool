from typing import Dict, Any

# Default compression settings
DEFAULT_COMPRESSION_CONFIG: Dict[str, Any] = {
    'max_dimension': 2048,  # Maximum dimension for any side of the image
    'jpeg_quality': 85,     # JPEG compression quality (0-100)
    'webp_quality': 80,     # WebP compression quality (0-100)
    'webp_lossless': False, # Whether to use lossless WebP compression
    
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
    
    # Format conversion settings
    'convert_to_webp': True,    # Whether to create WebP versions
    'keep_original': True,      # Whether to keep original format
    
    # Processing settings
    'max_threads': 4,           # Maximum number of concurrent compression threads
    'chunk_size': 10,          # Number of images to process in each batch
    
    # Output settings
    'output_structure': {
        'use_subdirs': True,    # Organize output in subdirectories
        'variant_subdir': True, # Put size variants in subdirectories
    }
} 