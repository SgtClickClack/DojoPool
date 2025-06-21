"""Models package."""

from ..core.extensions import db

# Import core models to ensure SQLAlchemy sees all relationships and FKs
# Replace wildcard imports with specific imports for better security and clarity
from .user import User
from .game import Game, GameComment, Shot
from .tournament import Tournament, TournamentParticipant
from .marketplace import Wallet, Transaction, MarketplaceItem, UserInventory
from .role import Role
from .player import Player
from .venue import Venue
from .staff import StaffMember
from .notification import Notification
from .achievements import Achievement, UserAchievement
from .social import SocialProfile, UserProfile, Friendship, Message, Share
from .token import Token
from .reward import UserReward
from .review import Review
from .base import BaseModel
from .session import Session

# Import the user_roles table
from .user_roles import user_roles

# Keep wildcard imports for models that may not have specific classes defined yet
# This maintains compatibility while we work on the specific imports
from .event import *
from .event_participant import *
from .player_ratings import *
from .player_status import *
from .match import *
from .notification_settings import *
from .activity import *
from .analytics import *
from .forum import *
from .friend import *
from .friendship import *
from .inventory import *
from .location import *
from .ranking_history import *
from .rankings import *
from .cached_queries import *
from .venue_amenity import *
from .venue_checkin import *
from .venue_leaderboard import *
from .venue_operating_hours import *

__all__ = [
    "db",
    "User", "Game", "GameComment", "Shot",
    "Tournament", "TournamentParticipant",
    "Wallet", "Transaction", "MarketplaceItem", "UserInventory",
    "Role", "Player", "Venue", "StaffMember", "Notification",
    "Achievement", "UserAchievement", "SocialProfile", "UserProfile", "Friendship", "Message", "Share",
    "Token", "user_roles", "UserReward", "Review", "BaseModel", "Session"
]
