"""Game analytics module.

This module provides advanced analytics capabilities for game analysis.
"""

from typing import Any, Dict, List, Optional

import numpy as np
from scipy import stats


class GameAnalytics:
    """Advanced game analytics processor."""

    def __init__(self, shot_history: List[Dict], game_state: Dict):
        """Initialize analytics processor.

        Args:
            shot_history: List of shot records
            game_state: Current game state
        """
        self.shot_history = shot_history
        self.game_state = game_state
        self._cached_results = {}

    def get_comprehensive_analysis(self) -> Dict[str, Any]:
        """Get comprehensive game analysis."""
        if "comprehensive_analysis" not in self._cached_results:
            self._cached_results["comprehensive_analysis"] = {
                "shot_patterns": self.analyze_shot_patterns(),
                "player_performance": self.analyze_player_performance(),
                "game_flow": self.analyze_game_flow(),
                "predictive_insights": self.generate_predictive_insights(),
            }
        return self._cached_results["comprehensive_analysis"]

    def analyze_shot_patterns(self) -> Dict[str, Any]:
        """Analyze shot patterns and sequences."""
        return {
            "common_sequences": self._identify_shot_sequences(),
            "position_patterns": self._analyze_position_patterns(),
            "shot_clustering": self._cluster_shots(),
            "pattern_effectiveness": self._evaluate_pattern_effectiveness(),
        }

    def analyze_player_performance(self) -> Dict[str, Any]:
        """Analyze detailed player performance metrics."""
        return {
            "skill_metrics": self._calculate_skill_metrics(),
            "consistency_analysis": self._analyze_consistency(),
            "adaptation_rate": self._calculate_adaptation_rate(),
            "pressure_handling": self._analyze_pressure_performance(),
        }

    def analyze_game_flow(self) -> Dict[str, Any]:
        """Analyze game flow and momentum."""
        return {
            "momentum_shifts": self._detect_momentum_shifts(),
            "critical_moments": self._identify_critical_moments(),
            "pace_analysis": self._analyze_game_pace(),
            "strategic_patterns": self._analyze_strategic_patterns(),
        }

    def generate_predictive_insights(self) -> Dict[str, Any]:
        """Generate predictive insights based on patterns."""
        return {
            "success_probability": self._calculate_success_probabilities(),
            "pattern_recommendations": self._generate_pattern_recommendations(),
            "risk_assessment": self._assess_risk_factors(),
            "optimization_suggestions": self._generate_optimization_suggestions(),
        }

    def _identify_shot_sequences(self) -> List[Dict[str, Any]]:
        """Identify recurring shot sequences."""
        sequences = []
        min_sequence_length = 3

        for i in range(len(self.shot_history) - min_sequence_length + 1):
            sequence = self.shot_history[i : i + min_sequence_length]
            pattern = self._extract_sequence_pattern(sequence)
            similar_sequences = self._find_similar_sequences(pattern)

            if len(similar_sequences) > 1:
                sequences.append(
                    {
                        "pattern": pattern,
                        "occurrences": len(similar_sequences),
                        "success_rate": self._calculate_sequence_success_rate(similar_sequences),
                        "examples": similar_sequences[:3],
                    }
                )

        return sorted(sequences, key=lambda x: (x["occurrences"], x["success_rate"]), reverse=True)

    def _analyze_position_patterns(self) -> Dict[str, Any]:
        """Analyze patterns in position play."""
        position_shots = [s for s in self.shot_history if s.get("position_intended")]

        return {
            "zone_preferences": self._analyze_zone_preferences(position_shots),
            "success_by_zone": self._calculate_zone_success_rates(position_shots),
            "common_routes": self._identify_position_routes(position_shots),
            "effectiveness": self._evaluate_position_effectiveness(position_shots),
        }

    def _cluster_shots(self) -> Dict[str, Any]:
        """Cluster shots based on characteristics."""
        shot_features = self._extract_shot_features()
        clusters = self._perform_shot_clustering(shot_features)

        return {
            "clusters": clusters,
            "cluster_stats": self._calculate_cluster_statistics(clusters),
            "cluster_patterns": self._identify_cluster_patterns(clusters),
        }

    def _calculate_skill_metrics(self) -> Dict[str, float]:
        """Calculate various skill metrics."""
        return {
            "accuracy": self._calculate_accuracy_score(),
            "consistency": self._calculate_consistency_score(),
            "versatility": self._calculate_versatility_score(),
            "efficiency": self._calculate_efficiency_score(),
        }

    def _analyze_consistency(self) -> Dict[str, Any]:
        """Analyze player consistency across different aspects."""
        return {
            "shot_consistency": self._analyze_shot_consistency(),
            "position_consistency": self._analyze_position_consistency(),
            "performance_stability": self._analyze_performance_stability(),
        }

    def _detect_momentum_shifts(self) -> List[Dict[str, Any]]:
        """Detect and analyze momentum shifts."""
        shifts = []
        window_size = 5

        for i in range(len(self.shot_history) - window_size):
            window = self.shot_history[i : i + window_size]
            if self._is_momentum_shift(window):
                shifts.append(
                    {
                        "index": i,
                        "type": self._determine_shift_type(window),
                        "magnitude": self._calculate_shift_magnitude(window),
                        "context": self._get_shift_context(window),
                    }
                )

        return shifts

    def _calculate_success_probabilities(self) -> Dict[str, float]:
        """Calculate success probabilities for different shot types."""
        shot_types = {s.get("shot_type") for s in self.shot_history if s.get("shot_type")}
        probabilities = {}

        for shot_type in shot_types:
            type_shots = [s for s in self.shot_history if s.get("shot_type") == shot_type]
            success_rate = len([s for s in type_shots if s.get("result") == "success"]) / len(
                type_shots
            )
            probabilities[shot_type] = success_rate

        return probabilities

    def _generate_optimization_suggestions(self) -> List[Dict[str, Any]]:
        """Generate suggestions for performance optimization."""
        return [
            {
                "aspect": aspect,
                "current_performance": self._calculate_aspect_performance(aspect),
                "potential_improvement": self._estimate_improvement_potential(aspect),
                "suggested_actions": self._generate_improvement_actions(aspect),
            }
            for aspect in ["accuracy", "position", "strategy", "consistency"]
        ]

    def _calculate_aspect_performance(self, aspect: str) -> float:
        """Calculate performance score for a specific aspect."""
        if aspect == "accuracy":
            return self._calculate_accuracy_score()
        elif aspect == "position":
            return self._calculate_position_score()
        elif aspect == "strategy":
            return self._calculate_strategy_score()
        elif aspect == "consistency":
            return self._calculate_consistency_score()
        return 0.0

    def _estimate_improvement_potential(self, aspect: str) -> float:
        """Estimate potential improvement for an aspect."""
        current_score = self._calculate_aspect_performance(aspect)
        return max(0.0, min(1.0, current_score * 1.2))  # 20% improvement potential

    def _generate_improvement_actions(self, aspect: str) -> List[str]:
        """Generate specific improvement actions for an aspect."""
        if aspect == "accuracy":
            return [
                "Focus on pre-shot routine consistency",
                "Practice alignment and sighting techniques",
                "Work on stroke smoothness and follow-through",
            ]
        elif aspect == "position":
            return [
                "Plan position for next 2-3 shots",
                "Practice speed control drills",
                "Study common position routes",
            ]
        elif aspect == "strategy":
            return [
                "Analyze opponent patterns",
                "Practice safety play options",
                "Develop multiple approach strategies",
            ]
        elif aspect == "consistency":
            return [
                "Maintain consistent pre-shot routine",
                "Practice under pressure situations",
                "Focus on fundamentals in practice",
            ]
        return []

    def _extract_sequence_pattern(self, sequence: List[Dict]) -> List[Dict]:
        """Extract pattern features from a sequence of shots."""
        return [
            {
                "shot_type": shot.get("shot_type"),
                "power_range": self._get_power_range(shot.get("power", 0)),
                "spin_type": shot.get("spin_type"),
                "position_zone": self._get_position_zone(shot),
            }
            for shot in sequence
        ]

    def _find_similar_sequences(self, pattern: List[Dict]) -> List[List[Dict]]:
        """Find sequences similar to the given pattern."""
        similar_sequences = []
        min_similarity = 0.8

        for i in range(len(self.shot_history) - len(pattern) + 1):
            sequence = self.shot_history[i : i + len(pattern)]
            if self._calculate_sequence_similarity(pattern, sequence) >= min_similarity:
                similar_sequences.append(sequence)

        return similar_sequences

    def _calculate_sequence_similarity(self, pattern: List[Dict], sequence: List[Dict]) -> float:
        """Calculate similarity between a pattern and a sequence."""
        if len(pattern) != len(sequence):
            return 0.0

        matches = 0
        total_attributes = len(pattern) * 4

        for p_shot, s_shot in zip(pattern, sequence):
            if p_shot["shot_type"] == s_shot.get("shot_type"):
                matches += 1
            if p_shot["power_range"] == self._get_power_range(s_shot.get("power", 0)):
                matches += 1
            if p_shot["spin_type"] == s_shot.get("spin_type"):
                matches += 1
            if p_shot["position_zone"] == self._get_position_zone(s_shot):
                matches += 1

        return matches / total_attributes

    def _get_power_range(self, power: float) -> str:
        """Categorize power into ranges."""
        if power < 0.3:
            return "soft"
        elif power < 0.7:
            return "medium"
        return "hard"

    def _get_position_zone(self, shot: Dict) -> Optional[str]:
        """Get the table zone for a shot."""
        if "position" in shot:
            x, y = shot["position"]
            zone_x = int(x * 3)
            zone_y = int(y * 3)
            return f"zone_{zone_x}_{zone_y}"
        return None

    def _analyze_zone_preferences(self, shots: List[Dict]) -> Dict[str, Any]:
        """Analyze preferred zones for position play."""
        zones = {f"zone_{i}_{j}": 0 for i in range(3) for j in range(3)}

        for shot in shots:
            zone = self._get_position_zone(shot)
            if zone:
                zones[zone] += 1

        total_shots = sum(zones.values())
        if total_shots > 0:
            zones = {k: v / total_shots for k, v in zones.items()}

        return {
            "zone_frequencies": zones,
            "preferred_zones": sorted(zones.items(), key=lambda x: x[1], reverse=True)[:3],
        }

    def _calculate_zone_success_rates(self, shots: List[Dict]) -> Dict[str, float]:
        """Calculate success rates for different table zones."""
        zone_stats = {
            f"zone_{i}_{j}": {"attempts": 0, "success": 0} for i in range(3) for j in range(3)
        }

        for shot in shots:
            zone = self._get_position_zone(shot)
            if zone:
                zone_stats[zone]["attempts"] += 1
                if shot.get("result") == "success":
                    zone_stats[zone]["success"] += 1

        return {
            zone: stats["success"] / stats["attempts"] if stats["attempts"] > 0 else 0
            for zone, stats in zone_stats.items()
        }

    def _identify_position_routes(self, shots: List[Dict]) -> List[Dict[str, Any]]:
        """Identify common position play routes."""
        routes = []
        min_route_length = 3

        for i in range(len(shots) - min_route_length + 1):
            route = shots[i : i + min_route_length]
            route_pattern = [self._get_position_zone(shot) for shot in route]

            if all(zone is not None for zone in route_pattern):
                routes.append(
                    {
                        "pattern": route_pattern,
                        "success": all(shot.get("result") == "success" for shot in route),
                        "shots": route,
                    }
                )

        return sorted(routes, key=lambda x: x["success"], reverse=True)[:10]

    def _evaluate_position_effectiveness(self, shots: List[Dict]) -> Dict[str, Any]:
        """Evaluate effectiveness of position play."""
        if not shots:
            return {"overall_effectiveness": 0, "consistency": 0, "adaptability": 0}

        # Calculate overall effectiveness
        successful_position = len([s for s in shots if s.get("position_success")])
        overall_effectiveness = successful_position / len(shots)

        # Calculate consistency
        intended_vs_actual = []
        for shot in shots:
            if "intended_position" in shot and "actual_position" in shot:
                intended = shot["intended_position"]
                actual = shot["actual_position"]
                distance = ((intended[0] - actual[0]) ** 2 + (intended[1] - actual[1]) ** 2) ** 0.5
                intended_vs_actual.append(1 - min(1, distance))

        consistency = np.mean(intended_vs_actual) if intended_vs_actual else 0

        # Calculate adaptability
        adaptability = self._calculate_position_adaptability(shots)

        return {
            "overall_effectiveness": overall_effectiveness,
            "consistency": consistency,
            "adaptability": adaptability,
        }

    def _calculate_position_adaptability(self, shots: List[Dict]) -> float:
        """Calculate player's adaptability in position play."""
        if len(shots) < 5:
            return 0

        # Calculate success rate changes over time
        window_size = 5
        success_rates = []

        for i in range(0, len(shots) - window_size + 1):
            window = shots[i : i + window_size]
            success_rate = len([s for s in window if s.get("position_success")]) / window_size
            success_rates.append(success_rate)

        # Calculate trend
        if len(success_rates) > 1:
            slope, _, _, _, _ = stats.linregress(range(len(success_rates)), success_rates)
            return max(0, min(1, slope + 0.5))  # Normalize to 0-1 range

        return 0

    def _extract_shot_features(self) -> np.ndarray:
        """Extract numerical features from shots for clustering."""
        features = []
        for shot in self.shot_history:
            feature_vector = [
                shot.get("power", 0),
                shot.get("angle", 0) / 360,  # Normalize angle
                1 if shot.get("spin") else 0,
                shot.get("difficulty", 0),
            ]
            features.append(feature_vector)
        return np.array(features)

    def _perform_shot_clustering(self, features: np.ndarray) -> List[Dict[str, Any]]:
        """Perform clustering on shot features."""
        if len(features) < 2:
            return []

        # Use K-means clustering
        from sklearn.cluster import KMeans

        n_clusters = min(5, len(features))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        clusters = kmeans.fit_predict(features)

        # Organize shots by cluster
        clustered_shots = []
        for i in range(n_clusters):
            cluster_shots = [self.shot_history[j] for j in range(len(clusters)) if clusters[j] == i]
            clustered_shots.append(
                {
                    "cluster_id": i,
                    "shots": cluster_shots,
                    "center": kmeans.cluster_centers_[i].tolist(),
                    "size": len(cluster_shots),
                }
            )

        return clustered_shots

    def _calculate_cluster_statistics(self, clusters: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate statistics for each shot cluster."""
        stats = []
        for cluster in clusters:
            cluster_stats = {
                "cluster_id": cluster["cluster_id"],
                "size": cluster["size"],
                "success_rate": self._calculate_success_rate(cluster["shots"]),
                "avg_power": np.mean([s.get("power", 0) for s in cluster["shots"]]),
                "common_types": self._get_common_shot_types(cluster["shots"]),
            }
            stats.append(cluster_stats)
        return stats

    def _get_common_shot_types(self, shots: List[Dict]) -> List[tuple]:
        """Get most common shot types in a cluster."""
        type_counts = {}
        for shot in shots:
            shot_type = shot.get("shot_type", "unknown")
            type_counts[shot_type] = type_counts.get(shot_type, 0) + 1

        return sorted(type_counts.items(), key=lambda x: x[1], reverse=True)

    def _calculate_success_rate(self, shots: List[Dict]) -> float:
        """Calculate success rate for a set of shots."""
        if not shots:
            return 0
        successful = sum(1 for s in shots if s.get("result") == "success")
        return successful / len(shots)

    def _calculate_accuracy_score(self) -> float:
        """Calculate overall accuracy score."""
        if not self.shot_history:
            return 0

        weights = {"success_rate": 0.4, "position_accuracy": 0.3, "difficulty_factor": 0.3}

        success_rate = self._calculate_success_rate(self.shot_history)
        position_accuracy = self._calculate_position_accuracy()
        difficulty_factor = self._calculate_difficulty_factor()

        return (
            success_rate * weights["success_rate"]
            + position_accuracy * weights["position_accuracy"]
            + difficulty_factor * weights["difficulty_factor"]
        )

    def _calculate_position_accuracy(self) -> float:
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

        return np.mean(accuracies) if accuracies else 0

    def _calculate_difficulty_factor(self) -> float:
        """Calculate overall difficulty factor of successful shots."""
        successful_shots = [s for s in self.shot_history if s.get("result") == "success"]
        if not successful_shots:
            return 0

        difficulties = [s.get("difficulty", 0) for s in successful_shots]
        return np.mean(difficulties)

    def _analyze_shot_consistency(self) -> Dict[str, float]:
        """Analyze consistency in different shot aspects."""
        return {
            "power_consistency": self._calculate_power_consistency(),
            "angle_consistency": self._calculate_angle_consistency(),
            "spin_consistency": self._calculate_spin_consistency(),
        }

    def _calculate_power_consistency(self) -> float:
        """Calculate consistency in power application."""
        powers = [s.get("power", 0) for s in self.shot_history if s.get("power") is not None]
        return 1 - np.std(powers) if powers else 0

    def _calculate_angle_consistency(self) -> float:
        """Calculate consistency in shot angles."""
        angles = [s.get("angle", 0) for s in self.shot_history if s.get("angle") is not None]
        return 1 - np.std(angles) / 360 if angles else 0

    def _calculate_spin_consistency(self) -> float:
        """Calculate consistency in spin application."""
        spin_shots = [s for s in self.shot_history if s.get("spin")]
        if not spin_shots:
            return 0

        spin_types = [s.get("spin_type") for s in spin_shots]
        _, counts = np.unique(spin_types, return_counts=True)
        return np.max(counts) / len(spin_shots) if spin_shots else 0

    def _is_momentum_shift(self, window: List[Dict]) -> bool:
        """Determine if a window of shots represents a momentum shift."""
        if len(window) < 5:
            return False

        # Calculate success rates for first and second half of window
        mid = len(window) // 2
        first_half = window[:mid]
        second_half = window[mid:]

        first_rate = self._calculate_success_rate(first_half)
        second_rate = self._calculate_success_rate(second_half)

        return abs(second_rate - first_rate) > 0.3  # 30% change threshold

    def _determine_shift_type(self, window: List[Dict]) -> str:
        """Determine the type of momentum shift."""
        mid = len(window) // 2
        first_rate = self._calculate_success_rate(window[:mid])
        second_rate = self._calculate_success_rate(window[mid:])

        if second_rate > first_rate:
            return "positive"
        return "negative"

    def _calculate_shift_magnitude(self, window: List[Dict]) -> float:
        """Calculate the magnitude of a momentum shift."""
        mid = len(window) // 2
        first_rate = self._calculate_success_rate(window[:mid])
        second_rate = self._calculate_success_rate(window[mid:])

        return abs(second_rate - first_rate)

    def _get_shift_context(self, window: List[Dict]) -> Dict[str, Any]:
        """Get context information for a momentum shift."""
        return {
            "frame_number": window[-1].get("frame_number"),
            "score_before": window[0].get("score"),
            "score_after": window[-1].get("score"),
            "player_id": window[-1].get("player_id"),
            "shot_types": [s.get("shot_type") for s in window],
        }
