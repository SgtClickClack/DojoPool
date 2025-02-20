import gc
import gc
"""Metrics collection system for A/B testing experiments."""

import logging
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np

from .metrics import MetricEvent, MetricType

logger = logging.getLogger(__name__)


class MetricsCollector:
    """Collects and manages metrics for A/B testing experiments."""

    def __init__(self):
        """Initialize the metrics collector."""
        self._metrics: Dict[str, Dict[str, List[MetricEvent]]] = defaultdict(
            lambda: defaultdict(list)
        )
        self._cached_stats: Dict[str, Dict[str, Any]] = {}

    def record_metric(
        self,
        experiment_id: str,
        variant_id: str,
        user_id: str,
        metric_name: str,
        value: float,
        metric_type: MetricType,
        timestamp: Optional[datetime] = None,
        attributes: Optional[Dict[str, str]] = None,
    ) -> MetricEvent:
        """Record a new metric event.

        Args:
            experiment_id: ID of the experiment
            variant_id: ID of the variant (e.g., 'control', 'variant_a')
            user_id: ID of the user
            metric_name: Name of the metric
            value: Metric value
            metric_type: Type of metric (e.g., CONVERSION, REVENUE)
            timestamp: Event timestamp (defaults to now)
            attributes: Additional attributes for segmentation

        Returns:
            The created MetricEvent
        """
        timestamp = timestamp or datetime.now()
        attributes = attributes or {}

        event = MetricEvent(
            experiment_id=experiment_id,
            variant_id=variant_id,
            user_id=user_id,
            metric_name=metric_name,
            value=value,
            timestamp=timestamp,
            type=metric_type,
            attributes=attributes,
        )

        # Store the event
        key = f"{experiment_id}:{metric_name}"
        self._metrics[key][variant_id].append(event)

        # Invalidate cached stats
        if key in self._cached_stats:
            del self._cached_stats[key]

        return event

    def get_metric_events(
        self,
        experiment_id: str,
        metric_name: str,
        variant_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        attributes: Optional[Dict[str, str]] = None,
    ):
        """Get metric events matching the specified criteria.

        Args:
            experiment_id: ID of the experiment
            metric_name: Name of the metric
            variant_id: Optional variant ID to filter by
            start_time: Optional start time for filtering
            end_time: Optional end time for filtering
            attributes: Optional attributes to filter by

        Returns:
            List of matching MetricEvents
        """
        key = f"{experiment_id}:{metric_name}"
        events: List[MetricEvent] = []

        # Get events for specified variant or all variants
        variants = [variant_id] if variant_id else self._metrics[key].keys()
        for vid in variants:
            events.extend(self._metrics[key][vid])

        # Apply filters
        if start_time:
            events = [e for e in events if e.timestamp >= start_time]
        if end_time:
            events = [e for e in events if e.timestamp <= end_time]
        if attributes:
            events = [
                e
                for e in events
                if all(e.attributes.get(k) == v for k, v in attributes.items())
            ]

        return sorted(events, key=lambda e: e.timestamp)

    def get_metric_stats(
        self, experiment_id: str, metric_name: str, variant_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get statistical summary of metric events.

        Args:
            experiment_id: ID of the experiment
            metric_name: Name of the metric
            variant_id: Optional variant ID to filter by

        Returns:
            Dictionary containing statistical summary
        """
        key = f"{experiment_id}:{metric_name}"

        # Return cached stats if available
        cache_key = f"{key}:{variant_id if variant_id else 'all'}"
        if cache_key in self._cached_stats:
            return self._cached_stats[cache_key]

        # Get events
        events = self.get_metric_events(experiment_id, metric_name, variant_id)
        if not events:
            return {"count": 0, "mean": None, "std": None, "min": None, "max": None}

        # Calculate stats
        values = np.array([e.value for e in events])
        stats = {
            "count": len(values),
            "mean": float(np.mean(values)),
            "std": float(np.std(values)),
            "min": float(np.min(values)),
            "max": float(np.max(values)),
        }

        # Cache the results
        self._cached_stats[cache_key] = stats
        return stats

    def clear_metrics(
        self, experiment_id: Optional[str] = None, metric_name: Optional[str] = None
    ):
        """Clear stored metrics.

        Args:
            experiment_id: Optional experiment ID to clear
            metric_name: Optional metric name to clear
        """
        if experiment_id and metric_name:
            key = f"{experiment_id}:{metric_name}"
            if key in self._metrics:
                del self._metrics[key]
                # Clear related cached stats
                for k in list(self._cached_stats.keys()):
                    if k.startswith(key):
                        del self._cached_stats[k]
        else:
            self._metrics.clear()
            self._cached_stats.clear()
