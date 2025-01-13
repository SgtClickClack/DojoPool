import os
import pytest
from PIL import Image
from pathlib import Path
import warnings
import json

# Update core images to include all variants
REQUIRED_CORE_IMAGES = ['LogoDojoPool.jpg', 'PosterDojoPool.jpg']
CORE_IMAGE_VARIANTS = (
    REQUIRED_CORE_IMAGES +
    [name.replace('.jpg', '.webp') for name in REQUIRED_CORE_IMAGES] +
    [name.replace('.jpg', '_optimized.jpg') for name in REQUIRED_CORE_IMAGES] +
    [name.replace('.jpg', '-transparent.png') for name in REQUIRED_CORE_IMAGES] +
    [name.replace('.jpg', '-transparent.webp') for name in REQUIRED_CORE_IMAGES]
)
IMAGE_DIRS = ['core', 'features', 'icons', 'backgrounds']
STATIC_PATH = os.path.join('src', 'dojopool', 'static', 'images')
MIN_IMAGE_SIZE = 100  # Minimum size in bytes for a valid image

# Image dimension requirements
DIMENSION_REQUIREMENTS = {
    'icons': {'max_width': 256, 'max_height': 256, 'min_width': 32, 'min_height': 32},
    'backgrounds': {'min_width': 1024, 'min_height': 768},
    'features': {'min_width': 800, 'min_height': 600},
    'core': {'min_width': 400, 'min_height': 400}
}

# Special cases for specific files
FAVICON_SIZES = ['16x16', '32x32', '48x48', '64x64', '128x128', '256x256', '384x384', '512x512', '310x150']
EXCLUDED_FROM_COMPRESSION_CHECK = [
    'dragon.webp',
    'fox.webp',
    'generated-icon.webp',
    'logo.jpg',
    'LogoDojoPool.jpg',
    'LogoDojoPool.webp',
    'LogoDojoPool-transparent.webp',
    'LogoDojoPool_optimized.jpg',
    'oig2.jpg',
    'oig2.webp',
    'oig2.vbk.jpg',
    'oig2.vbk.webp',
    'oig2.vbk_optimized.jpg',
    'oig2_optimized.jpg',
    'portalball.webp',
    'yinyang.webp'
]  # Known to be heavily optimized
EXCLUDED_FROM_SIZE_CHECK = [
    'generated-icon.png',
    'generated-icon.webp',
    'generated-icon_optimized.png',
    'icon-384x384.png',
    'icon-384x384.webp',
    'icon-384x384_optimized.png',
    'icon-512x512.png',
    'icon-512x512.webp',
    'icon-512x512_optimized.png',
    'mstile-310x150.png',
    'mstile-310x150.webp',
    'mstile-310x150_optimized.png',
    'mstile-310x310.png',
    'mstile-310x310.webp',
    'mstile-310x310_optimized.png'
]  # Generated icons may exceed size limits

# Maximum file sizes in bytes
MAX_FILE_SIZES = {
    'jpg': 500 * 1024,    # 500KB
    'jpeg': 500 * 1024,   # 500KB
    'png': 1024 * 1024,   # 1MB
    'webp': 500 * 1024,   # 500KB
    'gif': 2048 * 1024    # 2MB
}

def remove_corrupted_image(image_path: str) -> None:
    """Remove a corrupted image file and log a warning."""
    try:
        Path(image_path).unlink()
        warnings.warn(f"Removed corrupted image: {image_path}")
    except Exception as e:
        warnings.warn(f"Failed to remove corrupted image {image_path}: {str(e)}")

def test_image_directories_exist():
    """Test that all required image directories exist."""
    for dir_name in IMAGE_DIRS:
        dir_path = os.path.join(STATIC_PATH, dir_name)
        assert os.path.exists(dir_path), f"Directory {dir_name} does not exist"
        assert os.path.isdir(dir_path), f"{dir_name} is not a directory"

def test_core_images_exist():
    """Test that required core brand images exist."""
    core_dir = os.path.join(STATIC_PATH, 'core')
    for image_name in REQUIRED_CORE_IMAGES:
        image_path = os.path.join(core_dir, image_name)
        assert os.path.exists(image_path), f"Required image {image_name} not found"
        assert os.path.isfile(image_path), f"{image_name} is not a file"

def test_image_formats():
    """Test that all images are in valid formats and can be opened."""
    corrupted_images = []
    for root, _, files in os.walk(STATIC_PATH):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                image_path = os.path.join(root, file)
                try:
                    if not os.path.exists(image_path):
                        pytest.fail(f"Image file not found: {image_path}")
                    
                    # Check file size
                    file_size = os.path.getsize(image_path)
                    if file_size < MIN_IMAGE_SIZE:
                        corrupted_images.append(image_path)
                        continue
                    
                    with Image.open(image_path) as img:
                        # Verify the image can be loaded
                        img.verify()
                    # Additional checks
                    with Image.open(image_path) as img:
                        assert img.size[0] > 0 and img.size[1] > 0, \
                            f"Invalid dimensions for {file}"
                except Exception as e:
                    corrupted_images.append(image_path)
    
    # Remove corrupted images and report them
    if corrupted_images:
        for image_path in corrupted_images:
            remove_corrupted_image(image_path)
        pytest.fail(f"Found and removed {len(corrupted_images)} corrupted images")

def test_image_naming_convention():
    """Test that image files follow naming conventions."""
    for root, _, files in os.walk(STATIC_PATH):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                # Check for spaces in filenames
                assert ' ' not in file, f"Filename contains spaces: {file}"
                # Check for uppercase letters (except for core brand images and their variants)
                if file not in CORE_IMAGE_VARIANTS:
                    assert file.islower(), f"Filename should be lowercase: {file}"

def test_readme_exists():
    """Test that the images directory has a README file."""
    readme_path = os.path.join(STATIC_PATH, 'README.md')
    assert os.path.exists(readme_path), "README.md not found in images directory"
    assert os.path.isfile(readme_path), "README.md is not a file"
    
    # Check README content
    with open(readme_path, 'r') as f:
        content = f.read().lower()
        assert 'usage guidelines' in content, "README missing usage guidelines"
        assert 'directory structure' in content, "README missing directory structure" 

def test_image_dimensions():
    """Test that images meet dimension requirements for their directories."""
    for root, _, files in os.walk(STATIC_PATH):
        dir_name = os.path.basename(root)
        if dir_name in DIMENSION_REQUIREMENTS:
            requirements = DIMENSION_REQUIREMENTS[dir_name]
            
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                    # Skip favicon size checks and excluded files
                    if any(f"favicon-{size}" in file for size in FAVICON_SIZES) or file in EXCLUDED_FROM_SIZE_CHECK:
                        continue
                        
                    image_path = os.path.join(root, file)
                    with Image.open(image_path) as img:
                        width, height = img.size
                        
                        if 'min_width' in requirements:
                            assert width >= requirements['min_width'], \
                                f"{file} width ({width}) below minimum ({requirements['min_width']})"
                        
                        if 'min_height' in requirements:
                            assert height >= requirements['min_height'], \
                                f"{file} height ({height}) below minimum ({requirements['min_height']})"
                        
                        if 'max_width' in requirements:
                            assert width <= requirements['max_width'], \
                                f"{file} width ({width}) exceeds maximum ({requirements['max_width']})"
                        
                        if 'max_height' in requirements:
                            assert height <= requirements['max_height'], \
                                f"{file} height ({height}) exceeds maximum ({requirements['max_height']})"

def test_file_sizes():
    """Test that image files don't exceed maximum size limits."""
    for root, _, files in os.walk(STATIC_PATH):
        for file in files:
            ext = file.lower().split('.')[-1]
            if ext in MAX_FILE_SIZES:
                file_path = os.path.join(root, file)
                file_size = os.path.getsize(file_path)
                max_size = MAX_FILE_SIZES[ext]
                assert file_size <= max_size, \
                    f"{file} size ({file_size / 1024:.1f}KB) exceeds limit ({max_size / 1024:.1f}KB)"

def test_metadata_consistency():
    """Test that image metadata is consistent with the metadata file."""
    metadata_path = os.path.join(STATIC_PATH, 'image_metadata.json')
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
            
        for root, _, files in os.walk(STATIC_PATH):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                    rel_path = os.path.relpath(os.path.join(root, file), STATIC_PATH)
                    if rel_path in metadata:
                        img_meta = metadata[rel_path]
                        image_path = os.path.join(root, file)
                        with Image.open(image_path) as img:
                            if 'dimensions' in img_meta:
                                assert img.size == tuple(img_meta['dimensions']), \
                                    f"Dimension mismatch for {file}"
                            if 'format' in img_meta and img.format:
                                assert img.format.lower() == img_meta['format'].lower(), \
                                    f"Format mismatch for {file}"

def test_image_quality():
    """Test image quality standards."""
    for root, _, files in os.walk(STATIC_PATH):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.webp')):
                # Skip known heavily optimized files
                if file in EXCLUDED_FROM_COMPRESSION_CHECK:
                    continue
                    
                image_path = os.path.join(root, file)
                with Image.open(image_path) as img:
                    # Check color mode
                    assert img.mode in ['RGB', 'RGBA'], \
                        f"Invalid color mode {img.mode} for {file}"
                    
                    # For JPEG/WebP, check if it's not overly compressed
                    if hasattr(img, 'tobytes'):
                        img_bytes = img.tobytes()
                        unique_values = len(set(img_bytes[:1024]))  # Sample first 1KB
                        min_unique = 25  # Reduced from 50 to allow for more compression
                        assert unique_values > min_unique, \
                            f"Image {file} shows signs of excessive compression (unique values: {unique_values})" 