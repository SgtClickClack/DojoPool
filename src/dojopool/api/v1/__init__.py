"""API v1 module initialization.

This module initializes the v1 API blueprint and registers all v1 routes.
"""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Request, Response, current_app
from flask.typing import ResponseReturnValue
from flask_restful import Api
from werkzeug.wrappers import Response as WerkzeugResponse

from .resources.auth import (
    LoginResource,
    LogoutResource,
    PasswordResetConfirmResource,
    PasswordResetResource,
    RegisterResource,
)
from .resources.games import GameListResource, GameResource, GameStatsResource
from .resources.tournaments import (
    TournamentListResource,
    TournamentParticipantResource,
    TournamentResource,
)
from .resources.users import UserListResource, UserProfileResource, UserResource

# Create blueprint
api_v1_bp: Blueprint = Blueprint("api_v1", __name__)
api: Api = Api(api_v1_bp)

# Auth routes
api.add_resource(LoginResource, "/auth/login")
api.add_resource(LogoutResource, "/auth/logout")
api.add_resource(RegisterResource, "/auth/register")
api.add_resource(PasswordResetResource, "/auth/password-reset")
api.add_resource(PasswordResetConfirmResource, "/auth/password-reset/confirm")

# User routes
api.add_resource(UserResource, "/users/<int:user_id>")
api.add_resource(UserListResource, "/users")
api.add_resource(UserProfileResource, "/users/<int:user_id>/profile")

# Game routes
api.add_resource(GameResource, "/games/<int:game_id>")
api.add_resource(GameListResource, "/games")
api.add_resource(GameStatsResource, "/games/<int:game_id>/stats")

# Tournament routes
api.add_resource(TournamentResource, "/tournaments/<int:tournament_id>")
api.add_resource(TournamentListResource, "/tournaments")
api.add_resource(
    TournamentParticipantResource, "/tournaments/<int:tournament_id>/participants"
)
