"""Shared types for ranking modules."""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Any, Union, Set
from fastapi import WebSocket

# Type aliases for better readability and type safety
WebSocketSet = Set[WebSocket]
UserID = int
Stats = Dict[str, Union[int, str, Set[int], Dict[str, Any], None]]
RateLimits = Dict[str, float]
BatchSettings = Dict[str, Union[int, float]]
MessageQueue = List[Dict[str, Any]]
UpdateTimes = Dict[int, float]
ConnectionTokens = Dict[int, str]

@dataclass
class RankingEntry:
    """Represents a player's ranking entry."""

    user_id: int
    rating: float
    rank: int
    change_24h: float
    games_played: int
    wins: int
    losses: int
    streak: int
    last_game: datetime
    title: Optional[str]

    def to_dict(self) -> Dict[str, Any]:
        """Convert ranking entry to dictionary."""
        return {
            "user_id": self.user_id,
            "rating": self.rating,
            "rank": self.rank,
            "change_24h": self.change_24h,
            "games_played": self.games_played,
            "wins": self.wins,
            "losses": self.losses,
            "streak": self.streak,
            "last_game": self.last_game.isoformat(),
            "title": self.title,
        } 