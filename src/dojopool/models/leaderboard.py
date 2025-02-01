from ..core.database import db
from ..core.mixins import TimestampMixin


class Leaderboard(TimestampMixin, db.Model):
    """Model for tracking user rankings."""

    __tablename__ = "leaderboards"
    __table_args__ = (
        db.UniqueConstraint("user_id", "type", name="unique_user_type"),
        {"extend_existing": True},
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # global, tournament, monthly, etc.
    period = db.Column(
        db.String(50)
    )  # For periodic leaderboards (e.g., "2024-01" for January 2024)
    rank = db.Column(db.Integer)
    score = db.Column(db.Float, default=0.0)
    games_played = db.Column(db.Integer, default=0)
    games_won = db.Column(db.Integer, default=0)
    tournaments_played = db.Column(db.Integer, default=0)
    tournaments_won = db.Column(db.Integer, default=0)

    # Additional stats stored as JSON
    stats = db.Column(db.JSON)

    # Relationships
    user = db.relationship("User", back_populates="leaderboard_entries")

    @property
    def win_rate(self):
        """Calculate win rate as a percentage."""
        if self.games_played == 0:
            return 0.0
        return (self.games_won / self.games_played) * 100

    def to_dict(self):
        """Convert leaderboard entry to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.user.username,
            "avatar_url": self.user.avatar_url,
            "type": self.type,
            "period": self.period,
            "rank": self.rank,
            "score": self.score,
            "games_played": self.games_played,
            "games_won": self.games_won,
            "tournaments_played": self.tournaments_played,
            "tournaments_won": self.tournaments_won,
            "win_rate": self.win_rate,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
