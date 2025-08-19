"""Game analytics model module."""

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from ..extensions import db
from .base import BaseModel


class GameAnalytics(BaseModel):
    """Game analytics model."""

    __tablename__ = "game_analytics"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("game_sessions.id"))

    # Performance metrics
    accuracy = Column(Float)  # Shot accuracy percentage
    potting_success = Column(Float)  # Successful pot percentage
    position_control = Column(Float)  # Position play rating
    safety_success = Column(Float)  # Safety shot success rate
    break_success = Column(Float)  # Break success rate

    # Game stats
    total_shots = Column(Integer, default=0)
    successful_shots = Column(Integer, default=0)
    failed_shots = Column(Integer, default=0)
    fouls = Column(Integer, default=0)
    safeties_played = Column(Integer, default=0)
    points_scored = Column(Integer, default=0)

    # Advanced metrics
    shot_patterns = Column(JSON)  # Common shot patterns and success rates
    position_patterns = Column(JSON)  # Position play patterns
    game_progression = Column(JSON)  # Shot-by-shot game progression
    decision_points = Column(JSON)  # Key decision points and outcomes

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    game = relationship("Game", backref="analytics")
    player = relationship("User", backref="game_analytics")
    session = relationship("GameSession", backref="analytics")

    def __repr__(self):
        return f"<GameAnalytics {self.id} for Game {self.game_id}>"

    def calculate_overall_performance(self):
        """Calculate overall performance score."""
        weights = {
            "accuracy": 0.3,
            "potting_success": 0.3,
            "position_control": 0.2,
            "safety_success": 0.1,
            "break_success": 0.1,
        }

        score = sum(
            getattr(self, metric) * weight
            for metric, weight in weights.items()
            if getattr(self, metric) is not None
        )

        return round(score, 2)

    def update_shot_patterns(self, pattern_data):
        """Update shot pattern analysis.

        Args:
            pattern_data: New pattern data to analyze
        """
        if not self.shot_patterns:
            self.shot_patterns = {}

        self.shot_patterns.update(pattern_data)
        db.session.commit()

    def update_position_patterns(self, pattern_data):
        """Update position pattern analysis.

        Args:
            pattern_data: New pattern data to analyze
        """
        if not self.position_patterns:
            self.position_patterns = {}

        self.position_patterns.update(pattern_data)
        db.session.commit()

    def add_decision_point(self, decision_data):
        """Add a new decision point analysis.

        Args:
            decision_data: Decision point data to add
        """
        if not self.decision_points:
            self.decision_points = []

        self.decision_points.append(decision_data)
        db.session.commit()

    def update_game_progression(self, progression_data):
        """Update game progression analysis.

        Args:
            progression_data: New progression data
        """
        if not self.game_progression:
            self.game_progression = []

        self.game_progression.extend(progression_data)
        db.session.commit()

    @classmethod
    def get_player_stats(cls, player_id):
        """Get aggregated stats for a player.

        Args:
            player_id: Player ID

        Returns:
            dict: Aggregated player stats
        """
        stats = (
            db.session.query(
                db.func.avg(cls.accuracy).label("avg_accuracy"),
                db.func.avg(cls.potting_success).label("avg_potting"),
                db.func.avg(cls.position_control).label("avg_position"),
                db.func.avg(cls.safety_success).label("avg_safety"),
                db.func.avg(cls.break_success).label("avg_break"),
                db.func.sum(cls.total_shots).label("total_shots"),
                db.func.sum(cls.successful_shots).label("successful_shots"),
                db.func.sum(cls.failed_shots).label("failed_shots"),
                db.func.sum(cls.fouls).label("total_fouls"),
                db.func.sum(cls.points_scored).label("total_points"),
            )
            .filter_by(player_id=player_id)
            .first()
        )

        return {
            "accuracy": round(stats.avg_accuracy or 0, 2),
            "potting_success": round(stats.avg_potting or 0, 2),
            "position_control": round(stats.avg_position or 0, 2),
            "safety_success": round(stats.avg_safety or 0, 2),
            "break_success": round(stats.avg_break or 0, 2),
            "total_shots": stats.total_shots or 0,
            "successful_shots": stats.successful_shots or 0,
            "failed_shots": stats.failed_shots or 0,
            "total_fouls": stats.total_fouls or 0,
            "total_points": stats.total_points or 0,
        }
