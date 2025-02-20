from multiprocessing import Pool
import gc
from multiprocessing import Pool
import gc
"""
Metrics tracking module for A/B testing.
Provides functionality to record and analyze metrics.
"""

import logging
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Set

logger = logging.getLogger(__name__)


class MetricType(Enum):
    """Types of metrics that can be tracked."""

    COUNTER = "counter"
    GAUGE = "gauge"
    CONVERSION = "conversion"


@dataclass
class MetricValue:
    """A single metric value with metadata."""

    value: float
    timestamp: datetime
    tags: Set[str]
    metadata: Dict[str, Any]


class MetricDefinition:
    """Definition of a metric."""

    def __init__(self, name: str, type: MetricType, description: Optional[str] = None):
        self.name = name
        self.type = type
        self.description = description


class MetricsManager:
    """Manages metrics collection and analysis."""

    def __init__(self):
        """Initialize metrics manager."""
        self._metrics: Dict[str, List[MetricValue]] = {}
        self._definitions: Dict[str, MetricDefinition] = {}

    def register_metric(
        self, name: str, type: MetricType, description: Optional[str] = None
    ) -> str:
        """
        Register a new metric.

        Args:
            name: Name of the metric
            type: Type of metric (counter, gauge, conversion)
            description: Optional description of the metric

        Returns:
            The ID of the registered metric (lowercase name with spaces replaced by underscores)

        Raises:
            ValueError: If the metric type is invalid or if the metric is already registered
        """
        # Validate metric type
        if not isinstance(type, MetricType):
            raise ValueError(
                f"Invalid metric type: {type}. Must be a MetricType enum value."
            )

        # Generate metric ID from name
        metric_id = name.lower().replace(" ", "_")

        if metric_id in self._definitions:
            raise ValueError(f"Metric {name} already registered")

        self._definitions[metric_id] = MetricDefinition(name, type, description)
        self._metrics[metric_id] = []

        return metric_id

    def record_metric(
        self,
        experiment_id: str,
        variant_id: str,
        name: str,
        value: float,
        tags: Optional[Set[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ):
        """
        Record a metric value.

        Args:
            experiment_id: ID of the experiment
            variant_id: ID of the variant
            name: Name of the metric
            value: Value to record
            tags: Optional set of tags for filtering
            metadata: Optional metadata to store with the value
            timestamp: Optional timestamp for the metric value
        """
        try:
            # Get metric definition
            if name not in self._definitions:
                raise ValueError(f"Metric {name} not registered")

            metric_def = self._definitions[name]

            # Validate value based on metric type
            if metric_def.type == MetricType.COUNTER:
                if not isinstance(value, (int, float)) or isinstance(value, bool):
                    raise ValueError("Counter metrics must be numeric (not boolean)")
            elif metric_def.type == MetricType.GAUGE:
                if not isinstance(value, (int, float)) or isinstance(value, bool):
                    raise ValueError("Gauge metrics must be numeric (not boolean)")
            elif metric_def.type == MetricType.CONVERSION:
                if not isinstance(value, bool):
                    raise ValueError("Conversion metrics must be boolean")
                value = 1 if value else 0

            # Prepare metadata
            combined_metadata = metadata or {}
            combined_metadata.update(
                {"experiment_id": experiment_id, "variant_id": variant_id}
            )

            # Create metric value
            metric_value = MetricValue(
                value=float(value),
                timestamp=timestamp or datetime.now(),
                tags=tags or set(),
                metadata=combined_metadata,
            )

            # Store value
            self._metrics[name].append(metric_value)

        except Exception as e:
            logger.error(f"Error recording metric: {str(e)}")
            raise

    def get_metric_values(
        self,
        name: str,
        tags: Optional[Set[str]] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ):
        """
        Get values for a metric with optional filtering.

        Args:
            name: Name of the metric
            tags: Optional set of tags to filter by
            start_time: Optional start time for filtering
            end_time: Optional end time for filtering

        Returns:
            List of metric values matching the filters
        """
        try:
            if name not in self._metrics:
                return []

            values = []
            for metric in self._metrics[name]:
                # Check tags
                if tags and not tags.issubset(metric.tags):
                    continue

                # Check time range
                if start_time and metric.timestamp < start_time:
                    continue
                if end_time and metric.timestamp > end_time:
                    continue

                values.append(metric.value)

            return values

        except Exception as e:
            logger.error(f"Error getting metric values: {str(e)}")
            return []

    def analyze_metric(
        self,
        name: str,
        tags: Optional[Set[str]] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Analyze a metric's values.

        Args:
            name: Name of the metric
            tags: Optional set of tags to filter by
            start_time: Optional start time for filtering
            end_time: Optional end time for filtering

        Returns:
            Dictionary containing analysis results grouped by variant_id
        """
        try:
            if name not in self._metrics:
                return {}

            # Group values by variant
            variant_values: Dict[str, List[float]] = {}
            for metric in self._metrics[name]:
                # Check tags
                if tags and not tags.issubset(metric.tags):
                    continue

                # Check time range
                if start_time and metric.timestamp < start_time:
                    continue
                if end_time and metric.timestamp > end_time:
                    continue

                # Get variant_id from metadata
                variant_id = metric.metadata.get("variant_id")
                if not variant_id:
                    continue

                if variant_id not in variant_values:
                    variant_values[variant_id] = []
                variant_values[variant_id].append(metric.value)

            # Get metric type
            metric_type = self._definitions[name].type

            # Calculate statistics for each variant
            results = {}
            for variant_id, values in variant_values.items():
                if not values:
                    continue

                stats: Dict[str, Any] = {"count": len(values)}

                if metric_type in (MetricType.COUNTER, MetricType.GAUGE):
                    mean = sum(values) / len(values)
                    stats.update(
                        {
                            "min": min(values),
                            "max": max(values),
                            "mean": mean,
                            "total": sum(values),
                            "stddev": (
                                sum((x - mean) ** 2 for x in values) / len(values)
                            )
                            ** 0.5,
                        }
                    )
                elif metric_type == MetricType.CONVERSION:
                    conversions = sum(1 for v in values if v > 0)
                    stats["conversion_rate"] = float(conversions) / len(values)

                results[variant_id] = stats

            return results

        except Exception as e:
            logger.error(f"Error analyzing metric: {str(e)}")
            return {}

    def export_metrics(self, experiment_id: str) -> Dict[str, Any]:
        """
        Export all metrics data for an experiment.

        Args:
            experiment_id: ID of the experiment to export data for

        Returns:
            Dictionary containing:
                - metrics: Metric definitions
                - variants: Variant data with recorded metric values
        """
        try:
            # Export metric definitions
            metrics_data = {}
            for metric_id, definition in self._definitions.items():
                metrics_data[metric_id] = {
                    "name": definition.name,
                    "type": definition.type.value,
                    "description": definition.description,
                }

            # Export variant data
            variants_data = {}
            for metric_id, values in self._metrics.items():
                # Group values by variant
                for value in values:
                    variant_id = value.metadata.get("variant_id")
                    if not variant_id:
                        continue

                    if variant_id not in variants_data:
                        variants_data[variant_id] = {}
                    if metric_id not in variants_data[variant_id]:
                        variants_data[variant_id][metric_id] = []

                    variants_data[variant_id][metric_id].append(value.value)

            return {"metrics": metrics_data, "variants": variants_data}

        except Exception as e:
            logger.error(f"Error exporting metrics: {str(e)}")
            return {"metrics": {}, "variants": {}}
