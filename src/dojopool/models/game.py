"""Game model module.

This module contains game-related models.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from ..core.extensions import db
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .social import UserProfile
from .achievements import UserAchievement, Achievement


class GameType(Enum):
    """Game type enumeration."""

    EIGHT_BALL = "eight_ball"
    NINE_BALL = "nine_ball"
    TEN_BALL = "ten_ball"
    STRAIGHT_POOL = "straight_pool"
    ONE_POCKET = "one_pocket"
    BANK_POOL = "bank_pool"


class GameMode(Enum):
    """Game mode enumeration."""

    CASUAL = "casual"
    RANKED = "ranked"
    TOURNAMENT = "tournament"
    PRACTICE = "practice"


class GameStatus(str, Enum):
    """Game status enumeration."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Shot(db.Model):
    """Shot model class."""

    __tablename__ = "shots"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    ball_numbers = db.Column(db.JSON, nullable=False)  # List of ball numbers involved
    pocketed = db.Column(db.Boolean, nullable=False)  # Whether any balls were pocketed
    foul = db.Column(db.Boolean, nullable=False, default=False)  # Whether a foul occurred
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    game = db.relationship("Game", back_populates="shots")
    player = db.relationship("User")


class Game(db.Model):
    """Game model class."""

    __tablename__ = "games"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    player1_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    player2_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    game_type = db.Column(db.Enum(GameType), nullable=False)
    game_mode = db.Column(db.Enum(GameMode), nullable=False)
    status = db.Column(db.Enum(GameStatus), nullable=False, default=GameStatus.PENDING)
    winner_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    score = db.Column(db.String(50))  # Format: "player1_score-player2_score"
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)

    # Relationships
    player1 = db.relationship("User", foreign_keys=[player1_id])
    player2 = db.relationship("User", foreign_keys=[player2_id])
    winner = db.relationship("User", foreign_keys=[winner_id])
    shots = db.relationship("Shot", back_populates="game", lazy="dynamic")
    tournament_games = db.relationship(
        "TournamentGame", backref="game", cascade="all, delete-orphan"
    )

    def __init__(self, player1_id, player2_id, game_type, game_mode, status=GameStatus.PENDING):
        """Initialize game."""
        self.player1_id = player1_id
        self.player2_id = player2_id
        self.game_type = game_type
        self.game_mode = game_mode
        self.status = status

    def start_game(self):
        """Start the game."""
        if self.status == GameStatus.PENDING:
            self.status = GameStatus.IN_PROGRESS
            self.started_at = datetime.utcnow()

    def complete_game(self, winner_id, score):
        """Complete the game and trigger achievements."""
        if self.status == GameStatus.IN_PROGRESS:
            self.status = GameStatus.COMPLETED
            self.winner_id = winner_id
            self.score = score
            self.completed_at = datetime.utcnow()

            if self.created_at:
                self.duration = self.completed_at - self.created_at

            self.save()

            # Update player stats
            self._update_player_stats()

            # Check for achievements
            self._check_achievements()

    def _update_player_stats(self):
        """Update player statistics."""
        for player in [self.player1, self.player2]:
            profile = UserProfile.objects.get(user=player)
            profile.total_matches += 1

            if player.id == self.winner_id:
                profile.wins += 1

            profile.save()

    def _check_achievements(self):
        """Check and award achievements based on game results."""
        winner_profile = UserProfile.objects.get(user=self.winner)
        loser_profile = UserProfile.objects.get(
            user=self.player2 if self.winner == self.player1 else self.player1
        )

        # Check win streak
        self._check_win_streak(winner_profile)

        # Check first win
        self._check_first_win(winner_profile)

        # Check perfect game
        if self.player1 == self.winner and self.player2_score == 0:
            self._award_achievement(winner_profile, "perfect_game")
        elif self.player2 == self.winner and self.player1_score == 0:
            self._award_achievement(winner_profile, "perfect_game")

        # Check high difficulty win
        if self.difficulty_rating >= 8:
            self._award_achievement(winner_profile, "difficult_victory")

    def _check_win_streak(self, profile):
        """Check and award win streak achievements."""
        recent_games = Game.objects.filter(
            models.Q(player1=profile.user) | models.Q(player2=profile.user),
            status="completed",
            completed_at__lte=timezone.now(),
        ).order_by("-completed_at")[:10]

        streak = 0
        for game in recent_games:
            if game.winner == profile.user:
                streak += 1
            else:
                break

        if streak >= 3:
            self._award_achievement(profile, "win_streak_3")
        if streak >= 5:
            self._award_achievement(profile, "win_streak_5")
        if streak >= 10:
            self._award_achievement(profile, "win_streak_10")

    def _check_first_win(self, profile):
        """Award first win achievement."""
        if profile.wins == 1:
            self._award_achievement(profile, "first_win")

    def _award_achievement(self, profile, achievement_code):
        """Award an achievement to a player."""
        try:
            achievement = Achievement.objects.get(code=achievement_code)
            user_achievement, created = UserAchievement.objects.get_or_create(
                user=profile, achievement=achievement
            )

            if not user_achievement.is_unlocked:
                user_achievement.unlock()
        except Achievement.DoesNotExist:
            pass

    def cancel_game(self):
        """Cancel the game."""
        if self.status != GameStatus.COMPLETED:
            self.status = GameStatus.CANCELLED

    def __repr__(self):
        """Represent game as string."""
        return f"<Game {self.id}: {self.player1_id} vs {self.player2_id}>"

    def __str__(self) -> str:
        """
        Returns the string representation of the Game.

        Returns:
            str: The game name.
        """
        return f"{self.player1_id} vs {self.player2_id}"

    def add_player(self, player: User) -> None:
        """
        Adds a player to the game.

        Args:
            player (User): The user instance to add.
        """
        self.players.add(player)
        self.save()

    def remove_player(self, player: User) -> None:
        """
        Removes a player from the game.

        Args:
            player (User): The user instance to remove.
        """
        self.players.remove(player)
        self.save()


class GameSession(db.Model):
    """Game session model."""

    __tablename__ = "game_sessions"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    status = db.Column(db.String(20), default="active")  # active, paused, ended
    metrics = db.Column(db.JSON)  # Store session metrics
    settings = db.Column(db.JSON)  # Store session settings

    # Relationships
    game = db.relationship("Game", backref=db.backref("sessions", lazy="dynamic"))
    user = db.relationship("User", backref=db.backref("game_sessions", lazy="dynamic"))

    def __init__(self, user_id: int, start_time: Optional[datetime] = None, status: str = "active"):
        """Initialize a game session."""
        self.user_id = user_id
        self.start_time = start_time or datetime.utcnow()
        self.status = status

    def save(self):
        """Save the session to the database."""
        db.session.add(self)
        db.session.commit()

    def end(self, score: Optional[int] = None):
        """End the game session."""
        self.end_time = datetime.utcnow()
        self.status = "completed"
        if score is not None:
            self.score = score
        db.session.commit()

    def cancel(self):
        """Cancel the game session."""
        self.end_time = datetime.utcnow()
        self.status = "cancelled"
        db.session.commit()

    def to_dict(self):
        """Convert the session to a dictionary."""
        return {
            "id": self.id,
            "game_id": self.game_id,
            "user_id": self.user_id,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "status": self.status,
            "metrics": self.metrics,
            "settings": self.settings,
        }


class GameComment(db.Model):
    """Game comment model."""

    __tablename__ = "game_comments"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    likes = db.Column(db.Integer, default=0)

    # Relationships
    game = db.relationship("Game", backref="comments")
    user = db.relationship("User", backref="comments")

    def __repr__(self):
        """Represent comment as string."""
        return f"<GameComment {self.id}: {self.game_id} - {self.user_id}>"


@receiver(post_save, sender=Game)
def game_completed_notification(sender, instance, created, **kwargs):
    """Send notifications when a game is completed."""
    if not created and instance.status == "completed" and instance.completed_at == timezone.now():
        # Send WebSocket notifications to both players
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()

        for player in [instance.player1, instance.player2]:
            async_to_sync(channel_layer.group_send)(
                f"notifications_group_{player.id}",
                {
                    "type": "game_completed",
                    "game": {
                        "id": instance.id,
                        "opponent": (
                            instance.player2.username
                            if player == instance.player1
                            else instance.player1.username
                        ),
                        "result": "victory" if player == instance.winner else "defeat",
                        "score": f"{instance.player1_score}-{instance.player2_score}",
                    },
                },
            )
