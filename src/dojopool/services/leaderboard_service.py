from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import desc, func

from dojopool.models.game import Game
from dojopool.models.user import User
from dojopool.core.extensions import db
from dojopool.core.models.notification import Notification
from dojopool.models.venue import Venue
from dojopool.models.venue_leaderboard import VenueLeaderboard


class LeaderboardService:
    """Service for managing venue leaderboards."""

    def __init__(self):
        self.points_per_win = 10
        self.points_per_loss = 2
        self.streak_bonus = 5  # Additional points per win while on streak
        self.streak_threshold = 3  # Number of wins to start streak bonus

    def update_leaderboard(
        self, venue_id: int, user_id: int, won: bool, points_earned: Optional[int] = None
    ) -> VenueLeaderboard:
        """Update leaderboard entry after a game.

        Args:
            venue_id: Venue ID
            user_id: User ID
            won: Whether the user won
            points_earned: Optional override for points earned

        Returns:
            VenueLeaderboard: Updated leaderboard entry
        """
        # Verify venue and user exist
        venue = Venue.query.get(venue_id)
        user = User.query.get(user_id)

        if not venue or not user:
            raise ValueError("Venue or user not found")

        # Get or create leaderboard entry
        entry = VenueLeaderboard.query.filter_by(venue_id=venue_id, user_id=user_id).first()

        if not entry:
            entry = VenueLeaderboard(
                venue_id=venue_id,
                user_id=user_id,
                points=0,
                wins=0,
                losses=0,
                current_streak=0,
                highest_streak=0,
                last_played=datetime.utcnow(),
            )
            db.session.add(entry)

        # Update stats
        if won:
            entry.wins += 1
            entry.current_streak = entry.current_streak + 1 if entry.current_streak >= 0 else 1

            # Calculate points
            if points_earned is not None:
                points = points_earned
            else:
                points = self.points_per_win
                if entry.current_streak >= self.streak_threshold:
                    points += self.streak_bonus

            entry.points += points
        else:
            entry.losses += 1
            entry.current_streak = entry.current_streak - 1 if entry.current_streak <= 0 else -1
            entry.points += points_earned if points_earned is not None else self.points_per_loss

        # Update highest streak
        if entry.current_streak > entry.highest_streak:
            entry.highest_streak = entry.current_streak

            # Notify user of new streak record
            if entry.highest_streak >= self.streak_threshold:
                Notification.create(
                    user_id=user_id,
                    type="streak_record",
                    title="New Streak Record!",
                    message=(
                        f"You achieved a new streak record of {entry.highest_streak} "
                        f"wins at {venue.name}!"
                    ),
                    data={"venue_id": venue_id, "streak": entry.highest_streak},
                )

        entry.last_played = datetime.utcnow()
        db.session.commit()
        return entry

    def get_leaderboard(
        self, venue_id: int, period: Optional[str] = None, limit: int = 10, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get venue leaderboard.

        Args:
            venue_id: Venue ID
            period: Optional time period ('week', 'month', 'year', None for all-time)
            limit: Maximum number of entries to return
            offset: Number of entries to skip

        Returns:
            List[Dict[str, Any]]: List of leaderboard entries
        """
        query = VenueLeaderboard.query.filter_by(venue_id=venue_id)

        if period:
            now = datetime.utcnow()
            if period == "week":
                start_date = now - timedelta(weeks=1)
            elif period == "month":
                start_date = now - timedelta(days=30)
            elif period == "year":
                start_date = now - timedelta(days=365)
            else:
                raise ValueError("Invalid period")

            query = query.filter(VenueLeaderboard.last_played >= start_date)

        entries = query.order_by(desc(VenueLeaderboard.points)).offset(offset).limit(limit).all()

        return [
            {
                "id": e.id,
                "user_id": e.user_id,
                "username": e.user.username,
                "avatar_url": e.user.avatar_url,
                "points": e.points,
                "wins": e.wins,
                "losses": e.losses,
                "current_streak": e.current_streak,
                "highest_streak": e.highest_streak,
                "last_played": e.last_played.isoformat(),
                "rank": offset + idx + 1,
            }
            for idx, e in enumerate(entries)
        ]

    def get_user_stats(self, venue_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user's stats for a venue.

        Args:
            venue_id: Venue ID
            user_id: User ID

        Returns:
            Optional[Dict[str, Any]]: User's stats if found
        """
        entry = VenueLeaderboard.query.filter_by(venue_id=venue_id, user_id=user_id).first()

        if not entry:
            return None

        # Get user's rank
        rank = (
            db.session.query(func.count())
            .select_from(VenueLeaderboard)
            .filter(VenueLeaderboard.venue_id == venue_id, VenueLeaderboard.points > entry.points)
            .scalar()
        )

        return {
            "id": entry.id,
            "user_id": entry.user_id,
            "username": entry.user.username,
            "avatar_url": entry.user.avatar_url,
            "points": entry.points,
            "wins": entry.wins,
            "losses": entry.losses,
            "current_streak": entry.current_streak,
            "highest_streak": entry.highest_streak,
            "last_played": entry.last_played.isoformat(),
            "rank": rank + 1,
            "win_rate": (
                round(entry.wins / (entry.wins + entry.losses) * 100, 1)
                if entry.wins + entry.losses > 0
                else 0
            ),
        }
