"""Tournament resources module.

This module provides API resources for tournament operations.
"""

from datetime import datetime
from typing import Any, Dict

from flask import request
from marshmallow import Schema, ValidationError, fields, validate

from dojopool.core.exceptions import NotFoundError
from dojopool.core.security import require_auth, require_roles
from dojopool.tournaments.tournament_manager import TournamentType, TournamentStatus, TournamentData
from dojopool.models.tournament import Tournament

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
        return self.success_response(
            data={"message": "Tournament endpoints temporarily disabled"},
            message="Tournament endpoints temporarily disabled"
        )

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
        return self.success_response(
            data={"message": "Tournament endpoints temporarily disabled"},
            message="Tournament endpoints temporarily disabled"
        )

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
        return self.success_response(
            data={"message": "Tournament endpoints temporarily disabled"},
            message="Tournament endpoints temporarily disabled"
        )


class TournamentListResource(BaseResource):
    """Resource for tournament list operations."""

    schema = TournamentSchema()

    @require_auth
    def get(self):
        """Get list of tournaments."""
        # For now, return an empty list for dev, but in correct format
        return self.success_response(
            data={"tournaments": []}, 
            message="No tournaments available (dev mode)"
        )

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
        #     description=data.get("description", ""),
        #     type=data["type"],
        #     max_players=data["max_players"],
        #     entry_fee=data["entry_fee"],
        #     registration_deadline=data["registration_deadline"],
        #     status=TournamentStatus.PENDING,
        # )

        # # tournament.save()

        # return self.success_response(
        #     data=self.schema.dump(tournament),
        #     message="Tournament created successfully",
        #     status_code=201,
        # )
        return self.success_response(
            data={"message": "Tournament endpoints temporarily disabled"},
            message="Tournament endpoints temporarily disabled"
        )


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

        # # Calculate standings based on games played
        # standings = []
        # for player in tournament.players:
        #     games_played = len([g for g in tournament.games if player in [g.player1, g.player2]])
        #     games_won = len([g for g in tournament.games if g.winner_id == player.id])
        #     total_score = sum(g.player1_score if g.player1_id == player.id else g.player2_score for g in tournament.games if player in [g.player1, g.player2])
        #     average_score = total_score / games_played if games_played > 0 else 0

        #     standings.append({
        #         "user_id": player.id,
        #         "username": player.username,
        #         "games_played": games_played,
        #         "games_won": games_won,
        #         "total_score": total_score,
        #         "average_score": average_score,
        #         "rank": 0  # Will be calculated after sorting
        #     })

        # # Sort by wins, then by average score
        # standings.sort(key=lambda x: (x["games_won"], x["average_score"]), reverse=True)

        # # Assign ranks
        # for i, standing in enumerate(standings):
        #     standing["rank"] = i + 1

        # return self.success_response(data=standings)
        return {"error": "Tournament endpoints temporarily disabled"}
