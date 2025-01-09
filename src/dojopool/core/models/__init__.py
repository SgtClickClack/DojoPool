"""Core models package.

This package provides core models for the application.
"""

from .base import BaseModel
from ..auth.models import User, Role, UserRole
from .game import Game, GameType, GameMode, GameResult, GamePlayer
from .venue import Venue, VenueAmenity, VenueOperatingHours
from .social import Friendship, ChatMessage, CommunityChallenge, ChallengeParticipant
from .payment import Payment, Subscription, PricingPlan
from .reward import RewardTier, Reward, UserReward
from .notification import Notification, NotificationPreference
from ..tournaments.models import (
    Tournament,
    TournamentParticipant,
    TournamentBracket,
    TournamentMatch,
    TournamentMatchPlayer,
    TournamentPrize
)

__all__ = [
    'BaseModel',
    'User',
    'Role',
    'UserRole',
    'Game',
    'GameType',
    'GameMode',
    'GameResult',
    'GamePlayer',
    'Venue',
    'VenueAmenity',
    'VenueOperatingHours',
    'Friendship',
    'ChatMessage',
    'CommunityChallenge',
    'ChallengeParticipant',
    'Payment',
    'Subscription',
    'PricingPlan',
    'RewardTier',
    'Reward',
    'UserReward',
    'Notification',
    'NotificationPreference',
    'Tournament',
    'TournamentParticipant',
    'TournamentBracket',
    'TournamentMatch',
    'TournamentMatchPlayer',
    'TournamentPrize'
]
