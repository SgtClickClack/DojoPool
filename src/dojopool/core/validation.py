"""Input validation module."""

from dataclasses import dataclass
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Type, TypeVar, Union, cast
from marshmallow import Schema, ValidationError, fields, validates, validates_schema
from flask import Request, request, jsonify
from werkzeug.local import LocalProxy

# Type variable for the decorated function
F = TypeVar('F', bound=Callable[..., Any])

class GameTypeSchema(Schema):
    """Game type validation schema."""
    
    game_type = fields.Str(required=True, validate=lambda x: x in ["8ball", "9ball", "straight"])
    opponent_id = fields.Int(required=True)
    venue_id = fields.Int(required=True)

class GameScoreSchema(Schema):
    """Game score validation schema."""
    
    points = fields.Int(required=True, validate=lambda x: 0 <= x <= 100)
    player_id = fields.Int(required=True)

class GameMatchmakingSchema(Schema):
    """Matchmaking validation schema."""
    
    game_type = fields.Str(required=True, validate=lambda x: x in ["8ball", "9ball", "straight"])
    skill_range = fields.Int(required=False, validate=lambda x: 0 <= x <= 500)
    venue_id = fields.Int(required=False)

def validate_request(schema_cls: Type[Schema]) -> Callable[[F], F]:
    """
    Decorator for validating request data.
    
    Args:
        schema_cls: Marshmallow schema class to use for validation
    """
    def decorator(f: F) -> F:
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            schema = schema_cls()
            try:
                # Validate request data
                if request.is_json:
                    data = schema.load(request.get_json() or {})
                elif request.form:
                    data = schema.load(dict(request.form))
                else:
                    return jsonify({
                        "error": "Invalid content type",
                        "message": "Request must be JSON or form data"
                    }), 400
                
                # Store validated data in request context
                setattr(request, '_validated_data', data)
                return f(*args, **kwargs)
                
            except ValidationError as err:
                return jsonify({
                    "error": "Validation error",
                    "message": "Invalid request data",
                    "details": err.messages
                }), 400
                
        return cast(F, wrapper)
    return decorator

def get_validated_data() -> Dict[str, Any]:
    """Get validated data from request context."""
    return getattr(request, '_validated_data', {})

def sanitize_input(data: Union[str, Dict, List]) -> Union[str, Dict, List]:
    """
    Sanitize input data to prevent XSS and injection attacks.
    
    Args:
        data: Input data to sanitize
        
    Returns:
        Sanitized data
    """
    import html
    
    if isinstance(data, str):
        # Escape HTML characters
        return html.escape(data)
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(v) for v in data]
    return data

def validate_game_id(game_id: int) -> bool:
    """Validate game ID."""
    from ..models.game import Game
    return bool(Game.query.get(game_id))

def validate_user_id(user_id: int) -> bool:
    """Validate user ID."""
    from ..models.user import User
    return bool(User.query.get(user_id))

def validate_venue_id(venue_id: int) -> bool:
    """Validate venue ID."""
    from ..models.venue import Venue
    return bool(Venue.query.get(venue_id))

# Example usage:
"""
@app.route("/game/create", methods=["POST"])
@validate_request(GameTypeSchema)
def create_game():
    data = get_validated_data()
    # Data is already validated here
    return create_game_logic(data)
""" 