import pytest
import asyncio
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from src.api.api_handler import APIHandler

# Fixture for API Handler
@pytest.fixture
async def api_handler():
    handler = APIHandler()
    # Setup test database connection
    handler.db_client = Mock()
    handler.db = Mock()
    return handler

# Test API Rate Limiting
@pytest.mark.asyncio
async def test_rate_limiting(api_handler):
    """Test API rate limiting functionality."""
    # Mock rate limit data
    api_handler.rate_limits['places'] = {
        'calls': 0,
        'reset_time': datetime.now() - timedelta(hours=2),
        'limit': 2
    }
    
    # Test successful calls within limit
    for _ in range(2):
        result = await api_handler.fetch_places("test", {"lat": 0, "lng": 0})
        assert result is not None
    
    # Test rate limit exceeded
    with pytest.raises(Exception) as exc_info:
        await api_handler.fetch_places("test", {"lat": 0, "lng": 0})
    assert "Rate limit exceeded" in str(exc_info.value)

# Test Caching
@pytest.mark.asyncio
async def test_caching(api_handler):
    """Test API response caching."""
    test_location = {"lat": 35.6762, "lng": 139.6503}
    cache_key = f"weather_{test_location['lat']}_{test_location['lng']}"
    
    # First call should cache the result
    with patch('aiohttp.ClientSession.get') as mock_get:
        mock_get.return_value.__aenter__.return_value.status = 200
        mock_get.return_value.__aenter__.return_value.json = \
            asyncio.coroutine(lambda: {"temp": 20})
        
        result1 = await api_handler.fetch_weather(test_location)
        assert result1 is not None
        assert cache_key in api_handler.cache
        
        # Second call should use cached result
        result2 = await api_handler.fetch_weather(test_location)
        assert result2 is not None
        mock_get.assert_called_once()  # Verify API was only called once 