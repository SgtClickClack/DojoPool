from flask_caching import Cache
from flask_caching import Cache
"""Tournament resources for the API."""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

from flask import current_app, request
from flask_login import current_user, login_required
from marshmallow import Schema, ValidationError, fields, validate, validates_schema
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.cache.flask_cache import cache_response_flask
from dojopool.core.exceptions import AuthorizationError, NotFoundError
from dojopool.core.security import require_auth, require_roles
from dojopool.models.tournament import Tournament, TournamentStatus
from dojopool.models.user import User

from .base import BaseResource


class TournamentSchema(Schema):
    """Schema for tournament data validation."""

    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description: Any = fields.Str()
    start_date: Any = fields.DateTime(required=True)
    end_date = fields.DateTime(required=True)
    max_participants: Any = fields.Int(validate=[validate.Range(min=2)])
    entry_fee: Any = fields.Float(validate=[validate.Range(min=0)])
    prize_pool: Any = fields.Float(validate=[validate.Range(min=0)])
    status: Any = fields.Enum(TournamentStatus)
    created_at: Any = fields.DateTime(dump_only=True)
    updated_at: Any = fields.DateTime(dump_only=True)

    @validates_schema
    def validate_dates(self, data: dict, **kwargs: dict) -> None:
        """Validate tournament dates."""
        if data["start_date"] >= data["end_date"]:
            raise ValidationError("End date must be after start date")


class TournamentResource(BaseResource):
    """Resource for managing individual tournaments."""

    schema = TournamentSchema()

    @login_required
    def get(self, tournament_id: int) -> Any:
        """Get a specific tournament."""
        tournament: Any = Tournament.query.get(tournament_id)
        if not tournament:
            raise NotFoundError("Tournament not found")
        return self.success_response(
            message="Tournament retrieved successfully",
            data={"tournament": self.schema.dump(tournament)},
        )

    @login_required
    def put(self, tournament_id: int):
        """Update a specific tournament."""
        tournament: Any = Tournament.query.get(tournament_id)
        if not tournament:
            raise NotFoundError("Tournament not found")

        if tournament.organizer_id != current_user.id:
            raise AuthorizationError("Not authorized to update this tournament")

        data: Any = self.get_json_data()
        for key, value in data.items():
            setattr(tournament, key, value)
        tournament.save()

        return self.success_response(
            message="Tournament updated successfully",
            data={"tournament": self.schema.dump(tournament)},
        )

    @login_required
    def delete(self, tournament_id: int):
        """Delete a specific tournament."""
        tournament: Any = Tournament.query.get(tournament_id)
        if not tournament:
            raise NotFoundError("Tournament not found")

        if tournament.organizer_id != current_user.id:
            raise AuthorizationError("Not authorized to delete this tournament")

        tournament.delete()
        return self.success_response(message="Tournament deleted successfully")


class TournamentListResource(BaseResource):
    """Resource for listing and creating tournaments."""

    schema = TournamentSchema()

    @login_required
    @cache_response_flask(timeout=300)  # Cache for 5 minutes
    def get(self):
        """Get list of tournaments."""
        tournaments = Tournament.query.all()
        return self.success_response(
            message="Tournaments retrieved successfully",
            data={"tournaments": self.schema.dump(tournaments, many=True)},
        )

    @login_required
    def post(self):
        """Create a new tournament."""
        data: Any = self.get_json_data()
        tournament: Any = Tournament(organizer_id=current_user.id, **data)
        tournament.save()

        return self.success_response(
            message="Tournament created successfully",
            data={"tournament": self.schema.dump(tournament)},
            status_code=201,
        )


class TournamentParticipantResource(BaseResource):
    """Resource for managing tournament participants."""

    @login_required
    def post(self, tournament_id: int):
        """Register current user for a tournament."""
        tournament: Any = Tournament.query.get(tournament_id)
        if not tournament:
            raise NotFoundError("Tournament not found")

        if tournament.status != TournamentStatus.OPEN:
            raise ValidationError("Tournament is not open for registration")

        if tournament.is_full():
            raise ValidationError("Tournament is full")

        if tournament.is_participant(current_user):
            raise ValidationError("Already registered for this tournament")

        tournament.add_participant(current_user)
        return self.success_response(message="Successfully registered for tournament")

    @login_required
    def delete(self, tournament_id: int):
        """Unregister current user from a tournament."""
        tournament: Any = Tournament.query.get(tournament_id)
        if not tournament:
            raise NotFoundError("Tournament not found")

        if not tournament.is_participant(current_user):
            raise ValidationError("Not registered for this tournament")

        tournament.remove_participant(current_user)
        return self.success_response(
            message="Successfully unregistered from tournament"
        )
