"""Game models module.

This module provides game-related models.
"""

from datetime import datetime, timedelta
from enum import Enum

from sqlalchemy import JSON, Index, case, func

from ...core.database import db
from ...core.exceptions import GameError
from ...extensions import cache
from ..game.validation import GameType as ValidGameType, GameValidator
from ..ml.game_predictor import GamePredictor
from .base import BaseModel


class GameStatus(Enum):
    """Game status enumeration."""

    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class GameType(Enum):
    """Game type enumeration."""

    EIGHT_BALL = "eight_ball"
    NINE_BALL = "nine_ball"
    TEN_BALL = "ten_ball"
    STRAIGHT_POOL = "straight_pool"
    ONE_POCKET = "one_pocket"
    BANK_POOL = "bank_pool"
    SNOOKER = "snooker"

    @property
    def validator_type(self):
        """Get the corresponding validator game type."""
        mapping = {
            self.EIGHT_BALL: ValidGameType.EIGHT_BALL,
            self.NINE_BALL: ValidGameType.NINE_BALL,
            self.TEN_BALL: ValidGameType.TEN_BALL,
            self.STRAIGHT_POOL: ValidGameType.STRAIGHT_POOL,
            self.ONE_POCKET: ValidGameType.ONE_POCKET,
            self.BANK_POOL: ValidGameType.BANK_POOL,
            self.SNOOKER: ValidGameType.SNOOKER,
        }
        return mapping.get(self)


class GameTypeModel(BaseModel):
    """Game type model."""

    __tablename__ = "game_types"
    __table_args__ = (
        Index("idx_game_types_name", "name"),
        Index("idx_game_types_active", "is_active"),
        {"extend_existing": True},
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
        return f"<GameType {self.name}>"

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


class GameMode(Enum):
    """Game mode enumeration."""

    CASUAL = "casual"
    RANKED = "ranked"
    TOURNAMENT = "tournament"
    PRACTICE = "practice"


class GameModeModel(BaseModel):
    """Game mode model."""

    __tablename__ = "game_modes"
    __table_args__ = (
        Index("idx_game_modes_name", "name"),
        Index("idx_game_modes_active", "is_active"),
        {"extend_existing": True},
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
        return f"<GameMode {self.name}>"

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


class CoreGameModel(BaseModel):
    """Core (non-SQLAlchemy) game model for business logic or Pydantic use."""
    # Add business logic or Pydantic fields here as needed.
    pass


class GamePlayer(BaseModel):
    """Game player model."""

    __tablename__ = "game_players"
    __table_args__ = (
        Index("idx_game_players_game", "game_id"),
        Index("idx_game_players_user", "user_id"),
        Index("idx_game_players_active", "is_active"),
        {"extend_existing": True},
    )

    # Basic fields
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    team = db.Column(db.Integer)  # Team number for team games
    position = db.Column(db.Integer)  # Player position/order

    # Player settings
    handicap = db.Column(db.Integer)  # Player's handicap for this game
    break_order = db.Column(db.Integer)  # Player's position in break rotation

    # Status
    is_active = db.Column(db.Boolean, default=True)  # For tracking substitutions
    substituted_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    substituted_at = db.Column(db.DateTime)

    # Metadata
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)

    # Relationships
    game = db.relationship("Game", back_populates="players")
    user = db.relationship("User", foreign_keys=[user_id])
    substitute = db.relationship("User", foreign_keys=[substituted_by])

    # Validation
    validator_class = GameValidator

    def __repr__(self):
        return f"<GamePlayer {self.game_id}:{self.user_id}>"

    def substitute(self, new_user_id, reason=None):
        """Substitute player.

        Args:
            new_user_id: New player's user ID
            reason: Optional reason for substitution

        Raises:
            GameError: If substitution is not allowed
        """
        if not self.is_active:
            raise GameError("Player is already substituted")

        if self.game.status != "active":
            raise GameError("Substitutions only allowed in active games")

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
            break_order=self.break_order,
        )
        db.session.add(new_player)
        db.session.commit()


class GameResult(BaseModel):
    """Game result model."""

    __tablename__ = "game_results"
    __table_args__ = (
        Index("idx_game_results_game", "game_id"),
        Index("idx_game_results_player", "player_id"),
        Index("idx_game_results_position", "position"),
        {"extend_existing": True},
    )

    # Basic fields
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Result details
    position = db.Column(db.Integer)  # Final position (1st, 2nd, etc.)
    score = db.Column(db.Integer)  # Player's final score
    stats = db.Column(db.JSON)  # Player-specific statistics

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)

    # Relationships
    game = db.relationship("Game", back_populates="results")
    player = db.relationship("User")

    # Validation
    validator_class = GameValidator

    def __repr__(self):
        return f"<GameResult {self.game_id}:{self.player_id}>"

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
        cache_key = f"player_stats:{player_id}:{game_type}:{timeframe}"

        # Try to get from cache first
        cached_stats = cache.get(cache_key)
        if cached_stats is not None:
            return cached_stats

        # Build base query with joins
        base_query = (
            db.session.query(
                func.count().label("total_games"),
                func.sum(case([(cls.position == 1, 1)], else_=0)).label("wins"),
            )
            .join(Game)
            .filter(cls.player_id == player_id)
        )

        # Add game type filter if provided
        if game_type:
            GameTypeModel.query.filter_by(name=game_type).first().id
            base_query = base_query.filter(Game.game_type == game_type)

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
            "total_games": result.total_games,
            "wins": result.wins,
            "losses": result.total_games - result.wins,
            "win_rate": (result.wins / result.total_games) * 100,
        }

        # Cache results for 5 minutes
        cache.set(cache_key, stats, timeout=300)

        return stats


class GameSession(BaseModel):
    """Game session model for tracking active game sessions."""

    __tablename__ = "game_sessions"
    __table_args__ = (
        Index("idx_game_sessions_game", "game_id"),
        Index("idx_game_sessions_status", "status"),
        Index("idx_game_sessions_venue", "venue_id"),
        Index("idx_game_sessions_start_time", "start_time"),
        {"extend_existing": True},
    )

    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    venue_id = db.Column(db.Integer, db.ForeignKey("venues.id"))
    status = db.Column(db.String(50), default="active")  # active, paused, completed
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    duration = db.Column(db.Integer)  # Duration in seconds
    session_data = db.Column(JSON, default={})

    # Analytics fields
    total_shots = db.Column(db.Integer, default=0)
    total_fouls = db.Column(db.Integer, default=0)
    total_breaks = db.Column(db.Integer, default=0)
    total_timeouts = db.Column(db.Integer, default=0)
    total_frames = db.Column(db.Integer, default=0)

    # Performance metrics
    avg_shot_time = db.Column(db.Float)
    avg_frame_time = db.Column(db.Float)
    avg_break_time = db.Column(db.Float)
    peak_concurrent_viewers = db.Column(db.Integer, default=0)

    # Network metrics
    connection_quality = db.Column(db.Float)  # 0-1 scale
    latency_stats = db.Column(JSON, default={})
    dropped_frames = db.Column(db.Integer, default=0)

    # Session events
    events = db.Column(JSON, default=[])

    # Relationships
    game = db.relationship("Game", backref=db.backref("session", uselist=False))
    venue = db.relationship("Venue", backref="sessions")

    def __repr__(self):
        return f"<GameSession {self.id} for Game {self.game_id}>"

    def end_session(self):
        """End the game session."""
        if self.status == "active":
            self.status = "completed"
            self.end_time = datetime.utcnow()
            self.duration = int((self.end_time - self.start_time).total_seconds())
            self._calculate_final_metrics()
            db.session.commit()

    def pause_session(self):
        """Pause the game session."""
        if self.status == "active":
            self.status = "paused"
            self._record_event(
                "pause",
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "duration": self.get_current_duration(),
                },
            )
            db.session.commit()

    def resume_session(self):
        """Resume the game session."""
        if self.status == "paused":
            self.status = "active"
            self._record_event(
                "resume",
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "total_pause_time": self.get_total_pause_time(),
                },
            )
            db.session.commit()

    def update_session_data(self, data):
        """Update session data.

        Args:
            data: New data to update/add
        """
        if not self.session_data:
            self.session_data = {}
        self.session_data.update(data)
        db.session.commit()

    def record_shot(self, shot_data):
        """Record a shot and update metrics.

        Args:
            shot_data: Shot details
        """
        self.total_shots += 1

        # Update shot time metrics
        shot_time = shot_data.get("duration", 0)
        if shot_time > 0:
            if not self.avg_shot_time:
                self.avg_shot_time = shot_time
            else:
                self.avg_shot_time = (
                    self.avg_shot_time * (self.total_shots - 1) + shot_time
                ) / self.total_shots

        self._record_event("shot", shot_data)
        db.session.commit()

    def record_break(self, break_data):
        """Record a break and update metrics.

        Args:
            break_data: Break details
        """
        self.total_breaks += 1

        # Update break time metrics
        break_time = break_data.get("duration", 0)
        if break_time > 0:
            if not self.avg_break_time:
                self.avg_break_time = break_time
            else:
                self.avg_break_time = (
                    self.avg_break_time * (self.total_breaks - 1) + break_time
                ) / self.total_breaks

        self._record_event("break", break_data)
        db.session.commit()

    def update_network_metrics(self, metrics):
        """Update network-related metrics.

        Args:
            metrics: Network metrics data
        """
        self.connection_quality = metrics.get("quality", self.connection_quality)

        if "latency" in metrics:
            if not self.latency_stats:
                self.latency_stats = {"min": 999999, "max": 0, "avg": 0, "samples": 0}

            latency = metrics["latency"]
            stats = self.latency_stats
            stats["min"] = min(stats["min"], latency)
            stats["max"] = max(stats["max"], latency)
            stats["avg"] = (stats["avg"] * stats["samples"] + latency) / (stats["samples"] + 1)
            stats["samples"] += 1

            self.latency_stats = stats

        if "dropped_frames" in metrics:
            self.dropped_frames += metrics["dropped_frames"]

        db.session.commit()

    def update_viewer_count(self, count):
        """Update concurrent viewer count.

        Args:
            count: Current viewer count
        """
        self.peak_concurrent_viewers = max(self.peak_concurrent_viewers, count)
        db.session.commit()

    def get_current_duration(self):
        """Get current session duration in seconds."""
        if self.end_time:
            return int((self.end_time - self.start_time).total_seconds())
        return int((datetime.utcnow() - self.start_time).total_seconds())

    def get_total_pause_time(self):
        """Calculate total pause time from events."""
        total_pause_time = 0
        pause_start = None

        for event in self.events:
            if event["type"] == "pause":
                pause_start = datetime.fromisoformat(event["data"]["timestamp"])
            elif event["type"] == "resume" and pause_start:
                resume_time = datetime.fromisoformat(event["data"]["timestamp"])
                total_pause_time += int((resume_time - pause_start).total_seconds())
                pause_start = None

        return total_pause_time

    def get_session_stats(self):
        """Get comprehensive session statistics."""
        return {
            "id": self.id,
            "game_id": self.game_id,
            "status": self.status,
            "duration": self.get_current_duration(),
            "total_pause_time": self.get_total_pause_time(),
            "metrics": {
                "shots": self.total_shots,
                "fouls": self.total_fouls,
                "breaks": self.total_breaks,
                "timeouts": self.total_timeouts,
                "frames": self.total_frames,
            },
            "performance": {
                "avg_shot_time": self.avg_shot_time,
                "avg_frame_time": self.avg_frame_time,
                "avg_break_time": self.avg_break_time,
            },
            "network": {
                "quality": self.connection_quality,
                "latency": self.latency_stats,
                "dropped_frames": self.dropped_frames,
            },
            "viewers": {"peak": self.peak_concurrent_viewers},
        }

    def _record_event(self, event_type, data):
        """Record a session event.

        Args:
            event_type: Type of event
            data: Event data
        """
        if not self.events:
            self.events = []

        self.events.append(
            {"type": event_type, "data": data, "timestamp": datetime.utcnow().isoformat()}
        )

    def _calculate_final_metrics(self):
        """Calculate final session metrics when ending session."""
        if not self.session_data:
            self.session_data = {}

        # Calculate active play time (excluding pauses)
        active_time = self.duration - self.get_total_pause_time()

        # Calculate averages
        if self.total_frames > 0:
            self.avg_frame_time = active_time / self.total_frames

        # Store final metrics
        self.session_data["final_metrics"] = {
            "active_play_time": active_time,
            "shots_per_frame": self.total_shots / max(1, self.total_frames),
            "fouls_per_frame": self.total_fouls / max(1, self.total_frames),
            "network_quality": {
                "average_quality": self.connection_quality,
                "latency_stats": self.latency_stats,
                "total_dropped_frames": self.dropped_frames,
            },
        }
