from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Enum, Float
from sqlalchemy.orm import relationship
from ..models import db

class Tournament(db.Model):
    __tablename__ = 'tournaments'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    organizer_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    venue_id = Column(Integer, ForeignKey('venues.id'), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    registration_deadline = Column(DateTime, nullable=False)
    max_participants = Column(Integer, nullable=False)
    entry_fee = Column(Float, default=0.0)
    total_prize_pool = Column(Float, default=0.0)
    status = Column(Enum('upcoming', 'registration_open', 'in_progress', 'completed', 'cancelled', name='tournament_status'), nullable=False)
    rules = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    organizer = relationship('User', back_populates='organized_tournaments')
    venue = relationship('Venue', back_populates='tournaments')
    participants = relationship('TournamentParticipant', back_populates='tournament')
    brackets = relationship('TournamentBracket', back_populates='tournament')
    prizes = relationship('TournamentPrize', back_populates='tournament')

class TournamentParticipant(db.Model):
    __tablename__ = 'tournament_participants'
    
    id = Column(Integer, primary_key=True)
    tournament_id = Column(Integer, ForeignKey('tournaments.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    registration_date = Column(DateTime, default=datetime.utcnow)
    seed = Column(Integer)
    status = Column(Enum('registered', 'checked_in', 'eliminated', 'active', 'winner', name='participant_status'), nullable=False)
    payment_status = Column(Enum('pending', 'paid', 'refunded', name='payment_status'), nullable=False)
    
    tournament = relationship('Tournament', back_populates='participants')
    user = relationship('User', back_populates='tournament_participations')
    matches = relationship('TournamentMatch', secondary='tournament_match_players')

class TournamentBracket(db.Model):
    __tablename__ = 'tournament_brackets'
    
    id = Column(Integer, primary_key=True)
    tournament_id = Column(Integer, ForeignKey('tournaments.id'), nullable=False)
    name = Column(String(100), nullable=False)  # e.g., "Winners", "Losers", "Finals"
    round_number = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=False)
    
    tournament = relationship('Tournament', back_populates='brackets')
    matches = relationship('TournamentMatch', back_populates='bracket')

class TournamentMatch(db.Model):
    __tablename__ = 'tournament_matches'
    
    id = Column(Integer, primary_key=True)
    bracket_id = Column(Integer, ForeignKey('tournament_brackets.id'), nullable=False)
    table_number = Column(Integer)
    scheduled_time = Column(DateTime)
    actual_start_time = Column(DateTime)
    actual_end_time = Column(DateTime)
    status = Column(Enum('scheduled', 'in_progress', 'completed', 'cancelled', name='match_status'), nullable=False)
    winner_id = Column(Integer, ForeignKey('users.id'))
    score = Column(String(50))  # e.g., "7-5"
    next_match_id = Column(Integer, ForeignKey('tournament_matches.id'))
    
    bracket = relationship('TournamentBracket', back_populates='matches')
    winner = relationship('User')
    next_match = relationship('TournamentMatch', remote_side=[id])
    players = relationship('TournamentParticipant', secondary='tournament_match_players')

class TournamentMatchPlayer(db.Model):
    __tablename__ = 'tournament_match_players'
    
    match_id = Column(Integer, ForeignKey('tournament_matches.id'), primary_key=True)
    participant_id = Column(Integer, ForeignKey('tournament_participants.id'), primary_key=True)
    position = Column(Integer, nullable=False)  # 1 or 2 for player positions

class TournamentPrize(db.Model):
    __tablename__ = 'tournament_prizes'
    
    id = Column(Integer, primary_key=True)
    tournament_id = Column(Integer, ForeignKey('tournaments.id'), nullable=False)
    position = Column(Integer, nullable=False)  # 1st place, 2nd place, etc.
    prize_amount = Column(Float, nullable=False)
    prize_description = Column(Text)
    winner_id = Column(Integer, ForeignKey('users.id'))
    distribution_status = Column(Enum('pending', 'distributed', 'claimed', name='prize_status'), nullable=False)
    distributed_at = Column(DateTime)
    
    tournament = relationship('Tournament', back_populates='prizes')
    winner = relationship('User') 