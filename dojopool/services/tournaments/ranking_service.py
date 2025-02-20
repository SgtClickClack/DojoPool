"""
Professional player ranking service.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from .pro_tournament_config import ProTournamentTier


@dataclass
class RankingPoints:
    """Ranking points earned in a tournament."""

    tournament_id: str
    tournament_tier: ProTournamentTier
    points: int
    date_earned: datetime
    position: int
    bonus_points: int = 0
    expiry_date: Optional[datetime] = None


@dataclass
class PlayerRanking:
    """Professional player ranking details."""

    player_id: str
    current_rank: int
    total_points: int
    ranking_points: List[RankingPoints]
    highest_rank: int
    highest_rank_date: datetime
    last_updated: datetime
    ranking_history: List[Tuple[datetime, int]]  # (date, rank)
    active_streak: Dict[str, any]  # Tracks current performance streak


class RankingService:
    """Manages professional player rankings."""

    def __init__(self):
        """Initialize ranking service."""
        self.rankings: Dict[str, PlayerRanking] = {}
        self.points_validity_period = timedelta(days=365)  # Points valid for 1 year
        self.ranking_update_frequency = timedelta(days=7)  # Weekly updates
        self.last_global_update = datetime.now()

        # Points distribution for different tournament tiers
        self.tier_points = {
            ProTournamentTier.MAJOR: {
                1: 10000,
                2: 8000,
                3: 6400,
                4: 6400,
                5: 5120,
                6: 5120,
                7: 5120,
                8: 5120,
                9: 4096,
                10: 4096,
                11: 4096,
                12: 4096,
                13: 3277,
                14: 3277,
                15: 3277,
                16: 3277,
            },
            ProTournamentTier.PREMIER: {
                1: 5000,
                2: 4000,
                3: 3200,
                4: 3200,
                5: 2560,
                6: 2560,
                7: 2560,
                8: 2560,
                9: 2048,
                10: 2048,
                11: 2048,
                12: 2048,
                13: 1638,
                14: 1638,
                15: 1638,
                16: 1638,
            },
            ProTournamentTier.OPEN: {
                1: 2500,
                2: 2000,
                3: 1600,
                4: 1600,
                5: 1280,
                6: 1280,
                7: 1280,
                8: 1280,
                9: 1024,
                10: 1024,
                11: 1024,
                12: 1024,
                13: 819,
                14: 819,
                15: 819,
                16: 819,
            },
        }

        # Bonus points criteria
        self.bonus_points = {
            "perfect_game": 500,
            "tournament_high_run": 250,
            "undefeated_tournament": 1000,
            "defending_champion": 2000,
        }

    def add_tournament_result(
        self,
        player_id: str,
        tournament_id: str,
        tournament_tier: ProTournamentTier,
        position: int,
        achievements: List[str] = None,
    ) -> int:
        """Add tournament result and calculate ranking points."""
        if player_id not in self.rankings:
            self._initialize_player_ranking(player_id)

        # Calculate base points
        base_points = self.tier_points[tournament_tier].get(position, 0)

        # Calculate bonus points
        bonus_points = 0
        if achievements:
            for achievement in achievements:
                bonus_points += self.bonus_points.get(achievement, 0)

        # Create ranking points entry
        points = RankingPoints(
            tournament_id=tournament_id,
            tournament_tier=tournament_tier,
            points=base_points,
            bonus_points=bonus_points,
            date_earned=datetime.now(),
            position=position,
            expiry_date=datetime.now() + self.points_validity_period,
        )

        # Add to player's ranking points
        self.rankings[player_id].ranking_points.append(points)

        # Update total points
        self._update_player_points(player_id)

        return base_points + bonus_points

    def update_global_rankings(self) :
        """Update global rankings for all players."""
        if (datetime.now() - self.last_global_update) < self.ranking_update_frequency:
            return False

        # Get all players sorted by total points
        sorted_players = sorted(
            self.rankings.items(), key=lambda x: x[1].total_points, reverse=True
        )

        # Update rankings
        for rank, (player_id, player_ranking) in enumerate(sorted_players, 1):
            old_rank = player_ranking.current_rank
            player_ranking.current_rank = rank

            # Update highest rank if applicable
            if rank < player_ranking.highest_rank:
                player_ranking.highest_rank = rank
                player_ranking.highest_rank_date = datetime.now()

            # Add to ranking history
            player_ranking.ranking_history.append((datetime.now(), rank))

            # Update streak information
            if old_rank > rank:
                player_ranking.active_streak = {
                    "type": "improvement",
                    "value": old_rank - rank,
                    "start_date": datetime.now(),
                }
            elif old_rank < rank:
                player_ranking.active_streak = {
                    "type": "decline",
                    "value": rank - old_rank,
                    "start_date": datetime.now(),
                }

        self.last_global_update = datetime.now()
        return True

    def get_player_ranking(self, player_id: str) -> Optional[PlayerRanking]:
        """Get a player's current ranking details."""
        return self.rankings.get(player_id)

    def get_rankings_in_range(
        self, start_rank: int, end_rank: int
    ) :
        """Get rankings for a specific range."""
        return sorted(
            [
                r
                for r in self.rankings.values()
                if start_rank <= r.current_rank <= end_rank
            ],
            key=lambda x: x.current_rank,
        )

    def get_ranking_history(
        self, player_id: str, start_date: datetime, end_date: datetime
    ) :
        """Get a player's ranking history for a specific period."""
        if player_id not in self.rankings:
            return []

        return [
            (date, rank)
            for date, rank in self.rankings[player_id].ranking_history
            if start_date <= date <= end_date
        ]

    def get_ranking_movement(self, player_id: str, period: timedelta) :
        """Get a player's ranking movement over a period."""
        if player_id not in self.rankings:
            return {}

        player = self.rankings[player_id]
        history = player.ranking_history

        if len(history) < 2:
            return {
                "start_rank": player.current_rank,
                "end_rank": player.current_rank,
                "movement": 0,
                "trend": "stable",
            }

        start_date = datetime.now() - period
        relevant_history = [
            (date, rank) for date, rank in history if date >= start_date
        ]

        if not relevant_history:
            return {
                "start_rank": player.current_rank,
                "end_rank": player.current_rank,
                "movement": 0,
                "trend": "stable",
            }

        start_rank = relevant_history[0][1]
        end_rank = relevant_history[-1][1]
        movement = start_rank - end_rank

        return {
            "start_rank": start_rank,
            "end_rank": end_rank,
            "movement": movement,
            "trend": "up" if movement > 0 else "down" if movement < 0 else "stable",
        }

    def _initialize_player_ranking(self, player_id: str) -> None:
        """Initialize ranking for a new player."""
        self.rankings[player_id] = PlayerRanking(
            player_id=player_id,
            current_rank=len(self.rankings) + 1,
            total_points=0,
            ranking_points=[],
            highest_rank=len(self.rankings) + 1,
            highest_rank_date=datetime.now(),
            last_updated=datetime.now(),
            ranking_history=[(datetime.now(), len(self.rankings) + 1)],
            active_streak={"type": "new", "value": 0, "start_date": datetime.now()},
        )

    def _update_player_points(self, player_id: str) :
        """Update a player's total ranking points."""
        player = self.rankings[player_id]
        current_time = datetime.now()

        # Remove expired points
        player.ranking_points = [
            points
            for points in player.ranking_points
            if not points.expiry_date or points.expiry_date > current_time
        ]

        # Calculate total points
        player.total_points = sum(
            points.points + points.bonus_points for points in player.ranking_points
        )

        player.last_updated = current_time
