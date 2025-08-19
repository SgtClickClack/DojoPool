import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

import psutil

from .worker_distribution import WorkerDistributionOptimizer


class TaskPriority(Enum):
    LOW = 0
    MEDIUM = 1
    HIGH = 2
    CRITICAL = 3


@dataclass
class Task:
    id: str
    priority: TaskPriority
    payload: Dict
    created_at: float
    timeout: float
    retries: int = 0
    max_retries: int = 3


@dataclass
class Worker:
    id: str
    status: str
    current_task: Optional[str]
    last_heartbeat: float
    memory_usage: float
    cpu_usage: float
    task_count: int
    errors: int


@dataclass
class WorkerPoolConfig:
    min_workers: int
    max_workers: int
    task_timeout: float
    heartbeat_interval: float
    memory_threshold: float
    cpu_threshold: float
    scaling_factor: float


class WorkerPool:
    def __init__(self, config: WorkerPoolConfig):
        self.logger = logging.getLogger(__name__)
        self.config = config
        self.workers: Dict[str, Worker] = {}
        self.task_queue: List[Task] = []
        self.is_running = False
        self._monitor_task = None
        self._process_task = None
        self.distribution_optimizer = WorkerDistributionOptimizer()

    async def start(self):
        """Start the worker pool."""
        if self.is_running:
            return

        self.is_running = True
        self.logger.info("Starting worker pool")

        try:
            # Start distribution optimizer
            await self.distribution_optimizer.start()

            # Initialize minimum number of workers
            for _ in range(self.config.min_workers):
                await self._create_worker()

            # Start monitoring and task processing
            self._monitor_task = asyncio.create_task(self._monitor_workers())
            self._process_task = asyncio.create_task(self._process_task_queue())

            self.logger.info(f"Worker pool started with {len(self.workers)} workers")

        except Exception as e:
            self.logger.error(f"Failed to start worker pool: {str(e)}")
            await self.stop()
            raise

    async def stop(self):
        """Stop the worker pool."""
        if not self.is_running:
            return

        self.is_running = False
        self.logger.info("Stopping worker pool")

        try:
            # Stop monitoring tasks
            if self._monitor_task:
                self._monitor_task.cancel()
                try:
                    await self._monitor_task
                except asyncio.CancelledError:
                    pass

            if self._process_task:
                self._process_task.cancel()
                try:
                    await self._process_task
                except asyncio.CancelledError:
                    pass

            # Stop distribution optimizer
            await self.distribution_optimizer.stop()

            # Terminate all workers
            worker_ids = list(self.workers.keys())
            for worker_id in worker_ids:
                await self._terminate_worker(worker_id)

            self.logger.info("Worker pool stopped successfully")

        except Exception as e:
            self.logger.error(f"Error stopping worker pool: {str(e)}")
            raise

    async def submit_task(self, task: Task) -> str:
        """Submit a task to the worker pool."""
        if not self.is_running:
            raise RuntimeError("Worker pool is not running")

        self.task_queue.append(task)
        self.logger.debug(f"Task {task.id} added to queue")

        # Sort queue by priority
        self.task_queue.sort(key=lambda x: x.priority.value, reverse=True)

        return task.id

    async def _create_worker(self) -> str:
        """Create a new worker."""
        worker_id = f"worker_{len(self.workers)}"
        worker = Worker(
            id=worker_id,
            status="idle",
            current_task=None,
            last_heartbeat=datetime.now().timestamp(),
            memory_usage=0.0,
            cpu_usage=0.0,
            task_count=0,
            errors=0,
        )
        self.workers[worker_id] = worker
        self.logger.info(f"Created worker {worker_id}")
        return worker_id

    async def _terminate_worker(self, worker_id: str):
        """Terminate a worker."""
        if worker_id in self.workers:
            worker = self.workers[worker_id]
            if worker.current_task:
                # Return task to queue if it was being processed
                task_id = worker.current_task
                for task in self.task_queue:
                    if task.id == task_id:
                        task.retries += 1
                        break
            del self.workers[worker_id]
            self.logger.info(f"Terminated worker {worker_id}")

    async def _monitor_workers(self):
        """Monitor worker health and scaling."""
        while self.is_running:
            try:
                current_time = datetime.now().timestamp()

                # Update worker metrics
                for worker_id, worker in self.workers.items():
                    # Simulate getting real metrics (replace with actual monitoring)
                    worker.cpu_usage = psutil.cpu_percent() / 100.0
                    worker.memory_usage = psutil.virtual_memory().percent / 100.0

                    # Update distribution optimizer
                    self.distribution_optimizer.update_worker_status(worker_id, worker)

                    # Check for unresponsive workers
                    if current_time - worker.last_heartbeat > self.config.heartbeat_interval * 3:
                        self.logger.warning(f"Worker {worker_id} unresponsive")
                        await self._terminate_worker(worker_id)
                        await self._create_worker()  # Replace unresponsive worker

                # Check scaling needs
                await self._check_scaling()

            except Exception as e:
                self.logger.error(f"Error in worker monitoring: {str(e)}")

            await asyncio.sleep(self.config.heartbeat_interval)

    async def _check_scaling(self):
        """Check if pool needs to scale up or down."""
        current_workers = len(self.workers)
        queued_tasks = len(self.task_queue)

        # Check if we need to scale up
        if (
            queued_tasks > current_workers * self.config.scaling_factor
            and current_workers < self.config.max_workers
        ):
            workers_to_add = min(
                self.config.max_workers - current_workers,
                int(queued_tasks / self.config.scaling_factor) - current_workers,
            )
            for _ in range(workers_to_add):
                await self._create_worker()
            self.logger.info(f"Scaled up by {workers_to_add} workers")

        # Check if we need to scale down
        elif (
            queued_tasks < current_workers / self.config.scaling_factor
            and current_workers > self.config.min_workers
        ):
            workers_to_remove = max(
                current_workers - self.config.min_workers,
                current_workers - int(queued_tasks * self.config.scaling_factor),
            )
            idle_workers = [
                worker_id for worker_id, worker in self.workers.items() if worker.status == "idle"
            ]
            for worker_id in idle_workers[:workers_to_remove]:
                await self._terminate_worker(worker_id)
            self.logger.info(f"Scaled down by {len(idle_workers[:workers_to_remove])} workers")

    async def _process_task_queue(self):
        """Process tasks in the queue."""
        while self.is_running:
            try:
                if not self.task_queue:
                    await asyncio.sleep(0.1)
                    continue

                # Find available workers
                available_workers = [
                    worker_id
                    for worker_id, worker in self.workers.items()
                    if worker.status == "idle"
                ]

                if not available_workers:
                    await self._check_scaling()
                    await asyncio.sleep(0.1)
                    continue

                # Get next task
                task = self.task_queue[0]

                # Get optimal worker from distribution optimizer
                worker_id = self.distribution_optimizer.get_optimal_worker(task, available_workers)
                if worker_id:
                    self.task_queue.pop(0)  # Remove task from queue
                    await self._assign_task(worker_id, task)

            except Exception as e:
                self.logger.error(f"Error processing task queue: {str(e)}")
                await asyncio.sleep(1)

    async def _assign_task(self, worker_id: str, task: Task):
        """Assign a task to a worker."""
        start_time = datetime.now().timestamp()
        worker = self.workers[worker_id]
        worker.status = "busy"
        worker.current_task = task.id
        worker.task_count += 1

        try:
            # Simulate task execution (replace with actual worker communication)
            await asyncio.sleep(0.1)
            result = {"status": "success", "data": f"Processed task {task.id}"}

            # Record successful completion
            duration = datetime.now().timestamp() - start_time
            self.distribution_optimizer.record_task_completion(task, worker_id, duration, True)
            await self._handle_task_completion(task.id, result)

        except Exception as e:
            # Record failed completion
            duration = datetime.now().timestamp() - start_time
            self.distribution_optimizer.record_task_completion(task, worker_id, duration, False)
            await self._handle_task_failure(task.id, str(e))
            worker.errors += 1

        finally:
            worker.status = "idle"
            worker.current_task = None
            worker.last_heartbeat = datetime.now().timestamp()

    async def _handle_task_completion(self, task_id: str, result: Dict):
        """Handle successful task completion."""
        self.logger.debug(f"Task {task_id} completed successfully: {result}")

    async def _handle_task_failure(self, task_id: str, error: str):
        """Handle task failure."""
        self.logger.error(f"Task {task_id} failed: {error}")
        # Find task in queue
        for task in self.task_queue:
            if task.id == task_id:
                if task.retries < task.max_retries:
                    task.retries += 1
                    self.logger.info(f"Retrying task {task_id} (attempt {task.retries})")
                else:
                    self.logger.error(f"Task {task_id} exceeded max retries")
                break

    def get_metrics(self) -> Dict:
        """Get worker pool metrics."""
        return {
            "workers": len(self.workers),
            "queued_tasks": len(self.task_queue),
            "worker_metrics": {
                worker_id: {
                    "status": worker.status,
                    "cpu_usage": worker.cpu_usage,
                    "memory_usage": worker.memory_usage,
                    "task_count": worker.task_count,
                    "errors": worker.errors,
                }
                for worker_id, worker in self.workers.items()
            },
            "distribution_metrics": self.distribution_optimizer.get_metrics(),
        }

    def get_recommendations(self) -> List[str]:
        """Get worker pool recommendations."""
        recommendations = []

        # Get distribution optimizer recommendations
        recommendations.extend(self.distribution_optimizer.get_recommendations())

        # Check queue size
        if len(self.task_queue) > len(self.workers) * self.config.scaling_factor:
            recommendations.append(
                f"High task queue size ({len(self.task_queue)}) - consider increasing max_workers"
            )

        # Check error rates
        for worker_id, worker in self.workers.items():
            error_rate = worker.errors / max(1, worker.task_count)
            if error_rate > 0.1:  # More than 10% errors
                recommendations.append(
                    f"Worker {worker_id} has high error rate ({error_rate:.1%}) - investigate issues"
                )

        return recommendations
