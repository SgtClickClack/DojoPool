"""Tests for the matchmaking database module."""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock

from ..database import MatchmakingDB
from ..exceptions import DatabaseError
from .test_config import TEST_USERS, TEST_VENUES

@pytest.mark.asyncio
@pytest.mark.database
class TestMatchmakingDB:
    """Test cases for MatchmakingDB class."""

    @pytest.fixture
    async def db(self):
        """Create a database instance for testing."""
        db = MatchmakingDB()
        await db.initialize()
        yield db
        await db.close()

    @pytest.fixture
    def mock_pool(self):
        """Create a mock connection pool."""
        pool = AsyncMock()
        pool.acquire = AsyncMock()
        return pool

    @pytest.fixture
    def mock_connection(self):
        """Create a mock database connection."""
        conn = AsyncMock()
        conn.fetch = AsyncMock()
        conn.fetchval = AsyncMock()
        conn.execute = AsyncMock()
        conn.fetchrow = AsyncMock()
        return conn

    async def test_initialize(self, mock_pool):
        """Test database initialization."""
        with patch('asyncpg.create_pool', return_value=mock_pool):
            db = MatchmakingDB()
            await db.initialize()
            assert db.pool == mock_pool

    async def test_initialize_error(self):
        """Test database initialization error."""
        with patch('asyncpg.create_pool', side_effect=Exception("Connection failed")):
            db = MatchmakingDB()
            with pytest.raises(DatabaseError):
                await db.initialize()

    async def test_store_match_history(self, db, mock_pool, mock_connection):
        """Test storing match history."""
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        mock_connection.fetchval.return_value = 1
        db.pool = mock_pool
        
        match_data = {
            'player1_id': TEST_USERS['user1']['id'],
            'player2_id': TEST_USERS['user2']['id'],
            'venue_id': TEST_VENUES['venue1']['id'],
            'start_time': datetime.now(),
            'end_time': datetime.now() + timedelta(hours=1),
            'score': '8-5',
            'winner_id': TEST_USERS['user1']['id'],
            'game_type': 'eight_ball',
            'status': 'completed'
        }
        
        match_id = await db.store_match_history(match_data)
        assert match_id == 1
        mock_connection.fetchval.assert_called_once()

    async def test_get_user_match_history(self, db, mock_pool, mock_connection):
        """Test getting user match history."""
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        mock_connection.fetch.return_value = [
            {'id': 1, 'player1_id': TEST_USERS['user1']['id']},
            {'id': 2, 'player2_id': TEST_USERS['user1']['id']}
        ]
        db.pool = mock_pool
        
        history = await db.get_user_match_history(TEST_USERS['user1']['id'])
        assert len(history) == 2
        mock_connection.fetch.assert_called_once()

    async def test_store_queue_entry(self, db, mock_pool, mock_connection):
        """Test storing queue entry."""
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        mock_connection.fetchval.return_value = 1
        db.pool = mock_pool
        
        entry_data = {
            'user_id': TEST_USERS['user1']['id'],
            'preferences': {'skill_level': 'intermediate'},
            'join_time': datetime.now(),
            'priority': 1,
            'last_check': None
        }
        
        entry_id = await db.store_queue_entry(entry_data)
        assert entry_id == 1
        mock_connection.fetchval.assert_called_once()

    async def test_update_queue_entry(self, db, mock_pool, mock_connection):
        """Test updating queue entry."""
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        mock_connection.execute.return_value = 'UPDATE 1'
        db.pool = mock_pool
        
        updates = {
            'last_check': datetime.now(),
            'status': 'matched'
        }
        
        result = await db.update_queue_entry(1, updates)
        assert result is True
        mock_connection.execute.assert_called_once()

    async def test_get_active_queue_entries(self, db, mock_pool, mock_connection):
        """Test getting active queue entries."""
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        mock_connection.fetch.return_value = [
            {'id': 1, 'user_id': TEST_USERS['user1']['id']},
            {'id': 2, 'user_id': TEST_USERS['user2']['id']}
        ]
        db.pool = mock_pool
        
        entries = await db.get_active_queue_entries()
        assert len(entries) == 2
        mock_connection.fetch.assert_called_once()

    async def test_store_user_preferences(self, db, mock_pool, mock_connection):
        """Test storing user preferences."""
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        db.pool = mock_pool
        
        preferences = {
            'skill_level': 'intermediate',
            'play_style': 'aggressive',
            'preferred_venues': [TEST_VENUES['venue1']['id']]
        }
        
        result = await db.store_user_preferences(TEST_USERS['user1']['id'], preferences)
        assert result is True
        mock_connection.execute.assert_called_once()

    async def test_get_user_preferences(self, db, mock_pool, mock_connection):
        """Test getting user preferences."""
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        mock_connection.fetchrow.return_value = {
            'preferences': {
                'skill_level': 'intermediate',
                'play_style': 'aggressive'
            }
        }
        db.pool = mock_pool
        
        preferences = await db.get_user_preferences(TEST_USERS['user1']['id'])
        assert preferences['skill_level'] == 'intermediate'
        mock_connection.fetchrow.assert_called_once()

    async def test_store_blocked_pair(self, db, mock_pool, mock_connection):
        """Test storing blocked pair."""
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        db.pool = mock_pool
        
        result = await db.store_blocked_pair(
            TEST_USERS['user1']['id'],
            TEST_USERS['user2']['id']
        )
        assert result is True
        mock_connection.execute.assert_called_once()

    async def test_remove_blocked_pair(self, db, mock_pool, mock_connection):
        """Test removing blocked pair."""
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        mock_connection.execute.return_value = 'DELETE 1'
        db.pool = mock_pool
        
        result = await db.remove_blocked_pair(
            TEST_USERS['user1']['id'],
            TEST_USERS['user2']['id']
        )
        assert result is True
        mock_connection.execute.assert_called_once()

    async def test_get_blocked_pairs(self, db, mock_pool, mock_connection):
        """Test getting blocked pairs."""
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        mock_connection.fetch.return_value = [
            {'blocker_id': TEST_USERS['user1']['id'], 'blocked_id': TEST_USERS['user2']['id']},
            {'blocker_id': TEST_USERS['user2']['id'], 'blocked_id': TEST_USERS['user1']['id']}
        ]
        db.pool = mock_pool
        
        pairs = await db.get_blocked_pairs(TEST_USERS['user1']['id'])
        assert len(pairs) == 2
        mock_connection.fetch.assert_called_once()

    async def test_store_event(self, db, mock_pool, mock_connection):
        """Test storing event."""
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        mock_connection.fetchval.return_value = 1
        db.pool = mock_pool
        
        event_data = {
            'event_type': 'match_found',
            'user_id': TEST_USERS['user1']['id'],
            'timestamp': datetime.now(),
            'data': {'opponent_id': TEST_USERS['user2']['id']}
        }
        
        event_id = await db.store_event(event_data)
        assert event_id == 1
        mock_connection.fetchval.assert_called_once()

    async def test_get_user_events(self, db, mock_pool, mock_connection):
        """Test getting user events."""
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        mock_connection.fetch.return_value = [
            {
                'id': 1,
                'event_type': 'match_found',
                'user_id': TEST_USERS['user1']['id'],
                'timestamp': datetime.now(),
                'data': {'opponent_id': TEST_USERS['user2']['id']}
            },
            {
                'id': 2,
                'event_type': 'match_started',
                'user_id': TEST_USERS['user1']['id'],
                'timestamp': datetime.now(),
                'data': {'match_id': 1}
            }
        ]
        db.pool = mock_pool
        
        events = await db.get_user_events(
            TEST_USERS['user1']['id'],
            event_type='match_found',
            start_time=datetime.now() - timedelta(days=1)
        )
        assert len(events) == 2
        mock_connection.fetch.assert_called_once()

    async def test_error_handling(self, db, mock_pool, mock_connection):
        """Test error handling in database operations."""
        mock_pool.acquire.return_value.__aenter__.return_value = mock_connection
        mock_connection.fetch.side_effect = Exception("Database error")
        db.pool = mock_pool
        
        with pytest.raises(DatabaseError):
            await db.get_user_match_history(TEST_USERS['user1']['id'])
