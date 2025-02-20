from flask_caching import Cache
from flask_caching import Cache
"""Service for handling tournament prize distribution and tracking."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from ..core.extensions import db
from ..models.notification import Notification
from ..models.tournament import Tournament, TournamentPrize


class PrizeDistributionRule:
    """Base class for prize distribution rules."""

    def calculate_prizes(self, tournament: Tournament) -> Dict[int, float]:
        """Calculate prize distribution for tournament places.

        Args:
            tournament: Tournament instance

        Returns:
            Dict[int, float]: Mapping of place to prize amount
        """
        raise NotImplementedError


class StandardPrizeRule(PrizeDistributionRule):
    """Standard prize distribution rule (50/30/20)."""

    def calculate_prizes(self, tournament: Tournament):
        """Calculate standard prize distribution."""
        return {
            1: tournament.total_prize_pool * 0.5,  # 50% for 1st place
            2: tournament.total_prize_pool * 0.3,  # 30% for 2nd place
            3: tournament.total_prize_pool * 0.2,  # 20% for 3rd place
        }


class CustomPrizeRule(PrizeDistributionRule):
    """Custom prize distribution rule."""

    def __init__(self, distribution: Dict[int, float]):
        """Initialize with custom distribution.

        Args:
            distribution: Mapping of place to percentage (as decimal)
        """
        total = sum(distribution.values())
        if not Decimal(str(total)).quantize(Decimal("0.01")) == Decimal("1.00"):
            raise ValueError("Prize distribution must sum to 1.00")
        self.distribution = distribution

    def calculate_prizes(self, tournament: Tournament):
        """Calculate custom prize distribution."""
        return {
            place: tournament.total_prize_pool * percentage
            for place, percentage in self.distribution.items()
        }


class PrizeService:
    """Service for managing tournament prizes."""

    def __init__(self):
        self.rules = {
            "standard": StandardPrizeRule(),
            "custom": None,  # Set via configure_custom_rule
        }

    def configure_custom_rule(self, distribution: Dict[int, float]):
        """Configure custom prize distribution rule.

        Args:
            distribution: Mapping of place to percentage (as decimal)
        """
        self.rules["custom"] = CustomPrizeRule(distribution)

    def distribute_prizes(
        self, tournament_id: int, rule_name: str = "standard"
    ) -> None:
        """Distribute prizes for a tournament.

        Args:
            tournament_id: Tournament ID
            rule_name: Name of distribution rule to use
        """
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")

        if not tournament.total_prize_pool:
            return

        rule = self.rules.get(rule_name)
        if not rule:
            raise ValueError(f"Prize rule '{rule_name}' not found")

        # Calculate prize distribution
        prizes = rule.calculate_prizes(tournament)

        # Get players ordered by final rank
        players = (
            TournamentPrize.query.filter_by(tournament_id=tournament_id)
            .order_by(TournamentPrize.rank.asc())
            .all()
        )

        # Distribute prizes
        for rank, player in enumerate(players, start=1):
            if rank in prizes:
                prize_amount = prizes[rank]

                # Create notification
                Notification.create(
                    user_id=player.player_id,
                    type="prize_won",
                    title=f"Prize Won in {tournament.name}",
                    message=(
                        f"Congratulations! You won {prize_amount:.2f} for "
                        f"placing {rank} in {tournament.name}."
                    ),
                    data={
                        "tournament_id": tournament_id,
                        "prize_amount": prize_amount,
                        "rank": rank,
                    },
                )

        db.session.commit()

    def get_unclaimed_prizes(self, user_id: int, limit: int = 10, offset: int = 0):
        """Get unclaimed prizes for a user.

        Args:
            user_id: User ID
            limit: Maximum number of prizes to return
            offset: Number of prizes to skip

        Returns:
            List[Dict[str, Any]]: List of unclaimed prizes
        """
        # Get tournaments where the user placed in top 3
        tournaments = (
            Tournament.query.join(TournamentPrize)
            .filter(
                TournamentPrize.player_id == user_id,
                Tournament.status == "completed",
            )
            .offset(offset)
            .limit(limit)
            .all()
        )

        unclaimed_prizes = []
        for tournament in tournaments:
            # Get player's rank
            player = next(
                (p for p in tournament.players if p.player_id == user_id), None
            )
            if player and player.total_points > 0:
                # Calculate prize based on standard distribution
                rank = (
                    sorted(
                        tournament.players,
                        key=lambda x: x.total_points,
                        reverse=True,
                    ).index(player)
                    + 1
                )

                if rank <= 3:  # Only top 3 get prizes
                    prize_amount = tournament.total_prize_pool * (
                        0.5 if rank == 1 else 0.3 if rank == 2 else 0.2
                    )
                    unclaimed_prizes.append(
                        {
                            "tournament_id": tournament.id,
                            "tournament_name": tournament.name,
                            "prize_amount": prize_amount,
                            "rank": rank,
                        }
                    )

        return unclaimed_prizes

    def get_prize_history(
        self, user_id: int, limit: int = 10, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get prize history for a user.

        Args:
            user_id: User ID
            limit: Maximum number of prizes to return
            offset: Number of prizes to skip

        Returns:
            List[Dict[str, Any]]: List of prizes
        """
        # Get all completed tournaments where user participated
        tournaments = (
            Tournament.query.join(TournamentPrize)
            .filter(
                TournamentPrize.player_id == user_id,
                Tournament.status == "completed",
            )
            .offset(offset)
            .limit(limit)
            .all()
        )

        prize_history = []
        for tournament in tournaments:
            # Get player's rank
            player = next(
                (p for p in tournament.players if p.player_id == user_id), None
            )
            if player and player.total_points > 0:
                # Calculate prize based on standard distribution
                rank = (
                    sorted(
                        tournament.players,
                        key=lambda x: x.total_points,
                        reverse=True,
                    ).index(player)
                    + 1
                )

                if rank <= 3:  # Only top 3 get prizes
                    prize_amount = tournament.total_prize_pool * (
                        0.5 if rank == 1 else 0.3 if rank == 2 else 0.2
                    )
                    prize_history.append(
                        {
                            "tournament_id": tournament.id,
                            "tournament_name": tournament.name,
                            "prize_amount": prize_amount,
                            "rank": rank,
                            "claimed": True,  # Since we're not tracking claims separately
                            "claimed_at": (
                                tournament.end_date.isoformat()
                                if tournament.end_date
                                else None
                            ),
                        }
                    )

        return prize_history
