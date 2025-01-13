import pytest
import os
from PIL import Image
import io
from dojopool.services.image_compression import ImageCompressionService
from dojopool.config.compression_config import DEFAULT_COMPRESSION_CONFIG

@pytest.fixture
def compression_service():
    return ImageCompressionService()

@pytest.fixture
def test_image():
    # Create a test image
    img = Image.new('RGB', (800, 600), color='red')
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    return buffer

@pytest.fixture
def test_image_rgba():
    # Create a test image with transparency
    img = Image.new('RGBA', (800, 600), color=(255, 0, 0, 128))
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer

def test_compression_service_initialization():
    # Test default initialization
    service = ImageCompressionService()
    assert service.config == DEFAULT_COMPRESSION_CONFIG
    
    # Test custom configuration
    custom_config = DEFAULT_COMPRESSION_CONFIG.copy()
    custom_config['max_dimension'] = 1024
    service = ImageCompressionService(config=custom_config)
    assert service.config['max_dimension'] == 1024

def test_calculate_new_dimensions(compression_service):
    # Test no resize needed
    width, height = compression_service._calculate_new_dimensions(800, 600, 2048)
    assert width == 800
    assert height == 600
    
    # Test resize width
    width, height = compression_service._calculate_new_dimensions(3000, 2000, 1500)
    assert width == 1500
    assert height == 1000
    
    # Test resize height
    width, height = compression_service._calculate_new_dimensions(2000, 3000, 1500)
    assert width == 1000
    assert height == 1500

def test_compress_single_variant(compression_service, test_image, tmp_path):
    # Save test image to disk
    input_path = os.path.join(tmp_path, 'test.jpg')
    with open(input_path, 'wb') as f:
        f.write(test_image.getvalue())
    
    # Test JPEG compression
    result = compression_service.compress_image(
        input_path,
        str(tmp_path),
        'test'
    )
    
    # Check if all variants were created
    for variant_name in DEFAULT_COMPRESSION_CONFIG['size_variants']:
        assert variant_name in result
        if DEFAULT_COMPRESSION_CONFIG['keep_original']:
            assert 'jpeg' in result[variant_name]
            assert os.path.exists(result[variant_name]['jpeg'])
        if DEFAULT_COMPRESSION_CONFIG['convert_to_webp']:
            assert 'webp' in result[variant_name]
            assert os.path.exists(result[variant_name]['webp'])

def test_compress_rgba_image(compression_service, test_image_rgba, tmp_path):
    # Save test image to disk
    input_path = os.path.join(tmp_path, 'test.png')
    with open(input_path, 'wb') as f:
        f.write(test_image_rgba.getvalue())
    
    # Test compression of RGBA image
    result = compression_service.compress_image(
        input_path,
        str(tmp_path),
        'test'
    )
    
    # Verify JPEG conversion handled transparency correctly
    if DEFAULT_COMPRESSION_CONFIG['keep_original']:
        jpeg_path = result['full']['jpeg']
        with Image.open(jpeg_path) as img:
            assert img.mode == 'RGB'  # Should be converted to RGB
            
    # Verify WebP preserved transparency
    if DEFAULT_COMPRESSION_CONFIG['convert_to_webp']:
        webp_path = result['full']['webp']
        with Image.open(webp_path) as img:
            assert img.mode == 'RGBA'  # Should preserve transparency

def test_batch_compression(compression_service, test_image, tmp_path):
    # Create multiple test images
    input_dir = os.path.join(tmp_path, 'input')
    output_dir = os.path.join(tmp_path, 'output')
    os.makedirs(input_dir)
    
    for i in range(5):
        with open(os.path.join(input_dir, f'test{i}.jpg'), 'wb') as f:
            f.write(test_image.getvalue())
    
    # Test batch compression
    results = compression_service.batch_compress_directory(input_dir, output_dir)
    
    # Verify results
    assert len(results) == 5
    for result in results:
        assert result is not None
        for variant_name in DEFAULT_COMPRESSION_CONFIG['size_variants']:
            assert variant_name in result
            if DEFAULT_COMPRESSION_CONFIG['keep_original']:
                assert 'jpeg' in result[variant_name]
            if DEFAULT_COMPRESSION_CONFIG['convert_to_webp']:
                assert 'webp' in result[variant_name]

def test_error_handling(compression_service, tmp_path):
    # Test with non-existent file
    with pytest.raises(Exception):
        compression_service.compress_image(
            os.path.join(tmp_path, 'nonexistent.jpg'),
            str(tmp_path),
            'test'
        )
    
    # Test with invalid image file
    invalid_path = os.path.join(tmp_path, 'invalid.jpg')
    with open(invalid_path, 'wb') as f:
        f.write(b'not an image')
    
    with pytest.raises(Exception):
        compression_service.compress_image(
            invalid_path,
            str(tmp_path),
            'test'
        ) 