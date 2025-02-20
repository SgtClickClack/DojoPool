"""Module for AI-powered match analysis and insights."""

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple, TypedDict, Union, cast
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Mapped, joinedload, mapped_column, relationship

from ..core.database import db
from ..core.exceptions import AnalysisError
from ..models import Match
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


@dataclass
class EventAnalysis:
    """Data class for event analysis results."""

    significance: float
    momentum_shift: float
    score_impact: float
    psychological_impact: float


class MatchAnalyzer:
    """Provides AI-powered analysis for pool matches."""

    def __init__(self):
        """Initialize match analyzer."""
        self.cache: Dict[int, Dict[str, Any]] = {}  # Type-annotated cache
        self.difficulty = AdaptiveDifficulty()
        self._cache_timeout = 3600  # Cache timeout in seconds

    async def analyze_match(self, match_id: int) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of a match.

        Args:
            match_id: The ID of the match to analyze

        Returns:
            Dict containing comprehensive match analysis

        Raises:
            AnalysisError: If match analysis fails
            ValueError: If match_id is invalid
        """
        try:
            # Check cache first
            cached: Any = self._get_from_cache(match_id)
            if cached:
                return cached

            # Load match with related data in one query
            match: Any = (
                await db.session.query(Match)
                .options(
                    joinedload(Match.player1),
                    joinedload(Match.player2),
                    joinedload(Match.events),
                    joinedload(Match.shots),
                )
                .get(match_id)
            )

            if not match:
                raise ValueError(f"Match with ID {match_id} not found")

            # Get player levels concurrently
            temp: Tuple[Dict[str, Any], Dict[str, Any]] = await self._get_player_levels(
                match
            )
            player1_levels, player2_levels = temp

            # Perform various analyses concurrently
            key_moments: Any = await self._analyze_key_moments(match)
            performance_stats: Any = await self._analyze_performance(match)
            tactical_analysis: Any = await self._analyze_tactics(
                match, player1_levels, player2_levels
            )
            improvement_areas: Any = await self._identify_improvement_areas(
                match, player1_levels, player2_levels
            )

            analysis: Dict[Any, Any] = {
                "match_summary": await self._generate_match_summary(match),
                "key_moments": key_moments,
                "performance_stats": performance_stats,
                "tactical_analysis": tactical_analysis,
                "improvement_areas": improvement_areas,
                "player_insights": {
                    "player1": await self._generate_player_insights(
                        match.player1_id, match
                    ),
                    "player2": await self._generate_player_insights(
                        match.player2_id, match
                    ),
                },
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Cache the results
            self._add_to_cache(match_id, analysis)
            return analysis

        except SQLAlchemyError as e:
            raise AnalysisError(
                f"Database error during match analysis: {str(e)}"
            ) from e
        except Exception as e:
            raise AnalysisError(f"Error analyzing match: {str(e)}") from e

    def _get_empty_analysis(self):
        """Return empty analysis structure with proper types."""
        return {
            "match_summary": cast(
                MatchSummary,
                {
                    "match_id": 0,
                    "player1": "",
                    "player2": "",
                    "score": "0-0",
                    "duration": "0:00",
                    "key_events": [],
                },
            ),
            "key_moments": [],
            "performance_stats": cast(
                AnalysisMetrics,
                {
                    "shot_accuracy": 0.0,
                    "consistency": {"overall": 0.0, "streaks": 0.0},
                    "pressure_handling": {"success_rate": 0.0, "adaptation": 0.0},
                    "shot_selection": {"aggressive_shots": 0.0, "safety_plays": 0.0},
                },
            ),
            "tactical_analysis": {},
            "improvement_areas": {"player1": [], "player2": []},
            "player_insights": {"player1": {}, "player2": {}},
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def _get_player_levels(
        self, match: Match
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """Get player levels concurrently."""
        player1_levels: Any = await self.difficulty.calculate_player_level(
            match.player1_id
        )
        player2_levels: Any = await self.difficulty.calculate_player_level(
            match.player2_id
        )
        return player1_levels, player2_levels

    def _get_from_cache(self, match_id: int):
        """Get analysis from cache if valid."""
        if match_id in self.cache:
            cached: Any = self.cache[match_id]
            cached_time: Any = datetime.fromisoformat(cached["timestamp"])
            if (datetime.utcnow() - cached_time).total_seconds() < self._cache_timeout:
                return cached
            del self.cache[match_id]
        return None

    def _add_to_cache(self, match_id: int, analysis: Dict[str, Any]) -> None:
        """Add analysis to cache with timestamp."""
        self.cache[match_id] = analysis
        # Implement cache size limit
        if len(self.cache) > 1000:  # Arbitrary limit
            oldest_id: min = min(
                self.cache.keys(), key=lambda k: self.cache[k]["timestamp"]
            )
            del self.cache[oldest_id]


# Initialize match analyzer
match_analyzer: MatchAnalyzer = MatchAnalyzer()
