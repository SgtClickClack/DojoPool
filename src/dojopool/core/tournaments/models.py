"""Tournament models module."""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship

from ..database import db
from ..models.base import BaseModel

class TournamentType(str, Enum):
    """Tournament type enum."""
    SINGLE_ELIMINATION = 'single_elimination'
    DOUBLE_ELIMINATION = 'double_elimination'
    ROUND_ROBIN = 'round_robin'
    SWISS = 'swiss'

class TournamentStatus(str, Enum):
    """Tournament status enum."""
    PENDING = 'pending'
    REGISTRATION_OPEN = 'registration_open'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'

class Tournament(BaseModel):
    """Tournament model."""
    
    __tablename__ = 'tournaments'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    organizer_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    venue_id = Column(Integer, ForeignKey('venues.id'), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    registration_deadline = Column(DateTime, nullable=False)
    check_in_start = Column(DateTime)
    check_in_end = Column(DateTime)
    max_participants = Column(Integer)
    min_participants = Column(Integer)
    entry_fee = Column(Float, default=0.0)
    total_prize_pool = Column(Float, default=0.0)
    status = Column(String(20), default=TournamentStatus.PENDING)
    tournament_type = Column(String(50), default=TournamentType.SINGLE_ELIMINATION)
    scoring_type = Column(String(50))  # points, elimination, etc.
    match_format = Column(String(50))  # best_of_3, single_game, etc.
    seeding_method = Column(String(50))  # random, ranking, manual
    rules = Column(Text)
    visibility = Column(String(20), default='public')  # public, private, invite_only
    featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organizer = relationship('User', foreign_keys=[organizer_id], backref='organized_tournaments')
    venue = relationship('Venue', backref='tournaments')
    participants = relationship('TournamentParticipant', backref='tournament')
    brackets = relationship('TournamentBracket', backref='tournament')
    prizes = relationship('TournamentPrize', backref='tournament')

class TournamentParticipant(BaseModel):
    """Tournament participant model."""
    
    __tablename__ = 'tournament_participants'
    
    id = Column(Integer, primary_key=True)
    tournament_id = Column(Integer, ForeignKey('tournaments.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    status = Column(String(20), default='registered')  # registered, checked_in, active, eliminated, winner
    seed = Column(Integer)
    payment_status = Column(String(20), default='pending')  # pending, paid, refunded
    check_in_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship('User', backref='tournament_participations')
    matches = relationship('TournamentMatchPlayer', backref='participant')

class TournamentBracket(BaseModel):
    """Tournament bracket model."""
    
    __tablename__ = 'tournament_brackets'
    
    id = Column(Integer, primary_key=True)
    tournament_id = Column(Integer, ForeignKey('tournaments.id'), nullable=False)
    name = Column(String(100), nullable=False)
    round_number = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    matches = relationship('TournamentMatch', backref='bracket')

class TournamentMatch(BaseModel):
    """Tournament match model."""
    
    __tablename__ = 'tournament_matches'
    
    id = Column(Integer, primary_key=True)
    bracket_id = Column(Integer, ForeignKey('tournament_brackets.id'), nullable=False)
    table_number = Column(Integer)
    status = Column(String(20), default='scheduled')  # scheduled, in_progress, completed
    winner_id = Column(Integer, ForeignKey('users.id'))
    score = Column(String(50))  # e.g., "2-1" for best of 3
    scheduled_time = Column(DateTime)
    actual_start_time = Column(DateTime)
    actual_end_time = Column(DateTime)
    next_match_id = Column(Integer, ForeignKey('tournament_matches.id'))
    
    # Relationships
    winner = relationship('User', foreign_keys=[winner_id])
    players = relationship('TournamentMatchPlayer', backref='match')
    next_match = relationship('TournamentMatch', remote_side=[id])

class TournamentMatchPlayer(BaseModel):
    """Tournament match player model."""
    
    __tablename__ = 'tournament_match_players'
    
    match_id = Column(Integer, ForeignKey('tournament_matches.id'), primary_key=True)
    participant_id = Column(Integer, ForeignKey('tournament_participants.id'), primary_key=True)
    position = Column(Integer, nullable=False)  # 1 for player 1, 2 for player 2
    score = Column(Integer)  # Individual score in the match
    notes = Column(Text)

class TournamentPrize(BaseModel):
    """Tournament prize model."""
    
    __tablename__ = 'tournament_prizes'
    
    id = Column(Integer, primary_key=True)
    tournament_id = Column(Integer, ForeignKey('tournaments.id'), nullable=False)
    position = Column(Integer, nullable=False)  # 1 for 1st place, 2 for 2nd place, etc.
    prize_amount = Column(Float, nullable=False)
    winner_id = Column(Integer, ForeignKey('users.id'))
    distribution_status = Column(String(20), default='pending')  # pending, distributed
    distributed_at = Column(DateTime)
    
    # Relationships
    winner = relationship('User', backref='tournament_prizes') 