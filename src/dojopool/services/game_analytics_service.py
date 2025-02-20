from datetime import datetime
from typing import Dict, List

import numpy as np
from models.game_analytics import (
    GameAnalytics,
    PositionalMetrics,
    PressureMetrics,
    ProgressionMetrics,
    ShotMetrics,
    StrategyMetrics,
)
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


class GameAnalyticsService:
    def __init__(self):
        self.scaler = StandardScaler()
        self.pattern_detector = KMeans(n_clusters=5)
        self.anomaly_detector = IsolationForest(contamination=0.1)

    async def analyze_match(self, match_data: Dict) -> GameAnalytics:
        """Analyze a single match and generate comprehensive metrics."""
        shot_metrics = await self._analyze_shots(match_data)
        positional_metrics = await self._analyze_position(match_data)
        strategy_metrics = await self._analyze_strategy(match_data)
        pressure_metrics = await self._analyze_pressure(match_data)
        progression_metrics = await self._analyze_progression(match_data)

        return GameAnalytics(
            player_id=match_data["player_id"],
            match_id=match_data["match_id"],
            shot_metrics=shot_metrics,
            positional_metrics=positional_metrics,
            strategy_metrics=strategy_metrics,
            pressure_metrics=pressure_metrics,
            progression_metrics=progression_metrics,
        )

    async def analyze_player_progression(
        self, player_id: str, start_date: datetime, end_date: datetime
    ):
        """Analyze player's progression over a time period."""
        # Fetch historical match data
        matches = await self._get_player_matches(player_id, start_date, end_date)

        # Generate analytics for each match
        analytics = []
        for match in matches:
            match_analytics = await self.analyze_match(match)
            analytics.append(match_analytics)

        return analytics

    async def generate_performance_insights(self, analytics: List[GameAnalytics]):
        """Generate insights from a series of game analytics."""
        return {
            "trends": await self._analyze_trends(analytics),
            "patterns": await self._detect_patterns(analytics),
            "anomalies": await self._detect_anomalies(analytics),
            "recommendations": await self._generate_recommendations(analytics),
        }

    async def _analyze_shots(self, match_data: Dict):
        """Analyze shot-related metrics from match data."""
        shots = match_data.get("shots", [])
        if not shots:
            return None

        success_rates = {}
        difficulties = {}
        position_controls = {}

        for shot in shots:
            shot_type = shot["type"]
            if shot_type not in success_rates:
                success_rates[shot_type] = []
                difficulties[shot_type] = []
                position_controls[shot_type] = []

            success_rates[shot_type].append(shot["success"])
            difficulties[shot_type].append(shot["difficulty"])
            position_controls[shot_type].append(shot["position_control"])

        # Calculate metrics for the most common shot type
        primary_shot_type = max(
            success_rates.keys(), key=lambda k: len(success_rates[k])
        )

        return ShotMetrics(
            type=primary_shot_type,
            success_rate=np.mean(success_rates[primary_shot_type]),
            average_difficulty=np.mean(difficulties[primary_shot_type]),
            position_control=np.mean(position_controls[primary_shot_type]),
            consistency_score=self._calculate_consistency(
                success_rates[primary_shot_type]
            ),
            preferred_angles=self._identify_preferred_angles(shots),
            common_patterns=self._identify_shot_patterns(shots),
        )

    async def _analyze_position(self, match_data: Dict) -> PositionalMetrics:
        """Analyze position-related metrics from match data."""
        positions = match_data.get("positions", [])
        if not positions:
            return None

        return PositionalMetrics(
            table_coverage=self._calculate_table_coverage(positions),
            zone_preferences=self._calculate_zone_preferences(positions),
            movement_patterns=self._identify_movement_patterns(positions),
            position_accuracy=self._calculate_position_accuracy(positions),
            recovery_rate=self._calculate_recovery_rate(positions),
        )

    async def _analyze_strategy(self, match_data: Dict) -> StrategyMetrics:
        """Analyze strategy-related metrics from match data."""
        decisions = match_data.get("decisions", [])
        if not decisions:
            return None

        return StrategyMetrics(
            safety_success_rate=self._calculate_safety_success(decisions),
            risk_assessment=self._evaluate_risk_assessment(decisions),
            pattern_recognition=self._evaluate_pattern_recognition(decisions),
            adaptability=self._calculate_adaptability(decisions),
            decision_quality=self._evaluate_decision_quality(decisions),
            common_strategies=self._identify_common_strategies(decisions),
        )

    async def _analyze_pressure(self, match_data: Dict) -> PressureMetrics:
        """Analyze pressure-related metrics from match data."""
        pressure_situations = self._identify_pressure_situations(match_data)
        if not pressure_situations:
            return None

        return PressureMetrics(
            clutch_performance=self._calculate_clutch_performance(pressure_situations),
            recovery_after_error=self._calculate_recovery_rate(pressure_situations),
            time_management=self._evaluate_time_management(pressure_situations),
            consistency_under_pressure=self._calculate_pressure_consistency(
                pressure_situations
            ),
            adaptation_to_pressure=self._calculate_pressure_adaptation(
                pressure_situations
            ),
        )

    async def _analyze_progression(self, match_data: Dict) -> ProgressionMetrics:
        """Analyze progression-related metrics from match data."""
        historical_data = await self._get_historical_data(match_data["player_id"])
        if not historical_data:
            return None

        return ProgressionMetrics(
            skill_development=self._calculate_skill_development(historical_data),
            learning_rate=self._calculate_learning_rate(historical_data),
            weakness_improvement=self._analyze_weakness_improvement(historical_data),
            consistency_trend=self._calculate_consistency_trend(historical_data),
            milestone_achievements=self._identify_milestones(historical_data),
        )

    def _calculate_consistency(self, values: List[float]) -> float:
        """Calculate consistency score based on standard deviation."""
        return 1 - min(1, np.std(values))

    def _identify_preferred_angles(self, shots: List[Dict]) -> List[float]:
        """Identify angles where the player performs best."""
        angles = [shot["angle"] for shot in shots if shot["success"]]
        if not angles:
            return []

        # Use clustering to identify preferred angles
        angles_2d = np.array(angles).reshape(-1, 1)
        clusters = self.pattern_detector.fit_predict(angles_2d)

        # Get cluster centers and sort by frequency
        unique, counts = np.unique(clusters, return_counts=True)
        sorted_clusters = sorted(zip(unique, counts), key=lambda x: x[1], reverse=True)

        return [
            float(self.pattern_detector.cluster_centers_[cluster[0]][0])
            for cluster in sorted_clusters[:3]
        ]

    async def _get_player_matches(
        self, player_id: str, start_date: datetime, end_date: datetime
    ) -> List[Dict]:
        """Fetch player's matches within the specified date range."""
        # TODO: Implement database query to fetch matches
        return []

    async def _get_historical_data(self, player_id: str):
        """Fetch historical performance data for a player."""
        # TODO: Implement database query to fetch historical data
        return []
