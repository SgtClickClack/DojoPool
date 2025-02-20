from flask_caching import Cache
"""Game service module."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from ..core.extensions import db, cache
from ..models.game import Game, GameSession, Shot
from ..models.user import User
from ..models.venue import Venue


class GameService:
    """Service for managing games."""

    def __init__(self):
        """Initialize game service."""
        pass

    def create_game(
        self,
        venue_id: int,
        player_ids: List[int],
        game_type: str = "8ball",
        is_ranked: bool = True,
    ) -> Dict[str, Any]:
        """Create a new game.

        Args:
            venue_id: ID of the venue
            player_ids: List of player IDs
            game_type: Type of game (8ball, 9ball, etc.)
            is_ranked: Whether the game affects rankings

        Returns:
            Dict containing game information
        """
        # Validate venue exists
        venue = Venue.query.get_or_404(venue_id)

        # Validate players exist
        players = User.query.filter(User.id.in_(player_ids)).all()
        if len(players) != len(player_ids):
            raise ValueError("One or more players not found")

        # Create new game
        game = Game(
            player_id=player_ids[0],
            opponent_id=player_ids[1] if len(player_ids) > 1 else None,
            venue_id=venue_id,
            game_type=game_type,
            is_ranked=is_ranked,
        )

        db.session.add(game)
        db.session.commit()

        return game.to_dict()

    def get_game(self, game_id: int) -> Optional[Dict[str, Any]]:
        """Get game by ID.

        Args:
            game_id: ID of the game

        Returns:
            Game information if found, None otherwise
        """
        game = Game.query.get(game_id)
        return game.to_dict() if game else None

    def update_score(self, game_id: int, player_id: int, points: int):
        """Update game score.

        Args:
            game_id: Game ID
            player_id: Player ID
            points: Points to add

        Returns:
            Updated game information
        """
        game = Game.query.get_or_404(game_id)

        if game.player_id == player_id:
            game.player_score += points
        elif game.opponent_id == player_id:
            game.opponent_score += points
        else:
            raise ValueError("Player not in this game")

        db.session.commit()
        return game.to_dict()

    def end_game(self, game_id: int, winner_id: int):
        """End a game.

        Args:
            game_id: Game ID
            winner_id: Winner's user ID

        Returns:
            Final game information
        """
        game = Game.query.get_or_404(game_id)

        if winner_id not in [game.player_id, game.opponent_id]:
            raise ValueError("Winner must be a player in the game")

        game.winner_id = winner_id
        game.status = "completed"
        game.ended_at = datetime.utcnow()

        db.session.commit()
        return game.to_dict()
