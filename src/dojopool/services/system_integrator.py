import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

from .ai_service import AIService
from .game_analytics import GameAnalytics
from .mobile_optimizer import MobileOptimizer, PerformanceMetrics
from .tournament_manager import TournamentManager
from .venue_manager import VenueManager
from .worker_pool import WorkerPool


@dataclass
class SystemMetrics:
    timestamp: datetime
    mobile_metrics: Optional[PerformanceMetrics]
    worker_metrics: Dict
    game_metrics: Dict
    tournament_metrics: Dict
    venue_metrics: Dict
    ai_metrics: Dict


class SystemIntegrator:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.is_running = False
        self.metrics_history: List[SystemMetrics] = []

        # Initialize components
        self.mobile_optimizer = MobileOptimizer()
        self.worker_pool = WorkerPool()
        self.game_analytics = GameAnalytics()
        self.tournament_manager = TournamentManager()
        self.venue_manager = VenueManager()
        self.ai_service = AIService()

        # Component status tracking
        self.component_status = {
            "mobile_optimizer": False,
            "worker_pool": False,
            "game_analytics": False,
            "tournament_manager": False,
            "venue_manager": False,
            "ai_service": False,
        }

        # Metrics collection interval (in seconds)
        self.metrics_interval = 5.0

    async def start(self, device_info: Optional[Dict] = None) -> None:
        """Start all system components."""
        try:
            self.logger.info("Starting system components...")

            # Initialize mobile optimizer first for device profiling
            if device_info:
                await self.mobile_optimizer.start(device_info)
                self.component_status["mobile_optimizer"] = True

            # Start worker pool
            await self.worker_pool.start()
            self.component_status["worker_pool"] = True

            # Start game analytics
            await self.game_analytics.start()
            self.component_status["game_analytics"] = True

            # Start tournament manager
            await self.tournament_manager.start()
            self.component_status["tournament_manager"] = True

            # Start venue manager
            await self.venue_manager.start()
            self.component_status["venue_manager"] = True

            # Start AI service
            await self.ai_service.start()
            self.component_status["ai_service"] = True

            # Start metrics collection
            self.is_running = True
            asyncio.create_task(self._collect_metrics())

            self.logger.info("All system components started successfully")
        except Exception as e:
            self.logger.error(f"Error starting system components: {str(e)}")
            await self.stop()
            raise

    async def stop(self) -> None:
        """Stop all system components."""
        self.logger.info("Stopping system components...")
        self.is_running = False

        # Stop components in reverse order
        if self.component_status["ai_service"]:
            await self.ai_service.stop()

        if self.component_status["venue_manager"]:
            await self.venue_manager.stop()

        if self.component_status["tournament_manager"]:
            await self.tournament_manager.stop()

        if self.component_status["game_analytics"]:
            await self.game_analytics.stop()

        if self.component_status["worker_pool"]:
            await self.worker_pool.stop()

        if self.component_status["mobile_optimizer"]:
            await self.mobile_optimizer.stop()

        # Reset status
        for component in self.component_status:
            self.component_status[component] = False

        self.logger.info("All system components stopped")

    async def _collect_metrics(self) -> None:
        """Collect metrics from all components periodically."""
        while self.is_running:
            try:
                metrics = SystemMetrics(
                    timestamp=datetime.now(),
                    mobile_metrics=None,
                    worker_metrics=self.worker_pool.get_metrics(),
                    game_metrics=self.game_analytics.get_metrics(),
                    tournament_metrics=self.tournament_manager.get_metrics(),
                    venue_metrics=self.venue_manager.get_metrics(),
                    ai_metrics=self.ai_service.get_metrics(),
                )

                self.metrics_history.append(metrics)
                # Keep only last hour of metrics
                if len(self.metrics_history) > 3600 / self.metrics_interval:
                    self.metrics_history.pop(0)

                await self._analyze_metrics(metrics)

            except Exception as e:
                self.logger.error(f"Error collecting metrics: {str(e)}")

            await asyncio.sleep(self.metrics_interval)

    async def _analyze_metrics(self, metrics: SystemMetrics) -> None:
        """Analyze collected metrics and trigger optimizations if needed."""
        try:
            # Check worker pool performance
            if (
                metrics.worker_metrics["queue_length"]
                > metrics.worker_metrics["optimal_queue_length"]
            ):
                await self.worker_pool.scale_workers(1)  # Add a worker

            # Check game analytics performance
            if metrics.game_metrics["response_time"] > 200:  # 200ms threshold
                self.logger.warning("High game response time detected")
                await self.game_analytics.optimize_performance()

            # Check tournament system load
            if metrics.tournament_metrics["system_load"] > 75:  # 75% threshold
                self.logger.warning("High tournament system load detected")
                await self.tournament_manager.optimize_resources()

            # Check venue capacity
            if metrics.venue_metrics["capacity_usage"] > 85:  # 85% threshold
                self.logger.warning("High venue capacity usage detected")
                await self.venue_manager.optimize_capacity()

            # Check AI service performance
            if metrics.ai_metrics["analysis_time"] > 500:  # 500ms threshold
                self.logger.warning("High AI analysis time detected")
                await self.ai_service.optimize_performance()

        except Exception as e:
            self.logger.error(f"Error analyzing metrics: {str(e)}")

    def get_system_status(self) -> Dict:
        """Get current status of all system components."""
        return {
            "is_running": self.is_running,
            "component_status": self.component_status,
            "current_metrics": self.metrics_history[-1] if self.metrics_history else None,
            "worker_count": (
                self.worker_pool.worker_count if self.component_status["worker_pool"] else 0
            ),
            "active_games": (
                self.game_analytics.active_games if self.component_status["game_analytics"] else 0
            ),
            "active_tournaments": (
                self.tournament_manager.active_tournaments
                if self.component_status["tournament_manager"]
                else 0
            ),
            "active_venues": (
                self.venue_manager.active_venues if self.component_status["venue_manager"] else 0
            ),
            "ai_requests_processed": (
                self.ai_service.requests_processed if self.component_status["ai_service"] else 0
            ),
        }

    def get_performance_recommendations(self) -> List[str]:
        """Get performance recommendations from all components."""
        recommendations = []

        if self.component_status["worker_pool"]:
            worker_metrics = self.worker_pool.get_metrics()
            if worker_metrics["queue_length"] > worker_metrics["optimal_queue_length"]:
                recommendations.append("Consider increasing worker pool size")
            elif worker_metrics["idle_workers"] > worker_metrics["optimal_idle_workers"]:
                recommendations.append("Consider decreasing worker pool size")

        if self.component_status["game_analytics"]:
            game_metrics = self.game_analytics.get_metrics()
            if game_metrics["response_time"] > 200:
                recommendations.append("Optimize game action processing")

        if self.component_status["tournament_manager"]:
            tournament_metrics = self.tournament_manager.get_metrics()
            if tournament_metrics["system_load"] > 75:
                recommendations.append("Review tournament system resource allocation")

        if self.component_status["venue_manager"]:
            venue_metrics = self.venue_manager.get_metrics()
            if venue_metrics["capacity_usage"] > 85:
                recommendations.append("Consider venue capacity optimization")

        if self.component_status["ai_service"]:
            ai_metrics = self.ai_service.get_metrics()
            if ai_metrics["analysis_time"] > 500:
                recommendations.append("Optimize AI analysis pipeline")

        return recommendations

    async def handle_device_update(self, device_info: Dict) -> None:
        """Handle updates to device information."""
        if self.component_status["mobile_optimizer"]:
            await self.mobile_optimizer.start(device_info)

            # Update worker pool settings
            if self.component_status["worker_pool"]:
                if device_info.get("battery_level", 100) < 20:
                    await self.worker_pool.optimize_for_power_saving()

    async def validate_system_health(self) -> Dict[str, bool]:
        """Validate health of all system components."""
        health_status = {}

        for component, is_running in self.component_status.items():
            if not is_running:
                health_status[component] = False
                continue

            try:
                if component == "mobile_optimizer":
                    health_status[component] = self.mobile_optimizer.device_profile is not None
                elif component == "worker_pool":
                    health_status[component] = await self.worker_pool.check_health()
                elif component == "game_analytics":
                    health_status[component] = await self.game_analytics.check_health()
                elif component == "tournament_manager":
                    health_status[component] = await self.tournament_manager.check_health()
                elif component == "venue_manager":
                    health_status[component] = await self.venue_manager.check_health()
                elif component == "ai_service":
                    health_status[component] = await self.ai_service.check_health()
            except Exception as e:
                self.logger.error(f"Error checking health of {component}: {str(e)}")
                health_status[component] = False

        return health_status
