import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .ai_service import AIService
from .game_analytics import GameAnalytics
from .tournament_manager import TournamentManager
from .venue_manager import VenueManager
from .worker_pool import WorkerPool


@dataclass
class MetricConfig:
    name: str
    description: str
    threshold: float
    warning_threshold: float
    critical_threshold: float
    unit: str


class PerformanceMonitor:
    def __init__(
        self,
        worker_pool: Optional[WorkerPool] = None,
        game_analytics: Optional[GameAnalytics] = None,
        tournament_manager: Optional[TournamentManager] = None,
        venue_manager: Optional[VenueManager] = None,
        ai_service: Optional[AIService] = None,
    ):
        self.logger = logging.getLogger(__name__)
        self.worker_pool = worker_pool
        self.game_analytics = game_analytics
        self.tournament_manager = tournament_manager
        self.venue_manager = venue_manager
        self.ai_service = ai_service

        self.is_monitoring = False
        self._monitor_task = None

        # Define metrics configuration
        self.metrics_config = {
            "worker_utilization": MetricConfig(
                name="Worker Pool Utilization",
                description="Worker pool resource utilization",
                threshold=80.0,
                warning_threshold=70.0,
                critical_threshold=90.0,
                unit="%",
            ),
            "game_response_time": MetricConfig(
                name="Game Response Time",
                description="Average response time for game actions",
                threshold=200.0,
                warning_threshold=150.0,
                critical_threshold=300.0,
                unit="ms",
            ),
            "tournament_load": MetricConfig(
                name="Tournament System Load",
                description="Tournament system resource usage",
                threshold=75.0,
                warning_threshold=65.0,
                critical_threshold=85.0,
                unit="%",
            ),
            "venue_capacity": MetricConfig(
                name="Venue Capacity Usage",
                description="Venue system capacity utilization",
                threshold=85.0,
                warning_threshold=75.0,
                critical_threshold=95.0,
                unit="%",
            ),
            "ai_analysis_time": MetricConfig(
                name="AI Analysis Time",
                description="Average time for AI shot analysis",
                threshold=500.0,
                warning_threshold=400.0,
                critical_threshold=750.0,
                unit="ms",
            ),
        }

        # Initialize metrics storage
        self.metrics_history: List[Dict[str, Any]] = []
        self.alerts_history: List[Dict[str, Any]] = []

    async def start_monitoring(self, interval_seconds: int = 60):
        """Start performance monitoring."""
        if self.is_monitoring:
            return

        self.is_monitoring = True
        self._monitor_task = asyncio.create_task(
            self._collect_metrics_loop(interval_seconds)
        )
        self.logger.info("Started performance monitoring")

    async def stop_monitoring(self):
        """Stop performance monitoring."""
        if not self.is_monitoring:
            return

        self.is_monitoring = False
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        self.logger.info("Stopped performance monitoring")

    async def _collect_metrics_loop(self, interval_seconds: int):
        """Continuously collect metrics at specified intervals."""
        while self.is_monitoring:
            try:
                metrics = await self._collect_system_metrics()
                self.metrics_history.append(metrics)
                await self._analyze_metrics(metrics)
                await asyncio.sleep(interval_seconds)
            except Exception as e:
                self.logger.error(f"Error collecting metrics: {str(e)}")
                await asyncio.sleep(interval_seconds)

    async def _collect_system_metrics(self) -> Dict[str, Any]:
        """Collect metrics from all monitored systems."""
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "worker_metrics": {},
            "game_metrics": {},
            "tournament_metrics": {},
            "venue_metrics": {},
            "ai_metrics": {},
        }

        try:
            if self.worker_pool:
                metrics["worker_metrics"] = await self.worker_pool.get_metrics()
            if self.game_analytics:
                metrics["game_metrics"] = await self.game_analytics.get_metrics()
            if self.tournament_manager:
                metrics["tournament_metrics"] = (
                    await self.tournament_manager.get_metrics()
                )
            if self.venue_manager:
                metrics["venue_metrics"] = await self.venue_manager.get_metrics()
            if self.ai_service:
                metrics["ai_metrics"] = await self.ai_service.get_metrics()
        except Exception as e:
            self.logger.error(f"Error collecting system metrics: {str(e)}")

        return metrics

    async def _analyze_metrics(self, metrics: Dict[str, Any]):
        """Analyze collected metrics and generate alerts if needed."""
        alerts = []

        # Check worker utilization
        if (
            metrics.get("worker_metrics", {}).get("utilization", 0)
            > self.metrics_config["worker_utilization"].threshold
        ):
            alerts.append(
                {
                    "timestamp": datetime.now().isoformat(),
                    "type": "worker_utilization",
                    "severity": "warning",
                    "message": "High worker pool utilization detected",
                }
            )

        # Check game response time
        if (
            metrics.get("game_metrics", {}).get("response_time", 0)
            > self.metrics_config["game_response_time"].threshold
        ):
            alerts.append(
                {
                    "timestamp": datetime.now().isoformat(),
                    "type": "game_response_time",
                    "severity": "warning",
                    "message": "High game response time detected",
                }
            )

        # Check tournament load
        if (
            metrics.get("tournament_metrics", {}).get("load", 0)
            > self.metrics_config["tournament_load"].threshold
        ):
            alerts.append(
                {
                    "timestamp": datetime.now().isoformat(),
                    "type": "tournament_load",
                    "severity": "warning",
                    "message": "High tournament system load detected",
                }
            )

        # Check venue capacity
        if (
            metrics.get("venue_metrics", {}).get("capacity_usage", 0)
            > self.metrics_config["venue_capacity"].threshold
        ):
            alerts.append(
                {
                    "timestamp": datetime.now().isoformat(),
                    "type": "venue_capacity",
                    "severity": "warning",
                    "message": "High venue capacity usage detected",
                }
            )

        # Check AI analysis time
        if (
            metrics.get("ai_metrics", {}).get("analysis_time", 0)
            > self.metrics_config["ai_analysis_time"].threshold
        ):
            alerts.append(
                {
                    "timestamp": datetime.now().isoformat(),
                    "type": "ai_analysis_time",
                    "severity": "warning",
                    "message": "High AI analysis time detected",
                }
            )

        # Store alerts
        if alerts:
            self.alerts_history.extend(alerts)
            for alert in alerts:
                self.logger.warning(f"Performance alert: {alert['message']}")

    def get_metrics(
        self, time_range: Optional[timedelta] = None
    ) -> List[Dict[str, Any]]:
        """Get collected metrics within the specified time range."""
        if not time_range:
            return self.metrics_history

        cutoff_time = datetime.now() - time_range
        return [
            metrics
            for metrics in self.metrics_history
            if datetime.fromisoformat(metrics["timestamp"]) > cutoff_time
        ]

    def get_alerts(
        self, time_range: Optional[timedelta] = None
    ) -> List[Dict[str, Any]]:
        """Get alerts within the specified time range."""
        if not time_range:
            return self.alerts_history

        cutoff_time = datetime.now() - time_range
        return [
            alert
            for alert in self.alerts_history
            if datetime.fromisoformat(alert["timestamp"]) > cutoff_time
        ]

    def get_recommendations(self) -> List[str]:
        """Get performance optimization recommendations based on metrics."""
        recommendations = []

        # Analyze recent metrics
        recent_metrics = self.get_metrics(timedelta(hours=1))
        if not recent_metrics:
            return recommendations

        # Worker pool recommendations
        worker_utilization = [
            m.get("worker_metrics", {}).get("utilization", 0) for m in recent_metrics
        ]
        if any(
            u > self.metrics_config["worker_utilization"].warning_threshold
            for u in worker_utilization
        ):
            recommendations.append("Consider increasing worker pool size")

        # Game performance recommendations
        game_response_times = [
            m.get("game_metrics", {}).get("response_time", 0) for m in recent_metrics
        ]
        if any(
            t > self.metrics_config["game_response_time"].warning_threshold
            for t in game_response_times
        ):
            recommendations.append("Optimize game action processing")

        # Tournament system recommendations
        tournament_loads = [
            m.get("tournament_metrics", {}).get("load", 0) for m in recent_metrics
        ]
        if any(
            l > self.metrics_config["tournament_load"].warning_threshold
            for l in tournament_loads
        ):
            recommendations.append("Review tournament system resource allocation")

        # Venue system recommendations
        venue_capacities = [
            m.get("venue_metrics", {}).get("capacity_usage", 0) for m in recent_metrics
        ]
        if any(
            c > self.metrics_config["venue_capacity"].warning_threshold
            for c in venue_capacities
        ):
            recommendations.append("Consider venue capacity optimization")

        # AI service recommendations
        ai_times = [
            m.get("ai_metrics", {}).get("analysis_time", 0) for m in recent_metrics
        ]
        if any(
            t > self.metrics_config["ai_analysis_time"].warning_threshold
            for t in ai_times
        ):
            recommendations.append("Optimize AI analysis pipeline")

        return recommendations
