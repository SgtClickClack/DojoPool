"""Match model module.

This module contains the Match model for tracking matches between players.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.dialects.postgresql import JSONB
from .base import BaseModel, db

class Match(BaseModel):
    """Match model."""
    __tablename__ = 'matches'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    player1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    player2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'))
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'))
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(20), default='pending')
    score = db.Column(JSONB, default={})
    stats = db.Column(JSONB, default={})
    
    # Relationships
    player1 = db.relationship('User', foreign_keys=[player1_id], backref='matches_as_player1')
    player2 = db.relationship('User', foreign_keys=[player2_id], backref='matches_as_player2')
    winner = db.relationship('User', foreign_keys=[winner_id], backref='matches_won')
    tournament = db.relationship('Tournament', backref='matches')
    venue = db.relationship('Venue', backref='matches')
    
    def __init__(self, **kwargs):
        """Initialize match."""
        super(Match, self).__init__(**kwargs)
        self.start_time = datetime.utcnow()
        self.status = 'pending'
        self.score = {}
        self.stats = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert match to dictionary."""
        return {
            'id': self.id,
            'player1_id': self.player1_id,
            'player2_id': self.player2_id,
            'tournament_id': self.tournament_id,
            'venue_id': self.venue_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'winner_id': self.winner_id,
            'status': self.status,
            'score': self.score,
            'stats': self.stats
        }
    
    @classmethod
    def get_player_matches(
        cls,
        player_id: int,
        status: Optional[str] = None,
        time_range: Optional[Dict[str, datetime]] = None
    ) -> List['Match']:
        """Get all matches for a player."""
        query = cls.query.filter(
            db.or_(
                cls.player1_id == player_id,
                cls.player2_id == player_id
            )
        )
        
        if status:
            query = query.filter_by(status=status)
        
        if time_range:
            query = query.filter(
                cls.start_time >= time_range.get('start'),
                cls.start_time <= time_range.get('end')
            )
        
        return query.order_by(cls.start_time.desc()).all()
    
    @classmethod
    def get_tournament_matches(
        cls,
        tournament_id: int,
        status: Optional[str] = None
    ) -> List['Match']:
        """Get all matches for a tournament."""
        query = cls.query.filter_by(tournament_id=tournament_id)
        
        if status:
            query = query.filter_by(status=status)
        
        return query.order_by(cls.start_time.desc()).all()
    
    @classmethod
    def get_venue_matches(
        cls,
        venue_id: int,
        status: Optional[str] = None,
        time_range: Optional[Dict[str, datetime]] = None
    ) -> List['Match']:
        """Get all matches for a venue."""
        query = cls.query.filter_by(venue_id=venue_id)
        
        if status:
            query = query.filter_by(status=status)
        
        if time_range:
            query = query.filter(
                cls.start_time >= time_range.get('start'),
                cls.start_time <= time_range.get('end')
            )
        
        return query.order_by(cls.start_time.desc()).all()
    
    @classmethod
    def create_match(
        cls,
        player1_id: int,
        player2_id: int,
        tournament_id: Optional[int] = None,
        venue_id: Optional[int] = None
    ) -> 'Match':
        """Create a new match."""
        match = cls(
            player1_id=player1_id,
            player2_id=player2_id,
            tournament_id=tournament_id,
            venue_id=venue_id
        )
        db.session.add(match)
        db.session.commit()
        return match
    
    def update_score(self, score: Dict[str, int]) -> None:
        """Update the match score."""
        self.score = score
        db.session.commit()
    
    def update_stats(self, stats: Dict[str, Any]) -> None:
        """Update match statistics."""
        self.stats = stats
        db.session.commit()
    
    def end_match(self, winner_id: int) -> None:
        """End the match and set the winner."""
        self.winner_id = winner_id
        self.end_time = datetime.utcnow()
        self.status = 'completed'
        db.session.commit()
    
    def cancel_match(self) -> None:
        """Cancel the match."""
        self.status = 'cancelled'
        self.end_time = datetime.utcnow()
        db.session.commit()
    
    @classmethod
    def get_player_stats(
        cls,
        player_id: int,
        time_range: Optional[Dict[str, datetime]] = None
    ) -> Dict[str, Any]:
        """Get aggregated match statistics for a player."""
        matches = cls.get_player_matches(player_id, status='completed', time_range=time_range)
        
        if not matches:
            return {
                'total_matches': 0,
                'wins': 0,
                'losses': 0,
                'win_rate': 0
            }
        
        total_matches = len(matches)
        wins = sum(1 for match in matches if match.winner_id == player_id)
        
        return {
            'total_matches': total_matches,
            'wins': wins,
            'losses': total_matches - wins,
            'win_rate': wins / total_matches if total_matches > 0 else 0
        } 