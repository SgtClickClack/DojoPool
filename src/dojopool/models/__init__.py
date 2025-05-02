"""Models package."""

from ..core.extensions import db

# Import all models to ensure SQLAlchemy sees all relationships and FKs
from .user import *
from .game import *
from .tournament import *
from .marketplace import *
from .role import *
from .player import *
from .shot import *
from .event import *
from .event_participant import *
from .leaderboard import *
from .player_ratings import *
from .player_status import *
from .venue import *
from .match import *
from .notification import *
from .achievements import *
from .activity import *
from .analytics import *
from .forum import *
from .friend import *
from .friendship import *
from .inventory import *
from .location import *
from .notification_settings import *
from .social import *
from .token import *
from .user_roles import *
from .reward import *
from .review import *
from .ranking_history import *
from .rankings import *
from .cached_queries import *
from .base import *
# from .associations import *  # Commented out to prevent duplicate association table definitions
from .session import *
from .venue_amenity import *
from .venue_checkin import *
from .venue_leaderboard import *
from .venue_operating_hours import *

# Remove import of social_groups (Django model, not Flask/SQLAlchemy compatible)
# from .social_groups import *

__all__ = ["db"]
