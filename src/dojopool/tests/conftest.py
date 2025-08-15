import pytest
from unittest.mock import AsyncMock, patch


@pytest.fixture
def mock_cache_service():
    """Mock cache service for testing."""
    with patch("dojopool.core.extensions.cache") as mock:
        mock.get = AsyncMock(return_value=None)
        mock.set = AsyncMock()
        yield mock


@pytest.fixture
def mock_db_service():
    """Mock database service for testing."""
    with patch("dojopool.core.extensions.db") as mock:
        mock.session = AsyncMock()
        mock.session.commit = AsyncMock()
        mock.session.rollback = AsyncMock()
        yield mock
