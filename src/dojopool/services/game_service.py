"""Game service module."""

from datetime import datetime
from typing import Dict, Optional

from ..core.extensions import cache, db
from ..utils.adaptive_difficulty import AdaptiveDifficulty
from ..utils.game_state import GameState
from ..utils.matchmaking import MatchmakingSystem


class GameService:
    """Service for managing game operations"""

    def __init__(self):
        self.adaptive_difficulty = AdaptiveDifficulty()
        self.matchmaking = MatchmakingSystem()

    def create_game(self, player1_id: int, player2_id: int, venue_id: Optional[int] = None) -> Dict:
        """
        Create a new game
        :param player1_id: First player's ID
        :param player2_id: Second player's ID
        :param venue_id: Optional venue ID
        :return: Created game details
        """
        # Get difficulty settings for player1 (initiator)
        settings = self.adaptive_difficulty.adjust_difficulty(player1_id)

        # Create game in database
        from ..core.models.game import Game

        game = Game(
            player1_id=player1_id,
            player2_id=player2_id,
            venue_id=venue_id,
            status="pending",
            rules=settings["game_rules"],
            challenges=settings["challenges"],
            rewards=settings["rewards"],
        )

        db.session.add(game)
        db.session.commit()

        # Initialize game state
        game_state = GameState(game.id, settings["game_rules"])
        self._cache_game_state(game.id, game_state)

        return {
            "game_id": game.id,
            "player1_id": player1_id,
            "player2_id": player2_id,
            "venue_id": venue_id,
            "settings": settings,
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

        from ..core.models.game import Game

        game = Game.query.get(game_id)
        if not game:
            raise ValueError("Game not found")

        # Start the game
        game_state.start_game(game.player1_id, game.player2_id)
        game.status = "active"
        game.start_time = datetime.utcnow()

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
            from ..core.models.game import Game

            game = Game.query.get(game_id)
            if game:
                game.status = "completed"
                game.end_time = datetime.utcnow()
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

        from ..core.models.game import Game

        game = Game.query.get(game_id)
        if game:
            game.status = "paused"
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

        from ..core.models.game import Game

        game = Game.query.get(game_id)
        if game:
            game.status = "active"
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

        from ..core.models.game import Game

        game = Game.query.get(game_id)
        if game:
            game.status = "cancelled"
            game.end_time = datetime.utcnow()
            db.session.commit()

        self._cache_game_state(game_id, game_state)

        return game_state.get_state()

    def find_match(self, player_id: int, venue_id: Optional[int] = None) -> Optional[Dict]:
        """
        Find a match for a player
        :param player_id: Player ID
        :param venue_id: Optional venue ID
        :return: Match details if found
        """
        return self.matchmaking.find_match(player_id, venue_id)

    def start_matchmaking(self, player_id: int, venue_id: Optional[int] = None):
        """
        Start matchmaking for a player
        :param player_id: Player ID
        :param venue_id: Optional venue ID
        """
        self.matchmaking.start_matchmaking(player_id, venue_id)

    def cancel_matchmaking(self, player_id: int):
        """
        Cancel matchmaking for a player
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
        from ..core.models.game import Game

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
