from datetime import datetime
from ..core.database import db
from ..core.mixins import TimestampMixin

class Rating(TimestampMixin, db.Model):
    """Model for user skill ratings."""
    
    __tablename__ = 'ratings'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # elo, glicko, trueskill, etc.
    value = db.Column(db.Float, nullable=False)
    uncertainty = db.Column(db.Float)  # For rating systems with uncertainty (e.g., Glicko-2)
    volatility = db.Column(db.Float)  # For rating systems with volatility
    games_played = db.Column(db.Integer, default=0)
    last_game_id = db.Column(db.Integer, db.ForeignKey('games.id'))
    
    # Additional rating data stored as JSON
    data = db.Column(db.JSON)
    
    # Relationships
    user = db.relationship('User', back_populates='ratings')
    last_game = db.relationship('Game', back_populates='ratings') 