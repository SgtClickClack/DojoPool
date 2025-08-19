"""Game service module."""

from datetime import datetime
from typing import Any, Dict, Optional

from ..models.game import Game
from ..models.enums import GameType, GameMode, GameStatus # Import enums
from ..core.extensions import cache, db
from ..utils.adaptive_difficulty import AdaptiveDifficulty
from ..utils.game_state import GameState
from ..utils.matchmaking import MatchmakingSystem
from ..core.utils.notifications import send_notification


class GameService:
    """Service for managing game operations"""

    def __init__(self):
        self.adaptive_difficulty = AdaptiveDifficulty()
        self.matchmaking = MatchmakingSystem()

    def create_game(self, player1_id: int, player2_id: int, game_type: GameType = GameType.EIGHT_BALL, game_mode: GameMode = GameMode.CASUAL) -> Dict:
        """
        Create a new game
        :param player1_id: First player's ID
        :param player2_id: Second player's ID
        :param game_type: Type of game
        :param game_mode: Mode of game
        :return: Created game details
        """
        # Removed venue_id from params here, assuming it's not directly stored on Game model based on __init__
        # Removed fetching settings for difficulty here as Game __init__ doesn't take rules/challenges/rewards

        # Create game in database with required fields
        game = Game(
            player1_id=player1_id,
            player2_id=player2_id,
            game_type=game_type, 
            game_mode=game_mode, 
            status=GameStatus.PENDING # Use enum directly
            # Removed venue_id, rules, challenges, rewards as they are not in Game.__init__
        )

        db.session.add(game)
        db.session.commit()

        # Initialize game state - assuming GameState needs rules, need to define where rules come from
        # For now, providing a default or empty ruleset. This might need refinement.
        default_rules = {} # Placeholder: Define actual default rules if needed
        game_state = GameState(game.id, default_rules) 
        self._cache_game_state(game.id, game_state)

        return {
            "game_id": game.id,
            "player1_id": player1_id,
            "player2_id": player2_id,
            "game_type": game_type.value,
            "game_mode": game_mode.value,
            # Removed venue_id and settings from return as they might not be relevant/available this way
        }

    def start_game(self, game_id: int) -> Dict:
        """
        Start a game
        :param game_id: Game ID
        :return: Updated game state
        """
        game_state = self._get_game_state(game_id)
        if not game_state:
            raise ValueError("Game not found")

        game = Game.query.get(game_id)
        if not game:
            raise ValueError("Game not found")

        # Start the game
        game_state.start_game(game.player1_id, game.player2_id)
        game.status = GameStatus.IN_PROGRESS # Use enum
        game.started_at = datetime.utcnow()

        # Save changes
        db.session.commit()
        self._cache_game_state(game_id, game_state)

        return game_state.get_state()

    def take_shot(self, game_id: int, player_id: int, shot_data: Dict) -> Dict:
        """
        Process a shot in the game
        :param game_id: Game ID
        :param player_id: Player taking the shot
        :param shot_data: Shot details
        :return: Shot result and updated game state
        """
        game_state = self._get_game_state(game_id)
        if not game_state:
            raise ValueError("Game not found")

        # Process the shot
        result = game_state.take_shot(player_id, shot_data)

        # Update game in database if game is over
        if result["game_over"]:
            game = Game.query.get(game_id)
            if game:
                game.status = GameStatus.COMPLETED # Use enum
                game.completed_at = datetime.utcnow()
                game.winner_id = game_state.winner
                db.session.commit()

        # Cache updated state
        self._cache_game_state(game_id, game_state)

        return {"result": result, "state": game_state.get_state()}

    def get_game_state(self, game_id: int) -> Dict:
        """
        Get current game state
        :param game_id: Game ID
        :return: Current game state
        """
        game_state = self._get_game_state(game_id)
        if not game_state:
            raise ValueError("Game not found")

        return game_state.get_state()

    def pause_game(self, game_id: int) -> Dict:
        """
        Pause a game
        :param game_id: Game ID
        :return: Updated game state
        """
        game_state = self._get_game_state(game_id)
        if not game_state:
            raise ValueError("Game not found")

        game_state.pause_game()

        game = Game.query.get(game_id)
        if game:
            game.status = GameStatus.PENDING # Or maybe a specific PAUSED status if added to enum
            db.session.commit()

        self._cache_game_state(game_id, game_state)

        return game_state.get_state()

    def resume_game(self, game_id: int) -> Dict:
        """
        Resume a paused game
        :param game_id: Game ID
        :return: Updated game state
        """
        game_state = self._get_game_state(game_id)
        if not game_state:
            raise ValueError("Game not found")

        game_state.resume_game()

        game = Game.query.get(game_id)
        if game:
            game.status = GameStatus.IN_PROGRESS # Use enum
            db.session.commit()

        self._cache_game_state(game_id, game_state)

        return game_state.get_state()

    def cancel_game(self, game_id: int) -> Dict:
        """
        Cancel a game
        :param game_id: Game ID
        :return: Final game state
        """
        game_state = self._get_game_state(game_id)
        if not game_state:
            raise ValueError("Game not found")

        game_state.cancel_game()

        game = Game.query.get(game_id)
        if game:
            game.status = GameStatus.CANCELLED # Use enum
            game.completed_at = datetime.utcnow() # completed_at might be better than end_time if consistent
            db.session.commit()

        self._cache_game_state(game_id, game_state)

        return game_state.get_state()

    def find_match(self, player_id: int, venue_id: Optional[int] = None) -> Optional[Dict]:
        """
        Find a match for a player
        :param player_id: Player ID
        :param venue_id: Optional venue ID
        :return: Match details if found, None otherwise
        """
        # Explicitly pass None if venue_id is None, or the int value otherwise
        # Although the target method accepts Optional implicitly via default, this might help the linter.
        venue_arg = venue_id if venue_id is not None else None 
        return self.matchmaking.find_match(player_id, venue_arg)

    def start_matchmaking(self, player_id: int, venue_id: Optional[int] = None):
        """
        Start matchmaking for a player by adding them to the queue.
        :param player_id: Player ID
        :param venue_id: Optional venue ID
        """
        # Explicitly pass None if venue_id is None, or the int value otherwise
        venue_arg = venue_id if venue_id is not None else None
        self.matchmaking._add_to_queue(player_id, venue_arg)
        # Consider returning something, like queue position or success status

    def cancel_matchmaking(self, player_id: int):
        """
        Cancel matchmaking for a player.
        :param player_id: Player ID
        """
        self.matchmaking.cancel_matchmaking(player_id)

    def _get_game_state(self, game_id: int) -> Optional[GameState]:
        """Get game state from cache or create new one"""
        # Try to get from cache
        cache_key = f"game_state:{game_id}"
        cached_state = cache.get(cache_key)

        if cached_state:
            game_state = GameState(game_id, cached_state["rules"])
            game_state.load_state(cached_state)
            return game_state

        # If not in cache, create from database
        game = Game.query.get(game_id)
        if not game:
            return None

        # Create new game state
        game_state = GameState(game_id, game.rules)
        if game.status != "pending":
            # Initialize with current game state
            state = {
                "status": game.status,
                "current_player": game.current_player_id,
                "winner": game.winner_id,
                "start_time": game.start_time.isoformat() if game.start_time else None,
                "end_time": game.end_time.isoformat() if game.end_time else None,
                "shots": game.shots or {},
                "fouls": game.fouls or {},
                "ball_states": game.ball_states or {},
                "player_types": game.player_types or {},
                "eight_ball_allowed": game.eight_ball_allowed,
                "rules": game.rules,
            }
            game_state.load_state(state)

        # Cache the state
        self._cache_game_state(game_id, game_state)

        return game_state

    def _cache_game_state(self, game_id: int, game_state: GameState):
        """Cache game state"""
        cache_key = f"game_state:{game_id}"
        cache.set(cache_key, game_state.get_state(), timeout=3600)  # Cache for 1 hour


def game_completed_notification(game: Game):
    """Send notification when game is completed."""
    if game.status == GameStatus.COMPLETED and game.winner and game.player1 and game.player2:
        winner = game.winner
        loser = game.player2 if winner.id == game.player1_id else game.player1

        if not loser: 
            return

        # Ensure usernames exist or provide fallback
        winner_username = getattr(winner, 'username', f'User {winner.id}')
        loser_username = getattr(loser, 'username', f'User {loser.id}')

        # Notify winner
        winner_message = f"Congratulations! You won your game against {loser_username}. Score: {game.score}"
        winner_metadata = {
            "user_id": winner.id,
            "game_id": game.id,
            "result": "win",
            "opponent_username": loser_username,
            "score": game.score,
            "title": "Game Completed - Victory!" 
        }
        send_notification(
            message=winner_message,
            channel="in_app", 
            priority="high", 
            metadata=winner_metadata
        )

        # Notify loser
        loser_message = f"Game finished. You played against {winner_username}. Score: {game.score}. {winner_username} won."
        loser_metadata = {
            "user_id": loser.id,
            "game_id": game.id,
            "result": "loss",
            "opponent_username": winner_username,
            "score": game.score,
            "title": "Game Completed"
        }
        send_notification(
            message=loser_message,
            channel="in_app", 
            priority="normal",
            metadata=loser_metadata
        )

def get_game_details(game_id: int) -> Dict[str, Any]:
    """Get detailed game information."""
    game = db.session.get(Game, game_id)
    if not game:
        return {}
        
    winner_username = None
    if game.winner:
       winner_username = getattr(game.winner, 'username', f'User {game.winner.id}')

    player1_username = getattr(game.player1, 'username', f'User {game.player1_id}')
    player2_username = getattr(game.player2, 'username', f'User {game.player2_id}')

    return {
        "id": game.id,
        "player1": player1_username,
        "player2": player2_username,
        "game_type": game.game_type.value,
        "game_mode": game.game_mode.value,
        "status": game.status.value,
        "winner": winner_username,
        "score": game.score,
        "created_at": game.created_at.isoformat() if game.created_at else None,
        "started_at": game.started_at.isoformat() if game.started_at else None,
        "completed_at": game.completed_at.isoformat() if game.completed_at else None,
    }
