"""Database module for matchmaking persistence.

This module handles all database operations for the matchmaking system,
including storing match history, queue state, and user preferences.
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime
import asyncpg
from ..config.database import DATABASE_CONFIG
from ..models.user import User
from ..models.game import Game
from ..models.venue import Venue
from .exceptions import DatabaseError

class MatchmakingDB:
    """Database handler for matchmaking operations."""
    
    def __init__(self):
        """Initialize database connection pool."""
        self.pool = None
        
    async def initialize(self):
        """Initialize the connection pool."""
        try:
            self.pool = await asyncpg.create_pool(
                user=DATABASE_CONFIG['user'],
                password=DATABASE_CONFIG['password'],
                database=DATABASE_CONFIG['database'],
                host=DATABASE_CONFIG['host'],
                port=DATABASE_CONFIG['port'],
                min_size=DATABASE_CONFIG['min_connections'],
                max_size=DATABASE_CONFIG['max_connections']
            )
        except Exception as e:
            raise DatabaseError(f"Failed to initialize database pool: {str(e)}")

    async def close(self):
        """Close the database connection pool."""
        if self.pool:
            await self.pool.close()
            
    async def store_match_history(self, match: Dict) -> int:
        """Store a completed match in the database.
        
        Args:
            match: Match data to store
            
        Returns:
            int: ID of stored match record
            
        Raises:
            DatabaseError: If database operation fails
        """
        async with self.pool.acquire() as conn:
            try:
                query = """
                    INSERT INTO match_history (
                        player1_id, player2_id, venue_id,
                        start_time, end_time, score,
                        winner_id, game_type, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING id
                """
                match_id = await conn.fetchval(
                    query,
                    match['player1_id'],
                    match['player2_id'],
                    match['venue_id'],
                    match['start_time'],
                    match['end_time'],
                    match['score'],
                    match['winner_id'],
                    match['game_type'],
                    match['status']
                )
                return match_id
            except Exception as e:
                raise DatabaseError(f"Failed to store match history: {str(e)}")

    async def get_user_match_history(
        self,
        user_id: int,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict]:
        """Get match history for a user.
        
        Args:
            user_id: ID of user to get history for
            limit: Maximum number of matches to return
            offset: Number of matches to skip
            
        Returns:
            List[Dict]: List of match records
            
        Raises:
            DatabaseError: If database operation fails
        """
        async with self.pool.acquire() as conn:
            try:
                query = """
                    SELECT *
                    FROM match_history
                    WHERE player1_id = $1 OR player2_id = $1
                    ORDER BY start_time DESC
                    LIMIT $2 OFFSET $3
                """
                records = await conn.fetch(query, user_id, limit, offset)
                return [dict(record) for record in records]
            except Exception as e:
                raise DatabaseError(f"Failed to get user match history: {str(e)}")

    async def store_queue_entry(self, entry: Dict) -> int:
        """Store a queue entry in the database.
        
        Args:
            entry: Queue entry data to store
            
        Returns:
            int: ID of stored queue entry
            
        Raises:
            DatabaseError: If database operation fails
        """
        async with self.pool.acquire() as conn:
            try:
                query = """
                    INSERT INTO matchmaking_queue (
                        user_id, preferences, join_time,
                        priority, last_check, status
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                """
                entry_id = await conn.fetchval(
                    query,
                    entry['user_id'],
                    entry['preferences'],
                    entry['join_time'],
                    entry['priority'],
                    entry['last_check'],
                    'active'
                )
                return entry_id
            except Exception as e:
                raise DatabaseError(f"Failed to store queue entry: {str(e)}")

    async def update_queue_entry(self, entry_id: int, updates: Dict) -> bool:
        """Update a queue entry in the database.
        
        Args:
            entry_id: ID of queue entry to update
            updates: Fields to update
            
        Returns:
            bool: True if successful
            
        Raises:
            DatabaseError: If database operation fails
        """
        async with self.pool.acquire() as conn:
            try:
                set_clauses = []
                values = []
                for i, (key, value) in enumerate(updates.items(), start=1):
                    set_clauses.append(f"{key} = ${i}")
                    values.append(value)
                    
                query = f"""
                    UPDATE matchmaking_queue
                    SET {', '.join(set_clauses)}
                    WHERE id = ${len(values) + 1}
                """
                values.append(entry_id)
                
                result = await conn.execute(query, *values)
                return 'UPDATE 1' in result
            except Exception as e:
                raise DatabaseError(f"Failed to update queue entry: {str(e)}")

    async def get_active_queue_entries(self) -> List[Dict]:
        """Get all active queue entries.
        
        Returns:
            List[Dict]: List of active queue entries
            
        Raises:
            DatabaseError: If database operation fails
        """
        async with self.pool.acquire() as conn:
            try:
                query = """
                    SELECT *
                    FROM matchmaking_queue
                    WHERE status = 'active'
                    ORDER BY priority DESC, join_time ASC
                """
                records = await conn.fetch(query)
                return [dict(record) for record in records]
            except Exception as e:
                raise DatabaseError(f"Failed to get active queue entries: {str(e)}")

    async def store_user_preferences(self, user_id: int, preferences: Dict) -> bool:
        """Store user matchmaking preferences.
        
        Args:
            user_id: ID of user
            preferences: Matchmaking preferences
            
        Returns:
            bool: True if successful
            
        Raises:
            DatabaseError: If database operation fails
        """
        async with self.pool.acquire() as conn:
            try:
                query = """
                    INSERT INTO user_preferences (user_id, preferences)
                    VALUES ($1, $2)
                    ON CONFLICT (user_id)
                    DO UPDATE SET preferences = $2
                """
                await conn.execute(query, user_id, preferences)
                return True
            except Exception as e:
                raise DatabaseError(f"Failed to store user preferences: {str(e)}")

    async def get_user_preferences(self, user_id: int) -> Optional[Dict]:
        """Get user matchmaking preferences.
        
        Args:
            user_id: ID of user
            
        Returns:
            Optional[Dict]: User preferences if found
            
        Raises:
            DatabaseError: If database operation fails
        """
        async with self.pool.acquire() as conn:
            try:
                query = """
                    SELECT preferences
                    FROM user_preferences
                    WHERE user_id = $1
                """
                record = await conn.fetchrow(query, user_id)
                return dict(record['preferences']) if record else None
            except Exception as e:
                raise DatabaseError(f"Failed to get user preferences: {str(e)}")

    async def store_blocked_pair(self, blocker_id: int, blocked_id: int) -> bool:
        """Store a blocked player pair.
        
        Args:
            blocker_id: ID of user initiating block
            blocked_id: ID of blocked user
            
        Returns:
            bool: True if successful
            
        Raises:
            DatabaseError: If database operation fails
        """
        async with self.pool.acquire() as conn:
            try:
                query = """
                    INSERT INTO blocked_pairs (blocker_id, blocked_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                """
                await conn.execute(query, blocker_id, blocked_id)
                return True
            except Exception as e:
                raise DatabaseError(f"Failed to store blocked pair: {str(e)}")

    async def remove_blocked_pair(self, blocker_id: int, blocked_id: int) -> bool:
        """Remove a blocked player pair.
        
        Args:
            blocker_id: ID of user who initiated block
            blocked_id: ID of blocked user
            
        Returns:
            bool: True if successful
            
        Raises:
            DatabaseError: If database operation fails
        """
        async with self.pool.acquire() as conn:
            try:
                query = """
                    DELETE FROM blocked_pairs
                    WHERE blocker_id = $1 AND blocked_id = $2
                """
                result = await conn.execute(query, blocker_id, blocked_id)
                return 'DELETE 1' in result
            except Exception as e:
                raise DatabaseError(f"Failed to remove blocked pair: {str(e)}")

    async def get_blocked_pairs(self, user_id: int) -> List[Tuple[int, int]]:
        """Get all blocked pairs involving a user.
        
        Args:
            user_id: ID of user
            
        Returns:
            List[Tuple[int, int]]: List of (blocker_id, blocked_id) pairs
            
        Raises:
            DatabaseError: If database operation fails
        """
        async with self.pool.acquire() as conn:
            try:
                query = """
                    SELECT blocker_id, blocked_id
                    FROM blocked_pairs
                    WHERE blocker_id = $1 OR blocked_id = $1
                """
                records = await conn.fetch(query, user_id)
                return [(r['blocker_id'], r['blocked_id']) for r in records]
            except Exception as e:
                raise DatabaseError(f"Failed to get blocked pairs: {str(e)}")

    async def store_event(self, event: Dict) -> int:
        """Store a matchmaking event.
        
        Args:
            event: Event data to store
            
        Returns:
            int: ID of stored event
            
        Raises:
            DatabaseError: If database operation fails
        """
        async with self.pool.acquire() as conn:
            try:
                query = """
                    INSERT INTO matchmaking_events (
                        event_type, user_id, timestamp, data
                    ) VALUES ($1, $2, $3, $4)
                    RETURNING id
                """
                event_id = await conn.fetchval(
                    query,
                    event['event_type'],
                    event['user_id'],
                    event['timestamp'],
                    event['data']
                )
                return event_id
            except Exception as e:
                raise DatabaseError(f"Failed to store event: {str(e)}")

    async def get_user_events(
        self,
        user_id: int,
        event_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 50
    ) -> List[Dict]:
        """Get events for a user.
        
        Args:
            user_id: ID of user
            event_type: Optional type of events to filter by
            start_time: Optional start of time range
            end_time: Optional end of time range
            limit: Maximum number of events to return
            
        Returns:
            List[Dict]: List of events
            
        Raises:
            DatabaseError: If database operation fails
        """
        async with self.pool.acquire() as conn:
            try:
                conditions = ['user_id = $1']
                values = [user_id]
                param_count = 1
                
                if event_type:
                    param_count += 1
                    conditions.append(f'event_type = ${param_count}')
                    values.append(event_type)
                    
                if start_time:
                    param_count += 1
                    conditions.append(f'timestamp >= ${param_count}')
                    values.append(start_time)
                    
                if end_time:
                    param_count += 1
                    conditions.append(f'timestamp <= ${param_count}')
                    values.append(end_time)
                    
                query = f"""
                    SELECT *
                    FROM matchmaking_events
                    WHERE {' AND '.join(conditions)}
                    ORDER BY timestamp DESC
                    LIMIT ${param_count + 1}
                """
                values.append(limit)
                
                records = await conn.fetch(query, *values)
                return [dict(record) for record in records]
            except Exception as e:
                raise DatabaseError(f"Failed to get user events: {str(e)}")
