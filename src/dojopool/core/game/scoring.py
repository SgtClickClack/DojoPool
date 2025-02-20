"""Game scoring module."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class ScoringSystem(Enum):
    """Scoring system types."""

    POINTS = "points"  # Points per ball
    FRAMES = "frames"  # Best of N frames
    RACE_TO = "race_to"  # First to N wins


@dataclass
class PlayerStats:
    """Player statistics."""

    total_points: int = 0
    frames_won: int = 0
    total_innings: int = 0
    total_shots: int = 0
    successful_shots: int = 0
    fouls: int = 0
    scratches: int = 0
    safeties_played: int = 0
    breaks_won: int = 0
    avg_shot_time: float = 0.0
    longest_run: int = 0
    current_run: int = 0
    balls_pocketed: List[int] = field(default_factory=list)
    shot_history: List[Dict] = field(default_factory=list)


@dataclass
class FrameStats:
    """Frame statistics."""

    frame_number: int
    winner_id: Optional[str] = None
    duration: float = 0.0
    total_innings: int = 0
    total_shots: int = 0
    fouls: Dict[str, int] = field(default_factory=dict)
    points: Dict[str, int] = field(default_factory=dict)
    balls_pocketed: Dict[str, List[int]] = field(default_factory=dict)
    start_time: datetime = field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None


class ScoringSystem:
    """Manages game scoring and statistics."""

    def __init__(self, game_type: str, scoring_type: ScoringSystem, target_score: int):
        """Initialize scoring system.

        Args:
            game_type: Type of game ('8ball', '9ball', etc.)
            scoring_type: Type of scoring system
            target_score: Target score for winning (frames or points)
        """
        self.game_type = game_type
        self.scoring_type = scoring_type
        self.target_score = target_score
        self.player_stats: Dict[str, PlayerStats] = {}
        self.frame_stats: List[FrameStats] = []
        self.current_frame: Optional[FrameStats] = None
        self.last_shot_time: Optional[datetime] = None

    def start_frame(self, frame_number: int):
        """Start a new frame.

        Args:
            frame_number: Frame number
        """
        if self.current_frame:
            self.end_frame()

        self.current_frame = FrameStats(frame_number=frame_number)
        self.last_shot_time = datetime.utcnow()

    def end_frame(self, winner_id: Optional[str] = None):
        """End current frame.

        Args:
            winner_id: ID of frame winner
        """
        if not self.current_frame:
            return

        self.current_frame.end_time = datetime.utcnow()
        self.current_frame.duration = (
            self.current_frame.end_time - self.current_frame.start_time
        ).total_seconds()
        self.current_frame.winner_id = winner_id

        if winner_id:
            if winner_id not in self.player_stats:
                self.player_stats[winner_id] = PlayerStats()
            self.player_stats[winner_id].frames_won += 1

        self.frame_stats.append(self.current_frame)
        self.current_frame = None

    def record_shot(self, player_id: str, shot_data: Dict):
        """Record a shot.

        Args:
            player_id: Player who made the shot
            shot_data: Shot information
        """
        if player_id not in self.player_stats:
            self.player_stats[player_id] = PlayerStats()

        stats = self.player_stats[player_id]
        current_time = datetime.utcnow()

        # Update shot timing
        if self.last_shot_time:
            shot_time = (current_time - self.last_shot_time).total_seconds()
            stats.avg_shot_time = (
                stats.avg_shot_time * stats.total_shots + shot_time
            ) / (stats.total_shots + 1)

        self.last_shot_time = current_time

        # Update shot counts
        stats.total_shots += 1
        if shot_data.get("successful", False):
            stats.successful_shots += 1
            stats.current_run += 1
            stats.longest_run = max(stats.longest_run, stats.current_run)
        else:
            stats.current_run = 0

        # Record shot in history
        shot_data["timestamp"] = current_time.isoformat()
        stats.shot_history.append(shot_data)

        # Update frame stats
        if self.current_frame:
            self.current_frame.total_shots += 1

    def record_pocket(self, player_id: str, ball_number: int):
        """Record a pocketed ball.

        Args:
            player_id: Player who pocketed the ball
            ball_number: Number of the pocketed ball
        """
        if player_id not in self.player_stats:
            self.player_stats[player_id] = PlayerStats()

        stats = self.player_stats[player_id]
        stats.balls_pocketed.append(ball_number)

        # Update points based on game type
        if self.game_type == "9ball":
            # 2 points for 9-ball, 1 point for others
            points = 2 if ball_number == 9 else 1
        else:
            points = 1

        stats.total_points += points

        # Update frame stats
        if self.current_frame:
            if player_id not in self.current_frame.balls_pocketed:
                self.current_frame.balls_pocketed[player_id] = []
            self.current_frame.balls_pocketed[player_id].append(ball_number)

            if player_id not in self.current_frame.points:
                self.current_frame.points[player_id] = 0
            self.current_frame.points[player_id] += points

    def record_foul(self, player_id: str, foul_type: str):
        """Record a foul.

        Args:
            player_id: Player who committed the foul
            foul_type: Type of foul
        """
        if player_id not in self.player_stats:
            self.player_stats[player_id] = PlayerStats()

        stats = self.player_stats[player_id]
        stats.fouls += 1

        if foul_type == "scratch":
            stats.scratches += 1

        # Update frame stats
        if self.current_frame:
            if player_id not in self.current_frame.fouls:
                self.current_frame.fouls[player_id] = 0
            self.current_frame.fouls[player_id] += 1

    def record_safety(self, player_id: str):
        """Record a safety shot.

        Args:
            player_id: Player who played the safety
        """
        if player_id not in self.player_stats:
            self.player_stats[player_id] = PlayerStats()

        self.player_stats[player_id].safeties_played += 1

    def record_break(self, player_id: str, successful: bool):
        """Record a break shot.

        Args:
            player_id: Player who broke
            successful: Whether the break was successful
        """
        if player_id not in self.player_stats:
            self.player_stats[player_id] = PlayerStats()

        if successful:
            self.player_stats[player_id].breaks_won += 1

    def update_innings(self, player_id: str):
        """Update innings count.

        Args:
            player_id: Player whose inning is ending
        """
        if player_id not in self.player_stats:
            self.player_stats[player_id] = PlayerStats()

        stats = self.player_stats[player_id]
        stats.total_innings += 1

        # Update frame stats
        if self.current_frame:
            self.current_frame.total_innings += 1

    def get_player_stats(self, player_id: str) -> Optional[PlayerStats]:
        """Get statistics for a player.

        Args:
            player_id: Player ID

        Returns:
            Player statistics or None if not found
        """
        return self.player_stats.get(player_id)

    def get_frame_stats(self, frame_number: Optional[int] = None):
        """Get statistics for a frame.

        Args:
            frame_number: Frame number or None for current frame

        Returns:
            Frame statistics or None if not found
        """
        if frame_number is None:
            return self.current_frame

        try:
            return next(f for f in self.frame_stats if f.frame_number == frame_number)
        except StopIteration:
            return None

    def check_winner(self):
        """Check if there's a winner based on scoring system.

        Returns:
            Winner ID or None if no winner yet
        """
        if self.scoring_type == ScoringSystem.POINTS:
            # Check points threshold
            for player_id, stats in self.player_stats.items():
                if stats.total_points >= self.target_score:
                    return player_id

        elif self.scoring_type == ScoringSystem.FRAMES:
            # Check frames won
            for player_id, stats in self.player_stats.items():
                if stats.frames_won >= (self.target_score + 1) // 2:
                    return player_id

        elif self.scoring_type == ScoringSystem.RACE_TO:
            # Check games won
            for player_id, stats in self.player_stats.items():
                if stats.frames_won >= self.target_score:
                    return player_id

        return None

    def get_game_summary(self) -> Dict:
        """Get summary of game statistics.

        Returns:
            Dictionary containing game summary
        """
        return {
            "game_type": self.game_type,
            "scoring_type": self.scoring_type.value,
            "target_score": self.target_score,
            "total_frames": len(self.frame_stats),
            "total_duration": sum(f.duration for f in self.frame_stats),
            "player_stats": {
                player_id: {
                    "total_points": stats.total_points,
                    "frames_won": stats.frames_won,
                    "success_rate": (
                        stats.successful_shots / stats.total_shots
                        if stats.total_shots > 0
                        else 0
                    ),
                    "avg_shot_time": stats.avg_shot_time,
                    "longest_run": stats.longest_run,
                    "total_fouls": stats.fouls,
                    "total_safeties": stats.safeties_played,
                    "breaks_won": stats.breaks_won,
                }
                for player_id, stats in self.player_stats.items()
            },
        }
