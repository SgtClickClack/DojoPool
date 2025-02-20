from flask_caching import Cache
from flask_caching import Cache
"""Game resources for the API."""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

from flask import current_app, request
from flask_login import current_user, login_required
from marshmallow import Schema, ValidationError, fields, validate, validates_schema
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.cache.flask_cache import (
    cache_response_flask,
    invalidate_endpoint_cache,
)
from dojopool.core.config import CACHE_REGIONS, CACHED_ENDPOINTS
from dojopool.core.exceptions import AuthorizationError, NotFoundError
from dojopool.core.security import require_auth, require_roles
from dojopool.models.game import Game, GameStatus, GameType
from dojopool.models.user import User

from .base import BaseResource


class PlayerSchema(Schema):
    """Schema for player data validation."""

    user_id = fields.Integer(required=True)
    score = fields.Integer(required=True, validate=[validate.Range(min=0)])


class GameSchema(Schema):
    """Schema for game data validation."""

    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description: Any = fields.Str()
    created_at: Any = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class GameUpdateSchema(Schema):
    """Schema for game update data validation."""

    status = fields.Enum(GameStatus, required=True)
    player1_score = fields.Integer(required=True, validate=[validate.Range(min=0)])
    player2_score: Any = fields.Integer(required=True, validate=[validate.Range(min=0)])


class GameStatsSchema(Schema):
    """Schema for game statistics."""

    total_games: Any = fields.Integer()
    games_won = fields.Integer()
    games_lost: Any = fields.Integer()
    win_rate: Any = fields.Float()
    average_score = fields.Float()
    highest_score: Any = fields.Integer()
    total_playtime: Any = fields.Integer()  # in minutes


class GameResource(BaseResource):
    """Resource for managing individual games."""

    schema = GameSchema()
    update_schema = GameUpdateSchema()

    @login_required
    def get(self, game_id) -> Any:
        """Get a specific game."""
        game: Any = Game.query.get(game_id)
        if not game:
            raise NotFoundError("Game not found")
        return self.success_response(
            message="Game retrieved successfully",
            data={"game": GameSchema().dump(game)},
        )

    @login_required
    def put(self, game_id):
        """Update a specific game."""
        game: Any = Game.query.get(game_id)
        if not game:
            raise NotFoundError("Game not found")

        data: Any = self.get_json_data()
        for key, value in data.items():
            setattr(game, key, value)
        game.save()

        return self.success_response(
            message="Game updated successfully", data={"game": GameSchema().dump(game)}
        )

    @login_required
    def delete(self, game_id):
        """Delete a specific game."""
        game: Any = Game.query.get(game_id)
        if not game:
            raise NotFoundError("Game not found")

        game.delete()
        return self.success_response(message="Game deleted successfully")


class GameListResource(BaseResource):
    """Resource for listing and creating games."""

    schema = GameSchema()

    @login_required
    def get(self):
        """Get list of games."""
        games: Any = Game.query.all()
        return self.success_response(
            message="Games retrieved successfully",
            data={"games": GameSchema(many=True).dump(games)},
        )

    @login_required
    def post(self):
        """Create a new game."""
        data: Any = self.get_json_data()
        game: Any = Game(**data)
        game.save()
        return self.success_response(
            message="Game created successfully",
            data={"game": GameSchema().dump(game)},
            status_code=201,
        )


class GameStatsResource(BaseResource):
    """Resource for game statistics."""

    schema = GameStatsSchema()

    @login_required
    def get(self, game_id):
        """Get statistics for a specific game."""
        game: Any = Game.query.get(game_id)
        if not game:
            raise NotFoundError("Game not found")

        # TODO: Implement game statistics
        stats: Dict[Any, Any] = {
            "total_matches": 0,
            "total_players": 0,
            "average_duration": 0,
        }

        return self.success_response(
            message="Game statistics retrieved successfully", data={"stats": stats}
        )
