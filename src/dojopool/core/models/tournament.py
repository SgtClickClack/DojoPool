"""Tournament model module."""

from datetime import datetime
from enum import Enum

from ..extensions import db
from .base import BaseModel


class TournamentType(Enum):
    """Tournament type enumeration."""

    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS = "swiss"


class TournamentStatus(Enum):
    """Tournament status enumeration."""

    REGISTRATION_OPEN = "registration_open"
    REGISTRATION_CLOSED = "registration_closed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TournamentFormat(Enum):
    """Tournament format enumeration."""

    BRACKET = "bracket"
    POOL = "pool"
    GROUP = "group"


class TournamentRoundType(Enum):
    """Tournament round type enumeration."""

    WINNERS = "winners"
    LOSERS = "losers"
    FINALS = "finals"


class TournamentBracketType(Enum):
    """Tournament bracket type enumeration."""

    WINNERS = "winners"
    LOSERS = "losers"
    FINALS = "finals"


class GameType(Enum):
    """Game type enumeration."""

    EIGHT_BALL = "eight_ball"
    NINE_BALL = "nine_ball"
    TEN_BALL = "ten_ball"
    STRAIGHT_POOL = "straight_pool"


class Tournament(BaseModel):
    """Tournament model."""

    __tablename__ = "tournaments"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    venue_id = db.Column(db.Integer, db.ForeignKey("venues.id"))
    status = db.Column(db.String(20), default="pending")  # pending, active, completed, cancelled
    format = db.Column(db.String(50))  # single elimination, double elimination, round robin
    max_players = db.Column(db.Integer)
    entry_fee = db.Column(db.Float)
    prize_pool = db.Column(db.Float)
    rules = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    venue = db.relationship("Venue", backref=db.backref("tournaments", lazy="dynamic"))
    players = db.relationship("TournamentPlayer", back_populates="tournament")
    matches = db.relationship("TournamentGame", back_populates="tournament")
    participants = db.relationship(
        "User",
        secondary="tournament_participants",
        lazy="dynamic",
        backref=db.backref("tournaments", lazy="dynamic"),
    )

    def __init__(
        self,
        name,
        organizer_id,
        tournament_type,
        game_type,
        format,
        status=TournamentStatus.REGISTRATION_OPEN,
    ):
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
        return f"<Tournament {self.name}>"


class TournamentPlayer(BaseModel):
    """Tournament player model class."""

    __tablename__ = "tournament_players"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey("tournaments.id"), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    seed = db.Column(db.Integer)
    status = db.Column(db.String(20), default="active")  # active, eliminated, winner
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    player = db.relationship("User", backref="tournament_entries")
    tournament = db.relationship("Tournament", back_populates="players")

    def __repr__(self):
        """Represent tournament player as string."""
        return f"<TournamentPlayer {self.player_id} in Tournament {self.tournament_id}>"


class TournamentGame(BaseModel):
    """Tournament game model class."""

    __tablename__ = "tournament_games"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey("tournaments.id"), nullable=False)
    game_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    round_number = db.Column(db.Integer)
    match_number = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tournament = db.relationship("Tournament", back_populates="matches")
    game = db.relationship("Game", backref="tournament_games")

    def __repr__(self):
        """Represent tournament game as string."""
        return f"<TournamentGame {self.game_id} in Tournament {self.tournament_id}>"


class TournamentRound(BaseModel):
    """Tournament round model class."""

    __tablename__ = "tournament_rounds"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey("tournaments.id"), nullable=False)
    round_number = db.Column(db.Integer, nullable=False)
    round_type = db.Column(
        db.Enum(TournamentRoundType, name="tournament_round_type_enum"), nullable=False
    )
    status = db.Column(db.String(20), default="pending")  # pending, in_progress, completed
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tournament = db.relationship("Tournament", backref="rounds")
    brackets = db.relationship("TournamentBracket", backref="round", cascade="all, delete-orphan")

    def __repr__(self):
        """Represent tournament round as string."""
        return f"<TournamentRound {self.round_number} in Tournament {self.tournament_id}>"


class TournamentBracket(BaseModel):
    """Tournament bracket model class."""

    __tablename__ = "tournament_brackets"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    tournament_round_id = db.Column(
        db.Integer, db.ForeignKey("tournament_rounds.id"), nullable=False
    )
    tournament_game_id = db.Column(db.Integer, db.ForeignKey("tournament_games.id"), nullable=False)
    bracket_type = db.Column(
        db.Enum(TournamentBracketType, name="tournament_bracket_type_enum"), nullable=False
    )
    position = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    game = db.relationship("TournamentGame")

    def __repr__(self):
        """Represent tournament bracket as string."""
        return f"<TournamentBracket {self.id} in Round {self.tournament_round_id}>"
