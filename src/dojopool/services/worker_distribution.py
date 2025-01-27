from typing import Dict, List, Optional, Set, Tuple
import asyncio
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass
import numpy as np
from enum import Enum

from .worker_pool import Task, Worker, TaskPriority


class DistributionStrategy(Enum):
    ROUND_ROBIN = "round_robin"
    LEAST_LOADED = "least_loaded"
    PRIORITY_BASED = "priority_based"
    RESOURCE_AWARE = "resource_aware"


@dataclass
class WorkerMetrics:
    cpu_usage: float
    memory_usage: float
    task_throughput: float
    error_rate: float
    avg_task_time: float
    idle_time: float


class WorkerDistributionOptimizer:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.worker_metrics: Dict[str, WorkerMetrics] = {}
        self.task_history: List[Dict] = []
        self.worker_loads: Dict[str, float] = {}
        self.strategy = DistributionStrategy.RESOURCE_AWARE
        self.is_monitoring = False
        self._monitor_task = None

        # Configure thresholds
        self.load_threshold = 0.8  # 80% load
        self.error_threshold = 0.1  # 10% error rate
        self.response_threshold = 1000  # 1 second
        self.rebalance_threshold = 0.2  # 20% load difference

    async def start(self):
        """Start distribution optimization monitoring."""
        if self.is_monitoring:
            return

        self.is_monitoring = True
        self._monitor_task = asyncio.create_task(self._monitor_distribution())
        self.logger.info("Worker distribution monitoring started")

    async def stop(self):
        """Stop distribution optimization monitoring."""
        if not self.is_monitoring:
            return

        self.is_monitoring = False
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        self.logger.info("Worker distribution monitoring stopped")

    async def _monitor_distribution(self):
        """Monitor worker distribution and trigger optimizations."""
        while self.is_monitoring:
            try:
                # Update worker metrics
                await self._update_worker_metrics()

                # Check for load imbalances
                imbalances = self._detect_load_imbalances()
                if imbalances:
                    self.logger.warning(f"Load imbalances detected: {imbalances}")
                    await self._rebalance_workers(imbalances)

                # Optimize task distribution
                await self._optimize_task_distribution()

                # Update distribution strategy if needed
                self._update_distribution_strategy()

            except Exception as e:
                self.logger.error(f"Error in distribution monitoring: {str(e)}")

            await asyncio.sleep(10)  # Check every 10 seconds

    def update_worker_status(self, worker_id: str, worker: Worker):
        """Update worker status and metrics."""
        metrics = WorkerMetrics(
            cpu_usage=worker.cpu_usage,
            memory_usage=worker.memory_usage,
            task_throughput=worker.task_count
            / max(1, (datetime.now().timestamp() - worker.last_heartbeat)),
            error_rate=worker.errors / max(1, worker.task_count),
            avg_task_time=0.0,  # Will be updated with historical data
            idle_time=(
                0.0
                if worker.status == "busy"
                else (datetime.now().timestamp() - worker.last_heartbeat)
            ),
        )
        self.worker_metrics[worker_id] = metrics
        self._update_worker_load(worker_id)

    def record_task_completion(self, task: Task, worker_id: str, duration: float, success: bool):
        """Record task completion metrics."""
        self.task_history.append(
            {
                "task_id": task.id,
                "worker_id": worker_id,
                "priority": task.priority.value,
                "duration": duration,
                "success": success,
                "timestamp": datetime.now().timestamp(),
            }
        )

        # Keep history manageable
        if len(self.task_history) > 1000:
            self.task_history = self.task_history[-1000:]

        # Update worker metrics
        if worker_id in self.worker_metrics:
            metrics = self.worker_metrics[worker_id]
            metrics.avg_task_time = np.mean(
                [task["duration"] for task in self.task_history if task["worker_id"] == worker_id]
            )

    def get_optimal_worker(self, task: Task, available_workers: List[str]) -> Optional[str]:
        """Get the optimal worker for a task based on current strategy."""
        if not available_workers:
            return None

        if self.strategy == DistributionStrategy.ROUND_ROBIN:
            return available_workers[0]

        elif self.strategy == DistributionStrategy.LEAST_LOADED:
            return min(available_workers, key=lambda w: self.worker_loads.get(w, 0.0))

        elif self.strategy == DistributionStrategy.PRIORITY_BASED:
            if task.priority == TaskPriority.CRITICAL:
                # Find worker with lowest load and error rate
                return min(
                    available_workers,
                    key=lambda w: (
                        self.worker_loads.get(w, 0.0),
                        self.worker_metrics[w].error_rate if w in self.worker_metrics else 1.0,
                    ),
                )
            else:
                # Use least loaded worker
                return min(available_workers, key=lambda w: self.worker_loads.get(w, 0.0))

        else:  # RESOURCE_AWARE
            return min(
                available_workers,
                key=lambda w: (
                    self.worker_metrics[w].cpu_usage if w in self.worker_metrics else 1.0,
                    self.worker_metrics[w].memory_usage if w in self.worker_metrics else 1.0,
                    self.worker_loads.get(w, 0.0),
                ),
            )

    async def _update_worker_metrics(self):
        """Update worker metrics based on recent history."""
        current_time = datetime.now().timestamp()
        recent_history = [
            task
            for task in self.task_history
            if current_time - task["timestamp"] < 300  # Last 5 minutes
        ]

        for worker_id in self.worker_metrics:
            worker_history = [task for task in recent_history if task["worker_id"] == worker_id]

            if worker_history:
                success_rate = sum(1 for task in worker_history if task["success"]) / len(
                    worker_history
                )
                avg_duration = np.mean([task["duration"] for task in worker_history])

                metrics = self.worker_metrics[worker_id]
                metrics.error_rate = 1.0 - success_rate
                metrics.avg_task_time = avg_duration
                metrics.task_throughput = len(worker_history) / 300  # Tasks per second

    def _update_worker_load(self, worker_id: str):
        """Update worker load score based on metrics."""
        if worker_id not in self.worker_metrics:
            self.worker_loads[worker_id] = 0.0
            return

        metrics = self.worker_metrics[worker_id]

        # Calculate load score (0.0 - 1.0) based on multiple factors
        cpu_weight = 0.3
        memory_weight = 0.3
        error_weight = 0.2
        throughput_weight = 0.2

        load_score = (
            cpu_weight * metrics.cpu_usage
            + memory_weight * metrics.memory_usage
            + error_weight * metrics.error_rate
            + throughput_weight
            * (1.0 - min(1.0, metrics.task_throughput / 10.0))  # Normalize to 0-1
        )

        self.worker_loads[worker_id] = load_score

    def _detect_load_imbalances(self) -> List[Tuple[str, str, float]]:
        """Detect load imbalances between workers."""
        imbalances = []
        worker_ids = list(self.worker_loads.keys())

        for i in range(len(worker_ids)):
            for j in range(i + 1, len(worker_ids)):
                worker1, worker2 = worker_ids[i], worker_ids[j]
                load_diff = abs(self.worker_loads[worker1] - self.worker_loads[worker2])

                if load_diff > self.rebalance_threshold:
                    imbalances.append((worker1, worker2, load_diff))

        return sorted(imbalances, key=lambda x: x[2], reverse=True)

    async def _rebalance_workers(self, imbalances: List[Tuple[str, str, float]]):
        """Rebalance load between workers."""
        for worker1, worker2, load_diff in imbalances:
            # Update distribution strategy to prefer the less loaded worker
            if self.worker_loads[worker1] > self.worker_loads[worker2]:
                self.worker_loads[worker1] *= 0.9  # Reduce load score to encourage task assignment
            else:
                self.worker_loads[worker2] *= 0.9

    async def _optimize_task_distribution(self):
        """Optimize task distribution based on metrics."""
        # Analyze task completion patterns
        current_time = datetime.now().timestamp()
        recent_tasks = [
            task for task in self.task_history if current_time - task["timestamp"] < 300
        ]

        if not recent_tasks:
            return

        # Calculate success rates by priority
        priority_success = {}
        for task in recent_tasks:
            priority = task["priority"]
            if priority not in priority_success:
                priority_success[priority] = {"success": 0, "total": 0}
            priority_success[priority]["total"] += 1
            if task["success"]:
                priority_success[priority]["success"] += 1

        # Update strategy based on success rates
        critical_success_rate = priority_success.get(
            TaskPriority.CRITICAL.value, {"success": 0, "total": 0}
        )["success"] / max(
            1,
            priority_success.get(TaskPriority.CRITICAL.value, {"success": 0, "total": 0})["total"],
        )

        if critical_success_rate < 0.95:  # Less than 95% success for critical tasks
            self.strategy = DistributionStrategy.PRIORITY_BASED
        elif any(self.worker_loads[w] > self.load_threshold for w in self.worker_loads):
            self.strategy = DistributionStrategy.RESOURCE_AWARE
        else:
            self.strategy = DistributionStrategy.LEAST_LOADED

    def _update_distribution_strategy(self):
        """Update distribution strategy based on system state."""
        # Calculate overall system metrics
        avg_load = np.mean(list(self.worker_loads.values()))
        max_load = max(self.worker_loads.values())
        load_variance = np.var(list(self.worker_loads.values()))

        # Update strategy based on system state
        if max_load > self.load_threshold:
            self.strategy = DistributionStrategy.RESOURCE_AWARE
        elif load_variance > self.rebalance_threshold:
            self.strategy = DistributionStrategy.LEAST_LOADED
        elif any(m.error_rate > self.error_threshold for m in self.worker_metrics.values()):
            self.strategy = DistributionStrategy.PRIORITY_BASED
        else:
            self.strategy = DistributionStrategy.ROUND_ROBIN

    def get_metrics(self) -> Dict:
        """Get distribution optimization metrics."""
        return {
            "worker_loads": self.worker_loads,
            "current_strategy": self.strategy.value,
            "worker_metrics": {
                worker_id: {
                    "cpu_usage": metrics.cpu_usage,
                    "memory_usage": metrics.memory_usage,
                    "task_throughput": metrics.task_throughput,
                    "error_rate": metrics.error_rate,
                    "avg_task_time": metrics.avg_task_time,
                    "idle_time": metrics.idle_time,
                }
                for worker_id, metrics in self.worker_metrics.items()
            },
            "task_history_size": len(self.task_history),
        }

    def get_recommendations(self) -> List[str]:
        """Get distribution optimization recommendations."""
        recommendations = []

        # Check worker loads
        overloaded_workers = [
            worker_id for worker_id, load in self.worker_loads.items() if load > self.load_threshold
        ]
        if overloaded_workers:
            recommendations.append(
                f"Workers {overloaded_workers} are overloaded - consider scaling or rebalancing"
            )

        # Check error rates
        high_error_workers = [
            worker_id
            for worker_id, metrics in self.worker_metrics.items()
            if metrics.error_rate > self.error_threshold
        ]
        if high_error_workers:
            recommendations.append(
                f"Workers {high_error_workers} have high error rates - investigate issues"
            )

        # Check distribution strategy
        if self.strategy == DistributionStrategy.RESOURCE_AWARE:
            recommendations.append(
                "System is using resource-aware distribution - monitor resource usage"
            )

        return recommendations
