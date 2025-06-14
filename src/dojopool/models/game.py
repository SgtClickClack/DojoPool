"""Game model module.

This module contains game-related models.
"""

from datetime import datetime
from typing import Any, Dict, Optional

from ..core.extensions import db
# Remove direct achievement model imports if no longer used here
# from dojopool.models.achievements import Achievement, UserAchievement 
from .social import UserProfile # Keep if UserProfile is used for _update_player_stats
from .enums import GameType, GameMode, GameStatus
# from ..services.achievement_service import achievement_service # Removed: Appears unused and causes circular import
# Import game_completed_notification from its new location - MOVED INTO complete_game method
# from ..services.game_service import game_completed_notification 
# Import GamePlayer from core models
from ..core.models.game import GamePlayer, GameResult
# Import other models with Game relationships
from .rating import Rating
from .player_status import PlayerStatus
from .video_highlight import VideoHighlight


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
    # Add duration if it was used in complete_game, otherwise remove calculation
    # duration = db.Column(db.Interval) # Example if you want to store it

    # Relationships
    player1 = db.relationship("User", foreign_keys=[player1_id])
    player2 = db.relationship("User", foreign_keys=[player2_id])
    winner = db.relationship("User", foreign_keys=[winner_id])
    shots = db.relationship("Shot", back_populates="game", lazy="dynamic")
    tournament_games = db.relationship(
        "TournamentGame", cascade="all, delete-orphan", back_populates="game"
    )
    players = db.relationship("GamePlayer", back_populates="game", lazy="dynamic")
    results = db.relationship("GameResult", back_populates="game", lazy="dynamic")
    ratings = db.relationship("Rating", back_populates="last_game", lazy="dynamic")
    comments = db.relationship("GameComment", backref="game", lazy="dynamic")

    def __init__(self, player1_id, player2_id, game_type: GameType, game_mode: GameMode, status: GameStatus = GameStatus.PENDING):
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
            db.session.add(self) # Add to session when state changes
            db.session.commit()

    def complete_game(self, winner_id: int, score: str):
        """Complete the game and trigger achievements."""
        # Moved import here to break circular dependency
        from ..services.game_service import game_completed_notification
        if self.status == GameStatus.IN_PROGRESS:
            self.status = GameStatus.COMPLETED
            self.winner_id = winner_id
            self.score = score
            self.completed_at = datetime.utcnow()

            # Duration calculation - ensure created_at exists
            # if self.created_at and self.completed_at:
            #    self.duration = self.completed_at - self.created_at

            db.session.add(self) # Add to session before commit if not already managed
            # Player stats update and achievement checks are now separate concerns handled by services if needed
            # For now, let's assume the commit for game completion should happen here.
            db.session.commit()

            # Update player stats (can be moved to a service too)
            self._update_player_stats() 

            # Call the imported game_completed_notification
            game_completed_notification(self)

            # --- Post-game rewards and achievements ---
            try:
                from dojopool.services.wallet_service import wallet_service, RewardType
                from dojopool.services.achievement_service import achievement_service
                # Award coins to the winner
                if self.winner_id:
                    wallet_service.award_coins(self.winner_id, RewardType.MATCH_WIN)
                # Award achievements
                achievement_service.check_and_award_game_achievements(self)
            except Exception as e:
                # Log but do not break game completion
                import logging
                logging.warning(f"Post-game rewards/achievements error: {e}")

    def _update_player_stats(self):
        """Update player statistics after a game is completed."""
        # This logic might also be suitable for a UserStatsService
        if not self.winner_id: # Cannot update stats if winner is not set
            return
            
        player_ids_to_update = [self.player1_id, self.player2_id]
        for player_id in player_ids_to_update:
            if player_id is None: # Skip if a player ID is somehow None
                continue
            profile = db.session.query(UserProfile).filter_by(user_id=player_id).first()
            if profile:
                profile.total_matches = (profile.total_matches or 0) + 1
                if player_id == self.winner_id:
                    profile.wins = (profile.wins or 0) + 1
                # else: # if you track losses
                #    profile.losses = (profile.losses or 0) + 1
                db.session.add(profile)
        db.session.commit() # Commit after updating all relevant profiles

    def cancel_game(self):
        """Cancel the game."""
        if self.status != GameStatus.COMPLETED:
            self.status = GameStatus.CANCELLED
            db.session.add(self)
            db.session.commit()

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
        """Initialize game session."""
        self.user_id = user_id
        self.start_time = start_time or datetime.utcnow()
        self.status = status

    def save(self):
        """Save game session."""
        db.session.add(self)
        db.session.commit()

    def end(self, score: Optional[int] = None):
        """End game session."""
        self.end_time = datetime.utcnow()
        self.status = "ended"
        self.save()

    def cancel(self):
        """Cancel game session."""
        self.status = "cancelled"
        self.save()

    def to_dict(self):
        """Convert game session to dictionary."""
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

    # Relationships - removed duplicate backref since Game model already defines it
    user = db.relationship("User", backref="comments")

    def __repr__(self):
        """Represent game comment as string."""
        return f"<GameComment {self.id}: {self.content[:50]}...>"
