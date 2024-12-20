"""Tournament model for pool tournaments."""
from datetime import datetime
from enum import Enum
from src.core.database import db
from src.core.mixins import TimestampMixin

class TournamentFormat(str, Enum):
    """Tournament format types."""
    SINGLE_ELIMINATION = 'single_elimination'
    DOUBLE_ELIMINATION = 'double_elimination'
    ROUND_ROBIN = 'round_robin'
    SWISS = 'swiss'

class TournamentStatus(str, Enum):
    """Tournament status types."""
    DRAFT = 'draft'
    REGISTRATION_OPEN = 'registration_open'
    REGISTRATION_CLOSED = 'registration_closed'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'

class TournamentMatch(TimestampMixin, db.Model):
    """Model for tournament matches."""
    
    __tablename__ = 'tournament_matches'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id', use_alter=True, name='fk_tournament_match_tournament_id'), nullable=False)
    round_number = db.Column(db.Integer, nullable=False)
    match_number = db.Column(db.Integer, nullable=False)
    player1_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_tournament_match_player1_id'))
    player2_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_tournament_match_player2_id'))
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_tournament_match_winner_id'))
    status = db.Column(db.String(50), default='pending')  # pending, in_progress, completed
    score = db.Column(db.JSON)  # Store match scores as JSON
    
    # Relationships
    tournament = db.relationship('Tournament', back_populates='tournament_matches')
    player1 = db.relationship('User', foreign_keys=[player1_id])
    player2 = db.relationship('User', foreign_keys=[player2_id])
    winner = db.relationship('User', foreign_keys=[winner_id])
    
    def __repr__(self):
        """String representation of the tournament match."""
        return f'<TournamentMatch tournament_id={self.tournament_id} round={self.round_number} match={self.match_number}>'
    
    def to_dict(self):
        """Convert tournament match to dictionary."""
        return {
            'id': self.id,
            'tournament_id': self.tournament_id,
            'round_number': self.round_number,
            'match_number': self.match_number,
            'player1_id': self.player1_id,
            'player2_id': self.player2_id,
            'winner_id': self.winner_id,
            'status': self.status,
            'score': self.score,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class TournamentParticipant(TimestampMixin, db.Model):
    """Model for tournament participants."""
    
    __tablename__ = 'tournament_participants'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id', use_alter=True, name='fk_tournament_participant_tournament_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_tournament_participant_user_id'), nullable=False)
    status = db.Column(db.String(50), default='registered')  # registered, checked_in, eliminated, etc.
    seed = db.Column(db.Integer)
    final_rank = db.Column(db.Integer)
    
    # Relationships
    tournament = db.relationship('Tournament', back_populates='participants')
    user = db.relationship('User', back_populates='tournament_participations')
    
    def __repr__(self):
        """String representation of the tournament participant."""
        return f'<TournamentParticipant tournament_id={self.tournament_id} user_id={self.user_id}>'
    
    def to_dict(self):
        """Convert tournament participant to dictionary."""
        return {
            'id': self.id,
            'tournament_id': self.tournament_id,
            'user_id': self.user_id,
            'status': self.status,
            'seed': self.seed,
            'final_rank': self.final_rank,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Tournament(TimestampMixin, db.Model):
    """Model for pool tournaments."""
    
    __tablename__ = 'tournaments'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id', use_alter=True, name='fk_tournament_venue_id'), nullable=False)
    organizer_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_tournament_organizer_id'), nullable=False)
    format = db.Column(db.String(50), default=TournamentFormat.SINGLE_ELIMINATION)
    status = db.Column(db.String(50), default=TournamentStatus.DRAFT)
    max_players = db.Column(db.Integer, nullable=False)
    entry_fee = db.Column(db.Float, default=0.0)
    prize_pool = db.Column(db.Float, default=0.0)
    
    # Tournament rules stored as JSON
    rules = db.Column(db.JSON)
    
    # Tournament statistics stored as JSON
    stats = db.Column(db.JSON)
    
    # Tournament schedule
    registration_start = db.Column(db.DateTime, nullable=False)
    registration_end = db.Column(db.DateTime, nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    
    # Relationships
    venue = db.relationship('Venue', back_populates='tournaments')
    organizer = db.relationship('User', foreign_keys=[organizer_id], back_populates='organized_tournaments')
    participants = db.relationship('TournamentParticipant', back_populates='tournament')
    regular_matches = db.relationship('Match', back_populates='tournament')
    tournament_matches = db.relationship('TournamentMatch', back_populates='tournament')
    games = db.relationship('Game', back_populates='tournament')
    
    def __repr__(self):
        """String representation of the tournament."""
        return f'<Tournament {self.name}>'
    
    def to_dict(self):
        """Convert tournament to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'venue_id': self.venue_id,
            'organizer_id': self.organizer_id,
            'format': self.format,
            'status': self.status,
            'max_players': self.max_players,
            'entry_fee': self.entry_fee,
            'prize_pool': self.prize_pool,
            'rules': self.rules,
            'stats': self.stats,
            'registration_start': self.registration_start.isoformat(),
            'registration_end': self.registration_end.isoformat(),
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @staticmethod
    def from_dict(data):
        """Create tournament from dictionary."""
        return Tournament(
            name=data.get('name'),
            description=data.get('description'),
            venue_id=data.get('venue_id'),
            organizer_id=data.get('organizer_id'),
            format=data.get('format', TournamentFormat.SINGLE_ELIMINATION),
            status=data.get('status', TournamentStatus.DRAFT),
            max_players=data.get('max_players'),
            entry_fee=data.get('entry_fee', 0.0),
            prize_pool=data.get('prize_pool', 0.0),
            rules=data.get('rules', {}),
            stats=data.get('stats', {}),
            registration_start=datetime.fromisoformat(data['registration_start']),
            registration_end=datetime.fromisoformat(data['registration_end']),
            start_date=datetime.fromisoformat(data['start_date']),
            end_date=datetime.fromisoformat(data['end_date'])
        )
    
    def start_registration(self):
        """Open tournament registration."""
        if self.status != TournamentStatus.DRAFT:
            raise ValueError("Tournament must be in draft status to start registration")
        self.status = TournamentStatus.REGISTRATION_OPEN
        db.session.commit()
    
    def close_registration(self):
        """Close tournament registration."""
        if self.status != TournamentStatus.REGISTRATION_OPEN:
            raise ValueError("Tournament must be in registration open status to close registration")
        self.status = TournamentStatus.REGISTRATION_CLOSED
        db.session.commit()
    
    def start(self):
        """Start the tournament."""
        if self.status != TournamentStatus.REGISTRATION_CLOSED:
            raise ValueError("Tournament must be in registration closed status to start")
        self.status = TournamentStatus.IN_PROGRESS
        db.session.commit()
    
    def complete(self):
        """Complete the tournament."""
        if self.status != TournamentStatus.IN_PROGRESS:
            raise ValueError("Tournament must be in progress to complete")
        self.status = TournamentStatus.COMPLETED
        db.session.commit()
    
    def cancel(self):
        """Cancel the tournament."""
        if self.status in [TournamentStatus.COMPLETED, TournamentStatus.CANCELLED]:
            raise ValueError("Cannot cancel completed or already cancelled tournament")
        self.status = TournamentStatus.CANCELLED
        db.session.commit()
    
    def update_stats(self, stats):
        """Update tournament statistics."""
        if not self.stats:
            self.stats = {}
        self.stats.update(stats)
        db.session.commit()
    
    def add_player(self, user):
        """Add a player to the tournament."""
        if self.status != TournamentStatus.REGISTRATION_OPEN:
            raise ValueError("Tournament registration is not open")
        if len(self.participants) >= self.max_players:
            raise ValueError("Tournament is full")
        participant = TournamentParticipant(tournament_id=self.id, user_id=user.id)
        db.session.add(participant)
        db.session.commit()
    
    def remove_player(self, user):
        """Remove a player from the tournament."""
        if self.status not in [TournamentStatus.REGISTRATION_OPEN, TournamentStatus.REGISTRATION_CLOSED]:
            raise ValueError("Cannot remove player after tournament has started")
        participant = TournamentParticipant.query.filter_by(tournament_id=self.id, user_id=user.id).first()
        if participant:
            db.session.delete(participant)
            db.session.commit()
    
    def is_full(self):
        """Check if tournament is full."""
        return len(self.participants) >= self.max_players
    
    def is_player_registered(self, user):
        """Check if a user is registered for the tournament."""
        return TournamentParticipant.query.filter_by(tournament_id=self.id, user_id=user.id).first() is not None