"""Game models module.

This module provides game-related models.
"""

from datetime import datetime, timedelta
from enum import Enum
from sqlalchemy import and_, or_, func, Index, case
from sqlalchemy.ext.hybrid import hybrid_property
from ...core.database import db
from ...extensions import cache
from ...core.validation import GameValidator
from ...core.exceptions import GameError
from .base import BaseModel

class GameStatus(str, Enum):
    """Game status enum."""
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    PAUSED = 'paused'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'

class GameType(str, Enum):
    """Game type enum."""
    EIGHT_BALL = 'eight_ball'
    NINE_BALL = 'nine_ball'
    TEN_BALL = 'ten_ball'
    STRAIGHT_POOL = 'straight_pool'
    ONE_POCKET = 'one_pocket'
    BANK_POOL = 'bank_pool'
    SNOOKER = 'snooker'

class GameTypeModel(BaseModel):
    """Game type model."""
    
    __tablename__ = 'game_types'
    __table_args__ = (
        Index('idx_game_types_name', 'name'),
        Index('idx_game_types_active', 'is_active'),
        {'extend_existing': True}
    )
    
    # Basic fields
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)  # 8-ball, 9-ball, etc.
    description = db.Column(db.Text)
    rules = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    
    # Configuration
    scoring_type = db.Column(db.String(50))  # points, frames, best_of
    default_format = db.Column(db.String(50))  # race_to, best_of, timed
    default_value = db.Column(db.Integer)  # e.g., race to 7, best of 3
    time_limit = db.Column(db.Integer)  # Time limit in minutes
    break_type = db.Column(db.String(50))  # alternating, winner, loser
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Validation
    validator_class = GameValidator
    
    def __repr__(self):
        return f'<GameType {self.name}>'
    
    def deactivate(self):
        """Deactivate game type."""
        self.is_active = False
        db.session.commit()
    
    def activate(self):
        """Activate game type."""
        self.is_active = True
        db.session.commit()
    
    def update_rules(self, rules):
        """Update game type rules.
        
        Args:
            rules: New rules text
        """
        self.rules = rules
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    @classmethod
    def get_active_types(cls):
        """Get all active game types.
        
        Returns:
            list: Active game types
        """
        return cls.query.filter_by(is_active=True).all()
    
    @classmethod
    def get_by_name(cls, name):
        """Get game type by name.
        
        Args:
            name: Game type name
            
        Returns:
            GameType: Found game type
        """
        return cls.query.filter_by(name=name).first()

class GameMode(BaseModel):
    """Game mode model."""
    
    __tablename__ = 'game_modes'
    __table_args__ = (
        Index('idx_game_modes_name', 'name'),
        Index('idx_game_modes_active', 'is_active'),
        {'extend_existing': True}
    )
    
    # Basic fields
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)  # singles, doubles, cutthroat
    description = db.Column(db.Text)
    min_players = db.Column(db.Integer, nullable=False)
    max_players = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Configuration
    team_size = db.Column(db.Integer)  # Players per team
    rotation_type = db.Column(db.String(50))  # fixed, rotating
    scoring_rules = db.Column(db.JSON)  # Special scoring rules
    handicap_allowed = db.Column(db.Boolean, default=True)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Validation
    validator_class = GameValidator
    
    def __repr__(self):
        return f'<GameMode {self.name}>'
    
    def deactivate(self):
        """Deactivate game mode."""
        self.is_active = False
        db.session.commit()
    
    def activate(self):
        """Activate game mode."""
        self.is_active = True
        db.session.commit()
    
    def update_scoring_rules(self, rules):
        """Update scoring rules.
        
        Args:
            rules: New scoring rules
        """
        self.scoring_rules = rules
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    @classmethod
    def get_active_modes(cls):
        """Get all active game modes.
        
        Returns:
            list: Active game modes
        """
        return cls.query.filter_by(is_active=True).all()
    
    def is_valid_player_count(self, count):
        """Check if player count is valid for this mode.
        
        Args:
            count: Number of players
            
        Returns:
            bool: True if valid
        """
        return self.min_players <= count <= self.max_players
    
    def get_team_count(self, player_count):
        """Get number of teams for player count.
        
        Args:
            player_count: Number of players
            
        Returns:
            int: Number of teams
        """
        if not self.team_size or not self.is_valid_player_count(player_count):
            return None
        return player_count // self.team_size

class Game(BaseModel):
    """Game model."""
    
    __tablename__ = 'games'
    __table_args__ = (
        Index('idx_games_status', 'status'),
        Index('idx_games_venue_status', 'venue_id', 'status'),
        Index('idx_games_type_status', 'type_id', 'status'),
        Index('idx_games_tournament', 'tournament_id'),
        Index('idx_games_dates', 'start_time', 'end_time'),
        Index('idx_games_type_mode_status', 'type_id', 'mode_id', 'status'),
        Index('idx_games_venue_dates', 'venue_id', 'start_time', 'end_time'),
        Index('idx_games_player_dates', 'id', 'start_time', 'end_time'),
        {'extend_existing': True}
    )
    
    # Basic fields
    id = db.Column(db.Integer, primary_key=True)
    type_id = db.Column(db.Integer, db.ForeignKey('game_types.id'), nullable=False)
    mode_id = db.Column(db.Integer, db.ForeignKey('game_modes.id'), nullable=False)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=False)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'))
    
    # Status and timing
    status = db.Column(db.Enum(GameStatus), default=GameStatus.PENDING)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    pause_time = db.Column(db.DateTime)
    total_pause_duration = db.Column(db.Integer, default=0)  # Total pause duration in seconds
    
    # Game settings
    table_number = db.Column(db.Integer)
    format = db.Column(db.String(50))  # race_to, best_of, timed
    format_value = db.Column(db.Integer)  # e.g., race to 7, best of 3
    time_limit = db.Column(db.Integer)  # Time limit in minutes
    break_type = db.Column(db.String(50))  # alternating, winner, loser
    handicap = db.Column(db.JSON)  # Handicap settings
    
    # Scoring and stats
    score = db.Column(db.JSON)  # Store game score data
    stats = db.Column(db.JSON)  # Store game statistics
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    winning_score = db.Column(db.String(50))
    
    # Metadata
    notes = db.Column(db.Text)  # Game notes/comments
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    type = db.relationship('GameTypeModel', backref=db.backref('games', lazy='dynamic'))
    mode = db.relationship('GameMode', backref=db.backref('games', lazy='dynamic'))
    venue = db.relationship('Venue', backref=db.backref('games', lazy='dynamic'))
    tournament = db.relationship('Tournament', backref=db.backref('games', lazy='dynamic'))
    winner = db.relationship('User', backref=db.backref('games_won', lazy='dynamic'))
    players = db.relationship('GamePlayer', back_populates='game')
    results = db.relationship('GameResult', back_populates='game')
    
    # Validation
    validator_class = GameValidator
    
    def __repr__(self):
        return f'<Game {self.id}:{self.type.name}>'
    
    @hybrid_property
    def duration(self):
        """Get game duration in minutes."""
        if not self.start_time or not self.end_time:
            return None
            
        total_duration = (self.end_time - self.start_time).total_seconds()
        return (total_duration - self.total_pause_duration) / 60
    
    @hybrid_property
    def is_tournament_game(self):
        """Check if game is part of a tournament."""
        return bool(self.tournament_id)
    
    @hybrid_property
    def player_count(self):
        """Get number of players."""
        return len(self.players)
    
    @hybrid_property
    def time_remaining(self):
        """Get remaining time in minutes."""
        if not self.time_limit or not self.start_time:
            return None
            
        if self.status == 'completed':
            return 0
            
        elapsed = (datetime.utcnow() - self.start_time).total_seconds()
        remaining = (self.time_limit * 60) - (elapsed - self.total_pause_duration)
        return max(0, remaining / 60)
    
    def start(self, table_number=None):
        """Start the game.
        
        Args:
            table_number: Optional table number
            
        Raises:
            GameError: If game cannot be started
        """
        if self.status != 'pending':
            raise GameError('Game can only be started from pending status')
            
        if not self.players:
            raise GameError('Game must have players to start')
            
        if not self.mode.is_valid_player_count(self.player_count):
            raise GameError(f'Invalid player count for mode {self.mode.name}')
            
        self.status = 'active'
        self.start_time = datetime.utcnow()
        if table_number:
            self.table_number = table_number
            
        # Initialize game settings from type if not set
        if not self.format:
            self.format = self.type.default_format
        if not self.format_value:
            self.format_value = self.type.default_value
        if not self.time_limit:
            self.time_limit = self.type.time_limit
        if not self.break_type:
            self.break_type = self.type.break_type
            
        db.session.commit()
    
    def pause(self):
        """Pause the game."""
        if self.status != 'active':
            raise GameError('Game can only be paused when active')
            
        self.status = 'paused'
        self.pause_time = datetime.utcnow()
        db.session.commit()
    
    def resume(self):
        """Resume the game."""
        if self.status != 'paused':
            raise GameError('Game can only be resumed from paused status')
            
        pause_duration = (datetime.utcnow() - self.pause_time).total_seconds()
        self.total_pause_duration += int(pause_duration)
        
        self.status = 'active'
        self.pause_time = None
        db.session.commit()
    
    def end(self, winner_id=None, score_data=None, stats_data=None):
        """End the game.
        
        Args:
            winner_id: Winner user ID
            score_data: Final score data
            stats_data: Final game statistics
            
        Raises:
            GameError: If game cannot be ended
        """
        if self.status not in ['active', 'paused']:
            raise GameError('Game can only be ended from active or paused status')
            
        # Handle pause duration if game was paused
        if self.status == 'paused':
            pause_duration = (datetime.utcnow() - self.pause_time).total_seconds()
            self.total_pause_duration += int(pause_duration)
            
        self.status = 'completed'
        self.end_time = datetime.utcnow()
        
        if winner_id:
            if winner_id not in [p.user_id for p in self.players]:
                raise GameError('Invalid winner ID')
            self.winner_id = winner_id
            
        if score_data:
            self.update_score(score_data)
        if stats_data:
            self.update_stats(stats_data)
            
        # Create game results
        for player in self.players:
            result = GameResult(
                game_id=self.id,
                player_id=player.user_id,
                position=1 if player.user_id == winner_id else 2,
                score=self.score.get(str(player.user_id)) if self.score else None
            )
            db.session.add(result)
            
        db.session.commit()
    
    def cancel(self, reason=None):
        """Cancel the game.
        
        Args:
            reason: Cancellation reason
            
        Raises:
            GameError: If game cannot be cancelled
        """
        if self.status in ['completed', 'cancelled']:
            raise GameError('Cannot cancel completed or already cancelled game')
            
        self.status = 'cancelled'
        if reason:
            self.notes = reason
        db.session.commit()
    
    def update_score(self, score_data):
        """Update game score.
        
        Args:
            score_data: Score data to update
            
        Raises:
            GameError: If score data is invalid
        """
        if not isinstance(score_data, dict):
            raise GameError('Score data must be a dictionary')
            
        # Validate player IDs in score data
        player_ids = {str(p.user_id) for p in self.players}
        if not all(pid in player_ids for pid in score_data.keys()):
            raise GameError('Score data contains invalid player IDs')
            
        self.score = score_data
        
        # Update winning score if game is completed
        if self.status == 'completed' and self.winner_id:
            self.winning_score = str(score_data.get(str(self.winner_id)))
            
        db.session.commit()
    
    def update_stats(self, stats_data):
        """Update game statistics.
        
        Args:
            stats_data: Statistics data to update
            
        Raises:
            GameError: If stats data is invalid
        """
        if not isinstance(stats_data, dict):
            raise GameError('Stats data must be a dictionary')
            
        if not self.stats:
            self.stats = {}
        self.stats.update(stats_data)
        db.session.commit()
    
    def add_player(self, user_id, team=None, position=None):
        """Add player to game.
        
        Args:
            user_id: User ID
            team: Optional team number
            position: Optional position number
            
        Raises:
            GameError: If player cannot be added
        """
        if self.status != 'pending':
            raise GameError('Players can only be added to pending games')
            
        if user_id in [p.user_id for p in self.players]:
            raise GameError('Player already in game')
            
        if not self.mode.is_valid_player_count(self.player_count + 1):
            raise GameError(f'Adding player would exceed max players for mode {self.mode.name}')
            
        player = GamePlayer(
            game_id=self.id,
            user_id=user_id,
            team=team,
            position=position or (self.player_count + 1)
        )
        db.session.add(player)
        db.session.commit()
    
    def remove_player(self, user_id):
        """Remove player from game.
        
        Args:
            user_id: User ID to remove
            
        Raises:
            GameError: If player cannot be removed
        """
        if self.status != 'pending':
            raise GameError('Players can only be removed from pending games')
            
        player = next((p for p in self.players if p.user_id == user_id), None)
        if not player:
            raise GameError('Player not in game')
            
        db.session.delete(player)
        db.session.commit()
    
    def add_note(self, note):
        """Add note to game.
        
        Args:
            note: Note to add
        """
        if self.notes:
            self.notes += f'\n{note}'
        else:
            self.notes = note
        db.session.commit()
    
    @classmethod
    def get_active_games(cls, venue_id=None):
        """Get all active games with optimized query.
        
        Args:
            venue_id: Optional venue filter
            
        Returns:
            list: Active games
        """
        query = cls.query.filter_by(status='active')
        if venue_id:
            query = query.filter_by(venue_id=venue_id)
        return query.options(
            db.joinedload(cls.type),
            db.joinedload(cls.mode),
            db.joinedload(cls.venue)
        ).all()
    
    @classmethod
    def get_player_games(cls, player_id, status=None, limit=None):
        """Get all games for a player with optimized query.
        
        Args:
            player_id: Player ID
            status: Optional status filter
            limit: Optional result limit
            
        Returns:
            list: Player's games
        """
        # Start with base query using player index
        base_query = cls.query.join(
            GamePlayer, 
            and_(
                GamePlayer.game_id == cls.id,
                GamePlayer.user_id == player_id
            )
        )
        
        # Add status filter if provided
        if status:
            base_query = base_query.filter(cls.status == status)
        
        # Add eager loading for commonly accessed relationships
        base_query = base_query.options(
            db.joinedload(cls.type),
            db.joinedload(cls.mode),
            db.joinedload(cls.venue),
            db.joinedload(cls.players).joinedload(GamePlayer.user),
            db.joinedload(cls.results).joinedload(GameResult.player)
        )
        
        # Order by start time using index
        base_query = base_query.order_by(cls.start_time.desc())
        
        # Apply limit if provided
        if limit:
            base_query = base_query.limit(limit)
            
        return base_query.all()
    
    @classmethod
    def get_venue_games(cls, venue_id, start_date=None, end_date=None):
        """Get games at venue with optimized query and caching.
        
        Args:
            venue_id: Venue ID
            start_date: Optional start date filter
            end_date: Optional end date filter
            
        Returns:
            list: Venue games
        """
        # Generate cache key
        cache_key = f'venue_games:{venue_id}:{start_date}:{end_date}'
        
        # Try to get from cache first
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
            
        # Build query using venue_dates index
        query = cls.query.filter_by(venue_id=venue_id)
        
        if start_date:
            query = query.filter(cls.start_time >= start_date)
        if end_date:
            query = query.filter(cls.start_time <= end_date)
            
        # Add eager loading for commonly accessed relationships
        query = query.options(
            db.joinedload(cls.type),
            db.joinedload(cls.mode),
            db.joinedload(cls.players).joinedload(GamePlayer.user),
            db.joinedload(cls.results)
        )
        
        # Execute query
        result = query.order_by(cls.start_time.desc()).all()
        
        # Cache result for 5 minutes
        cache.set(cache_key, result, timeout=300)
        
        return result
    
    @classmethod
    def search(cls, query=None, game_type=None, mode=None, status=None, venue_id=None):
        """Search games with optimized query building.
        
        Args:
            query: Search query
            game_type: Game type filter
            mode: Game mode filter 
            status: Status filter
            venue_id: Venue filter
            
        Returns:
            list: Matching games
        """
        # Start with base query using appropriate index
        if game_type and mode and status:
            base_query = cls.query.filter(and_(
                cls.type_id == GameTypeModel.query.filter_by(name=game_type).first().id,
                cls.mode_id == GameMode.query.filter_by(name=mode).first().id,
                cls.status == status
            ))
        elif venue_id:
            base_query = cls.query.filter(cls.venue_id == venue_id)
        else:
            base_query = cls.query
            
        # Add filters efficiently
        filters = []
        if status and not (game_type and mode):
            filters.append(cls.status == status)
        if venue_id and not base_query.whereclause:
            filters.append(cls.venue_id == venue_id)
            
        if game_type and not (game_type and mode and status):
            game_type_id = GameTypeModel.query.filter_by(name=game_type).first().id
            filters.append(cls.type_id == game_type_id)
        if mode and not (game_type and mode and status):
            mode_id = GameMode.query.filter_by(name=mode).first().id
            filters.append(cls.mode_id == mode_id)
            
        # Add player search if query exists
        if query:
            player_ids = db.session.query(User.id).filter(
                or_(
                    User.username.ilike(f'%{query}%'),
                    User.email.ilike(f'%{query}%')
                )
            ).subquery()
            
            filters.append(cls.id.in_(
                db.session.query(GamePlayer.game_id).filter(
                    GamePlayer.user_id.in_(player_ids)
                )
            ))
            
        # Apply filters and return optimized query
        return base_query.filter(*filters).options(
            db.joinedload(cls.type),
            db.joinedload(cls.mode),
            db.joinedload(cls.venue)
        ).order_by(cls.start_time.desc()).all()

class GamePlayer(BaseModel):
    """Game player model."""
    
    __tablename__ = 'game_players'
    __table_args__ = (
        Index('idx_game_players_game', 'game_id'),
        Index('idx_game_players_user', 'user_id'),
        Index('idx_game_players_active', 'is_active'),
        {'extend_existing': True}
    )
    
    # Basic fields
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    team = db.Column(db.Integer)  # Team number for team games
    position = db.Column(db.Integer)  # Player position/order
    
    # Player settings
    handicap = db.Column(db.Integer)  # Player's handicap for this game
    break_order = db.Column(db.Integer)  # Player's position in break rotation
    
    # Status
    is_active = db.Column(db.Boolean, default=True)  # For tracking substitutions
    substituted_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    substituted_at = db.Column(db.DateTime)
    
    # Metadata
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    
    # Relationships
    game = db.relationship('Game', back_populates='players')
    user = db.relationship('User', foreign_keys=[user_id])
    substitute = db.relationship('User', foreign_keys=[substituted_by])
    
    # Validation
    validator_class = GameValidator
    
    def __repr__(self):
        return f'<GamePlayer {self.game_id}:{self.user_id}>'
    
    def substitute(self, new_user_id, reason=None):
        """Substitute player.
        
        Args:
            new_user_id: New player's user ID
            reason: Optional reason for substitution
            
        Raises:
            GameError: If substitution is not allowed
        """
        if not self.is_active:
            raise GameError('Player is already substituted')
            
        if self.game.status != 'active':
            raise GameError('Substitutions only allowed in active games')
            
        self.is_active = False
        self.substituted_by = new_user_id
        self.substituted_at = datetime.utcnow()
        if reason:
            self.notes = reason
            
        # Add new player
        new_player = GamePlayer(
            game_id=self.game_id,
            user_id=new_user_id,
            team=self.team,
            position=self.position,
            handicap=self.handicap,
            break_order=self.break_order
        )
        db.session.add(new_player)
        db.session.commit()

class GameResult(BaseModel):
    """Game result model."""
    
    __tablename__ = 'game_results'
    __table_args__ = (
        Index('idx_game_results_game', 'game_id'),
        Index('idx_game_results_player', 'player_id'),
        Index('idx_game_results_position', 'position'),
        {'extend_existing': True}
    )
    
    # Basic fields
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Result details
    position = db.Column(db.Integer)  # Final position (1st, 2nd, etc.)
    score = db.Column(db.Integer)  # Player's final score
    stats = db.Column(db.JSON)  # Player-specific statistics
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    
    # Relationships
    game = db.relationship('Game', back_populates='results')
    player = db.relationship('User')
    
    # Validation
    validator_class = GameValidator
    
    def __repr__(self):
        return f'<GameResult {self.game_id}:{self.player_id}>'
    
    def update_stats(self, stats_data):
        """Update player statistics.
        
        Args:
            stats_data: Statistics to update
        """
        if not self.stats:
            self.stats = {}
        self.stats.update(stats_data)
        db.session.commit()
    
    @classmethod
    def get_player_stats(cls, player_id, game_type=None, timeframe=None):
        """Get player statistics with caching and optimized queries.
        
        Args:
            player_id: Player ID
            game_type: Optional game type filter
            timeframe: Optional timeframe in days
            
        Returns:
            dict: Player statistics
        """
        # Generate cache key
        cache_key = f'player_stats:{player_id}:{game_type}:{timeframe}'
        
        # Try to get from cache first
        cached_stats = cache.get(cache_key)
        if cached_stats is not None:
            return cached_stats
            
        # Build base query with joins
        base_query = db.session.query(
            func.count().label('total_games'),
            func.sum(case([(cls.position == 1, 1)], else_=0)).label('wins')
        ).join(Game).filter(cls.player_id == player_id)
        
        # Add game type filter if provided
        if game_type:
            game_type_id = GameTypeModel.query.filter_by(name=game_type).first().id
            base_query = base_query.filter(Game.type_id == game_type_id)
            
        # Add timeframe filter if provided
        if timeframe:
            since = datetime.utcnow() - timedelta(days=timeframe)
            base_query = base_query.filter(Game.start_time >= since)
            
        # Execute query and get results
        result = base_query.first()
        
        if not result or result.total_games == 0:
            return None
            
        # Calculate statistics
        stats = {
            'total_games': result.total_games,
            'wins': result.wins,
            'losses': result.total_games - result.wins,
            'win_rate': (result.wins / result.total_games) * 100
        }
        
        # Cache results for 5 minutes
        cache.set(cache_key, stats, timeout=300)
        
        return stats
