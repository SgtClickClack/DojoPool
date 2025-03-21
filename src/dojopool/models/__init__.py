"""Models package."""

from ..core.extensions import db

# Import all models
from .user import User
from .role import Role
from .game import Game
from ..core.models.tournament import Tournament, TournamentGame
from .venue import Venue
from .match import Match

# Register models with SQLAlchemy
__all__ = ["db", "User", "Role", "Game", "Tournament", "TournamentGame", "Venue", "Match"]
