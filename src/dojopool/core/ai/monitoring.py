"""AI service monitoring module."""

import logging
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any

from prometheus_client import Counter, Gauge, Histogram

# Metrics
PREDICTION_DURATION = Histogram(
    "ai_prediction_duration_seconds", "Time spent processing predictions", ["model_type"]
)

PREDICTION_ERRORS = Counter(
    "ai_prediction_errors_total", "Total number of prediction errors", ["error_type"]
)

CACHE_HITS = Counter("ai_cache_hits_total", "Total number of cache hits", ["cache_type"])

MODEL_LOAD_TIME = Gauge("ai_model_load_time_seconds", "Time taken to load models", ["model_type"])


@dataclass
class PredictionMetrics:
    """Metrics for a single prediction."""

    model_type: str
    duration: float
    timestamp: datetime = field(default_factory=datetime.utcnow)
    error: Optional[str] = None
    cache_hit: bool = False


class AIMonitor:
    """Monitor for AI service performance and errors."""

    def __init__(self):
        """Initialize AI monitor."""
        self.logger = logging.getLogger(__name__)
        self.recent_predictions: List[PredictionMetrics] = []
        self.error_counts: Dict[str, int] = {}

    def record_prediction(
        self, model_type: str, duration: float, error: Optional[str] = None, cache_hit: bool = False
    ):
        """Record metrics for a prediction.

        Args:
            model_type: Type of model used
            duration: Time taken for prediction
            error: Error message if prediction failed
            cache_hit: Whether result was from cache
        """
        # Store metrics
        metrics = PredictionMetrics(
            model_type=model_type, duration=duration, error=error, cache_hit=cache_hit
        )
        self.recent_predictions.append(metrics)

        # Update Prometheus metrics
        PREDICTION_DURATION.labels(model_type=model_type).observe(duration)

        if error:
            PREDICTION_ERRORS.labels(error_type=type(error).__name__).inc()
            self.error_counts[type(error).__name__] = (
                self.error_counts.get(type(error).__name__, 0) + 1
            )

        if cache_hit:
            CACHE_HITS.labels(cache_type=model_type).inc()

    def record_model_load(self, model_type: str, duration: float):
        """Record model loading time.

        Args:
            model_type: Type of model loaded
            duration: Time taken to load
        """
        MODEL_LOAD_TIME.labels(model_type=model_type).set(duration)

    def get_recent_metrics(self, limit: int = 100) -> List[PredictionMetrics]:
        """Get recent prediction metrics.

        Args:
            limit: Maximum number of metrics to return

        Returns:
            List of recent prediction metrics
        """
        return sorted(self.recent_predictions, key=lambda x: x.timestamp, reverse=True)[:limit]

    def get_error_summary(self) -> Dict[str, Any]:
        """Get summary of prediction errors.

        Returns:
            Dictionary containing error statistics
        """
        total_predictions = len(self.recent_predictions)
        total_errors = sum(self.error_counts.values())

        return {
            "total_predictions": total_predictions,
            "total_errors": total_errors,
            "error_rate": total_errors / total_predictions if total_predictions > 0 else 0,
            "error_counts": self.error_counts.copy(),
        }

    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for predictions.

        Returns:
            Dictionary containing performance statistics
        """
        if not self.recent_predictions:
            return {}

        durations = [m.duration for m in self.recent_predictions]
        cache_hits = sum(1 for m in self.recent_predictions if m.cache_hit)

        return {
            "avg_duration": sum(durations) / len(durations),
            "max_duration": max(durations),
            "min_duration": min(durations),
            "cache_hit_rate": cache_hits / len(self.recent_predictions),
            "total_predictions": len(self.recent_predictions),
        }


class AIMetricsTimer:
    """Context manager for timing AI operations."""

    def __init__(self, monitor: AIMonitor, model_type: str):
        """Initialize timer.

        Args:
            monitor: AI monitor instance
            model_type: Type of model being timed
        """
        self.monitor = monitor
        self.model_type = model_type
        self.start_time: Optional[float] = None
        self.error: Optional[str] = None

    def __enter__(self):
        """Start timing."""
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Record metrics on exit."""
        if self.start_time is not None:
            duration = time.time() - self.start_time
            self.monitor.record_prediction(self.model_type, duration, str(exc_val) if exc_val else None)
        else:
            self.monitor.logger.warning("AIMetricsTimer exited without being started properly.")
