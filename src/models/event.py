"""Event model for tracking match events."""
from datetime import datetime
from src.core.database import db
from src.core.mixins import TimestampMixin

class Event(TimestampMixin, db.Model):
    """Model for tracking match events."""
    
    __tablename__ = 'events'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey('matches.id', use_alter=True, name='fk_event_match_id'), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_event_player_id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # shot, foul, timeout, etc.
    description = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    data = db.Column(db.JSON)  # Additional event-specific data
    
    # Analysis fields
    decision_rating = db.Column(db.Float)  # AI-generated rating of the decision
    pressure_level = db.Column(db.Float)  # Calculated pressure level at the time
    outcome = db.Column(db.String(20))  # success, failure, neutral
    
    # Relationships
    match = db.relationship('Match', back_populates='events')
    player = db.relationship('User', back_populates='events')
    
    def __repr__(self):
        """String representation of the event."""
        return f'<Event {self.id} - {self.type}>'
    
    def to_dict(self):
        """Convert event to dictionary."""
        return {
            'id': self.id,
            'match_id': self.match_id,
            'player_id': self.player_id,
            'type': self.type,
            'description': self.description,
            'timestamp': self.timestamp.isoformat(),
            'data': self.data,
            'decision_rating': self.decision_rating,
            'pressure_level': self.pressure_level,
            'outcome': self.outcome,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @staticmethod
    def from_dict(data):
        """Create event from dictionary."""
        return Event(
            match_id=data.get('match_id'),
            player_id=data.get('player_id'),
            type=data.get('type'),
            description=data.get('description'),
            timestamp=datetime.fromisoformat(data['timestamp']) if data.get('timestamp') else datetime.utcnow(),
            data=data.get('data', {}),
            decision_rating=data.get('decision_rating'),
            pressure_level=data.get('pressure_level'),
            outcome=data.get('outcome')
        ) 