import pytest
from src.api.api_handler import APIHandler

@pytest.mark.asyncio
async def test_rate_limiting(api_handler):
    """Test API rate limiting functionality."""
    
    # Test successful calls within limit
    for _ in range(2):
        result = await api_handler.fetch_places("test_query", {"lat": 40.7128, "lng": -74.0060})
        assert result is not None
        assert result["status"] == "success"
        assert "data" in result
        assert "results" in result["data"]
        assert len(result["data"]["results"]) == 2
    
    # Test rate limit exceeded
    with pytest.raises(Exception) as exc_info:
        await api_handler.fetch_places("test_query", {"lat": 40.7128, "lng": -74.0060})
    
    assert "Rate limit exceeded" in str(exc_info.value)