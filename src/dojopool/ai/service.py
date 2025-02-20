"""Module for AI-powered match analysis and insights."""

import json
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple, TypedDict, Union, cast
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.ai.service import AIService
from ..core.database import db
from ..core.exceptions import AnalysisError
from ..models import Event, Match, Shot, User
from .difficulty import AdaptiveDifficulty


class AnalysisMetrics(TypedDict):
    """Type definition for analysis metrics."""

    shot_accuracy: float
    consistency: Dict[str, float]
    pressure_handling: Dict[str, float]
    shot_selection: Dict[str, float]


class MatchSummary(TypedDict):
    """Type definition for match summary."""

    match_id: int
    player1: str
    player2: str
    score: str
    duration: str
    key_events: List[str]


class KeyMoment(TypedDict):
    """Type definition for key moment."""

    timestamp: Optional[str]
    description: str
    significance: float
    impact: Dict[str, float]
    venue_id: int


class TacticalAnalysis(TypedDict):
    """Type definition for tactical analysis."""

    shot_patterns: Dict[str, Any]
    strategic_decisions: Dict[str, float]
    adaptations: Dict[str, float]
    player_matchup: Dict[str, Dict[str, float]]


class MatchAnalysis(TypedDict):
    """Type definition for match analysis."""

    match_summary: str
    key_moments: List[KeyMoment]
    performance_stats: AnalysisMetrics
    tactical_analysis: TacticalAnalysis
    improvement_areas: Dict[str, List[str]]
    player_insights: Dict[str, AnalysisMetrics]
    timestamp: str


@dataclass
class EventAnalysis:
    """Data class for event analysis results."""

    significance: float
    momentum_shift: float
    score_impact: float
    psychological_impact: float


@dataclass
class EventImpact:
    """Data class for event impact evaluation results."""

    significance: float
    score_value: float
    momentum_value: float
    psychological_value: float


class MatchAnalyzer:
    """Provides AI-powered analysis for pool matches."""

    def __init__(self):
        """Initialize match analyzer."""
        self.cache: Dict[int, MatchAnalysis] = {}  # Type-annotated cache
        self.difficulty = AdaptiveDifficulty()
        self._cache_timeout = 3600  # Cache timeout in seconds
        self.ai_service = AIService()

    def _handle_cache(
        self, match_id: int, analysis: Optional[MatchAnalysis] = None
    ) -> Optional[MatchAnalysis]:
        """
        Handle cache operations - both retrieval and storage.
        If analysis is provided, stores it in cache. Otherwise attempts to retrieve from cache.

        Args:
            match_id: The match ID to get/set cache for
            analysis: Optional analysis to store in cache

        Returns:
            Retrieved analysis if getting from cache, None if invalid/expired or storing
        """
        if analysis:
            # Store in cache
            self.cache[match_id] = analysis
            # Implement cache size limit
            if len(self.cache) > 1000:  # Arbitrary limit
                oldest_id: min = min(
                    self.cache.keys(), key=lambda k: self.cache[k]["timestamp"]
                )
                del self.cache[oldest_id]
            return None

        # Retrieve from cache
        if match_id in self.cache:
            cached: Any = self.cache[match_id]
            cached_time: Any = datetime.fromisoformat(cached["timestamp"])
            if (datetime.utcnow() - cached_time).total_seconds() < self._cache_timeout:
                return cached
            del self.cache[match_id]
        return None

    def _evaluate_event_impact(
        self, event_type: str, status: str, time_factor: float = 0.5
    ) -> EventImpact:
        """
        Evaluate the impact of an event based on its type, status and timing.
        Consolidates event evaluation logic used across multiple methods.

        Args:
            event_type: Type of the event
            status: Status of the event (success/failure)
            time_factor: When the event occurred in the match (0-1)

        Returns:
            EventImpact with calculated impact values
        """
        # Base significance by event type
        significance_map: Dict[Any, Any] = {
            "winning_shot": 0.8,
            "game_winning_shot": 0.9,
            "critical_safety": 0.7,
            "pressure_shot": 0.6,
            "tactical_shot": 0.5,
            "defensive_shot": 0.4,
            "positional_shot": 0.3,
        }
        base_significance: Any = significance_map.get(event_type, 0.2)

        # Adjust for timing
        if time_factor > 0.8:  # Late game
            base_significance += 0.2
        elif time_factor > 0.6:  # Mid-late game
            base_significance += 0.1

        # Calculate score impact
        score_value: float = 0.0
        if event_type in ["winning_shot", "game_winning_shot"]:
            score_value: float = 1.0 if status == "success" else 0.0
        elif event_type in ["critical_safety", "pressure_shot"]:
            score_value: float = 0.7 if status == "success" else 0.3

        # Calculate momentum impact
        momentum_value: float = 0.5
        if status == "success":
            momentum_value: float = 0.8 if time_factor > 0.6 else 0.7
        else:
            momentum_value: float = 0.2 if time_factor > 0.6 else 0.3

        # Calculate psychological impact
        psychological_value: float = 0.5
        if event_type in ["pressure_shot", "critical_safety"]:
            psychological_value: float = 0.9 if status == "success" else 0.2
        elif event_type in ["winning_shot", "game_winning_shot"]:
            psychological_value: float = 1.0 if status == "success" else 0.1

        return EventImpact(
            significance=min(1.0, base_significance),
            score_value=score_value,
            momentum_value=momentum_value,
            psychological_value=psychological_value,
        )

    def _analyze_event(self, event: Event, match: Match) -> EventAnalysis:
        """
        Comprehensive analysis of a single event.
        Consolidates event significance and impact analysis.
        """
        # Calculate time factor
        time_factor: Any = 0.5
        if event.created_at:
            match_duration: Any = (match.end_time - match.start_time).total_seconds()
            event_time: Any = (event.created_at - match.start_time).total_seconds()
            time_factor: Any = event_time / match_duration

        # Get event impact evaluation
        impact: Any = self._evaluate_event_impact(
            event.event_type, event.status, time_factor
        )

        return EventAnalysis(
            significance=impact.significance,
            momentum_shift=impact.momentum_value,
            score_impact=impact.score_value,
            psychological_impact=impact.psychological_value,
        )

    def _analyze_key_moments(
        self, match: Match, events: List[Event]
    ) -> List[KeyMoment]:
        """Analyze key moments in the match."""
        key_moments: List[KeyMoment] = []

        for event in events:
            # Get comprehensive event analysis
            analysis: Any = self._analyze_event(event, match)

            if analysis.significance > 0.7:  # Only include significant moments
                key_moments.append(
                    {
                        "timestamp": (
                            event.created_at.isoformat() if event.created_at else None
                        ),
                        "description": event.description,
                        "significance": analysis.significance,
                        "impact": {
                            "momentum_shift": analysis.momentum_shift,
                            "score_impact": analysis.score_impact,
                            "psychological_impact": analysis.psychological_impact,
                        },
                        "venue_id": event.venue_id,
                    }
                )

        return sorted(key_moments, key=lambda x: x["significance"], reverse=True)

    def _analyze_performance(
        self,
        match: Match,
        shots: List[Shot],
        events: List[Event],
        player_id: Optional[int] = None,
    ) -> AnalysisMetrics:
        """
        Analyze performance statistics for the match or a specific player.
        Consolidates shot accuracy, consistency, pressure handling, and shot selection analysis.

        Args:
            match: The match to analyze
            shots: List of shots in the match
            events: List of events in the match
            player_id: Optional player ID to filter stats for a specific player

        Returns:
            Performance metrics including shot accuracy, consistency, pressure handling, and shot selection
        """
        # Filter data for specific player if provided
        if player_id:
            shots: Any = [s for s in shots if s.player_id == player_id]
            events: Any = [
                e for e in events if e.venue_id == player_id
            ]  # Using venue_id as player_id

        if not shots:
            return {
                "shot_accuracy": 0.0,
                "consistency": {"overall": 0.0, "streaks": 0.0},
                "pressure_handling": {"success_rate": 0.0, "adaptation": 0.0},
                "shot_selection": {
                    "aggressive": 0.0,
                    "defensive": 0.0,
                    "balanced": 0.0,
                },
            }

        # Calculate shot accuracy
        successful: sum = sum(1 for shot in shots if shot.result)  # result is a boolean
        accuracy: round = round((successful / len(shots)) * 100, 2)

        # Calculate consistency
        results: Any = [shot.result for shot in shots]  # result is a boolean
        transitions: sum = sum(
            1 for i in range(len(results) - 1) if results[i] != results[i + 1]
        )
        consistency: Any = (
            1 - (transitions / (len(results) - 1)) if len(results) > 1 else 0
        )

        # Calculate streaks
        current_streak: int = 1
        max_streak: int = 1
        for i in range(1, len(results)):
            if results[i] == results[i - 1]:
                current_streak += 1
                max_streak: int = max(max_streak, current_streak)
            else:
                current_streak: int = 1

        consistency_stats: Dict[Any, Any] = {
            "overall": round(consistency * 100, 2),
            "streaks": round((max_streak / len(shots)) * 100, 2),
        }

        # Calculate pressure handling
        pressure_events: Any = [e for e in events if e.event_type == "pressure_shot"]
        if pressure_events:
            success_count: sum = sum(
                1 for e in pressure_events if e.status == "success"
            )
            success_rate: Any = (success_count / len(pressure_events)) * 100

            # Calculate adaptation
            early_success: sum = sum(
                1
                for e in pressure_events[: len(pressure_events) // 2]
                if e.status == "success"
            )
            late_success: sum = sum(
                1
                for e in pressure_events[len(pressure_events) // 2 :]
                if e.status == "success"
            )
            adaptation: Any = (
                (late_success / (len(pressure_events) // 2))
                - (early_success / (len(pressure_events) // 2))
            ) * 100
        else:
            success_rate: Any = 0.0
            adaptation: Any = 0.0

        pressure_stats: Dict[Any, Any] = {
            "success_rate": round(success_rate, 2),
            "adaptation": round(adaptation, 2),
        }

        # Calculate shot selection
        aggressive: sum = sum(1 for s in shots if s.power > 0.7 or abs(s.spin) > 0.7)
        defensive: sum = sum(1 for s in shots if s.power < 0.3 and abs(s.spin) < 0.3)
        balanced: Any = len(shots) - aggressive - defensive

        selection_stats: Dict[Any, Any] = {
            "aggressive": round((aggressive / len(shots)) * 100, 2),
            "defensive": round((defensive / len(shots)) * 100, 2),
            "balanced": round((balanced / len(shots)) * 100, 2),
        }

        return {
            "shot_accuracy": accuracy,
            "consistency": consistency_stats,
            "pressure_handling": pressure_stats,
            "shot_selection": selection_stats,
        }

    async def _load_match_data(
        self, match_id: int
    ) -> Tuple[
        Match, User, User, List[Event], List[Shot], Dict[str, Any], Dict[str, Any]
    ]:
        """
        Load and validate all match data in a single method.

        Returns:
            Tuple of (match, player1, player2, events, shots, player1_levels, player2_levels)

        Raises:
            ValueError: If match or players not found
            SQLAlchemyError: If database error occurs
        """
        # Load match with related data in one query
        match: Any = db.session.query(Match).filter_by(id=match_id).first()
        if not match:
            raise ValueError(f"Match with ID {match_id} not found")

        # Load related data
        player1: Any = db.session.query(User).get(match.player1_id)
        player2: Any = db.session.query(User).get(match.player2_id)

        if not player1 or not player2:
            raise ValueError("Match players not found")

        events: Any = db.session.query(Event).filter_by(match_id=match_id).all()
        shots: Any = db.session.query(Shot).filter_by(match_id=match_id).all()

        # Get player levels
        player1_levels: Any = await self.difficulty.calculate_player_level(
            match.player1_id
        )
        player2_levels: Any = await self.difficulty.calculate_player_level(
            match.player2_id
        )

        return match, player1, player2, events, shots, player1_levels, player2_levels

    async def analyze_match(self, match_id: int):
        """Perform comprehensive analysis of a match."""
        try:
            # Check cache first
            cached: Any = self._handle_cache(match_id)
            if cached:
                return cached

            # Load all match data
            (match, player1, player2, events, shots, player1_levels, player2_levels) = (
                await self._load_match_data(match_id)
            )

            # Perform various analyses
            key_moments = self._analyze_key_moments(match, events)
            performance_stats: Any = self._analyze_performance(
                match, shots, events
            )  # Overall match stats
            tactical_analysis: Any = cast(
                TacticalAnalysis,
                self._analyze_tactics(
                    match, shots, events, player1_levels, player2_levels
                ),
            )
            improvement_areas: Any = await self._identify_improvement_areas(
                match, shots, events, player1_levels, player2_levels
            )

            # Generate match summary and score progression
            match_summary, score_progression = await self._generate_match_summary(
                match, player1, player2, events
            )

            # Generate player insights using the same performance analysis method
            player1_insights: AnalysisMetrics = cast(
                AnalysisMetrics,
                self._analyze_performance(match, shots, events, match.player1_id),
            )
            player2_insights: AnalysisMetrics = cast(
                AnalysisMetrics,
                self._analyze_performance(match, shots, events, match.player2_id),
            )

            analysis: MatchAnalysis = {
                "match_summary": match_summary,
                "key_moments": key_moments,
                "performance_stats": performance_stats,
                "tactical_analysis": tactical_analysis,
                "improvement_areas": improvement_areas,
                "player_insights": {
                    "player1": player1_insights,
                    "player2": player2_insights,
                },
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Cache the results
            self._handle_cache(match_id, analysis)
            return analysis

        except SQLAlchemyError as e:
            raise AnalysisError(
                f"Database error during match analysis: {str(e)}"
            ) from e
        except Exception as e:
            raise AnalysisError(f"Error analyzing match: {str(e)}") from e

    def _analyze_shot_patterns(self, shots: List[Shot]):
        """
        Analyze comprehensive patterns in shot selection and execution.
        Consolidates angle, power, and spin analysis into a single method.
        """
        if not shots:
            return {
                "angles": {},
                "power": {},
                "spin": {},
                "style": {"aggressive": 0.0, "defensive": 0.0, "balanced": 0.0},
            }

        # Analyze angles
        angles: Any = [shot.angle for shot in shots if shot.angle is not None]
        angle_ranges: Dict[Any, Any] = {
            "straight": 0,
            "slight": 0,
            "moderate": 0,
            "extreme": 0,
        }
        for angle in angles:
            if angle < 15:
                angle_ranges["straight"] += 1
            elif angle < 30:
                angle_ranges["slight"] += 1
            elif angle < 45:
                angle_ranges["moderate"] += 1
            else:
                angle_ranges["extreme"] += 1

        # Analyze power
        powers: Any = [shot.power for shot in shots if shot.power is not None]
        power_ranges: Dict[Any, Any] = {"soft": 0, "medium": 0, "hard": 0}
        for power in powers:
            if power < 0.33:
                power_ranges["soft"] += 1
            elif power < 0.66:
                power_ranges["medium"] += 1
            else:
                power_ranges["hard"] += 1

        # Analyze spin
        spins: Any = [shot.spin for shot in shots if shot.spin is not None]
        spin_categories: Dict[Any, Any] = {
            "topspin": 0,
            "backspin": 0,
            "left": 0,
            "right": 0,
            "none": 0,
        }
        for spin in spins:
            if abs(spin) < 0.1:
                spin_categories["none"] += 1
            elif spin > 0:
                spin_categories["topspin" if spin > 0.5 else "right"] += 1
            else:
                spin_categories["backspin" if spin < -0.5 else "left"] += 1

        # Analyze shot style
        aggressive: sum = sum(1 for s in shots if s.power > 0.7 or abs(s.spin) > 0.7)
        defensive: sum = sum(1 for s in shots if s.power < 0.3 and abs(s.spin) < 0.3)
        balanced: Any = len(shots) - aggressive - defensive

        # Calculate percentages
        total_angles: Any = len(angles) or 1
        total_powers: Any = len(powers) or 1
        total_spins: Any = len(spins) or 1
        total_shots: Any = len(shots) or 1

        return {
            "angles": {
                k: round((v / total_angles) * 100, 2) for k, v in angle_ranges.items()
            },
            "power": {
                k: round((v / total_powers) * 100, 2) for k, v in power_ranges.items()
            },
            "spin": {
                k: round((v / total_spins) * 100, 2) for k, v in spin_categories.items()
            },
            "style": {
                "aggressive": round((aggressive / total_shots) * 100, 2),
                "defensive": round((defensive / total_shots) * 100, 2),
                "balanced": round((balanced / total_shots) * 100, 2),
            },
        }

    def _analyze_tactics(
        self,
        match: Match,
        shots: List[Shot],
        events: List[Event],
        player1_levels: Dict[str, Any],
        player2_levels: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Analyze tactical aspects of the match.
        Consolidates strategic decisions, adaptations, and player matchup analysis.
        """
        if not shots or not events:
            return {
                "shot_patterns": self._analyze_shot_patterns([]),
                "strategic_decisions": {
                    "offensive_plays": 0.0,
                    "defensive_plays": 0.0,
                    "risk_taking": 0.0,
                },
                "adaptations": {
                    "style_changes": 0.0,
                    "response_to_pressure": 50.0,
                    "pattern_recognition": 50.0,
                },
                "player_matchup": {
                    "style_clash": {
                        "compatibility": 50.0,
                        "advantage": 50.0,
                        "dynamic_shifts": 0.0,
                    },
                    "strength_exploitation": {
                        "targeting_weaknesses": 50.0,
                        "leveraging_strengths": 50.0,
                        "adaptation_rate": 0.0,
                    },
                },
            }

        # Get shot patterns once and reuse
        shot_patterns: Any = self._analyze_shot_patterns(shots)

        # Calculate event statistics using event impact evaluation
        offensive_events: Any = 0
        defensive_events: Any = 0
        pressure_events: Any = []

        for event in events:
            impact: Any = self._evaluate_event_impact(event.event_type, event.status)
            if impact.score_value > 0.6:  # Offensive events have high score impact
                offensive_events += 1
            elif impact.momentum_value > 0.6:  # Defensive events focus on momentum
                defensive_events += 1
            if event.event_type == "pressure_shot":
                pressure_events.append(event)

        total_events: Any = len(events) or 1

        # Calculate strategic decisions
        strategic_decisions: Dict[Any, Any] = {
            "offensive_plays": round((offensive_events / total_events) * 100, 2),
            "defensive_plays": round((defensive_events / total_events) * 100, 2),
            "risk_taking": round(shot_patterns["style"]["aggressive"], 2),
        }

        # Calculate adaptations
        mid_point: Any = len(shots) // 2
        early_patterns: Any = self._analyze_shot_patterns(shots[:mid_point])
        late_patterns: Any = self._analyze_shot_patterns(shots[mid_point:])

        style_change: Any = (
            abs(
                late_patterns["style"]["aggressive"]
                - early_patterns["style"]["aggressive"]
            )
            / 100.0
        )

        # Calculate pressure adaptation
        pressure_adaptation: float = 0.0
        if pressure_events:
            early_success_rate: Any = sum(
                1
                for e in pressure_events[: len(pressure_events) // 2]
                if e.status == "success"
            ) / (len(pressure_events) // 2 or 1)
            late_success_rate: Any = sum(
                1
                for e in pressure_events[len(pressure_events) // 2 :]
                if e.status == "success"
            ) / ((len(pressure_events) - len(pressure_events) // 2) or 1)
            pressure_adaptation: float = late_success_rate - early_success_rate

        adaptations: Dict[Any, Any] = {
            "style_changes": round(style_change * 100, 2),
            "response_to_pressure": round((pressure_adaptation + 1) * 50, 2),
            "pattern_recognition": round(
                late_patterns["style"]["balanced"]
                - early_patterns["style"]["balanced"]
                + 50,
                2,
            ),
        }

        # Calculate player matchup
        def get_level(levels: Dict[str, Any], key: str) -> float:
            return float(levels.get(key, 0.5))

        style_compatibility: min = min(
            abs(
                get_level(player1_levels, "aggression")
                - get_level(player2_levels, "aggression")
            ),
            abs(
                get_level(player1_levels, "consistency")
                - get_level(player2_levels, "consistency")
            ),
        )

        player_matchup: Dict[Any, Any] = {
            "style_clash": {
                "compatibility": round((1 - style_compatibility) * 100, 2),
                "advantage": round(
                    (
                        get_level(player1_levels, "skill")
                        - get_level(player2_levels, "skill")
                        + 1
                    )
                    * 50,
                    2,
                ),
                "dynamic_shifts": round(style_change * 100, 2),
            },
            "strength_exploitation": {
                "targeting_weaknesses": round(
                    (
                        1
                        - min(
                            get_level(player1_levels, "defense"),
                            get_level(player2_levels, "defense"),
                        )
                    )
                    * 100,
                    2,
                ),
                "leveraging_strengths": round(
                    max(
                        get_level(player1_levels, "offense"),
                        get_level(player2_levels, "offense"),
                    )
                    * 100,
                    2,
                ),
                "adaptation_rate": round(pressure_adaptation * 100, 2),
            },
        }

        return {
            "shot_patterns": shot_patterns,
            "strategic_decisions": strategic_decisions,
            "adaptations": adaptations,
            "player_matchup": player_matchup,
        }

    async def _identify_improvement_areas(
        self,
        match: Match,
        shots: List[Shot],
        events: List[Event],
        player1_levels: Dict[str, Any],
        player2_levels: Dict[str, Any],
    ) -> Dict[str, List[str]]:
        """Identify areas for improvement for both players."""
        try:
            # Prepare match data with only necessary information
            match_data: Dict[Any, Any] = {
                "events": [{"type": e.event_type, "status": e.status} for e in events],
                "shots": [
                    {"power": s.power, "spin": s.spin, "result": s.result}
                    for s in shots
                ],
                "player_levels": {"player1": player1_levels, "player2": player2_levels},
            }

            # Generate focused prompt for improvement analysis
            improvement_prompt: Any = (
                f"Based on match data:\n{json.dumps(match_data, indent=2)}\n\n"
                "Identify for each player:\n"
                "1. Technical improvements\n"
                "2. Tactical adjustments\n"
                "3. Mental game enhancements\n"
                "Return as JSON with player1_improvements and player2_improvements lists."
            )

            analysis: Any = await self.ai_service.generate_text(improvement_prompt)
            if analysis:
                improvements: Any = json.loads(analysis)
                return {
                    "player1": improvements.get("player1_improvements", []),
                    "player2": improvements.get("player2_improvements", []),
                }

        except (json.JSONDecodeError, Exception) as e:
            # Log error but continue with default recommendations
            print(f"Error generating improvements: {str(e)}")

        # Default recommendations if AI analysis fails
        return {
            "player1": [
                "Improve shot consistency",
                "Practice pressure situations",
                "Develop strategic planning",
            ],
            "player2": [
                "Enhance shot accuracy",
                "Work on position play",
                "Build mental resilience",
            ],
        }

    def _process_match_events(self, events: List[Event], match: Match):
        """
        Process match events to generate score progression and significant events.
        Consolidates event processing logic used in match summary generation.

        Args:
            events: List of match events
            match: The match being analyzed

        Returns:
            Tuple of (score progression list, significant events list)
        """
        score_progression: List[Any] = [
            {"time": 0.0, "player1_score": 0.0, "player2_score": 0.0}
        ]

        current_score: Dict[Any, Any] = {"player1": 0.0, "player2": 0.0}
        significant_events: Any = []
        match_duration: Any = (match.end_time - match.start_time).total_seconds()

        # Process events chronologically
        for event in sorted(events, key=lambda e: e.created_at or match.start_time):
            event_time: Any = (
                (event.created_at - match.start_time).total_seconds()
                if event.created_at
                else 0.0
            )
            time_factor: Any = event_time / match_duration

            impact: Any = self._evaluate_event_impact(
                event.event_type, event.status, time_factor
            )

            # Update score for significant scoring events
            if impact.score_value > 0.8:
                if event.venue_id == match.player1_id:
                    current_score["player1"] += 1.0
                elif event.venue_id == match.player2_id:
                    current_score["player2"] += 1.0

                score_progression.append(
                    {
                        "time": event_time,
                        "player1_score": current_score["player1"],
                        "player2_score": current_score["player2"],
                    }
                )

            if impact.significance > 0.7:
                significant_events.append(
                    f"{event.event_type} at {event_time:.1f}s: {event.description}"
                )

        # Add final score
        final_score: Any = (
            match.score
            if isinstance(match.score, dict)
            else {"player1": 0.0, "player2": 0.0}
        )
        score_progression.append(
            {
                "time": match_duration,
                "player1_score": float(final_score.get("player1", 0.0)),
                "player2_score": float(final_score.get("player2", 0.0)),
            }
        )

        return score_progression, significant_events

    async def _generate_match_summary(
        self, match: Match, player1: User, player2: User, events: List[Event]
    ) -> Tuple[str, List[Dict[str, float]]]:
        """
        Generate a comprehensive match summary and score progression.
        Uses consolidated event processing logic from _process_match_events.

        Returns:
            Tuple of (summary string, score progression list)
        """
        # Get score progression and significant events
        score_progression, significant_events = self._process_match_events(
            events, match
        )
        match_duration: Any = (match.end_time - match.start_time).total_seconds()
        final_score: Any = (
            match.score
            if isinstance(match.score, dict)
            else {"player1": 0.0, "player2": 0.0}
        )

        # Generate focused summary prompt
        summary_prompt: Any = (
            f"Match Summary:\n"
            f"Players: {player1.username} vs {player2.username}\n"
            f"Duration: {match_duration / 60:.1f} minutes\n"
            f"Final Score: {final_score.get('player1', 0)} - {final_score.get('player2', 0)}\n"
            f"Key Events:\n" + "\n".join(significant_events) + "\n\n"
            "Create a brief narrative focusing on match flow and critical moments."
        )

        summary: Any = await self.ai_service.generate_text(summary_prompt)
        return (
            summary or f"Match between {player1.username} and {player2.username}",
            score_progression,
        )
