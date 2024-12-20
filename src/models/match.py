"""Match model for pool matches."""
from datetime import datetime
from src.core.database import db
from src.core.mixins import TimestampMixin

class Match(TimestampMixin, db.Model):
    """Model for pool matches."""
    
    __tablename__ = 'matches'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    player1_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_match_player1_id'), nullable=False)
    player2_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_match_player2_id'), nullable=False)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id', use_alter=True, name='fk_match_venue_id'), nullable=False)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id', use_alter=True, name='fk_match_tournament_id'))
    
    # Match details
    match_type = db.Column(db.String(50), default='standard')  # standard, tournament, challenge
    status = db.Column(db.String(20), default='scheduled')  # scheduled, active, completed, cancelled
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_match_winner_id'))
    
    # Match configuration stored as JSON
    config = db.Column(db.JSON)
    
    # Match statistics stored as JSON
    stats = db.Column(db.JSON)
    
    # Additional timestamps
    scheduled_time = db.Column(db.DateTime, nullable=False)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    player1 = db.relationship('User', foreign_keys=[player1_id], back_populates='matches_as_player1')
    player2 = db.relationship('User', foreign_keys=[player2_id], back_populates='matches_as_player2')
    winner = db.relationship('User', foreign_keys=[winner_id], back_populates='matches_won')
    venue = db.relationship('Venue', back_populates='matches')
    tournament = db.relationship('Tournament', back_populates='regular_matches')
    games = db.relationship('Game', back_populates='match')
    events = db.relationship('Event', back_populates='match', cascade='all, delete-orphan')
    shots = db.relationship('Shot', back_populates='match', cascade='all, delete-orphan')
    
    def __repr__(self):
        """String representation of the match."""
        return f'<Match {self.id} - {self.match_type}>'
    
    def to_dict(self):
        """Convert match to dictionary."""
        return {
            'id': self.id,
            'player1_id': self.player1_id,
            'player2_id': self.player2_id,
            'venue_id': self.venue_id,
            'tournament_id': self.tournament_id,
            'match_type': self.match_type,
            'status': self.status,
            'winner_id': self.winner_id,
            'config': self.config,
            'stats': self.stats,
            'scheduled_time': self.scheduled_time.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @staticmethod
    def from_dict(data):
        """Create match from dictionary."""
        return Match(
            player1_id=data.get('player1_id'),
            player2_id=data.get('player2_id'),
            venue_id=data.get('venue_id'),
            tournament_id=data.get('tournament_id'),
            match_type=data.get('match_type', 'standard'),
            status=data.get('status', 'scheduled'),
            winner_id=data.get('winner_id'),
            config=data.get('config', {}),
            stats=data.get('stats', {}),
            scheduled_time=datetime.fromisoformat(data['scheduled_time'])
        )
    
    def start(self):
        """Start the match."""
        if self.status != 'scheduled':
            raise ValueError("Match can only be started from scheduled status")
        self.status = 'active'
        self.started_at = datetime.utcnow()
        db.session.commit()
    
    def complete(self, winner_id):
        """Complete the match."""
        if self.status != 'active':
            raise ValueError("Match can only be completed from active status")
        self.status = 'completed'
        self.winner_id = winner_id
        self.completed_at = datetime.utcnow()
        db.session.commit()
    
    def cancel(self):
        """Cancel the match."""
        if self.status in ['completed', 'cancelled']:
            raise ValueError("Cannot cancel completed or already cancelled match")
        self.status = 'cancelled'
        db.session.commit()
    
    def update_stats(self, stats):
        """Update match statistics."""
        if not self.stats:
            self.stats = {}
        self.stats.update(stats)
        db.session.commit() 