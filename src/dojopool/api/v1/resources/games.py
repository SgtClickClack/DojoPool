"""Game resources module.

This module provides API resources for game operations.
"""

from datetime import datetime
from typing import Optional

from flask import request
from flask_login import current_user
from marshmallow import Schema, ValidationError, fields, validate, validates_schema

from dojopool.models.user import User
from dojopool.core.exceptions import AuthorizationError, NotFoundError
from dojopool.models.game import Game, GameStatus, GameType, GameMode
from dojopool.core.security import require_auth, require_roles
from dojopool.core.extensions import db
# Commenting out or updating cache imports until their correct paths are confirmed
# from dojopool.core.cache.flask_cache import cache_response_flask, invalidate_endpoint_cache
# from dojopool.core.config.cache_config import CACHE_REGIONS, CACHED_ENDPOINTS
from dojopool.core.models.game_analytics import GameAnalytics

from .base import BaseResource


class PlayerSchema(Schema):
    """Schema for player data validation."""

    user_id = fields.Integer(required=True)
    score = fields.Integer(required=True, validate=[validate.Range(min=0)])


class GameSchema(Schema):
    """Schema for game data serialization."""

    id = fields.Integer(dump_only=True)
    type = fields.Enum(GameType, required=True)
    status = fields.Enum(GameStatus, dump_only=True)
    player1 = fields.Nested(PlayerSchema, required=True)
    player2 = fields.Nested(PlayerSchema, required=True)
    winner_id = fields.Integer(dump_only=True)
    tournament_id = fields.Integer(allow_none=True)
    started_at = fields.DateTime(dump_only=True)
    ended_at = fields.DateTime(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates_schema
    def validate_players(self, data, **kwargs):
        """Validate player data."""
        if data["player1"]["user_id"] == data["player2"]["user_id"]:
            raise ValidationError("Players must be different")


class GameUpdateSchema(Schema):
    """Schema for game update data validation."""

    status = fields.Enum(GameStatus, required=True)
    player1_score = fields.Integer(required=True, validate=[validate.Range(min=0)])
    player2_score = fields.Integer(required=True, validate=[validate.Range(min=0)])


class GameStatsSchema(Schema):
    """Schema for game statistics."""

    total_games = fields.Integer()
    games_won = fields.Integer()
    games_lost = fields.Integer()
    win_rate = fields.Float()
    average_score = fields.Float()
    highest_score = fields.Integer()
    total_playtime = fields.Integer()  # in minutes


class GameResource(BaseResource):
    """Resource for individual game operations."""

    schema = GameSchema()
    update_schema = GameUpdateSchema()

    @require_auth
    # Commenting out or updating cache imports until their correct paths are confirmed
    # @cache_response_flask(
    #     timeout=CACHE_REGIONS["short"]["timeout"],
    #     key_prefix=CACHED_ENDPOINTS["game_state"]["key_pattern"],
    # )
    def get(self, game_id):
        """Get game details.

        Args:
            game_id: ID of the game to retrieve.

        Returns:
            Game details.
        """
        game = Game.query.get(game_id)
        if not game:
            raise NotFoundError("Game not found")

        # Check if user is a player or admin
        if not (
            current_user.has_role("admin")
            or current_user.id in [game.player1.user_id, game.player2.user_id]
        ):
            raise AuthorizationError()

        return self.success_response(data=self.schema.dump(game))  # type: ignore

    @require_auth
    def put(self, game_id):
        """Update game details.

        Args:
            game_id: ID of the game to update.

        Returns:
            Updated game details.
        """
        game = Game.query.get(game_id)
        if not game:
            raise NotFoundError("Game not found")

        # Check if user is a player or admin
        if not (
            current_user.has_role("admin")
            or current_user.id in [game.player1.user_id, game.player2.user_id]
        ):
            raise AuthorizationError()

        data = self.update_schema.load(self.get_json_data())

        # Update game status and scores
        game.status = data["status"]  # type: ignore
        game.player1.score = data["player1_score"]  # type: ignore
        game.player2.score = data["player2_score"]  # type: ignore

        # Set winner if game is completed
        if game.status == GameStatus.COMPLETED:
            if game.player1.score > game.player2.score:
                game.winner_id = game.player1.user_id
            elif game.player2.score > game.player1.score:
                game.winner_id = game.player2.user_id
            game.ended_at = datetime.utcnow()

        game.save()

        # Invalidate game cache
        # Commenting out or updating cache imports until their correct paths are confirmed
        # invalidate_endpoint_cache(f"{CACHED_ENDPOINTS['game_state']['key_pattern']}:{game_id}")

        return self.success_response(
            data=self.schema.dump(game), message="Game updated successfully"
        )

    @require_roles("admin")
    def delete(self, game_id):
        """Delete game.

        Args:
            game_id: ID of the game to delete.

        Returns:
            Success message.
        """
        game = Game.query.get(game_id)
        if not game:
            raise NotFoundError("Game not found")

        # Invalidate game cache before deletion
        # Commenting out or updating cache imports until their correct paths are confirmed
        # invalidate_endpoint_cache(f"{CACHED_ENDPOINTS['game_state']['key_pattern']}:{game_id}")

        game.delete()

        return self.success_response(message="Game deleted successfully")

    @require_auth
    def post(self, game_id):
        """Complete a game and trigger analytics update."""
        # Only allow this for a specific endpoint
        if request.path.endswith(f"/games/{game_id}/complete"):
            game = Game.query.get(game_id)
            if not game:
                raise NotFoundError("Game not found")

            # Check if user is a player or admin
            if not (
                current_user.has_role("admin")
                or current_user.id in [game.player1_id, game.player2_id]
            ):
                raise AuthorizationError()

            data = request.get_json() or {}
            winner_id = data.get("winner_id")
            score = data.get("score")
            if not winner_id or not score:
                return self.error_response("winner_id and score are required", 400)

            # Complete the game
            game.complete_game(winner_id, score)

            # Update or create analytics for both players
            for player_id in [game.player1_id, game.player2_id]:
                analytics = GameAnalytics.query.filter_by(game_id=game.id, player_id=player_id).first()
                if not analytics:
                    analytics = GameAnalytics(game_id=game.id, player_id=player_id)
                # Example: update stats (real logic would use actual game data)
                analytics.total_shots = analytics.total_shots or 0
                analytics.successful_shots = analytics.successful_shots or 0
                analytics.failed_shots = analytics.failed_shots or 0
                analytics.fouls = analytics.fouls or 0
                analytics.points_scored = analytics.points_scored or 0
                analytics.updated_at = datetime.utcnow()
                db.session.add(analytics)
            db.session.commit()

            return self.success_response(
                data={
                    "game": self.schema.dump(game),
                    "analytics": [
                        GameAnalytics.query.filter_by(game_id=game.id, player_id=game.player1_id).first(),
                        GameAnalytics.query.filter_by(game_id=game.id, player_id=game.player2_id).first(),
                    ],
                },
                message="Game completed and analytics updated successfully",
            )
        # Fallback to normal POST if not /complete
        return super().post(game_id)


class GameListResource(BaseResource):
    """Resource for game list operations."""

    schema = GameSchema()

    @require_auth
    # Commenting out or updating cache imports until their correct paths are confirmed
    # @cache_response_flask(timeout=CACHE_REGIONS["short"]["timeout"], key_prefix="games_list")
    def get(self):
        """Get list of games."""
        query = Game.query

        # Apply filters
        status = request.args.get("status")
        if status:
            query = query.filter_by(status=GameStatus[status.upper()])

        game_type = request.args.get("type")
        if game_type:
            query = query.filter_by(type=GameType[game_type.upper()])

        player_id = request.args.get("player_id", type=int)
        if player_id:
            query = query.filter(
                (Game.player1.has(user_id=player_id)) | (Game.player2.has(user_id=player_id))
            )

        tournament_id = request.args.get("tournament_id", type=int)
        if tournament_id:
            query = query.filter_by(tournament_id=tournament_id)

        # Apply date range filter
        start_date = request.args.get("start_date")
        if start_date:
            query = query.filter(Game.created_at >= start_date)

        end_date = request.args.get("end_date")
        if end_date:
            query = query.filter(Game.created_at <= end_date)

        # Apply sorting
        sort_by = request.args.get("sort_by", "created_at")
        sort_dir = request.args.get("sort_dir", "desc")

        if hasattr(Game, sort_by):
            order_by = getattr(Game, sort_by)
            if sort_dir.lower() == "desc":
                order_by = order_by.desc()
            query = query.order_by(order_by)

        return self.paginate(query)

    @require_auth
    def post(self):
        """Create new game."""
        data = self.get_json_data()

        # Verify players exist
        player1 = User.query.get(data["player1"]["user_id"])
        player2 = User.query.get(data["player2"]["user_id"])

        if not player1 or not player2:
            raise ValidationError("Invalid player ID")

        # Create game
        game = Game(
            player1_id=player1.id,
            player2_id=player2.id,
            game_type=data["type"],
            game_mode=data.get("mode", GameMode.CASUAL),
            status=GameStatus.IN_PROGRESS,
        )
        game.started_at = datetime.utcnow()
        game.score = f"{data['player1']['score']}-{data['player2']['score']}"
        db.session.add(game)
        db.session.commit()

        # Invalidate games list cache
        # Commenting out or updating cache imports until their correct paths are confirmed
        # invalidate_endpoint_cache("games_list:*")

        return self.success_response(
            data=self.schema.dump(game), message="Game created successfully", status_code=201  # type: ignore
        )


class GameStatsResource(BaseResource):
    """Resource for game statistics."""

    schema = GameStatsSchema()

    @require_auth
    # Commenting out or updating cache imports until their correct paths are confirmed
    # @cache_response_flask(timeout=CACHE_REGIONS["medium"]["timeout"], key_prefix="game_stats")
    def get(self, game_id: Optional[int] = None):
        """Get game statistics.

        Args:
            game_id: Optional ID of specific game.

        Returns:
            Game statistics.
        """
        # Get user ID from query params or current user
        user_id = request.args.get("user_id", type=int) or current_user.id

        # Check authorization
        if user_id != current_user.id and not current_user.has_role("admin"):
            raise AuthorizationError()

        # Get user's games
        games = Game.query.filter(
            (Game.player1.has(user_id=user_id)) | (Game.player2.has(user_id=user_id))
        ).all()

        if not games:
            return self.success_response(
                data={
                    "total_games": 0,
                    "games_won": 0,
                    "games_lost": 0,
                    "win_rate": 0.0,
                    "average_score": 0.0,
                    "highest_score": 0,
                    "total_playtime": 0,
                }
            )

        # Calculate statistics
        total_games = len(games)
        games_won = sum(1 for game in games if game.winner_id == user_id)
        total_score = 0
        highest_score = 0
        total_playtime = 0

        for game in games:
            if game.player1.user_id == user_id:
                score = game.player1.score
            else:
                score = game.player2.score

            total_score += score
            highest_score = max(highest_score, score)

            if game.ended_at and game.started_at:
                playtime = (game.ended_at - game.started_at).total_seconds() / 60
                total_playtime += playtime

        stats = {
            "total_games": total_games,
            "games_won": games_won,
            "games_lost": total_games - games_won,
            "win_rate": (games_won / total_games) * 100 if total_games > 0 else 0,
            "average_score": total_score / total_games if total_games > 0 else 0,
            "highest_score": highest_score,
            "total_playtime": int(total_playtime),
        }

        return self.success_response(data=stats)
