import pytest
from pathlib import Path
from PIL import Image
import io
from dojopool.utils.image_processor import convert_to_webp, create_size_variants, is_webp_supported

# Skip all tests if WebP is not supported
pytestmark = pytest.mark.skipif(
    not is_webp_supported(),
    reason="WebP support not available in Pillow installation"
)

@pytest.fixture
def test_images_dir(tmp_path):
    """Create test images in a temporary directory."""
    images_dir = tmp_path / "test_images"
    images_dir.mkdir()
    
    # Create a test JPEG image
    jpeg_path = images_dir / "test.jpg"
    img = Image.new('RGB', (1920, 1080), color='red')
    img.save(jpeg_path, 'JPEG', quality=95)
    
    # Create a test PNG with transparency
    png_path = images_dir / "test_alpha.png"
    img = Image.new('RGBA', (1920, 1080), color=(255, 0, 0, 128))
    img.save(png_path, 'PNG')
    
    # Create a corrupted image file
    corrupt_path = images_dir / "corrupt.jpg"
    with open(corrupt_path, 'wb') as f:
        f.write(b'not an image')
    
    return images_dir

@pytest.fixture
def output_dir(tmp_path):
    """Create temporary output directory."""
    output_dir = tmp_path / "output"
    output_dir.mkdir()
    return output_dir

def test_convert_to_webp_jpeg(test_images_dir, output_dir):
    """Test WebP conversion of JPEG image."""
    jpeg_path = test_images_dir / "test.jpg"
    webp_path = output_dir / "test.webp"
    
    success = convert_to_webp(str(jpeg_path), str(webp_path), quality=80)
    assert success
    assert webp_path.exists()
    
    # Verify it's a valid WebP file
    with Image.open(webp_path) as img:
        assert img.format == 'WEBP'
        assert img.mode == 'RGB'
        assert img.size == (1920, 1080)

def test_convert_to_webp_png_with_transparency(test_images_dir, output_dir):
    """Test WebP conversion of transparent PNG."""
    png_path = test_images_dir / "test_alpha.png"
    webp_path = output_dir / "test_alpha.webp"
    
    success = convert_to_webp(str(png_path), str(webp_path), quality=80)
    assert success
    assert webp_path.exists()
    
    # Verify transparency is preserved
    with Image.open(webp_path) as img:
        assert img.mode == 'RGBA'
        # Check if transparency exists
        assert any(pixel[3] < 255 for pixel in img.getdata())

def test_convert_to_webp_with_metadata(test_images_dir, output_dir):
    """Test WebP conversion with metadata preservation."""
    # Create image with metadata
    jpeg_path = test_images_dir / "metadata.jpg"
    img = Image.new('RGB', (100, 100), color='red')
    
    # Add metadata that WebP supports
    img.info['background'] = (255, 255, 255)  # WebP-supported metadata
    img.save(jpeg_path, 'JPEG')
    
    webp_path = output_dir / "metadata.webp"
    success = convert_to_webp(str(jpeg_path), str(webp_path), preserve_metadata=True)
    
    assert success
    with Image.open(webp_path) as img:
        assert img.info.get('background') == (255, 255, 255, 255)  # WebP adds alpha channel

def test_convert_to_webp_with_io_buffer():
    """Test WebP conversion using IO buffers."""
    # Create source image in memory
    source_buffer = io.BytesIO()
    img = Image.new('RGB', (100, 100), color='blue')
    img.save(source_buffer, format='JPEG')
    source_buffer.seek(0)
    
    # Convert to WebP
    output_buffer = io.BytesIO()
    success = convert_to_webp(source_buffer, output_buffer)
    
    assert success
    output_buffer.seek(0)
    with Image.open(output_buffer) as img:
        assert img.format == 'WEBP'

def test_create_size_variants(test_images_dir, output_dir):
    """Test creating multiple size variants."""
    source_path = test_images_dir / "test.jpg"
    sizes = {
        'sm': (480, 270),   # 480p
        'md': (1280, 720),  # 720p
        'lg': (1920, 1080)  # 1080p
    }
    
    variants = create_size_variants(str(source_path), str(output_dir), sizes)
    
    assert len(variants) == len(sizes)
    for name, path in variants.items():
        assert Path(path).exists()
        with Image.open(path) as img:
            width, height = sizes[name]
            assert img.size == (width, height)

def test_invalid_input_handling(test_images_dir, output_dir):
    """Test handling of invalid inputs."""
    nonexistent_path = test_images_dir / "nonexistent.jpg"
    output_path = output_dir / "output.webp"
    
    with pytest.raises(ValueError):
        convert_to_webp(str(nonexistent_path), str(output_path))
    
    with pytest.raises(ValueError):
        convert_to_webp("", str(output_path))
    
    with pytest.raises(ValueError):
        create_size_variants(str(nonexistent_path), str(output_dir), {'sm': (100, 100)})

def test_corrupt_image_handling(test_images_dir, output_dir):
    """Test handling of corrupt image files."""
    corrupt_path = test_images_dir / "corrupt.jpg"
    output_path = output_dir / "corrupt.webp"
    
    with pytest.raises(Exception):
        convert_to_webp(str(corrupt_path), str(output_path))

def test_quality_bounds(test_images_dir, output_dir):
    """Test WebP conversion with quality values at boundaries."""
    # Create a test image with photographic content
    img = Image.new('RGB', (400, 400))
    pixels = img.load()
    
    # Create a photographic-like pattern with high frequency details
    from math import sin, cos, pi
    for x in range(400):
        for y in range(400):
            # Multiple sine waves for natural-looking pattern
            val1 = sin(x * pi / 20) * cos(y * pi / 15) * 128 + 128
            val2 = sin((x + y) * pi / 30) * 64 + 64
            val3 = cos(x * pi / 25) * sin(y * pi / 25) * 96 + 96
            
            # Add some high-frequency noise
            from random import randint
            noise = randint(-10, 10)
            
            # Combine patterns for each color channel
            r = int(max(0, min(255, val1 + noise)))
            g = int(max(0, min(255, val2 + noise)))
            b = int(max(0, min(255, val3 + noise)))
            pixels[x, y] = (r, g, b)
    
    # Save as high quality JPEG first
    jpeg_path = test_images_dir / "test_quality.jpg"
    img.save(jpeg_path, 'JPEG', quality=95)
    
    # Test minimum quality (0)
    min_quality_path = output_dir / "min_quality.webp"
    success = convert_to_webp(str(jpeg_path), str(min_quality_path), quality=0, optimize=False)
    assert success
    assert min_quality_path.exists()
    
    # Test maximum quality (100)
    max_quality_path = output_dir / "max_quality.webp"
    success = convert_to_webp(str(jpeg_path), str(max_quality_path), quality=100, optimize=False)
    assert success
    assert max_quality_path.exists()
    
    # Verify max quality file is larger than min quality
    min_size = min_quality_path.stat().st_size
    max_size = max_quality_path.stat().st_size
    assert max_size > min_size, f"Max quality size ({max_size}) should be larger than min quality size ({min_size})"

def test_create_size_variants_with_invalid_sizes(test_images_dir, output_dir):
    """Test size variants creation with invalid size specifications."""
    source_path = test_images_dir / "test.jpg"
    
    # Test with zero dimensions
    with pytest.raises(ValueError):
        create_size_variants(str(source_path), str(output_dir), {'invalid': (0, 0)})
    
    # Test with negative dimensions
    with pytest.raises(ValueError):
        create_size_variants(str(source_path), str(output_dir), {'invalid': (-100, -100)})

def test_output_directory_creation(test_images_dir, tmp_path):
    """Test that output directories are created if they don't exist."""
    source_path = test_images_dir / "test.jpg"
    nested_output_dir = tmp_path / "nested" / "output" / "dir"
    
    sizes = {'sm': (480, 270)}
    variants = create_size_variants(str(source_path), str(nested_output_dir), sizes)
    
    assert nested_output_dir.exists()
    assert len(variants) == 1
    assert Path(variants['sm']).exists() 

def test_webp_optimization(test_images_dir, output_dir):
    """Test WebP optimization based on image content."""
    # Create a simple image (flat colors)
    simple_img = Image.new('RGB', (100, 100), color='red')
    simple_path = test_images_dir / "simple.jpg"
    simple_img.save(simple_path, 'JPEG', quality=95)
    
    # Create a complex image (gradient pattern)
    complex_img = Image.new('RGB', (100, 100))
    pixels = complex_img.load()
    for x in range(100):
        for y in range(100):
            pixels[x, y] = (x * 2, y * 2, (x + y))
    complex_path = test_images_dir / "complex.jpg"
    complex_img.save(complex_path, 'JPEG', quality=95)
    
    # Test optimization on simple image
    simple_webp = output_dir / "simple.webp"
    success = convert_to_webp(str(simple_path), str(simple_webp), optimize=True)
    assert success
    
    # Test optimization on complex image
    complex_webp = output_dir / "complex.webp"
    success = convert_to_webp(str(complex_path), str(complex_webp), optimize=True)
    assert success
    
    # Complex image should be larger due to higher quality setting
    assert complex_webp.stat().st_size > simple_webp.stat().st_size

def test_webp_transparency_optimization(test_images_dir, output_dir):
    """Test WebP optimization with transparent images."""
    # Create a transparent PNG
    img = Image.new('RGBA', (100, 100), color=(255, 0, 0, 128))
    png_path = test_images_dir / "transparent.png"
    img.save(png_path, 'PNG')
    
    # Convert with optimization
    webp_path = output_dir / "transparent.webp"
    success = convert_to_webp(str(png_path), str(webp_path), optimize=True)
    assert success
    
    # Verify transparency is preserved
    with Image.open(webp_path) as img:
        assert img.mode == 'RGBA'
        assert any(pixel[3] < 255 for pixel in img.getdata()) 