import gc
import gc
"""Matchmaking database module.

This module provides database operations for matchmaking functionality.
"""

import logging
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple, Union, cast
from uuid import UUID

from sqlalchemy import ForeignKey, text
from sqlalchemy.orm import Mapped, Session, mapped_column, relationship

from ..database import db_session
from ..models.game import Game
from ..models.user import User
from ..models.venue import Venue

logger: Any = logging.getLogger(__name__)


class MatchmakingDB:
    """Handles database operations for matchmaking."""

    def __init__(self) -> None:
        """Initialize matchmaking database."""
        self.initialize()

    def initialize(self):
        """Initialize database tables and indexes."""
        with db_session() as session:
            try:
                # Create tables if they don't exist
                session.execute(
                    text(
                        """
                    CREATE TABLE IF NOT EXISTS matchmaking_queue (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        skill_level INTEGER NOT NULL,
                        game_type VARCHAR(50) NOT NULL,
                        venue_id INTEGER,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        status VARCHAR(20) NOT NULL DEFAULT 'waiting',
                        FOREIGN KEY (user_id) REFERENCES users(id),
                        FOREIGN KEY (venue_id) REFERENCES venues(id)
                    )
                """
                    )
                )

                session.execute(
                    text(
                        """
                    CREATE TABLE IF NOT EXISTS match_history (
                        id SERIAL PRIMARY KEY,
                        game_id INTEGER NOT NULL,
                        player1_id INTEGER NOT NULL,
                        player2_id INTEGER NOT NULL,
                        winner_id INTEGER NOT NULL,
                        loser_id INTEGER NOT NULL,
                        venue_id INTEGER,
                        played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        game_type VARCHAR(50) NOT NULL,
                        score VARCHAR(50),
                        FOREIGN KEY (game_id) REFERENCES games(id),
                        FOREIGN KEY (player1_id) REFERENCES users(id),
                        FOREIGN KEY (player2_id) REFERENCES users(id),
                        FOREIGN KEY (winner_id) REFERENCES users(id),
                        FOREIGN KEY (loser_id) REFERENCES users(id),
                        FOREIGN KEY (venue_id) REFERENCES venues(id)
                    )
                """
                    )
                )

                session.execute(
                    text(
                        """
                    CREATE TABLE IF NOT EXISTS blocked_pairs (
                        id SERIAL PRIMARY KEY,
                        user1_id INTEGER NOT NULL,
                        user2_id INTEGER NOT NULL,
                        reason VARCHAR(200),
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user1_id) REFERENCES users(id),
                        FOREIGN KEY (user2_id) REFERENCES users(id),
                        UNIQUE (user1_id, user2_id)
                    )
                """
                    )
                )

                session.commit()
                logger.info("Matchmaking tables initialized successfully")
            except Exception as e:
                session.rollback()
                logger.error(f"Error initializing matchmaking tables: {str(e)}")
                raise

    def store_match_history(
        self,
        game_id: int,
        player1_id: int,
        player2_id: int,
        winner_id: int,
        game_type: str,
        venue_id: Optional[int] = None,
        score: Optional[str] = None,
    ):
        """Store a completed match in the history.

        Args:
            game_id: Unique identifier for the game
            player1_id: ID of first player
            player2_id: ID of second player
            winner_id: ID of winning player
            game_type: Type of game played
            venue_id: Optional venue where game was played
            score: Optional final score

        Returns:
            int: ID of the created match history entry
        """
        try:
            with Session() as session:
                match: Dict[Any, Any] = {
                    "game_id": game_id,
                    "player1_id": player1_id,
                    "player2_id": player2_id,
                    "winner_id": winner_id,
                    "game_type": game_type,
                    "venue_id": venue_id,
                    "score": score,
                }

                result: Any = session.execute(
                    text(
                        """
                    INSERT INTO match_history 
                    (game_id, player1_id, player2_id, winner_id, game_type, venue_id, score)
                    VALUES (:game_id, :player1_id, :player2_id, :winner_id, :game_type, :venue_id, :score)
                    RETURNING id
                """
                    ),
                    match,
                )

                match_id: Any = result.scalar_one()
                session.commit()
                return match_id

        except Exception as e:
            logger.error(f"Error storing match history: {str(e)}")
            raise

    def get_user_match_history(self, user_id: int, limit: int = 10, offset: int = 0):
        """Get match history for user.

        Args:
            user_id: User ID
            limit: Maximum number of matches to return
            offset: Number of matches to skip

        Returns:
            List[Dict[str, Any]]: Match history entries
        """
        with db_session() as session:
            try:
                result: Any = session.execute(
                    text(
                        """
                    SELECT 
                        mh.*,
                        g.name as game_name,
                        v.name as venue_name,
                        p1.username as player1_name,
                        p2.username as player2_name,
                        w.username as winner_name,
                        l.username as loser_name
                    FROM match_history mh
                    JOIN games g ON mh.game_id = g.id
                    LEFT JOIN venues v ON mh.venue_id = v.id
                    JOIN users p1 ON mh.player1_id = p1.id
                    JOIN users p2 ON mh.player2_id = p2.id
                    JOIN users w ON mh.winner_id = w.id
                    JOIN users l ON mh.loser_id = l.id
                    WHERE mh.player1_id = :user_id OR mh.player2_id = :user_id
                    ORDER BY mh.played_at DESC
                    LIMIT :limit OFFSET :offset
                """
                    ),
                    {"user_id": user_id, "limit": limit, "offset": offset},
                )

                return [dict(row) for row in result]

            except Exception as e:
                logger.error(f"Error getting match history: {str(e)}")
                return []

    def store_queue_entry(
        self,
        user_id: int,
        skill_level: int,
        game_type: str,
        venue_id: Optional[int] = None,
    ) -> int:
        """Store matchmaking queue entry.

        Args:
            user_id: User ID
            skill_level: Player skill level
            game_type: Type of game
            venue_id: Optional venue ID

        Returns:
            int: Queue entry ID
        """
        with db_session() as session:
            try:
                result: Any = session.execute(
                    text(
                        """
                    INSERT INTO matchmaking_queue (
                        user_id, skill_level, game_type, venue_id
                    ) VALUES (
                        :user_id, :skill_level, :game_type, :venue_id
                    ) RETURNING id
                """
                    ),
                    {
                        "user_id": user_id,
                        "skill_level": skill_level,
                        "game_type": game_type,
                        "venue_id": venue_id,
                    },
                )

                session.commit()
                return cast(int, result.scalar())

            except Exception as e:
                session.rollback()
                logger.error(f"Error storing queue entry: {str(e)}")
                raise

    def update_queue_entry(self, entry_id: int, status: str, **kwargs: Any):
        """Update matchmaking queue entry.

        Args:
            entry_id: Queue entry ID
            status: New status
            **kwargs: Additional fields to update

        Returns:
            bool: True if successful
        """
        valid_fields: Set[Any] = {"skill_level", "game_type", "venue_id"}
        update_fields: Any = {k: v for k, v in kwargs.items() if k in valid_fields}
        update_fields["status"] = status

        with db_session() as session:
            try:
                session.execute(
                    text(
                        """
                    UPDATE matchmaking_queue
                    SET status = :status
                    WHERE id = :entry_id
                """
                    ),
                    {"entry_id": entry_id, "status": status},
                )

                session.commit()
                return True

            except Exception as e:
                session.rollback()
                logger.error(f"Error updating queue entry: {str(e)}")
                return False

    def get_active_queue_entries(
        self, game_type: Optional[str] = None, venue_id: Optional[int] = None
    ):
        """Get active queue entries.

        Args:
            game_type: Optional game type filter
            venue_id: Optional venue filter

        Returns:
            List[Dict[str, Any]]: Active queue entries
        """
        with db_session() as session:
            try:
                query: str = """
                    SELECT 
                        q.*,
                        u.username,
                        v.name as venue_name
                    FROM matchmaking_queue q
                    JOIN users u ON q.user_id = u.id
                    LEFT JOIN venues v ON q.venue_id = v.id
                    WHERE q.status = 'waiting'
                """
                params: Dict[str, Any] = {}

                if game_type:
                    query += " AND q.game_type = :game_type"
                    params["game_type"] = game_type

                if venue_id:
                    query += " AND q.venue_id = :venue_id"
                    params["venue_id"] = venue_id

                query += " ORDER BY q.created_at ASC"

                result: Any = session.execute(text(query), params)
                return [dict(row) for row in result]

            except Exception as e:
                logger.error(f"Error getting queue entries: {str(e)}")
                return []

    def store_blocked_pair(
        self, user1_id: int, user2_id: int, reason: Optional[str] = None
    ):
        """Store blocked player pair.

        Args:
            user1_id: First user ID
            user2_id: Second user ID
            reason: Optional reason for blocking

        Returns:
            bool: True if successful
        """
        if user1_id == user2_id:
            raise ValueError("Cannot block self")

        with db_session() as session:
            try:
                session.execute(
                    text(
                        """
                    INSERT INTO blocked_pairs (user1_id, user2_id, reason)
                    VALUES (:user1_id, :user2_id, :reason)
                    ON CONFLICT (user1_id, user2_id) DO UPDATE
                    SET reason = :reason
                """
                    ),
                    {"user1_id": user1_id, "user2_id": user2_id, "reason": reason},
                )

                session.commit()
                return True

            except Exception as e:
                session.rollback()
                logger.error(f"Error storing blocked pair: {str(e)}")
                return False

    def remove_blocked_pair(self, user1_id: int, user2_id: int) -> bool:
        """Remove blocked player pair.

        Args:
            user1_id: First user ID
            user2_id: Second user ID

        Returns:
            bool: True if successful
        """
        with db_session() as session:
            try:
                session.execute(
                    text(
                        """
                    DELETE FROM blocked_pairs
                    WHERE (user1_id = :user1_id AND user2_id = :user2_id)
                    OR (user1_id = :user2_id AND user2_id = :user1_id)
                """
                    ),
                    {"user1_id": user1_id, "user2_id": user2_id},
                )

                session.commit()
                return True

            except Exception as e:
                session.rollback()
                logger.error(f"Error removing blocked pair: {str(e)}")
                return False

    def get_blocked_pairs(self, user_id: int):
        """Get blocked pairs for user.

        Args:
            user_id: User ID

        Returns:
            List[Dict[str, Any]]: Blocked pair entries
        """
        with db_session() as session:
            try:
                result: Any = session.execute(
                    text(
                        """
                    SELECT 
                        bp.*,
                        u1.username as user1_name,
                        u2.username as user2_name
                    FROM blocked_pairs bp
                    JOIN users u1 ON bp.user1_id = u1.id
                    JOIN users u2 ON bp.user2_id = u2.id
                    WHERE bp.user1_id = :user_id OR bp.user2_id = :user_id
                """
                    ),
                    {"user_id": user_id},
                )

                return [dict(row) for row in result]

            except Exception as e:
                logger.error(f"Error getting blocked pairs: {str(e)}")
                return []
