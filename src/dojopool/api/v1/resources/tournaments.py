"""Tournament API resources."""

from datetime import datetime
from typing import Any, Dict

from flask import request
from marshmallow import Schema, ValidationError, fields, validate

from dojopool.core.exceptions import NotFoundError
from dojopool.core.security import require_auth, require_roles
from dojopool.tournaments.tournament_manager import TournamentType, TournamentStatus, TournamentData
from dojopool.models.tournament import Tournament, TournamentStatus, TournamentFormat
from dojopool.services.tournament_service import TournamentService
from dojopool.core.extensions import db

from .base import BaseResource
from dojopool.models.game import Game

# Initialize tournament service
tournament_service = TournamentService()


class TournamentSchema(Schema):
    """Schema for tournament data serialization."""

    id = fields.Integer(dump_only=True)
    name = fields.String(required=True)
    description = fields.String()
    format = fields.Enum(TournamentFormat, required=True)
    status = fields.Enum(TournamentStatus, dump_only=True)
    max_participants = fields.Integer(required=True, validate=[validate.Range(min=2)])
    entry_fee = fields.Float(required=True, validate=[validate.Range(min=0)])
    prize_pool = fields.Float(required=True, validate=[validate.Range(min=0)])
    venue_id = fields.Integer(required=True)
    organizer_id = fields.Integer(required=True)
    start_date = fields.DateTime(required=True)
    end_date = fields.DateTime(required=True)
    registration_deadline = fields.DateTime(required=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class TournamentUpdateSchema(Schema):
    """Schema for tournament update data validation."""

    name = fields.String()
    description = fields.String()
    max_participants = fields.Integer(validate=[validate.Range(min=2)])
    entry_fee = fields.Float(validate=[validate.Range(min=0)])
    prize_pool = fields.Float(validate=[validate.Range(min=0)])
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
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise NotFoundError("Tournament not found")

        return self.success_response(data=tournament.to_dict())

    @require_roles("admin")
    def put(self, tournament_id):
        """Update tournament details.

        Args:
            tournament_id: ID of the tournament to update.

        Returns:
            Updated tournament details.
        """
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise NotFoundError("Tournament not found")

        data = self.update_schema.load(self.get_json_data())
        
        # Ensure data is a dictionary
        if not isinstance(data, dict):
            raise ValidationError("Invalid data format")

        # Update fields
        for field, value in data.items():
            if hasattr(tournament, field):
                setattr(tournament, field, value)

        # Handle status changes
        if "status" in data:
            if data["status"] == TournamentStatus.IN_PROGRESS:
                if not hasattr(tournament, 'started_at') or tournament.started_at is None:
                    tournament.started_at = datetime.utcnow()
            elif data["status"] == TournamentStatus.COMPLETED:
                tournament.ended_at = datetime.utcnow()

        db.session.commit()

        return self.success_response(
            data=tournament.to_dict(), message="Tournament updated successfully"
        )

    @require_roles("admin")
    def delete(self, tournament_id):
        """Delete tournament.

        Args:
            tournament_id: ID of the tournament to delete.

        Returns:
            Success message.
        """
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise NotFoundError("Tournament not found")

        if tournament.status != TournamentStatus.PENDING:
            raise ValidationError("Cannot delete tournament that has started")

        db.session.delete(tournament)
        db.session.commit()

        return self.success_response(message="Tournament deleted successfully")


class TournamentListResource(BaseResource):
    """Resource for tournament list operations."""

    schema = TournamentSchema()

    @require_auth
    def get(self):
        """Get list of tournaments."""
        tournaments = Tournament.query.all()
        return self.success_response(
            data={"tournaments": [t.to_dict() for t in tournaments]}, 
            message="Tournaments retrieved successfully"
        )

    @require_roles("admin")
    def post(self):
        """Create new tournament."""
        data = self.get_json_data()

        # Validate registration deadline
        if data["registration_deadline"] <= datetime.utcnow():
            raise ValidationError("Registration deadline must be in the future")

        # Create tournament
        tournament = Tournament(
            name=data["name"],
            description=data.get("description", ""),
            format=data["format"],
            max_participants=data["max_participants"],
            entry_fee=data["entry_fee"],
            prize_pool=data["prize_pool"],
            venue_id=data["venue_id"],
            organizer_id=data["organizer_id"],
            start_date=data["start_date"],
            end_date=data["end_date"],
            registration_deadline=data["registration_deadline"],
            status=TournamentStatus.PENDING,
        )

        db.session.add(tournament)
        db.session.commit()

        return self.success_response(
            data=tournament.to_dict(),
            message="Tournament created successfully",
            status_code=201,
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
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise NotFoundError("Tournament not found")

        # Calculate standings based on games played
        standings = []
        for participant in tournament.participants:
            user = participant.user
            games_played = len([g for g in tournament.tournament_games if user in [g.game.player1, g.game.player2]])
            games_won = len([g for g in tournament.tournament_games if g.game.winner_id == user.id])
            total_score = sum(g.game.player1_score if g.game.player1_id == user.id else g.game.player2_score for g in tournament.tournament_games if user in [g.game.player1, g.game.player2])
            average_score = total_score / games_played if games_played > 0 else 0

            standings.append({
                "user_id": user.id,
                "username": user.username,
                "games_played": games_played,
                "games_won": games_won,
                "total_score": total_score,
                "average_score": average_score,
                "rank": 0  # Will be calculated after sorting
            })

        # Sort by wins, then by average score
        standings.sort(key=lambda x: (x["games_won"], x["average_score"]), reverse=True)

        # Assign ranks
        for i, standing in enumerate(standings):
            standing["rank"] = i + 1

        return self.success_response(data=standings)
