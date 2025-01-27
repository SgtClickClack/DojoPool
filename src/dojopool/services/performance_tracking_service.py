from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import numpy as np
from models.shot import Shot
from models.player import Player
from services.shot_analysis import ShotAnalysis
from utils.analysis import analyze_shot_pattern, calculate_player_rating


class PerformanceTrackingService:
    def __init__(self):
        self.shot_analysis = ShotAnalysis()
        self.performance_metrics = {
            "accuracy": {"weight": 0.3, "threshold": 0.7},
            "consistency": {"weight": 0.25, "threshold": 0.6},
            "versatility": {"weight": 0.2, "threshold": 0.5},
            "difficulty": {"weight": 0.25, "threshold": 0.4},
        }

    def track_player_performance(
        self, player_id: str, time_range: Optional[Dict[str, datetime]] = None
    ) -> Dict[str, Any]:
        """
        Track and analyze player performance over time
        """
        # Get player's shots
        shots = Shot.get_player_shots(player_id, time_range)

        if not shots:
            return {"error": "No performance data available", "player_id": player_id}

        # Calculate performance metrics
        performance_data = self._calculate_performance_metrics(shots)

        # Analyze trends
        trends = self._analyze_performance_trends(shots)

        # Generate insights
        insights = self._generate_performance_insights(performance_data, trends)

        # Calculate skill progression
        progression = self._calculate_skill_progression(shots)

        return {
            "player_id": player_id,
            "timestamp": datetime.utcnow(),
            "metrics": performance_data,
            "trends": trends,
            "insights": insights,
            "progression": progression,
        }

    def get_performance_summary(self, player_id: str, period: str = "week") -> Dict[str, Any]:
        """
        Get a summary of player performance for a specific period
        """
        # Calculate time range
        end_date = datetime.utcnow()
        if period == "week":
            start_date = end_date - timedelta(days=7)
        elif period == "month":
            start_date = end_date - timedelta(days=30)
        elif period == "year":
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=7)  # Default to week

        time_range = {"start": start_date, "end": end_date}

        # Get performance data
        performance = self.track_player_performance(player_id, time_range)

        if "error" in performance:
            return performance

        # Calculate summary metrics
        summary = self._generate_performance_summary(performance)

        # Add recommendations
        recommendations = self._generate_recommendations(performance)

        return {
            "player_id": player_id,
            "period": period,
            "summary": summary,
            "recommendations": recommendations,
            "timestamp": datetime.utcnow(),
        }

    def compare_players(
        self, player_ids: List[str], metrics: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Compare performance metrics between multiple players
        """
        if not metrics:
            metrics = ["accuracy", "consistency", "versatility", "difficulty"]

        comparisons = {}
        for player_id in player_ids:
            performance = self.track_player_performance(player_id)
            if "error" not in performance:
                comparisons[player_id] = {
                    metric: performance["metrics"][metric]
                    for metric in metrics
                    if metric in performance["metrics"]
                }

        # Calculate rankings for each metric
        rankings = self._calculate_player_rankings(comparisons, metrics)

        return {"comparisons": comparisons, "rankings": rankings, "timestamp": datetime.utcnow()}

    def _calculate_performance_metrics(self, shots: List[Shot]) -> Dict[str, float]:
        """
        Calculate comprehensive performance metrics
        """
        # Calculate accuracy
        successful_shots = sum(1 for shot in shots if shot.result)
        accuracy = successful_shots / len(shots) if shots else 0

        # Calculate consistency using shot patterns
        shot_pattern = analyze_shot_pattern(shots)
        consistency = np.mean(list(shot_pattern["consistency"].values()))

        # Calculate versatility based on shot types used
        shot_types_used = len(
            set(
                self.shot_analysis._determine_shot_type(shot.power, shot.spin, shot.result)
                for shot in shots
            )
        )
        versatility = min(1.0, shot_types_used / len(self.shot_analysis.shot_types))

        # Calculate average shot difficulty
        difficulties = [
            self.shot_analysis._calculate_difficulty(
                shot.power, shot.angle, shot.spin, shot.english
            )
            for shot in shots
        ]
        avg_difficulty = np.mean(difficulties) if difficulties else 0

        return {
            "accuracy": float(accuracy),
            "consistency": float(consistency),
            "versatility": float(versatility),
            "difficulty": float(avg_difficulty),
        }

    def _analyze_performance_trends(self, shots: List[Shot]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Analyze trends in performance metrics over time
        """
        # Sort shots by timestamp
        sorted_shots = sorted(shots, key=lambda x: x.timestamp)

        # Calculate moving averages for each metric
        window_size = min(10, len(shots))
        trends = {"accuracy": [], "difficulty": [], "versatility": []}

        for i in range(len(sorted_shots) - window_size + 1):
            window = sorted_shots[i : i + window_size]
            timestamp = window[-1].timestamp

            # Calculate metrics for window
            metrics = self._calculate_performance_metrics(window)

            for metric, value in metrics.items():
                if metric in trends:
                    trends[metric].append({"timestamp": timestamp, "value": value})

        return trends

    def _generate_performance_insights(
        self, metrics: Dict[str, float], trends: Dict[str, List[Dict[str, Any]]]
    ) -> Dict[str, List[str]]:
        """
        Generate insights based on performance metrics and trends
        """
        insights = {"strengths": [], "weaknesses": [], "improvements": [], "areas_for_focus": []}

        # Analyze metrics against thresholds
        for metric, data in self.performance_metrics.items():
            if metrics[metric] >= data["threshold"]:
                insights["strengths"].append(f"Strong {metric} rating at {metrics[metric]:.2f}")
            else:
                insights["weaknesses"].append(f"Below average {metric} at {metrics[metric]:.2f}")

        # Analyze trends
        for metric, trend_data in trends.items():
            if len(trend_data) >= 2:
                start_value = trend_data[0]["value"]
                end_value = trend_data[-1]["value"]
                change = end_value - start_value

                if change > 0.1:
                    insights["improvements"].append(f"Improving {metric} trend (+{change:.2f})")
                elif change < -0.1:
                    insights["areas_for_focus"].append(f"Declining {metric} trend ({change:.2f})")

        return insights

    def _calculate_skill_progression(self, shots: List[Shot]) -> Dict[str, Any]:
        """
        Calculate skill progression over time
        """
        # Sort shots by timestamp
        sorted_shots = sorted(shots, key=lambda x: x.timestamp)

        # Calculate progression metrics
        progression = {
            "start_rating": None,
            "current_rating": None,
            "improvement_rate": 0,
            "milestones": [],
        }

        if len(sorted_shots) >= 2:
            # Calculate initial rating
            initial_window = sorted_shots[:10]
            initial_metrics = self._calculate_performance_metrics(initial_window)
            progression["start_rating"] = self._calculate_overall_rating(initial_metrics)

            # Calculate current rating
            current_window = sorted_shots[-10:]
            current_metrics = self._calculate_performance_metrics(current_window)
            progression["current_rating"] = self._calculate_overall_rating(current_metrics)

            # Calculate improvement rate
            time_diff = (sorted_shots[-1].timestamp - sorted_shots[0].timestamp).days
            if time_diff > 0:
                rating_diff = progression["current_rating"] - progression["start_rating"]
                progression["improvement_rate"] = rating_diff / time_diff

            # Identify milestones
            progression["milestones"] = self._identify_milestones(sorted_shots)

        return progression

    def _calculate_overall_rating(self, metrics: Dict[str, float]) -> float:
        """
        Calculate overall rating from performance metrics
        """
        rating = 0
        for metric, value in metrics.items():
            if metric in self.performance_metrics:
                rating += value * self.performance_metrics[metric]["weight"]
        return rating * 100

    def _identify_milestones(self, shots: List[Shot]) -> List[Dict[str, Any]]:
        """
        Identify significant milestones in player's progression
        """
        milestones = []
        window_size = 10

        for i in range(0, len(shots) - window_size, window_size):
            window = shots[i : i + window_size]
            metrics = self._calculate_performance_metrics(window)
            rating = self._calculate_overall_rating(metrics)

            # Check for significant improvements
            if i > 0:
                prev_window = shots[i - window_size : i]
                prev_metrics = self._calculate_performance_metrics(prev_window)
                prev_rating = self._calculate_overall_rating(prev_metrics)

                if rating > prev_rating + 10:  # Significant improvement threshold
                    milestones.append(
                        {
                            "timestamp": window[-1].timestamp,
                            "type": "improvement",
                            "description": f"Significant rating increase: {rating:.1f}",
                            "rating": rating,
                        }
                    )

        return milestones

    def _calculate_player_rankings(
        self, comparisons: Dict[str, Dict[str, float]], metrics: List[str]
    ) -> Dict[str, Dict[str, int]]:
        """
        Calculate player rankings for each metric
        """
        rankings = {metric: {} for metric in metrics}

        for metric in metrics:
            # Sort players by metric value
            sorted_players = sorted(
                comparisons.items(), key=lambda x: x[1].get(metric, 0), reverse=True
            )

            # Assign rankings
            for rank, (player_id, _) in enumerate(sorted_players, 1):
                rankings[metric][player_id] = rank

        return rankings

    def _generate_performance_summary(self, performance: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a concise performance summary
        """
        metrics = performance["metrics"]
        trends = performance["trends"]

        # Calculate overall rating
        overall_rating = self._calculate_overall_rating(metrics)

        # Determine performance level
        if overall_rating >= 80:
            level = "Expert"
        elif overall_rating >= 60:
            level = "Advanced"
        elif overall_rating >= 40:
            level = "Intermediate"
        else:
            level = "Beginner"

        # Calculate trend direction
        trend_direction = "stable"
        if trends["accuracy"] and len(trends["accuracy"]) >= 2:
            start_acc = trends["accuracy"][0]["value"]
            end_acc = trends["accuracy"][-1]["value"]
            if end_acc > start_acc + 0.1:
                trend_direction = "improving"
            elif end_acc < start_acc - 0.1:
                trend_direction = "declining"

        return {
            "overall_rating": overall_rating,
            "performance_level": level,
            "trend": trend_direction,
            "key_metrics": {
                metric: value
                for metric, value in metrics.items()
                if value >= self.performance_metrics[metric]["threshold"]
            },
        }

    def _generate_recommendations(self, performance: Dict[str, Any]) -> List[str]:
        """
        Generate personalized recommendations based on performance data
        """
        recommendations = []
        metrics = performance["metrics"]
        insights = performance["insights"]

        # Add recommendations based on metrics
        for metric, data in self.performance_metrics.items():
            if metrics[metric] < data["threshold"]:
                if metric == "accuracy":
                    recommendations.append(
                        "Focus on fundamental shot techniques to improve accuracy"
                    )
                elif metric == "consistency":
                    recommendations.append(
                        "Practice maintaining consistent power and angle control"
                    )
                elif metric == "versatility":
                    recommendations.append(
                        "Experiment with different shot types to increase versatility"
                    )
                elif metric == "difficulty":
                    recommendations.append(
                        "Gradually increase shot difficulty in practice sessions"
                    )

        # Add recommendations based on insights
        for weakness in insights["weaknesses"]:
            if "accuracy" in weakness.lower():
                recommendations.append("Dedicate practice time to basic shot repetition")
            elif "consistency" in weakness.lower():
                recommendations.append(
                    "Focus on developing muscle memory through repetitive drills"
                )

        return recommendations
