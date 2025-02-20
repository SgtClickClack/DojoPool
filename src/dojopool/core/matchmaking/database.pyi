import logging
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from uuid import UUID

from sqlalchemy import ForeignKey, text
from sqlalchemy.orm import Mapped, Session, mapped_column, relationship

from ..database import db_session
from ..models.game import Game
from ..models.user import User
from ..models.venue import Venue

class MatchmakingDB:
    def __init__(self, session: Optional[Session] = None) -> None: ...
    def get_active_players(
        self, game_type: Optional[str] = None, venue_id: Optional[int] = None
    ) -> List[Dict[str, Any]]: ...
    def get_player_stats(self, user_id: int) -> Dict[str, Any]: ...
    def get_venue_stats(self, venue_id: int) -> Dict[str, Any]: ...
    def update_player_status(self, user_id: int, status: str) -> bool: ...
    def create_match(
        self, player1_id: int, player2_id: int, venue_id: int, game_type: str
    ) -> Game: ...
    def get_match_history(self, user_id: int) -> List[Dict[str, Any]]: ...
    def get_leaderboard(
        self, venue_id: Optional[int] = None, game_type: Optional[str] = None
    ) -> List[Dict[str, Any]]: ...
