"""Shot model module.

This module contains the Shot model for tracking shots in a game.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.dialects.postgresql import JSONB
from .base import BaseModel, db

class Shot(BaseModel):
    """Shot model."""
    __tablename__ = 'shots'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    power = db.Column(db.Float, nullable=False)
    angle = db.Column(db.Float, nullable=False)
    spin = db.Column(db.Float, default=0)
    english = db.Column(db.Float, default=0)
    result = db.Column(db.Boolean, default=False)
    match_id = db.Column(db.Integer, db.ForeignKey('matches.id'))
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'))
    position = db.Column(JSONB)
    target = db.Column(JSONB)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    analysis = db.Column(JSONB)
    
    # Relationships
    player = db.relationship('User', backref='shots')
    match = db.relationship('Match', backref='shots')
    game = db.relationship('Game', backref='shots')
    
    def __init__(self, **kwargs):
        """Initialize shot."""
        super(Shot, self).__init__(**kwargs)
        self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert shot to dictionary."""
        return {
            'id': self.id,
            'player_id': self.player_id,
            'power': self.power,
            'angle': self.angle,
            'spin': self.spin,
            'english': self.english,
            'result': self.result,
            'match_id': self.match_id,
            'game_id': self.game_id,
            'position': self.position,
            'target': self.target,
            'timestamp': self.timestamp.isoformat(),
            'analysis': self.analysis
        }
    
    @classmethod
    def get_player_shots(
        cls,
        player_id: int,
        time_range: Optional[Dict[str, datetime]] = None
    ) -> List['Shot']:
        """Get all shots for a player within the specified time range."""
        query = cls.query.filter_by(player_id=player_id)
        
        if time_range:
            query = query.filter(
                cls.timestamp >= time_range.get('start'),
                cls.timestamp <= time_range.get('end')
            )
        
        return query.order_by(cls.timestamp.asc()).all()
    
    @classmethod
    def get_match_shots(cls, match_id: int) -> List['Shot']:
        """Get all shots for a specific match."""
        return cls.query.filter_by(match_id=match_id).order_by(cls.timestamp.asc()).all()
    
    @classmethod
    def get_game_shots(cls, game_id: int) -> List['Shot']:
        """Get all shots for a specific game."""
        return cls.query.filter_by(game_id=game_id).order_by(cls.timestamp.asc()).all()
    
    def add_analysis(self, analysis_data: Dict[str, Any]) -> None:
        """Add or update shot analysis data."""
        self.analysis = analysis_data
        db.session.commit()
    
    @classmethod
    def create_shot(
        cls,
        player_id: int,
        power: float,
        angle: float,
        spin: float = 0,
        english: float = 0,
        result: bool = False,
        match_id: Optional[int] = None,
        game_id: Optional[int] = None,
        position: Optional[Dict[str, float]] = None,
        target: Optional[Dict[str, float]] = None
    ) -> 'Shot':
        """Create a new shot record."""
        shot = cls(
            player_id=player_id,
            power=power,
            angle=angle,
            spin=spin,
            english=english,
            result=result,
            match_id=match_id,
            game_id=game_id,
            position=position,
            target=target
        )
        db.session.add(shot)
        db.session.commit()
        return shot
    
    def update_result(self, result: bool) -> None:
        """Update the result of the shot."""
        self.result = result
        db.session.commit()
    
    @classmethod
    def get_player_stats(
        cls,
        player_id: int,
        time_range: Optional[Dict[str, datetime]] = None
    ) -> Dict[str, Any]:
        """Get aggregated shot statistics for a player."""
        shots = cls.get_player_shots(player_id, time_range)
        
        if not shots:
            return {
                'total_shots': 0,
                'success_rate': 0,
                'average_power': 0,
                'shot_distribution': {}
            }
        
        total_shots = len(shots)
        successful_shots = sum(1 for shot in shots if shot.result)
        
        # Calculate averages
        avg_power = sum(shot.power for shot in shots) / total_shots
        avg_spin = sum(abs(shot.spin) for shot in shots) / total_shots
        avg_english = sum(abs(shot.english) for shot in shots) / total_shots
        
        # Calculate shot distribution
        power_ranges = {
            'soft': (0, 30),
            'medium': (31, 70),
            'power': (71, 100)
        }
        
        shot_distribution = {range_name: 0 for range_name in power_ranges}
        
        for shot in shots:
            for range_name, (min_power, max_power) in power_ranges.items():
                if min_power <= shot.power <= max_power:
                    shot_distribution[range_name] += 1
                    break
        
        return {
            'total_shots': total_shots,
            'success_rate': successful_shots / total_shots if total_shots > 0 else 0,
            'average_power': avg_power,
            'average_spin': avg_spin,
            'average_english': avg_english,
            'shot_distribution': {
                name: count / total_shots 
                for name, count in shot_distribution.items()
            }
        } 