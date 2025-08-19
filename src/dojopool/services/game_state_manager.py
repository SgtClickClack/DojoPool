"""
Game State Manager Service

This module provides enhanced game state management with real-time updates,
state persistence, and validation.
"""

from typing import Dict, List, Optional, Any, Set, Coroutine, Awaitable
from datetime import datetime
import json
import logging
from redis import Redis
from sqlalchemy.orm import Session
import asyncio

from ..core.game.state import GameState, GameStatus, GameType
from ..core.exceptions import GameStateError
from ..core.utils.redis import get_redis_client

logger = logging.getLogger(__name__)

class GameStateManager:
    """Enhanced game state management service."""

    def __init__(self, db_session: Session):
        """Initialize the game state manager.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
        self.redis = get_redis_client()
        self.cache_ttl = 3600  # 1 hour

    def create_game(self, game_id: str, game_type: GameType, player_ids: List[int]) -> GameState:
        """Create a new game state.
        
        Args:
            game_id: Unique game identifier
            game_type: Type of game (8ball, 9ball, etc.)
            player_ids: List of player IDs participating in the game
            
        Returns:
            Created game state
        """
        try:
            now = datetime.utcnow()
            game_state = GameState(
                game_id=game_id,
                game_type=game_type,
                status=GameStatus.WAITING,
                current_player_id=player_ids[0],
                player_ids=player_ids,
                player_groups={},
                balls_on_table=set(range(1, 16)),  # Initialize with balls 1-15
                balls_pocketed={pid: [] for pid in player_ids},
                fouls={pid: 0 for pid in player_ids},
                score={pid: 0 for pid in player_ids},
                innings=0,
                rack_number=1,
                started_at=now,
                last_action_at=now
            )
            
            # Cache the initial state
            self._cache_game_state(game_state)
            
            return game_state
            
        except Exception as e:
            logger.error(f"Error creating game: {str(e)}")
            raise GameStateError(f"Failed to create game: {str(e)}")

    def get_game_state(self, game_id: str) -> Optional[GameState]:
        """Get current game state.
        
        Args:
            game_id: ID of the game
            
        Returns:
            Current game state or None if not found
        """
        try:
            # Try to get from cache first
            cached_state = self._get_cached_state(game_id)
            if cached_state:
                return cached_state
                
            # If not in cache, get from database
            game_state = self.db.query(GameState).get(game_id)
            if game_state:
                # Cache the state
                self._cache_game_state(game_state)
                return game_state
                
            return None
            
        except Exception as e:
            logger.error(f"Error getting game state: {str(e)}")
            raise GameStateError(f"Failed to get game state: {str(e)}")

    def update_game_state(self, game_id: str, updates: Dict[str, Any]) -> GameState:
        """Update game state.
        
        Args:
            game_id: ID of the game
            updates: Dictionary of updates to apply
            
        Returns:
            Updated game state
        """
        try:
            game_state = self.get_game_state(game_id)
            if not game_state:
                raise GameStateError("Game not found")
                
            # Apply updates
            for key, value in updates.items():
                if hasattr(game_state, key):
                    setattr(game_state, key, value)
                    
            game_state.last_action_at = datetime.utcnow()
            
            # Update cache
            self._cache_game_state(game_state)
            
            return game_state
            
        except Exception as e:
            logger.error(f"Error updating game state: {str(e)}")
            raise GameStateError(f"Failed to update game state: {str(e)}")

    def start_game(self, game_id: str) -> GameState:
        """Start a game.
        
        Args:
            game_id: ID of the game
            
        Returns:
            Updated game state
        """
        try:
            game_state = self.get_game_state(game_id)
            if not game_state:
                raise GameStateError("Game not found")
                
            if game_state.status != GameStatus.WAITING:
                raise GameStateError("Game can only be started from waiting status")
                
            game_state.status = GameStatus.IN_PROGRESS
            game_state.last_action_at = datetime.utcnow()
            
            # Update cache
            self._cache_game_state(game_state)
            
            return game_state
            
        except Exception as e:
            logger.error(f"Error starting game: {str(e)}")
            raise GameStateError(f"Failed to start game: {str(e)}")

    def end_game(self, game_id: str, winner_id: int) -> GameState:
        """End a game.
        
        Args:
            game_id: ID of the game
            winner_id: ID of the winner
            
        Returns:
            Updated game state
        """
        try:
            game_state = self.get_game_state(game_id)
            if not game_state:
                raise GameStateError("Game not found")
                
            if game_state.status != GameStatus.IN_PROGRESS:
                raise GameStateError("Only active games can be ended")
                
            game_state.status = GameStatus.COMPLETED
            game_state.winner_id = winner_id
            game_state.last_action_at = datetime.utcnow()
            
            # Update cache
            self._cache_game_state(game_state)
            
            return game_state
            
        except Exception as e:
            logger.error(f"Error ending game: {str(e)}")
            raise GameStateError(f"Failed to end game: {str(e)}")

    def pause_game(self, game_id: str) -> GameState:
        """Pause a game.
        
        Args:
            game_id: ID of the game
            
        Returns:
            Updated game state
        """
        try:
            game_state = self.get_game_state(game_id)
            if not game_state:
                raise GameStateError("Game not found")
                
            if game_state.status != GameStatus.IN_PROGRESS:
                raise GameStateError("Only active games can be paused")
                
            game_state.status = GameStatus.PAUSED
            game_state.last_action_at = datetime.utcnow()
            
            # Update cache
            self._cache_game_state(game_state)
            
            return game_state
            
        except Exception as e:
            logger.error(f"Error pausing game: {str(e)}")
            raise GameStateError(f"Failed to pause game: {str(e)}")

    def resume_game(self, game_id: str) -> GameState:
        """Resume a paused game.
        
        Args:
            game_id: ID of the game
            
        Returns:
            Updated game state
        """
        try:
            game_state = self.get_game_state(game_id)
            if not game_state:
                raise GameStateError("Game not found")
                
            if game_state.status != GameStatus.PAUSED:
                raise GameStateError("Only paused games can be resumed")
                
            game_state.status = GameStatus.IN_PROGRESS
            game_state.last_action_at = datetime.utcnow()
            
            # Update cache
            self._cache_game_state(game_state)
            
            return game_state
            
        except Exception as e:
            logger.error(f"Error resuming game: {str(e)}")
            raise GameStateError(f"Failed to resume game: {str(e)}")

    def cancel_game(self, game_id: str) -> GameState:
        """Cancel a game.
        
        Args:
            game_id: ID of the game
            
        Returns:
            Updated game state
        """
        try:
            game_state = self.get_game_state(game_id)
            if not game_state:
                raise GameStateError("Game not found")
                
            if game_state.status == GameStatus.COMPLETED:
                raise GameStateError("Completed games cannot be cancelled")
                
            game_state.status = GameStatus.CANCELLED
            game_state.last_action_at = datetime.utcnow()
            
            # Update cache
            self._cache_game_state(game_state)
            
            return game_state
            
        except Exception as e:
            logger.error(f"Error cancelling game: {str(e)}")
            raise GameStateError(f"Failed to cancel game: {str(e)}")

    def next_turn(self, game_id: str, next_player_id: int) -> GameState:
        """Set the next player's turn.
        
        Args:
            game_id: ID of the game
            next_player_id: ID of the next player
            
        Returns:
            Updated game state
        """
        try:
            game_state = self.get_game_state(game_id)
            if not game_state:
                raise GameStateError("Game not found")
                
            if game_state.status != GameStatus.IN_PROGRESS:
                raise GameStateError("Can only change turns in active games")
                
            if next_player_id not in game_state.player_ids:
                raise GameStateError("Next player must be a participant in the game")
                
            game_state.current_player_id = next_player_id
            game_state.last_action_at = datetime.utcnow()
            
            # Update cache
            self._cache_game_state(game_state)
            
            return game_state
            
        except Exception as e:
            logger.error(f"Error setting next turn: {str(e)}")
            raise GameStateError(f"Failed to set next turn: {str(e)}")

    def _cache_game_state(self, game_state: GameState) -> None:
        """Cache game state in Redis.
        
        Args:
            game_state: Game state to cache
        """
        try:
            cache_key = f"game_state:{game_state.game_id}"
            # Convert game state to JSON string for Redis storage
            state_dict = game_state.to_dict()
            state_json = json.dumps(state_dict)
            self.redis.setex(
                cache_key,
                self.cache_ttl,
                state_json
            )
        except Exception as e:
            logger.error(f"Error caching game state: {str(e)}")

    async def _get_cached_state(self, game_id: str) -> Optional[GameState]:
        """Get game state from cache.
        
        Args:
            game_id: ID of the game
            
        Returns:
            Optional[GameState]: The cached game state or None if not found
        """
        try:
            cache_key = f"game_state:{game_id}"
            cached_data = await self.redis.get(cache_key)
            if cached_data:
                # Parse JSON string back to dictionary
                state_dict = json.loads(cached_data)
                return GameState.from_dict(state_dict)
            return None
        except Exception as e:
            logger.error(f"Error getting cached state: {str(e)}")
            return None 