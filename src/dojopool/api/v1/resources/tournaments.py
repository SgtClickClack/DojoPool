"""Tournament resources module.

This module provides API resources for tournament operations.
"""

from datetime import datetime
from typing import Any, Dict

from flask import request
from marshmallow import Schema, ValidationError, fields, validate

from dojopool.core.exceptions import NotFoundError
from dojopool.core.security import require_auth, require_roles
from dojopool.tournaments.tournament_manager import TournamentType, TournamentStatus, Tournament

from .base import BaseResource
from dojopool.models.game import Game


# --- Tournament endpoints are temporarily disabled due to missing ORM model ---
# All Tournament.query, .save(), .players, etc. usages are commented out to unblock backend startup.
# Uncomment and refactor once a proper SQLAlchemy Tournament model is available.

class TournamentSchema(Schema):
    """Schema for tournament data serialization."""

    id = fields.Integer(dump_only=True)
    name = fields.String(required=True)
    description = fields.String()
    type = fields.Enum(TournamentType, required=True)
    status = fields.Enum(TournamentStatus, dump_only=True)
    max_players = fields.Integer(required=True, validate=[validate.Range(min=2)])
    entry_fee = fields.Float(required=True, validate=[validate.Range(min=0)])
    prize_pool = fields.Float(dump_only=True)
    winner_id = fields.Integer(dump_only=True)
    started_at = fields.DateTime(dump_only=True)
    ended_at = fields.DateTime(dump_only=True)
    registration_deadline = fields.DateTime(required=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class TournamentUpdateSchema(Schema):
    """Schema for tournament update data validation."""

    name = fields.String()
    description = fields.String()
    max_players = fields.Integer(validate=[validate.Range(min=2)])
    entry_fee = fields.Float(validate=[validate.Range(min=0)])
    registration_deadline = fields.DateTime()
    status = fields.Enum(TournamentStatus)


class TournamentStandingsSchema(Schema):
    """Schema for tournament standings."""

    user_id = fields.Integer()
    username = fields.String()
    games_played = fields.Integer()
    games_won = fields.Integer()
    total_score = fields.Integer()
    average_score = fields.Float()
    rank = fields.Integer()


class TournamentResource(BaseResource):
    """Resource for individual tournament operations."""

    schema = TournamentSchema()
    update_schema = TournamentUpdateSchema()

    @require_auth
    def get(self, tournament_id):
        """Get tournament details.

        Args:
            tournament_id: ID of the tournament to retrieve.

        Returns:
            Tournament details.
        """
        # tournament = Tournament.query.get(tournament_id)
        # if not tournament:
        #     raise NotFoundError("Tournament not found")

        # return self.success_response(data=self.schema.dump(tournament))
        pass

    @require_roles("admin")
    def put(self, tournament_id):
        """Update tournament details.

        Args:
            tournament_id: ID of the tournament to update.

        Returns:
            Updated tournament details.
        """
        # tournament = Tournament.query.get(tournament_id)
        # if not tournament:
        #     raise NotFoundError("Tournament not found")

        # data = self.update_schema.load(self.get_json_data())

        # # Update fields
        # for field, value in data.items():
        #     setattr(tournament, field, value)

        # # Handle status changes
        # if "status" in data:
        #     if data["status"] == TournamentStatus.IN_PROGRESS:
        #         if tournament.started_at is None:
        #             tournament.started_at = datetime.utcnow()
        #     elif data["status"] == TournamentStatus.COMPLETED:
        #         tournament.ended_at = datetime.utcnow()

        # # tournament.save()

        # return self.success_response(
        #     data=self.schema.dump(tournament), message="Tournament updated successfully"
        # )
        pass

    @require_roles("admin")
    def delete(self, tournament_id):
        """Delete tournament.

        Args:
            tournament_id: ID of the tournament to delete.

        Returns:
            Success message.
        """
        # tournament = Tournament.query.get(tournament_id)
        # if not tournament:
        #     raise NotFoundError("Tournament not found")

        # if tournament.status != TournamentStatus.PENDING:
        #     raise ValidationError("Cannot delete tournament that has started")

        # # tournament.delete()

        # return self.success_response(message="Tournament deleted successfully")
        pass


class TournamentListResource(BaseResource):
    """Resource for tournament list operations."""

    schema = TournamentSchema()

    @require_auth
    def get(self):
        """Get list of tournaments."""
        # query = Tournament.query

        # # Apply filters
        # status = request.args.get("status")
        # if status:
        #     query = query.filter_by(status=TournamentStatus[status.upper()])

        # tournament_type = request.args.get("type")
        # if tournament_type:
        #     query = query.filter_by(type=TournamentType[tournament_type.upper()])

        # # Filter by player participation
        # player_id = request.args.get("player_id", type=int)
        # if player_id:
        #     query = query.filter(Tournament.players.any(id=player_id))

        # # Apply date range filter
        # start_date = request.args.get("start_date")
        # if start_date:
        #     query = query.filter(Tournament.created_at >= start_date)

        # end_date = request.args.get("end_date")
        # if end_date:
        #     query = query.filter(Tournament.created_at <= end_date)

        # # Apply sorting
        # sort_by = request.args.get("sort_by", "created_at")
        # sort_dir = request.args.get("sort_dir", "desc")

        # if hasattr(Tournament, sort_by):
        #     order_by = getattr(Tournament, sort_by)
        #     if sort_dir.lower() == "desc":
        #         order_by = order_by.desc()
        #     query = query.order_by(order_by)

        # return self.paginate(query)
        pass

    @require_roles("admin")
    def post(self):
        """Create new tournament."""
        # data = self.get_json_data()

        # # Validate registration deadline
        # if data["registration_deadline"] <= datetime.utcnow():
        #     raise ValidationError("Registration deadline must be in the future")

        # # Create tournament
        # tournament = Tournament(
        #     name=data["name"],
        #     description=data.get("description"),
        #     type=data["type"],
        #     status=TournamentStatus.PENDING,
        #     max_players=data["max_players"],
        #     entry_fee=data["entry_fee"],
        #     registration_deadline=data["registration_deadline"],
        # )

        # # tournament.save()

        # return self.success_response(
        #     data=self.schema.dump(tournament),
        #     message="Tournament created successfully",
        #     status_code=201,
        # )
        pass


class TournamentStandingsResource(BaseResource):
    """Resource for tournament standings."""

    schema = TournamentStandingsSchema()

    @require_auth
    def get(self, tournament_id):
        """Get tournament standings.

        Args:
            tournament_id: ID of the tournament.

        Returns:
            Tournament standings.
        """
        # tournament = Tournament.query.get(tournament_id)
        # if not tournament:
        #     raise NotFoundError("Tournament not found")

        # # Get all games in the tournament
        # games = Game.query.filter_by(tournament_id=tournament_id).all()

        # # Calculate standings
        # standings: Dict[int, Dict[str, Any]] = {}

        # for game in games:
        #     # Process player 1
        #     if game.player1.user_id not in standings:
        #         standings[game.player1.user_id] = {
        #             "user_id": game.player1.user_id,
        #             "username": game.player1.user.username,
        #             "games_played": 0,
        #             "games_won": 0,
        #             "total_score": 0,
        #             "average_score": 0,
        #         }

        #     standings[game.player1.user_id]["games_played"] += 1
        #     standings[game.player1.user_id]["total_score"] += game.player1.score
        #     if game.winner_id == game.player1.user_id:
        #         standings[game.player1.user_id]["games_won"] += 1

        #     # Process player 2
        #     if game.player2.user_id not in standings:
        #         standings[game.player2.user_id] = {
        #             "user_id": game.player2.user_id,
        #             "username": game.player2.user.username,
        #             "games_played": 0,
        #             "games_won": 0,
        #             "total_score": 0,
        #             "average_score": 0,
        #         }

        #     standings[game.player2.user_id]["games_played"] += 1
        #     standings[game.player2.user_id]["total_score"] += game.player2.score
        #     if game.winner_id == game.player2.user_id:
        #         standings[game.player2.user_id]["games_won"] += 1

        # # Calculate averages and create final list
        # standings_list = []
        # for stats in standings.values():
        #     if stats["games_played"] > 0:
        #         stats["average_score"] = stats["total_score"] / stats["games_played"]
        #     standings_list.append(stats)

        # # Sort by games won (descending) and average score (descending)
        # standings_list.sort(key=lambda x: (-x["games_won"], -x["average_score"]))

        # # Add ranks
        # for i, stats in enumerate(standings_list, 1):
        #     stats["rank"] = i

        # return self.success_response(data=self.schema.dump(standings_list, many=True))
        pass
