import pytest
from pathlib import Path
import time
from PIL import Image
import io
from dojopool.utils.image_cache import ImageCache, CacheEntry

@pytest.fixture
def cache_dir(tmp_path):
    """Create a temporary directory for cache testing."""
    return tmp_path / "cache"

@pytest.fixture
def test_image(tmp_path):
    """Create a test image file."""
    img_path = tmp_path / "test.jpg"
    img = Image.new('RGB', (100, 100), color='red')
    img.save(img_path, 'JPEG')
    return img_path

@pytest.fixture
def cache(cache_dir):
    """Create an ImageCache instance with test settings."""
    return ImageCache(
        cache_dir=str(cache_dir),
        max_size_bytes=1024 * 1024,  # 1MB
        max_entries=10,
        max_age_days=1,
        cleanup_interval=1,  # 1 second for testing
        min_hit_count=2
    )

def test_cache_initialization(cache):
    """Test cache initialization with custom parameters."""
    assert cache.max_size_bytes == 1024 * 1024
    assert cache.max_entries == 10
    assert cache.cleanup_interval == 1
    assert cache.min_hit_count == 2

def test_add_and_get(cache, test_image):
    """Test basic add and get operations."""
    success = cache.add("test1", str(test_image))
    assert success
    
    entry = cache.get("test1")
    assert entry is not None
    assert entry.path == str(test_image)
    assert entry.hits == 1

def test_cache_eviction(cache, tmp_path):
    """Test cache eviction based on size and entry limits."""
    # Create multiple large files
    files = []
    for i in range(15):  # More than max_entries
        img_path = tmp_path / f"test{i}.jpg"
        img = Image.new('RGB', (500, 500), color='red')  # Larger image
        img.save(img_path, 'JPEG', quality=95)
        files.append(img_path)
        cache.add(f"test{i}", str(img_path))
    
    # Verify cache size is within limits
    assert len(cache.entries) <= cache.max_entries
    assert cache.current_size <= cache.max_size_bytes

def test_cache_cleanup(cache, test_image):
    """Test automatic cache cleanup."""
    # Add an entry
    cache.add("test1", str(test_image))
    
    # Simulate time passing
    time.sleep(1.1)  # Just over cleanup_interval
    
    # Access should trigger cleanup of stale entries
    entry = cache.get("test1")
    assert entry is not None
    assert entry.hits == 1
    assert not entry.is_stale

def test_cache_invalidation(cache, test_image):
    """Test cache entry invalidation."""
    cache.add("test1", str(test_image))
    
    # Delete the original file
    test_image.unlink()
    
    # Entry should be removed on next access
    entry = cache.get("test1")
    assert entry is None
    assert "test1" not in cache.entries

def test_stale_entry_handling(cache, test_image):
    """Test handling of stale entries."""
    cache.add("test1", str(test_image))
    
    # Simulate time passing
    time.sleep(1.1)  # Just over cleanup_interval
    
    # Force a cleanup check which will mark entries as stale
    cache._run_cleanup_if_needed()
    
    # Entry should be marked as stale
    entry = cache.entries["test1"]
    assert entry.is_stale
    
    # Access should refresh the entry
    entry = cache.get("test1")
    assert entry is not None
    assert not entry.is_stale

def test_cache_statistics(cache, test_image):
    """Test cache statistics calculation."""
    cache.add("test1", str(test_image))
    cache.get("test1")  # One hit
    
    stats = cache.get_stats()
    assert stats['total_entries'] == 1
    assert stats['hit_counts']['test1'] == 1
    assert 'avg_hits' in stats
    assert 'avg_age_days' in stats
    assert 'stale_entries' in stats

def test_webp_variant_handling(cache, tmp_path):
    """Test handling of WebP variants."""
    # Create original and WebP version
    orig_path = tmp_path / "test.jpg"
    webp_path = tmp_path / "test.webp"
    img = Image.new('RGB', (100, 100), color='red')
    img.save(orig_path, 'JPEG')
    img.save(webp_path, 'WebP')
    
    # Add to cache with WebP variant
    success = cache.add("test1", str(orig_path), webp_path=str(webp_path))
    assert success
    
    # Verify both files are tracked
    entry = cache.get("test1")
    assert entry is not None
    assert entry.webp_path == str(webp_path)

def test_size_variant_handling(cache, tmp_path):
    """Test handling of size variants."""
    # Create original and variants
    orig_path = tmp_path / "test.jpg"
    img = Image.new('RGB', (100, 100), color='red')
    img.save(orig_path, 'JPEG')
    
    variants = {}
    for size in ['sm', 'md', 'lg']:
        variant_path = tmp_path / f"test_{size}.jpg"
        img.save(variant_path, 'JPEG')
        variants[size] = str(variant_path)
    
    # Add to cache with variants
    success = cache.add("test1", str(orig_path), variants=variants)
    assert success
    
    # Verify variants are tracked
    entry = cache.get("test1")
    assert entry is not None
    assert entry.variants == variants

def test_cache_clear(cache, test_image):
    """Test cache clearing."""
    cache.add("test1", str(test_image))
    assert len(cache.entries) == 1
    
    cache.clear()
    assert len(cache.entries) == 0
    assert cache.current_size == 0

def test_entry_removal(cache, test_image):
    """Test entry removal."""
    cache.add("test1", str(test_image))
    assert len(cache.entries) == 1
    
    success = cache.remove("test1")
    assert success
    assert len(cache.entries) == 0
    assert cache.current_size == 0 