"""Tournament model module."""
from datetime import datetime
from enum import Enum

from dojopool.core.extensions import db

class TournamentType(Enum):
    """Tournament type enumeration."""
    SINGLE_ELIMINATION = 'single_elimination'
    DOUBLE_ELIMINATION = 'double_elimination'
    ROUND_ROBIN = 'round_robin'
    SWISS = 'swiss'

class TournamentStatus(Enum):
    """Tournament status enumeration."""
    REGISTRATION_OPEN = 'registration_open'
    REGISTRATION_CLOSED = 'registration_closed'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'

class TournamentFormat(Enum):
    """Tournament format enumeration."""
    BRACKET = 'bracket'
    POOL = 'pool'
    GROUP = 'group'

class TournamentRoundType(Enum):
    """Tournament round type enumeration."""
    WINNERS = 'winners'
    LOSERS = 'losers'
    FINALS = 'finals'

class TournamentBracketType(Enum):
    """Tournament bracket type enumeration."""
    WINNERS = 'winners'
    LOSERS = 'losers'
    FINALS = 'finals'

class GameType(Enum):
    """Game type enumeration."""
    EIGHT_BALL = 'eight_ball'
    NINE_BALL = 'nine_ball'
    TEN_BALL = 'ten_ball'
    STRAIGHT_POOL = 'straight_pool'

class Tournament(db.Model):
    """Tournament model class."""

    __tablename__ = 'tournaments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    organizer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tournament_type = db.Column(db.Enum(TournamentType, name='tournament_type_enum'), nullable=False)
    game_type = db.Column(db.Enum(GameType, name='game_type_enum'), nullable=False)
    format = db.Column(db.Enum(TournamentFormat, name='tournament_format_enum'), nullable=False)
    status = db.Column(db.Enum(TournamentStatus, name='tournament_status_enum'), nullable=False,
                      default=TournamentStatus.REGISTRATION_OPEN)
    max_players = db.Column(db.Integer)
    entry_fee = db.Column(db.Float)
    prize_pool = db.Column(db.Float)
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                          onupdate=datetime.utcnow)
    
    # Relationships
    players = db.relationship('TournamentPlayer', backref='tournament',
                            cascade='all, delete-orphan')
    games = db.relationship('TournamentGame', backref='tournament',
                          cascade='all, delete-orphan')
    rounds = db.relationship('TournamentRound', backref='tournament',
                           cascade='all, delete-orphan')

    def __init__(self, name, organizer_id, tournament_type, game_type, format,
                 status=TournamentStatus.REGISTRATION_OPEN):
        """Initialize tournament."""
        self.name = name
        self.organizer_id = organizer_id
        self.tournament_type = tournament_type
        self.game_type = game_type
        self.format = format
        self.status = status

    def start_tournament(self):
        """Start the tournament."""
        if self.status == TournamentStatus.REGISTRATION_CLOSED:
            self.status = TournamentStatus.IN_PROGRESS
            self.start_date = datetime.utcnow()

    def complete_tournament(self):
        """Complete the tournament."""
        if self.status == TournamentStatus.IN_PROGRESS:
            self.status = TournamentStatus.COMPLETED
            self.end_date = datetime.utcnow()

    def cancel_tournament(self):
        """Cancel the tournament."""
        if self.status != TournamentStatus.COMPLETED:
            self.status = TournamentStatus.CANCELLED

    def __repr__(self):
        """Represent tournament as string."""
        return f'<Tournament {self.name}>'

class TournamentPlayer(db.Model):
    """Tournament player model class."""

    __tablename__ = 'tournament_players'

    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'),
                            nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    seed = db.Column(db.Integer)
    status = db.Column(db.String(20), default='active')  # active, eliminated, winner
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                          onupdate=datetime.utcnow)

    # Relationships
    player = db.relationship('User', backref='tournament_entries')

    def __repr__(self):
        """Represent tournament player as string."""
        return f'<TournamentPlayer {self.player_id} in Tournament {self.tournament_id}>'

class TournamentGame(db.Model):
    """Tournament game model class."""

    __tablename__ = 'tournament_games'

    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'),
                            nullable=False)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    round_number = db.Column(db.Integer)
    match_number = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                          onupdate=datetime.utcnow)

    def __repr__(self):
        """Represent tournament game as string."""
        return f'<TournamentGame {self.game_id} in Tournament {self.tournament_id}>'

class TournamentRound(db.Model):
    """Tournament round model class."""

    __tablename__ = 'tournament_rounds'

    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'),
                            nullable=False)
    round_number = db.Column(db.Integer, nullable=False)
    round_type = db.Column(db.Enum(TournamentRoundType, name='tournament_round_type_enum'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                          onupdate=datetime.utcnow)

    # Relationships
    brackets = db.relationship('TournamentBracket', backref='round',
                             cascade='all, delete-orphan')

    def __repr__(self):
        """Represent tournament round as string."""
        return f'<TournamentRound {self.round_number} in Tournament {self.tournament_id}>'

class TournamentBracket(db.Model):
    """Tournament bracket model class."""

    __tablename__ = 'tournament_brackets'

    id = db.Column(db.Integer, primary_key=True)
    tournament_round_id = db.Column(db.Integer, db.ForeignKey('tournament_rounds.id'),
                                  nullable=False)
    tournament_game_id = db.Column(db.Integer, db.ForeignKey('tournament_games.id'),
                                 nullable=False)
    bracket_type = db.Column(db.Enum(TournamentBracketType, name='tournament_bracket_type_enum'), nullable=False)
    position = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                          onupdate=datetime.utcnow)

    # Relationships
    game = db.relationship('TournamentGame')

    def __repr__(self):
        """Represent tournament bracket as string."""
        return f'<TournamentBracket {self.id} in Round {self.tournament_round_id}>'
