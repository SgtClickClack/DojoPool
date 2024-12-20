"""Game model for pool matches."""
from datetime import datetime
from src.core.database import db
from src.core.mixins import TimestampMixin
from .associations import game_players

class Game(TimestampMixin, db.Model):
    """Model for pool games."""
    
    __tablename__ = 'games'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    player1_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_game_player1_id'), nullable=False)
    player2_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_game_player2_id'), nullable=False)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id', use_alter=True, name='fk_game_venue_id'), nullable=False)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id', use_alter=True, name='fk_game_tournament_id'))
    match_id = db.Column(db.Integer, db.ForeignKey('matches.id', use_alter=True, name='fk_game_match_id'))
    
    # Game details
    game_type = db.Column(db.String(50), default='8-ball')  # 8-ball, 9-ball, etc.
    status = db.Column(db.String(20), default='pending')  # pending, active, completed, cancelled
    score1 = db.Column(db.Integer, default=0)
    score2 = db.Column(db.Integer, default=0)
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_game_winner_id'))
    
    # Game configuration stored as JSON
    config = db.Column(db.JSON)
    
    # Game statistics stored as JSON
    stats = db.Column(db.JSON)
    
    # Additional timestamps
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    player1 = db.relationship('User', foreign_keys=[player1_id], back_populates='games_as_player1')
    player2 = db.relationship('User', foreign_keys=[player2_id], back_populates='games_as_player2')
    winner = db.relationship('User', foreign_keys=[winner_id], back_populates='won_games')
    venue = db.relationship('Venue', back_populates='games')
    tournament = db.relationship('Tournament', back_populates='games')
    match = db.relationship('Match', back_populates='games')
    players = db.relationship('User', secondary=game_players, back_populates='games', lazy='dynamic')
    ratings = db.relationship('Rating', back_populates='last_game')
    
    def __repr__(self):
        """String representation of the game."""
        return f'<Game {self.id} - {self.game_type}>'
    
    def to_dict(self):
        """Convert game to dictionary."""
        return {
            'id': self.id,
            'player1_id': self.player1_id,
            'player2_id': self.player2_id,
            'venue_id': self.venue_id,
            'tournament_id': self.tournament_id,
            'match_id': self.match_id,
            'game_type': self.game_type,
            'status': self.status,
            'score1': self.score1,
            'score2': self.score2,
            'winner_id': self.winner_id,
            'config': self.config,
            'stats': self.stats,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
    
    @staticmethod
    def from_dict(data):
        """Create game from dictionary."""
        return Game(
            player1_id=data.get('player1_id'),
            player2_id=data.get('player2_id'),
            venue_id=data.get('venue_id'),
            tournament_id=data.get('tournament_id'),
            match_id=data.get('match_id'),
            game_type=data.get('game_type', '8-ball'),
            status=data.get('status', 'pending'),
            score1=data.get('score1', 0),
            score2=data.get('score2', 0),
            winner_id=data.get('winner_id'),
            config=data.get('config', {}),
            stats=data.get('stats', {})
        )
    
    def start(self):
        """Start the game."""
        if self.status != 'pending':
            raise ValueError("Game can only be started from pending status")
        self.status = 'active'
        self.started_at = datetime.utcnow()
        db.session.commit()
    
    def complete(self, winner_id, score1, score2):
        """Complete the game."""
        if self.status != 'active':
            raise ValueError("Game can only be completed from active status")
        self.status = 'completed'
        self.winner_id = winner_id
        self.score1 = score1
        self.score2 = score2
        self.completed_at = datetime.utcnow()
        db.session.commit()
    
    def cancel(self):
        """Cancel the game."""
        if self.status in ['completed', 'cancelled']:
            raise ValueError("Cannot cancel completed or already cancelled game")
        self.status = 'cancelled'
        db.session.commit()
    
    def update_stats(self, stats):
        """Update game statistics."""
        if not self.stats:
            self.stats = {}
        self.stats.update(stats)
        db.session.commit()