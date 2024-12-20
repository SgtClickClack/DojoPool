"""Shot model for tracking pool shots."""
from datetime import datetime
from src.core.database import db
from src.core.mixins import TimestampMixin

class Shot(TimestampMixin, db.Model):
    """Model for tracking pool shots."""
    
    __tablename__ = 'shots'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey('matches.id', use_alter=True, name='fk_shot_match_id'), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_shot_player_id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # break, cut, bank, safety, etc.
    success = db.Column(db.Boolean, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    data = db.Column(db.JSON)  # Additional shot-specific data
    
    # Relationships
    match = db.relationship('Match', back_populates='shots')
    player = db.relationship('User', back_populates='shots')
    
    def __repr__(self):
        """String representation of the shot."""
        return f'<Shot {self.id} - {self.type}>'
    
    def to_dict(self):
        """Convert shot to dictionary."""
        return {
            'id': self.id,
            'match_id': self.match_id,
            'player_id': self.player_id,
            'type': self.type,
            'success': self.success,
            'timestamp': self.timestamp.isoformat(),
            'data': self.data,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @staticmethod
    def from_dict(data):
        """Create shot from dictionary."""
        return Shot(
            match_id=data.get('match_id'),
            player_id=data.get('player_id'),
            type=data.get('type'),
            success=data.get('success'),
            timestamp=datetime.fromisoformat(data['timestamp']) if data.get('timestamp') else datetime.utcnow(),
            data=data.get('data', {})
        ) 