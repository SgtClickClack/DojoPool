"""Game analytics models."""
from datetime import datetime
from typing import Dict, List
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from dojopool.extensions import db

class GameAnalytics(db.Model):
    """Game analytics model."""
    
    __tablename__ = 'game_analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    match_id = db.Column(db.String(255), nullable=True)
    timestamp = db.Column(db.DateTime, nullable=False, server_default=func.now())
    
    # Store metrics as JSON
    shot_metrics = db.Column(JSONB, nullable=False)
    positional_metrics = db.Column(JSONB, nullable=False)
    strategy_metrics = db.Column(JSONB, nullable=False)
    pressure_metrics = db.Column(JSONB, nullable=False)
    progression_metrics = db.Column(JSONB, nullable=False)
    
    def __init__(
        self,
        player_id: int,
        shot_metrics: Dict,
        positional_metrics: Dict,
        strategy_metrics: Dict,
        pressure_metrics: Dict,
        progression_metrics: Dict,
        match_id: str = None,
        timestamp: datetime = None
    ):
        """Initialize game analytics.
        
        Args:
            player_id: Player ID
            shot_metrics: Shot metrics data
            positional_metrics: Positional metrics data
            strategy_metrics: Strategy metrics data
            pressure_metrics: Pressure metrics data
            progression_metrics: Progression metrics data
            match_id: Optional match ID
            timestamp: Optional timestamp
        """
        self.player_id = player_id
        self.match_id = match_id
        self.timestamp = timestamp or datetime.utcnow()
        self.shot_metrics = shot_metrics
        self.positional_metrics = positional_metrics
        self.strategy_metrics = strategy_metrics
        self.pressure_metrics = pressure_metrics
        self.progression_metrics = progression_metrics
    
    def to_dict(self) -> Dict:
        """Convert to dictionary.
        
        Returns:
            Dict: Dictionary representation
        """
        return {
            'id': self.id,
            'player_id': self.player_id,
            'match_id': self.match_id,
            'timestamp': self.timestamp.isoformat(),
            'shot_metrics': self.shot_metrics,
            'positional_metrics': self.positional_metrics,
            'strategy_metrics': self.strategy_metrics,
            'pressure_metrics': self.pressure_metrics,
            'progression_metrics': self.progression_metrics
        }
    
    @staticmethod
    def validate_metrics(metrics: Dict) -> bool:
        """Validate metrics data.
        
        Args:
            metrics: Metrics data to validate
            
        Returns:
            bool: Whether metrics are valid
        """
        # Add validation logic here
        return True 