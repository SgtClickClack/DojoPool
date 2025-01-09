"""Game model module."""
from datetime import datetime
from enum import Enum

from dojopool.core.extensions import db

class GameType(Enum):
    """Game type enumeration."""
    EIGHT_BALL = 'eight_ball'
    NINE_BALL = 'nine_ball'
    TEN_BALL = 'ten_ball'
    STRAIGHT_POOL = 'straight_pool'
    ONE_POCKET = 'one_pocket'
    BANK_POOL = 'bank_pool'

class GameMode(Enum):
    """Game mode enumeration."""
    CASUAL = 'casual'
    RANKED = 'ranked'
    TOURNAMENT = 'tournament'
    PRACTICE = 'practice'

class GameStatus(Enum):
    """Game status enumeration."""
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'

class Game(db.Model):
    """Game model class."""

    __tablename__ = 'games'

    id = db.Column(db.Integer, primary_key=True)
    player1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    player2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_type = db.Column(db.Enum(GameType), nullable=False)
    game_mode = db.Column(db.Enum(GameMode), nullable=False)
    status = db.Column(db.Enum(GameStatus), nullable=False, default=GameStatus.PENDING)
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    score = db.Column(db.String(50))  # Format: "player1_score-player2_score"
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                          onupdate=datetime.utcnow)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)

    # Relationships
    winner = db.relationship('User', foreign_keys=[winner_id])
    tournament_games = db.relationship('TournamentGame', backref='game',
                                     cascade='all, delete-orphan')

    def __init__(self, player1_id, player2_id, game_type, game_mode,
                 status=GameStatus.PENDING):
        """Initialize game."""
        self.player1_id = player1_id
        self.player2_id = player2_id
        self.game_type = game_type
        self.game_mode = game_mode
        self.status = status

    def start_game(self):
        """Start the game."""
        if self.status == GameStatus.PENDING:
            self.status = GameStatus.IN_PROGRESS
            self.started_at = datetime.utcnow()

    def complete_game(self, winner_id, score):
        """Complete the game."""
        if self.status == GameStatus.IN_PROGRESS:
            self.status = GameStatus.COMPLETED
            self.winner_id = winner_id
            self.score = score
            self.completed_at = datetime.utcnow()

    def cancel_game(self):
        """Cancel the game."""
        if self.status != GameStatus.COMPLETED:
            self.status = GameStatus.CANCELLED

    def __repr__(self):
        """Represent game as string."""
        return f'<Game {self.id}: {self.player1_id} vs {self.player2_id}>'