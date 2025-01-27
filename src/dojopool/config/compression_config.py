"""Default configuration for image compression service."""

DEFAULT_COMPRESSION_CONFIG = {
    'chunk_size': 10,
    'max_threads': 4,
    'keep_original': True,
    'convert_to_webp': True,
    'convert_to_avif': True,
    'output_structure': {
        'variant_subdir': True
    },
    'size_variants': {
        'sm': {
            'max_dimension': 400,
            'avif_quality': 80,
            'webp_quality': 85,
            'jpeg_quality': 85
        },
        'md': {
            'max_dimension': 800,
            'avif_quality': 75,
            'webp_quality': 80,
            'jpeg_quality': 80
        },
        'lg': {
            'max_dimension': 1200,
            'avif_quality': 70,
            'webp_quality': 75,
            'jpeg_quality': 75
        },
        'xl': {
            'max_dimension': 1920,
            'avif_quality': 65,
            'webp_quality': 70,
            'jpeg_quality': 70
        }
    },
    'avif_settings': {
        'speed': 4,  # 0-8, lower is slower but better quality
        'threads': 2  # Number of threads for AVIF encoding
    }
} 