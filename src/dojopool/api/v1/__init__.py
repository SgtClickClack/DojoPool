"""API v1 module initialization.

This module initializes the v1 API blueprint and registers all v1 routes.
"""
import traceback # For more detailed error logging if needed
print("[API_V1_INIT] ENTERING __init__.py", flush=True)

from flask import Blueprint, request # Added request
from flask_restful import Api

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
    TournamentResource,
    TournamentStandingsResource,
)
from .resources.users import UserListResource, UserProfileResource, UserResource
from .resources.user_me import UserMeResource
from .resources.venues import VenuesResource

# Create blueprint
print("[API_V1_INIT] Creating Blueprint api_v1_bp", flush=True)
api_v1_bp = Blueprint("api_v1", __name__) # Removed url_prefix here as it's set during registration in app.py
print(f"[API_V1_INIT] Blueprint object: {api_v1_bp}", flush=True)

@api_v1_bp.before_request
def log_api_v1_request():
    print(f"[API_V1_BEFORE_REQUEST] Path: {request.path}, Method: {request.method}", flush=True)
    # Optional: Log headers and body. Be cautious with sensitive data and large bodies.
    # print(f"[API_V1_BEFORE_REQUEST] Headers: {request.headers}", flush=True)
    # try:
    #     if request.data:
    #         print(f"[API_V1_BEFORE_REQUEST] Body: {request.get_data(as_text=True)}", flush=True)
    #     else:
    #         print(f"[API_V1_BEFORE_REQUEST] Body: No data", flush=True)
    # except Exception as e:
    #     print(f"[API_V1_BEFORE_REQUEST] Error reading body: {e}", flush=True)
    #     traceback.print_exc(file=sys.stdout)


print("[API_V1_INIT] Creating Api object for Flask-RESTful", flush=True)
api = Api(api_v1_bp)
print(f"[API_V1_INIT] Api object: {api}", flush=True)


# Auth routes
print("[API_V1_INIT] Adding auth resources", flush=True)
api.add_resource(LoginResource, "/auth/login")
api.add_resource(LogoutResource, "/auth/logout")
api.add_resource(RegisterResource, "/auth/register")
api.add_resource(PasswordResetResource, "/auth/password-reset")
api.add_resource(PasswordResetConfirmResource, "/auth/password-reset/confirm")

# User routes
print("[API_V1_INIT] Adding user resources", flush=True)
api.add_resource(UserResource, "/users/<int:user_id>")
api.add_resource(UserListResource, "/users")
api.add_resource(UserProfileResource, "/users/<int:user_id>/profile")
api.add_resource(UserMeResource, "/users/me")

# Game routes
print("[API_V1_INIT] Adding game resources", flush=True)
api.add_resource(GameResource, "/games/<int:game_id>")
api.add_resource(GameListResource, "/games")
api.add_resource(GameStatsResource, "/games/<int:game_id>/stats")

# Tournament routes
print("[API_V1_INIT] Adding tournament resources", flush=True)
api.add_resource(TournamentResource, "/tournaments/<int:tournament_id>")
api.add_resource(TournamentListResource, "/tournaments")
api.add_resource(TournamentStandingsResource, "/tournaments/<int:tournament_id>/standings")

# Venues route
print("[API_V1_INIT] Adding venues resource", flush=True)
api.add_resource(VenuesResource, "/venues")

print("[API_V1_INIT] LEAVING __init__.py", flush=True)
