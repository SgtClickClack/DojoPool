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


class Game(BaseModel):
    """Game model."""

    __tablename__ = "games"
    __table_args__ = (
        Index("idx_games_status", "status"),
        Index("idx_games_type", "game_type"),
        Index("idx_games_venue", "venue_id"),
        Index("idx_games_tournament", "tournament_id"),
        {"extend_existing": True},
    )

    # Basic fields
    id = db.Column(db.Integer, primary_key=True)
    game_type = db.Column(db.Enum(GameType), nullable=False)
    status = db.Column(db.Enum(GameStatus), default=GameStatus.PENDING)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)

    # Player fields
    player1_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    player2_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    winner_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    current_player_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    # Game state
    score = db.Column(JSON, default={})
    stats = db.Column(JSON, default={})
    game_state = db.Column(JSON, default={})

    # Venue and tournament fields
    venue_id = db.Column(db.Integer, db.ForeignKey("venues.id"))
    tournament_id = db.Column(db.Integer, db.ForeignKey("tournaments.id"))

    # Real-time monitoring fields
    last_action_time = db.Column(db.DateTime)
    last_action_type = db.Column(db.String(50))
    monitoring_data = db.Column(JSON, default={})
    frame_data = db.Column(JSON, default={})
    shot_history = db.Column(JSON, default=[])

    # Performance metrics
    avg_shot_time = db.Column(db.Float)
    avg_turn_time = db.Column(db.Float)
    total_game_time = db.Column(db.Integer)  # in seconds

    # Relationships
    player1 = db.relationship("User", foreign_keys=[player1_id])
    player2 = db.relationship("User", foreign_keys=[player2_id])
    winner = db.relationship("User", foreign_keys=[winner_id])
    current_player = db.relationship("User", foreign_keys=[current_player_id])

    def __init__(self, *args, **kwargs):
        """Initialize game model."""
        super().__init__(*args, **kwargs)
        self._validator = None
        self._predictor = None
        self.monitoring_data = {"shots": [], "fouls": [], "score_changes": []}
        self.shot_history = []
        self.frame_data = {}
        self.game_state = {}

        # Performance metrics
        self.avg_shot_time = None
        self.avg_turn_time = None
        self.total_game_time = 0

    @property
    def validator(self):
        """Get game validator."""
        if self._validator is None and self.game_type:
            validator_type = self.game_type.validator_type
            if validator_type:
                self._validator = GameValidator(validator_type)
        return self._validator

    @property
    def predictor(self):
        """Get game predictor."""
        if self._predictor is None:
            self._predictor = GamePredictor()
        return self._predictor

    def process_shot(self, shot_data):
        """Process a shot and update game state.

        Args:
            shot_data: Shot details including power, angle, spin, etc.

        Returns:
            ValidationResult: Shot validation result

        Raises:
            GameError: If shot is invalid or game state doesn't allow it
        """
        # Ensure game is active
        if self.status != GameStatus.ACTIVE:
            raise GameError("Game is not active")

        # Validate shot through game validator
        validation_result = self.validator.validate_shot(self.game_state, shot_data)
        if not validation_result.valid:
            raise GameError(validation_result.message)

        # Update shot history with detailed metrics
        shot_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "player_id": shot_data["player_id"],
            "shot_type": shot_data.get("type", "standard"),
            "power": shot_data.get("power"),
            "angle": shot_data.get("angle"),
            "spin": shot_data.get("spin"),
            "english": shot_data.get("english"),
            "elevation": shot_data.get("elevation"),
            "target_ball": shot_data.get("target_ball"),
            "called_pocket": shot_data.get("called_pocket"),
            "result": None,  # Will be updated after shot completion
        }

        # Add analytics data
        shot_record.update(
            {
                "frame_number": len(self.shot_history) // 2 + 1,  # Assuming 2 shots per frame
                "shot_number": len(self.shot_history) + 1,
                "player_stats": self._get_player_shot_stats(shot_data["player_id"]),
                "game_situation": self._get_game_situation(),
            }
        )

        self.shot_history.append(shot_record)

        # Update monitoring data with validation details
        self.monitoring_data["shots"].append(
            {
                "timestamp": datetime.utcnow().isoformat(),
                "data": shot_data,
                "validation": {
                    "valid": validation_result.valid,
                    "message": validation_result.message,
                    "details": validation_result.data,
                },
                "game_state": self._get_game_state_snapshot(),
            }
        )

        # Update performance metrics
        self._update_shot_metrics(shot_data)

        # Update game state
        self.last_action_time = datetime.utcnow()
        self.last_action_type = "shot"

        # Update session if exists
        if hasattr(self, "session") and self.session:
            self.session.record_shot(shot_record)

        db.session.commit()

        return validation_result

    def _get_player_shot_stats(self, player_id):
        """Get player's shot statistics for the current game.

        Args:
            player_id: Player ID

        Returns:
            dict: Player shot statistics
        """
        player_shots = [s for s in self.shot_history if s["player_id"] == player_id]
        total_shots = len(player_shots)

        if total_shots == 0:
            return {"total_shots": 0, "avg_power": 0, "avg_shot_time": 0, "success_rate": 0}

        # Calculate averages
        avg_power = sum(s["power"] for s in player_shots if s.get("power")) / total_shots

        # Calculate shot timing
        shot_times = []
        for i in range(1, len(player_shots)):
            if player_shots[i - 1]["timestamp"] and player_shots[i]["timestamp"]:
                prev_time = datetime.fromisoformat(player_shots[i - 1]["timestamp"])
                curr_time = datetime.fromisoformat(player_shots[i]["timestamp"])
                shot_times.append((curr_time - prev_time).total_seconds())

        avg_shot_time = sum(shot_times) / len(shot_times) if shot_times else 0

        # Calculate success rate
        successful_shots = len([s for s in player_shots if s.get("result") == "success"])
        success_rate = (successful_shots / total_shots) * 100 if total_shots > 0 else 0

        return {
            "total_shots": total_shots,
            "avg_power": avg_power,
            "avg_shot_time": avg_shot_time,
            "success_rate": success_rate,
        }

    def _get_game_situation(self):
        """Get current game situation details.

        Returns:
            dict: Game situation details
        """
        return {
            "frame_number": len(self.shot_history) // 2 + 1,
            "remaining_balls": self.game_state.get("remaining_balls", []),
            "score": self.score,
            "current_player": self.current_player_id,
            "phase": self.game_state.get("phase", "open"),
            "special_conditions": self._get_special_conditions(),
        }

    def _get_special_conditions(self):
        """Get any special conditions in effect.

        Returns:
            list: Special conditions
        """
        conditions = []

        if self.game_type == GameType.EIGHT_BALL:
            if 8 in self.game_state.get("remaining_balls", []):
                if self._can_shoot_eight(self.current_player_id):
                    conditions.append("eight_ball_available")
        elif self.game_type == GameType.NINE_BALL:
            if 9 in self.game_state.get("remaining_balls", []):
                if len(self.game_state.get("remaining_balls", [])) == 1:
                    conditions.append("nine_ball_only")

        return conditions

    def _get_game_state_snapshot(self):
        """Get a snapshot of current game state.

        Returns:
            dict: Game state snapshot
        """
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "frame_number": len(self.shot_history) // 2 + 1,
            "shot_number": len(self.shot_history) + 1,
            "score": self.score,
            "current_player": self.current_player_id,
            "remaining_balls": self.game_state.get("remaining_balls", []),
            "phase": self.game_state.get("phase", "open"),
            "special_conditions": self._get_special_conditions(),
            "last_action": self.game_state.get("last_action"),
            "player_groups": self.game_state.get("player_groups", {}),
            "called_shots": self.game_state.get("called_shots", []),
        }

    def process_frame_update(self, frame_data):
        """Process real-time frame update."""
        self.frame_data = {
            "ball_positions": frame_data.get("balls", {}),
            "player_positions": frame_data.get("players", {}),
            "table_state": frame_data.get("table", {}),
            "timestamp": datetime.utcnow().isoformat(),
        }
        db.session.commit()

    def _update_shot_metrics(self, shot_data):
        """Update shot-related performance metrics."""
        now = datetime.utcnow()

        # Update average shot time
        if self.last_action_time and self.last_action_type == "shot":
            shot_time = (now - self.last_action_time).total_seconds()
            if not self.avg_shot_time:
                self.avg_shot_time = shot_time
            else:
                self.avg_shot_time = (self.avg_shot_time + shot_time) / 2

        # Update total game time
        if self.start_time:
            self.total_game_time = int((now - self.start_time).total_seconds())

        # Update turn time if player changed
        if shot_data.get("player_id") != self.current_player_id:
            if self.last_action_time:
                turn_time = (now - self.last_action_time).total_seconds()
                if not self.avg_turn_time:
                    self.avg_turn_time = turn_time
                else:
                    self.avg_turn_time = (self.avg_turn_time + turn_time) / 2

    def get_real_time_stats(self):
        """Get real-time game statistics."""
        return {
            "game_id": self.id,
            "status": self.status.value,
            "current_frame": self.frame_data,
            "performance_metrics": {
                "avg_shot_time": self.avg_shot_time,
                "avg_turn_time": self.avg_turn_time,
                "total_game_time": self.total_game_time,
            },
            "shot_history": self.shot_history[-10:],  # Last 10 shots
            "monitoring_data": {
                "shots": self.monitoring_data["shots"][-5:],  # Last 5 shots
                "fouls": self.monitoring_data["fouls"][-5:],  # Last 5 fouls
                "score_changes": self.monitoring_data["score_changes"][-5:],  # Last 5 score changes
            },
        }

    def process_ball_pocketed(self, pocket_data):
        """Process a ball being pocketed."""
        if not self.validator:
            return {"success": False, "message": "Game type not supported"}

        # Validate pocket
        validation = self.validator.validate_pocket(self.game_state, pocket_data)
        if not validation.valid:
            return {"success": False, "message": validation.message}

        # Update game state
        ball_number = pocket_data["ball_number"]
        self.game_state.setdefault("pocketed_balls", []).append(ball_number)
        if "remaining_balls" in self.game_state:
            self.game_state["remaining_balls"].remove(ball_number)

        self.game_state["last_action"] = {
            "type": "pocket",
            "data": pocket_data,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Update score
        player_id = str(pocket_data["player_id"])
        self.score.setdefault(player_id, 0)
        self.score[player_id] += 1

        db.session.commit()
        return {"success": True, "data": pocket_data}

    def process_foul(self, foul_data):
        """Process a foul."""
        if not self.validator:
            return {"success": False, "message": "Game type not supported"}

        # Validate foul
        validation = self.validator.validate_foul(self.game_state, foul_data)
        if not validation.valid:
            return {"success": False, "message": validation.message}

        # Update game state
        self.game_state.setdefault("fouls", []).append(foul_data)
        self.game_state["last_action"] = {
            "type": "foul",
            "data": foul_data,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Update stats
        player_id = str(foul_data["player_id"])
        self.stats.setdefault(player_id, {}).setdefault("fouls", 0)
        self.stats[player_id]["fouls"] += 1

        db.session.commit()
        return {"success": True, "data": foul_data}

    def is_game_over(self):
        """Check if the game is over."""
        if not self.game_state.get("remaining_balls"):
            return True

        if self.game_type == GameType.EIGHT_BALL:
            # Check if 8-ball is pocketed
            return 8 in self.game_state.get("pocketed_balls", [])
        elif self.game_type == GameType.NINE_BALL:
            # Check if 9-ball is pocketed
            return 9 in self.game_state.get("pocketed_balls", [])

        return False

    def get_advanced_analytics(self) -> dict:
        """Get comprehensive game analytics.

        Returns:
            dict: Detailed game analytics
        """
        # Get basic analytics
        analytics = {
            "game_summary": self._get_game_summary(),
            "shot_patterns": self.analyze_game_patterns(),
            "player_performance": self._get_player_performance(),
            "game_flow": self._get_game_flow(),
            "predictive_insights": self._get_predictive_insights(),
        }

        # Add ML-based insights
        if len(self.shot_history) > 0:
            analytics.update(
                {
                    "ml_insights": {
                        "pattern_analysis": self.analyze_game_patterns(),
                        "next_shot_recommendation": self.get_shot_recommendation(),
                        "position_recommendation": self.get_position_recommendation(),
                    }
                }
            )

        return analytics

    def _get_game_summary(self):
        """Get game summary statistics."""
        total_time = self.total_game_time or 0
        active_time = total_time - (self.session.get_total_pause_time() if self.session else 0)

        return {
            "duration": {
                "total": total_time,
                "active": active_time,
                "avg_shot_time": self.avg_shot_time,
                "avg_turn_time": self.avg_turn_time,
            },
            "shots": {
                "total": len(self.shot_history),
                "successful": len([s for s in self.shot_history if s.get("result") == "success"]),
                "fouls": len(self.monitoring_data["fouls"]),
                "avg_power": sum(s.get("power", 0) for s in self.shot_history)
                / max(1, len(self.shot_history)),
            },
            "score": self.score,
            "winner": self.winner_id,
            "game_type": self.game_type.value,
            "status": self.status.value,
            "performance_metrics": {
                "shot_success_rate": self._calculate_shot_success_rate(),
                "position_accuracy": self._calculate_position_accuracy(),
                "critical_shot_success": self._calculate_critical_shot_success(),
            },
        }

    def _calculate_shot_success_rate(self):
        """Calculate overall shot success rate."""
        total_shots = len(self.shot_history)
        if total_shots == 0:
            return 0
        successful_shots = len([s for s in self.shot_history if s.get("result") == "success"])
        return (successful_shots / total_shots) * 100

    def _calculate_position_accuracy(self):
        """Calculate position play accuracy."""
        position_shots = [s for s in self.shot_history if s.get("position_intended")]
        if not position_shots:
            return 0

        accuracies = []
        for shot in position_shots:
            if "intended_position" in shot and "actual_position" in shot:
                intended = shot["intended_position"]
                actual = shot["actual_position"]
                distance = ((intended[0] - actual[0]) ** 2 + (intended[1] - actual[1]) ** 2) ** 0.5
                accuracies.append(1 - min(1, distance))

        return sum(accuracies) / len(accuracies) * 100 if accuracies else 0

    def _calculate_critical_shot_success(self):
        """Calculate success rate for critical shots."""
        critical_shots = [s for s in self.shot_history if self._is_critical_shot(s)]
        if not critical_shots:
            return 0

        successful = len([s for s in critical_shots if s.get("result") == "success"])
        return (successful / len(critical_shots)) * 100

    def _is_critical_shot(self, shot):
        """Determine if a shot is critical."""
        return any(
            [
                shot.get("game_changing_shot"),
                shot.get("match_point"),
                shot.get("frame_ball"),
                shot.get("clearance_attempt"),
                shot.get("difficulty", 0) > 0.8,
            ]
        )

    def get_real_time_visualizations(self):
        """Get real-time game visualizations.

        Returns:
            dict: Real-time visualizations of game data
        """
        from ..visualization.game_visualizer import GameVisualizer

        visualizer = GameVisualizer(self.shot_history, self.game_state)
        return visualizer.get_real_time_visualizations()

    def get_shot_distribution_plot(self):
        """Get shot distribution visualization.

        Returns:
            dict: Shot distribution plot data
        """
        from ..visualization.game_visualizer import GameVisualizer

        visualizer = GameVisualizer(self.shot_history, self.game_state)
        return visualizer.create_shot_distribution_plot()

    def get_performance_trends_plot(self):
        """Get performance trends visualization.

        Returns:
            dict: Performance trends plot data
        """
        from ..visualization.game_visualizer import GameVisualizer

        visualizer = GameVisualizer(self.shot_history, self.game_state)
        return visualizer.create_performance_trends_plot()

    def get_position_heatmap(self):
        """Get position play heatmap.

        Returns:
            dict: Position heatmap data
        """
        from ..visualization.game_visualizer import GameVisualizer

        visualizer = GameVisualizer(self.shot_history, self.game_state)
        return visualizer.create_position_heatmap()

    def get_success_patterns_plot(self):
        """Get success patterns visualization.

        Returns:
            dict: Success patterns plot data
        """
        from ..visualization.game_visualizer import GameVisualizer

        visualizer = GameVisualizer(self.shot_history, self.game_state)
        return visualizer.create_success_patterns_plot()

    def get_shot_prediction(self, shot_data: dict) -> dict:
        """Get prediction for a shot.

        Args:
            shot_data: Shot details

        Returns:
            dict: Prediction results
        """
        return self.predictor.predict_shot_success(shot_data)

    def get_shot_recommendation(self) -> dict:
        """Get shot type recommendation for current game state.

        Returns:
            dict: Shot recommendations
        """
        return self.predictor.recommend_shot_type(self.game_state)

    def get_position_recommendation(self) -> dict:
        """Get position play recommendation.

        Returns:
            dict: Position recommendations
        """
        return self.predictor.predict_optimal_position(self.game_state)

    def analyze_game_patterns(self) -> dict:
        """Analyze patterns in the current game.

        Returns:
            dict: Pattern analysis results
        """
        return self.predictor.analyze_patterns(self.shot_history)

    def _get_game_flow(self) -> dict:
        """Analyze game flow and momentum."""
        if not self.shot_history:
            return {}

        # Calculate momentum shifts
        momentum_shifts = []
        window_size = 5

        for i in range(len(self.shot_history) - window_size + 1):
            window = self.shot_history[i : i + window_size]
            success_rate = sum(1 for s in window if s.get("result") == "success") / window_size

            if success_rate > 0.8:  # High momentum
                momentum_shifts.append(
                    {"start_index": i, "type": "positive", "strength": success_rate}
                )
            elif success_rate < 0.2:  # Low momentum
                momentum_shifts.append(
                    {"start_index": i, "type": "negative", "strength": 1 - success_rate}
                )

        return {
            "momentum_shifts": momentum_shifts,
            "game_pace": self._calculate_game_pace(),
            "critical_moments": self._identify_critical_moments(),
            "phase_transitions": self._analyze_phase_transitions(),
        }

    def _get_predictive_insights(self) -> dict:
        """Generate predictive insights using ML models."""
        if not self.shot_history:
            return {}

        current_shot_data = self.shot_history[-1] if self.shot_history else {}

        return {
            "next_shot": {
                "recommendations": self.get_shot_recommendation(),
                "position": self.get_position_recommendation(),
                "success_factors": self._analyze_success_factors(current_shot_data),
            },
            "game_outcome": self._predict_game_outcome(),
            "player_trends": self._analyze_player_trends(),
            "strategy_suggestions": self._generate_strategy_suggestions(),
        }

    def _analyze_success_factors(self, shot_data: dict) -> dict:
        """Analyze factors contributing to shot success."""
        if not shot_data:
            return {}

        prediction = self.get_shot_prediction(shot_data)

        return {
            "success_probability": prediction["success_probability"],
            "confidence": prediction["confidence"],
            "contributing_factors": prediction["factors"],
        }

    def _predict_game_outcome(self) -> dict:
        """Predict game outcome based on current state."""
        if not self.shot_history:
            return {}

        # Use recent performance to predict outcome
        recent_shots = self.shot_history[-10:]
        player_performance = {}

        for shot in recent_shots:
            player_id = shot.get("player_id")
            if player_id not in player_performance:
                player_performance[player_id] = {"success": 0, "total": 0}

            player_performance[player_id]["total"] += 1
            if shot.get("result") == "success":
                player_performance[player_id]["success"] += 1

        predictions = {}
        for player_id, stats in player_performance.items():
            success_rate = stats["success"] / stats["total"] if stats["total"] > 0 else 0
            predictions[player_id] = {
                "win_probability": success_rate,
                "projected_shots_remaining": self._estimate_remaining_shots(player_id),
                "critical_factors": self._identify_critical_factors(player_id),
            }

        return predictions

    def _analyze_player_trends(self) -> dict:
        """Analyze trends in player performance."""
        if not self.shot_history:
            return {}

        trends = {}
        for player_id in {s.get("player_id") for s in self.shot_history}:
            player_shots = [s for s in self.shot_history if s.get("player_id") == player_id]

            if not player_shots:
                continue

            # Calculate rolling success rate
            window_size = 5
            success_rates = []
            for i in range(len(player_shots) - window_size + 1):
                window = player_shots[i : i + window_size]
                success_rate = sum(1 for s in window if s.get("result") == "success") / window_size
                success_rates.append(success_rate)

            trends[player_id] = {
                "success_trend": success_rates,
                "shot_preferences": self._analyze_shot_preferences(player_shots),
                "improvement_areas": self._identify_improvement_areas(player_shots),
                "strengths": self._identify_player_strengths(player_shots),
            }

        return trends

    def _generate_strategy_suggestions(self) -> dict:
        """Generate strategic suggestions based on analysis."""
        if not self.shot_history:
            return {}

        return {
            "shot_selection": self._suggest_shot_selection(),
            "position_play": self._suggest_position_play(),
            "tactical_adjustments": self._suggest_tactical_adjustments(),
            "risk_management": self._analyze_risk_factors(),
        }

    def _suggest_shot_selection(self) -> dict:
        """Generate shot selection suggestions."""
        recommendations = self.get_shot_recommendation()

        return {
            "recommended_shots": recommendations.get("recommendations", []),
            "reasoning": self._analyze_recommendation_factors(recommendations),
            "alternatives": self._generate_alternative_shots(),
        }

    def _suggest_position_play(self) -> dict:
        """Generate position play suggestions."""
        position_rec = self.get_position_recommendation()

        return {
            "optimal_position": position_rec.get("recommended_position"),
            "confidence": position_rec.get("confidence"),
            "alternatives": position_rec.get("alternatives", []),
            "considerations": self._analyze_position_factors(),
        }

    def _suggest_tactical_adjustments(self) -> dict:
        """Suggest tactical adjustments based on game state."""
        return {
            "defensive_options": self._analyze_defensive_options(),
            "aggressive_opportunities": self._identify_aggressive_options(),
            "safety_plays": self._analyze_safety_opportunities(),
            "momentum_based_adjustments": self._suggest_momentum_adjustments(),
        }

    def _analyze_risk_factors(self) -> dict:
        """Analyze risk factors in current game state."""
        return {
            "shot_difficulty": self._calculate_current_difficulty(),
            "position_sensitivity": self._analyze_position_sensitivity(),
            "game_situation_pressure": self._analyze_pressure_factors(),
            "risk_reward_balance": self._calculate_risk_reward_ratio(),
        }


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
