"""Database package.

This package provides database functionality and models.
"""

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData, Column, ForeignKey, Integer

# Configure naming convention for constraints
convention = {
    'ix': 'ix_%(column_0_label)s',
    'uq': 'uq_%(table_name)s_%(column_0_name)s',
    'ck': 'ck_%(table_name)s_%(constraint_name)s',
    'fk': 'fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s',
    'pk': 'pk_%(table_name)s'
}

# Configure metadata with naming convention and reflection
metadata = MetaData(naming_convention=convention)
db = SQLAlchemy(metadata=metadata)

def init_db():
    """Initialize database."""
    # Import all models to register them with SQLAlchemy
    from ..models import (
        # Auth models
        User, Role, UserRole,
        # Game models
        Game, GameType, GameMode, GameResult,
        # Venue models
        Venue, VenueAmenity, VenueOperatingHours,
        # Tournament models
        Tournament, TournamentParticipant, TournamentMatch, TournamentPrize,
        # Social models
        Friendship, ChatMessage, CommunityChallenge, ChallengeParticipant,
        # Payment models
        Payment, Subscription, PricingPlan,
        # Reward models
        RewardTier, Reward, UserReward,
        # Notification models
        Notification, NotificationPreference
    )
    db.create_all()

def reference_col(tablename, nullable=False, pk_name='id', **kwargs):
    """Column that adds primary key foreign key reference.

    Args:
        tablename: Model.__tablename__
        nullable: Whether it can be nullable
        pk_name: Primary key column name
        **kwargs: Other arguments passed to Column
    """
    return Column(
        Integer,
        ForeignKey(f'{tablename}.{pk_name}'),
        nullable=nullable,
        **kwargs
    )

__all__ = [
    'db',
    'init_db',
    'reference_col'
]