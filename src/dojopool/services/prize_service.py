"""Service for handling tournament prize distribution and tracking."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from dojopool.core.extensions import db
from dojopool.models.notification import Notification
from dojopool.models.tournament import Tournament, TournamentParticipant


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

    def calculate_prizes(self, tournament: Tournament) -> Dict[int, float]:
        """Calculate standard prize distribution."""
        return {
            1: tournament.prize_pool * 0.5,  # 50% for 1st place
            2: tournament.prize_pool * 0.3,  # 30% for 2nd place
            3: tournament.prize_pool * 0.2,  # 20% for 3rd place
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

    def calculate_prizes(self, tournament: Tournament) -> Dict[int, float]:
        """Calculate custom prize distribution."""
        return {
            place: tournament.prize_pool * percentage
            for place, percentage in self.distribution.items()
        }


class PrizeService:
    """Service for managing tournament prizes."""

    def __init__(self):
        self.rules = {
            "standard": StandardPrizeRule(),
            "custom": None,  # Set via configure_custom_rule
        }

    def configure_custom_rule(self, distribution: Dict[int, float]) -> None:
        """Configure custom prize distribution rule.

        Args:
            distribution: Mapping of place to percentage (as decimal)
        """
        self.rules["custom"] = CustomPrizeRule(distribution)

    def distribute_prizes(self, tournament_id: int, rule_name: str = "standard") -> None:
        """Distribute prizes for a tournament.

        Args:
            tournament_id: Tournament ID
            rule_name: Name of distribution rule to use
        """
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")

        if not tournament.prize_pool:
            return

        rule = self.rules.get(rule_name)
        if not rule:
            raise ValueError(f"Prize rule '{rule_name}' not found")

        # Calculate prize distribution
        prizes = rule.calculate_prizes(tournament)

        # Get participants ordered by final rank
        participants = (
            TournamentParticipant.query.filter_by(tournament_id=tournament_id)
            .order_by(TournamentParticipant.final_rank)
            .all()
        )

        # Distribute prizes
        for participant in participants:
            if participant.final_rank in prizes:
                prize_amount = prizes[participant.final_rank]
                participant.prize_amount = prize_amount

                # Record prize in participant stats
                if not participant.stats.get("prizes"):
                    participant.stats["prizes"] = []

                participant.stats["prizes"].append(
                    {
                        "tournament_id": tournament_id,
                        "tournament_name": tournament.name,
                        "amount": prize_amount,
                        "rank": participant.final_rank,
                        "date": datetime.utcnow().isoformat(),
                        "claimed": False,
                    }
                )

                # Create notification
                Notification.create(
                    user_id=participant.user_id,
                    type="prize_won",
                    title=f"Prize Won in {tournament.name}",
                    message=(
                        f"Congratulations! You won {prize_amount:.2f} for "
                        f"placing {participant.final_rank} in {tournament.name}."
                    ),
                    data={
                        "tournament_id": tournament_id,
                        "prize_amount": prize_amount,
                        "rank": participant.final_rank,
                    },
                )

        db.session.commit()

    def claim_prize(self, participant_id: int, tournament_id: int) -> Optional[Dict[str, Any]]:
        """Claim a prize for a tournament.

        Args:
            participant_id: Participant ID
            tournament_id: Tournament ID

        Returns:
            Optional[Dict[str, Any]]: Prize details if claimed
        """
        participant = TournamentParticipant.query.get(participant_id)
        if not participant:
            raise ValueError("Participant not found")

        # Find prize in participant stats
        prizes = participant.stats.get("prizes", [])
        prize = next((p for p in prizes if p["tournament_id"] == tournament_id), None)

        if not prize:
            raise ValueError("No prize found for this tournament")

        if prize["claimed"]:
            raise ValueError("Prize already claimed")

        # Mark prize as claimed
        prize["claimed"] = True
        prize["claimed_at"] = datetime.utcnow().isoformat()

        # Update participant stats
        participant.stats["prizes"] = prizes

        # Create notification
        Notification.create(
            user_id=participant.user_id,
            type="prize_claimed",
            title="Prize Claimed",
            message=(
                f'Your prize of {prize["amount"]:.2f} for '
                f'{prize["tournament_name"]} has been claimed.'
            ),
            data={
                "tournament_id": tournament_id,
                "prize_amount": prize["amount"],
                "rank": prize["rank"],
            },
        )

        db.session.commit()
        return prize

    def get_unclaimed_prizes(
        self, user_id: int, limit: int = 10, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get unclaimed prizes for a user.

        Args:
            user_id: User ID
            limit: Maximum number of prizes to return
            offset: Number of prizes to skip

        Returns:
            List[Dict[str, Any]]: List of unclaimed prizes
        """
        participants = TournamentParticipant.query.filter_by(user_id=user_id).all()

        unclaimed_prizes = []
        for participant in participants:
            prizes = participant.stats.get("prizes", [])
            unclaimed = [
                {**p, "participant_id": participant.id}
                for p in prizes
                if not p.get("claimed", False)
            ]
            unclaimed_prizes.extend(unclaimed)

        # Sort by date (newest first) and apply pagination
        unclaimed_prizes.sort(key=lambda p: p["date"], reverse=True)
        return unclaimed_prizes[offset : offset + limit]

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
        participants = TournamentParticipant.query.filter_by(user_id=user_id).all()

        all_prizes = []
        for participant in participants:
            prizes = participant.stats.get("prizes", [])
            prizes_with_id = [{**p, "participant_id": participant.id} for p in prizes]
            all_prizes.extend(prizes_with_id)

        # Sort by date (newest first) and apply pagination
        all_prizes.sort(key=lambda p: p["date"], reverse=True)
        return all_prizes[offset : offset + limit]
