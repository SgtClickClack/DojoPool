import pytest_asyncio
from unittest.mock import Mock
from datetime import datetime, timedelta
from src.api.api_handler import APIHandler

@pytest_asyncio.fixture
async def api_handler():
    handler = APIHandler()
    
    # Mock database client and collection
    handler.db_client = Mock()
    handler.db = Mock()
    
    # Initialize rate limits for testing
    handler.rate_limits = {
        'places': {
            'calls': 0,
            'reset_time': datetime.now() - timedelta(hours=2),
            'limit': 2  # Ensure rate limit is low for testing
        },
        'weather': {
            'calls': 0,
            'reset_time': datetime.now(),
            'limit': 1000
        }
    }
    
    # Optionally, mock cache
    handler.cache = {}
    
    return handler 