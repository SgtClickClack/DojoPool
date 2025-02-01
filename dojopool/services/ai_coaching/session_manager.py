"""
Session manager for the DojoPool AI coaching system.
Handles coaching sessions and tracks player progress.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from .shot_analysis import ShotMetrics, ShotFeedback


@dataclass
class SessionMetrics:
    """Overall metrics for a coaching session."""

    start_time: datetime
    end_time: Optional[datetime]
    total_shots: int
    successful_shots: int
    average_accuracy: float
    average_power: float
    improvement_areas: List[str]
    recommended_drills: List[str]


@dataclass
class PlayerProgress:
    """Tracks player's progress over time."""

    player_id: str
    sessions: List[SessionMetrics]
    skill_level: float  # 0-1 scale
    strengths: List[str]
    weaknesses: List[str]
    preferred_drills: List[str]


class CoachingSessionManager:
    """Manages AI coaching sessions and player progress."""

    def __init__(self):
        """Initialize the coaching session manager."""
        self.active_sessions: Dict[str, SessionMetrics] = {}
        self.player_progress: Dict[str, PlayerProgress] = {}

    def start_session(self, player_id: str) -> SessionMetrics:
        """Start a new coaching session for a player."""
        if player_id in self.active_sessions:
            raise ValueError(f"Player {player_id} already has an active session")

        session = SessionMetrics(
            start_time=datetime.now(),
            end_time=None,
            total_shots=0,
            successful_shots=0,
            average_accuracy=0.0,
            average_power=0.0,
            improvement_areas=[],
            recommended_drills=[],
        )

        self.active_sessions[player_id] = session
        return session

    def record_shot(self, player_id: str, feedback: ShotFeedback) -> None:
        """Record shot feedback in the current session."""
        if player_id not in self.active_sessions:
            raise ValueError(f"No active session for player {player_id}")

        session = self.active_sessions[player_id]
        session.total_shots += 1

        # Consider shot successful if confidence score is above 0.7
        if feedback.confidence_score > 0.7:
            session.successful_shots += 1

        # Update running averages
        session.average_accuracy = (
            session.average_accuracy * (session.total_shots - 1) + feedback.metrics.accuracy
        ) / session.total_shots
        session.average_power = (
            session.average_power * (session.total_shots - 1) + feedback.metrics.power
        ) / session.total_shots

        # Update improvement areas and drills
        for improvement in feedback.improvements:
            if improvement not in session.improvement_areas:
                session.improvement_areas.append(improvement)

        for drill in feedback.suggested_drills:
            if drill not in session.recommended_drills:
                session.recommended_drills.append(drill)

    def end_session(self, player_id: str) -> SessionMetrics:
        """End the current coaching session and update player progress."""
        if player_id not in self.active_sessions:
            raise ValueError(f"No active session for player {player_id}")

        session = self.active_sessions[player_id]
        session.end_time = datetime.now()

        # Update player progress
        if player_id not in self.player_progress:
            self.player_progress[player_id] = PlayerProgress(
                player_id=player_id,
                sessions=[],
                skill_level=0.0,
                strengths=[],
                weaknesses=[],
                preferred_drills=[],
            )

        progress = self.player_progress[player_id]
        progress.sessions.append(session)

        # Update skill level based on recent performance
        recent_sessions = [
            s
            for s in progress.sessions
            if s.end_time and s.end_time > datetime.now() - timedelta(days=30)
        ]

        if recent_sessions:
            avg_success_rate = sum(
                s.successful_shots / max(s.total_shots, 1) for s in recent_sessions
            ) / len(recent_sessions)
            avg_accuracy = sum(s.average_accuracy for s in recent_sessions) / len(recent_sessions)

            # Weighted skill level calculation
            progress.skill_level = avg_success_rate * 0.6 + avg_accuracy * 0.4

        # Update strengths and weaknesses
        self._update_player_attributes(progress)

        del self.active_sessions[player_id]
        return session

    def get_player_progress(self, player_id: str) -> Optional[PlayerProgress]:
        """Get a player's progress history."""
        return self.player_progress.get(player_id)

    def _update_player_attributes(self, progress: PlayerProgress) -> None:
        """Update player's strengths, weaknesses, and preferred drills."""
        # Analyze recent sessions
        recent_sessions = [s for s in progress.sessions[-5:]]

        # Count improvement areas
        area_counts: Dict[str, int] = {}
        drill_counts: Dict[str, int] = {}

        for session in recent_sessions:
            for area in session.improvement_areas:
                area_counts[area] = area_counts.get(area, 0) + 1
            for drill in session.recommended_drills:
                drill_counts[drill] = drill_counts.get(drill, 0) + 1

        # Update weaknesses (areas needing most improvement)
        progress.weaknesses = sorted(
            area_counts.keys(), key=lambda x: area_counts[x], reverse=True
        )[:3]

        # Update strengths (areas not appearing in improvements)
        all_areas = {
            "Power control",
            "Shot accuracy",
            "Follow through",
            "Stance stability",
            "English application",
            "Position play",
        }
        progress.strengths = list(all_areas - set(progress.weaknesses))[:3]

        # Update preferred drills (most recommended)
        progress.preferred_drills = sorted(
            drill_counts.keys(), key=lambda x: drill_counts[x], reverse=True
        )[:5]
