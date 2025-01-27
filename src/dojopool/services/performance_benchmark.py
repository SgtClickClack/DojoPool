from typing import Dict, List, Optional, Union
from dataclasses import dataclass
import logging
import asyncio
from datetime import datetime, timedelta
import statistics

from .system_integrator import SystemIntegrator


@dataclass
class BenchmarkConfig:
    duration: int = 300  # Duration in seconds
    collect_interval: int = 5  # Collection interval in seconds
    worker_load: int = 50  # Target worker load percentage
    game_load: int = 30  # Target game load percentage
    tournament_load: int = 20  # Target tournament load percentage
    venue_load: int = 40  # Target venue load percentage
    ai_load: int = 60  # Target AI load percentage


class PerformanceBenchmark:
    def __init__(
        self, system_integrator: SystemIntegrator, config: Optional[BenchmarkConfig] = None
    ):
        self.logger = logging.getLogger(__name__)
        self.system_integrator = system_integrator
        self.config = config or BenchmarkConfig()

        self.is_running = False
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.metrics_history: List[Dict] = []
        self.errors: List[str] = []

    async def start(self) -> None:
        """Start performance benchmark."""
        self.logger.info("Starting performance benchmark...")
        self.is_running = True
        self.start_time = datetime.now()
        self.metrics_history = []
        self.errors = []

        try:
            # Start system components if not already running
            if not self.system_integrator.is_running:
                await self.system_integrator.start()

            # Start metrics collection
            asyncio.create_task(self._collect_metrics_loop())
        except Exception as e:
            self.logger.error(f"Error starting benchmark: {str(e)}")
            self.errors.append(f"Benchmark start error: {str(e)}")
            await self.stop()
            raise

    async def stop(self) -> None:
        """Stop performance benchmark."""
        self.logger.info("Stopping performance benchmark...")
        self.is_running = False
        self.end_time = datetime.now()

    async def _collect_metrics_loop(self) -> None:
        """Continuously collect metrics at specified intervals."""
        while self.is_running:
            try:
                metrics = await self._collect_metrics()
                self.metrics_history.append(metrics)
                await asyncio.sleep(self.config.collect_interval)

                # Check if benchmark duration has elapsed
                if (datetime.now() - self.start_time) > timedelta(seconds=self.config.duration):
                    await self.stop()
                    break
            except Exception as e:
                self.logger.error(f"Error collecting metrics: {str(e)}")
                self.errors.append(f"Metrics collection error: {str(e)}")
                await asyncio.sleep(self.config.collect_interval)

    async def _collect_metrics(self) -> Dict:
        """Collect metrics from all components."""
        return {
            "timestamp": datetime.now().isoformat(),
            "worker_metrics": self.system_integrator.worker_pool.get_metrics(),
            "game_metrics": self.system_integrator.game_analytics.get_metrics(),
            "tournament_metrics": self.system_integrator.tournament_manager.get_metrics(),
            "venue_metrics": self.system_integrator.venue_manager.get_metrics(),
            "ai_metrics": self.system_integrator.ai_service.get_metrics(),
        }

    async def analyze_results(self) -> Dict:
        """Analyze benchmark results."""
        if not self.metrics_history:
            return {
                "error": "No metrics collected",
                "error_count": len(self.errors),
                "errors": self.errors,
            }

        results = {
            "duration": (self.end_time - self.start_time).total_seconds() if self.end_time else 0,
            "samples": len(self.metrics_history),
            "error_count": len(self.errors),
            "errors": self.errors,
            "worker_performance": self._analyze_worker_performance(),
            "game_performance": self._analyze_game_performance(),
            "tournament_performance": self._analyze_tournament_performance(),
            "venue_performance": self._analyze_venue_performance(),
            "ai_performance": self._analyze_ai_performance(),
            "resource_utilization": self._calculate_resource_utilization(),
            "alerts": self._generate_alerts(),
            "trends": self._analyze_trends(),
            "recommendations": await self._generate_recommendations(),
        }

        return results

    def _analyze_worker_performance(self) -> Dict:
        """Analyze worker pool performance metrics."""
        worker_metrics = [m["worker_metrics"] for m in self.metrics_history]
        return {
            "average_queue_length": statistics.mean(m["queue_length"] for m in worker_metrics),
            "max_queue_length": max(m["queue_length"] for m in worker_metrics),
            "average_active_workers": statistics.mean(m["active_workers"] for m in worker_metrics),
            "tasks_completed": sum(m["tasks_completed"] for m in worker_metrics),
            "idle_worker_ratio": statistics.mean(
                m["idle_workers"] / m["active_workers"] for m in worker_metrics
            ),
        }

    def _analyze_game_performance(self) -> Dict:
        """Analyze game analytics performance metrics."""
        game_metrics = [m["game_metrics"] for m in self.metrics_history]
        return {
            "average_response_time": statistics.mean(m["response_time"] for m in game_metrics),
            "max_response_time": max(m["response_time"] for m in game_metrics),
            "total_shots_analyzed": sum(m["shots_analyzed"] for m in game_metrics),
            "average_game_duration": statistics.mean(
                m["average_game_duration"] for m in game_metrics
            ),
            "shot_accuracy": statistics.mean(m["shot_accuracy"] for m in game_metrics),
        }

    def _analyze_tournament_performance(self) -> Dict:
        """Analyze tournament system performance metrics."""
        tournament_metrics = [m["tournament_metrics"] for m in self.metrics_history]
        return {
            "average_system_load": statistics.mean(m["system_load"] for m in tournament_metrics),
            "peak_system_load": max(m["system_load"] for m in tournament_metrics),
            "total_registered_players": max(m["registered_players"] for m in tournament_metrics),
            "match_completion_rate": statistics.mean(
                m["match_completion_rate"] for m in tournament_metrics
            ),
        }

    def _analyze_venue_performance(self) -> Dict:
        """Analyze venue management performance metrics."""
        venue_metrics = [m["venue_metrics"] for m in self.metrics_history]
        return {
            "average_capacity_usage": statistics.mean(m["capacity_usage"] for m in venue_metrics),
            "peak_capacity_usage": max(m["capacity_usage"] for m in venue_metrics),
            "average_active_players": statistics.mean(m["active_players"] for m in venue_metrics),
            "table_utilization": statistics.mean(m["table_utilization"] for m in venue_metrics),
        }

    def _analyze_ai_performance(self) -> Dict:
        """Analyze AI service performance metrics."""
        ai_metrics = [m["ai_metrics"] for m in self.metrics_history]
        return {
            "average_analysis_time": statistics.mean(m["analysis_time"] for m in ai_metrics),
            "max_analysis_time": max(m["analysis_time"] for m in ai_metrics),
            "total_requests": sum(m["analysis_requests"] for m in ai_metrics),
            "accuracy_rate": statistics.mean(m["accuracy_rate"] for m in ai_metrics),
            "prediction_confidence": statistics.mean(
                m["prediction_confidence"] for m in ai_metrics
            ),
        }

    def _calculate_resource_utilization(self) -> Dict[str, float]:
        """Calculate resource utilization for each component."""
        latest_metrics = self.metrics_history[-1]
        return {
            "worker_utilization": latest_metrics["worker_metrics"]["active_workers"]
            / (
                latest_metrics["worker_metrics"]["active_workers"]
                + latest_metrics["worker_metrics"]["idle_workers"]
            ),
            "game_server_utilization": latest_metrics["game_metrics"]["response_time"]
            / 200,  # 200ms threshold
            "tournament_system_utilization": latest_metrics["tournament_metrics"]["system_load"]
            / 100,
            "venue_resource_utilization": latest_metrics["venue_metrics"]["capacity_usage"] / 100,
            "ai_system_utilization": latest_metrics["ai_metrics"]["analysis_time"]
            / 500,  # 500ms threshold
        }

    def _generate_alerts(self) -> Dict[str, bool]:
        """Generate alerts based on performance thresholds."""
        latest_metrics = self.metrics_history[-1]
        return {
            "high_worker_load": latest_metrics["worker_metrics"]["queue_length"]
            > latest_metrics["worker_metrics"]["optimal_queue_length"],
            "high_game_latency": latest_metrics["game_metrics"]["response_time"] > 200,
            "high_tournament_load": latest_metrics["tournament_metrics"]["system_load"] > 75,
            "high_venue_capacity": latest_metrics["venue_metrics"]["capacity_usage"] > 85,
            "high_ai_latency": latest_metrics["ai_metrics"]["analysis_time"] > 500,
        }

    def _analyze_trends(self) -> Dict[str, str]:
        """Analyze performance trends over time."""
        if len(self.metrics_history) < 2:
            return {}

        first_metrics = self.metrics_history[0]
        last_metrics = self.metrics_history[-1]

        def calculate_trend(start: float, end: float) -> str:
            diff = end - start
            if abs(diff) < 0.05:  # 5% threshold for stability
                return "stable"
            return "increasing" if diff > 0 else "decreasing"

        return {
            "worker_load_trend": calculate_trend(
                first_metrics["worker_metrics"]["queue_length"],
                last_metrics["worker_metrics"]["queue_length"],
            ),
            "game_response_trend": calculate_trend(
                first_metrics["game_metrics"]["response_time"],
                last_metrics["game_metrics"]["response_time"],
            ),
            "tournament_load_trend": calculate_trend(
                first_metrics["tournament_metrics"]["system_load"],
                last_metrics["tournament_metrics"]["system_load"],
            ),
            "venue_capacity_trend": calculate_trend(
                first_metrics["venue_metrics"]["capacity_usage"],
                last_metrics["venue_metrics"]["capacity_usage"],
            ),
            "ai_performance_trend": calculate_trend(
                first_metrics["ai_metrics"]["analysis_time"],
                last_metrics["ai_metrics"]["analysis_time"],
            ),
        }

    async def _generate_recommendations(self) -> List[str]:
        """Generate performance optimization recommendations."""
        recommendations = []
        alerts = self._generate_alerts()

        if alerts["high_worker_load"]:
            recommendations.append(
                "Increase worker pool size to handle increased task queue length"
            )

        if alerts["high_game_latency"]:
            recommendations.extend(
                [
                    "Optimize game action processing to reduce response time",
                    "Consider implementing request batching for game actions",
                ]
            )

        if alerts["high_tournament_load"]:
            recommendations.extend(
                [
                    "Review tournament system resource allocation",
                    "Consider implementing tournament load balancing",
                ]
            )

        if alerts["high_venue_capacity"]:
            recommendations.extend(
                [
                    "Optimize venue capacity management",
                    "Consider implementing dynamic venue scaling",
                ]
            )

        if alerts["high_ai_latency"]:
            recommendations.extend(
                [
                    "Optimize AI analysis pipeline",
                    "Consider implementing AI request caching",
                ]
            )

        # Add trend-based recommendations
        trends = self._analyze_trends()
        for component, trend in trends.items():
            if trend == "increasing":
                recommendations.append(
                    f"Monitor {component.replace('_', ' ')} as it shows an increasing trend"
                )

        return recommendations
