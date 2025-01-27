"""Tournament models module.

This module provides tournament-related models.
DEPRECATED: This module is deprecated. Use src.core.tournaments.models instead.
"""

from src.core.tournaments.models import (
    Tournament,
    TournamentParticipant,
    TournamentBracket,
    TournamentMatch,
    TournamentMatchPlayer,
    TournamentPrize
)

# Re-export for backward compatibility
__all__ = [
    'Tournament',
    'TournamentParticipant',
    'TournamentBracket',
    'TournamentMatch',
    'TournamentMatchPlayer',
    'TournamentPrize'
]
