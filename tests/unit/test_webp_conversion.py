import pytest
from pathlib import Path
from PIL import Image
import io
from dojopool.utils.image_processor import convert_to_webp, is_webp_supported

# Skip all tests in this module if WebP is not supported
pytestmark = pytest.mark.skipif(
    not is_webp_supported(),
    reason="WebP support not available in Pillow installation"
)

@pytest.fixture
def test_image(tmp_path):
    """Create a test image for conversion tests."""
    image_path = tmp_path / "test.jpg"
    # Create a simple test image
    img = Image.new('RGB', (100, 100), color='red')
    img.save(str(image_path), 'JPEG')
    return image_path

def test_webp_conversion(test_image):
    """Test basic WebP conversion."""
    output_path = test_image.parent / "test.webp"
    success = convert_to_webp(str(test_image), str(output_path))
    
    assert success
    assert output_path.exists()
    # Verify it's a valid WebP file
    with Image.open(output_path) as img:
        assert img.format == 'WEBP'

def test_webp_quality_settings(test_image):
    """Test WebP conversion with different quality settings."""
    # Test with high quality
    high_quality_path = test_image.parent / "high.webp"
    success_high = convert_to_webp(str(test_image), str(high_quality_path), quality=90)
    
    # Test with low quality
    low_quality_path = test_image.parent / "low.webp"
    success_low = convert_to_webp(str(test_image), str(low_quality_path), quality=50)
    
    assert success_high and success_low
    # Low quality should result in smaller file size
    assert low_quality_path.stat().st_size < high_quality_path.stat().st_size

def test_webp_conversion_maintains_transparency():
    """Test that WebP conversion maintains transparency."""
    # Create a test image with transparency
    img = Image.new('RGBA', (100, 100), (255, 0, 0, 0))
    
    # Save as PNG with transparency
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    # Convert to WebP
    output_buffer = io.BytesIO()
    success = convert_to_webp(buffer, output_buffer)
    
    assert success
    # Verify transparency is maintained
    output_buffer.seek(0)
    with Image.open(output_buffer) as webp_img:
        assert webp_img.mode == 'RGBA'
        # Check if transparency exists
        assert any(pixel[3] < 255 for pixel in webp_img.getdata())

def test_webp_support_detection():
    """Test WebP support detection."""
    # This test should be skipped by the module-level mark
    assert is_webp_supported()

def test_invalid_input_handling():
    """Test handling of invalid inputs."""
    with pytest.raises(ValueError):
        convert_to_webp("nonexistent.jpg", "output.webp")
    
    # Test with invalid source type
    with pytest.raises(ValueError):
        convert_to_webp("", "output.webp")  # Empty string instead of None

def test_webp_conversion_preserves_metadata():
    """Test that WebP conversion preserves important metadata."""
    # Create a test image with metadata
    img = Image.new('RGB', (100, 100), color='red')
    img.info['dpi'] = (72, 72)
    img.info['icc_profile'] = b'test profile'
    
    # Save with metadata
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    
    # Convert to WebP
    output_buffer = io.BytesIO()
    success = convert_to_webp(buffer, output_buffer, preserve_metadata=True)
    
    assert success
    # Verify metadata is preserved
    output_buffer.seek(0)
    with Image.open(output_buffer) as webp_img:
        assert webp_img.info.get('dpi') == (72, 72)
        assert webp_img.info.get('icc_profile') == b'test profile'