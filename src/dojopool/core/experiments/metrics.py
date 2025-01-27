"""Metrics collection and analysis for A/B testing experiments."""

from typing import Dict, List, Any, Optional, Union, Set
from dataclasses import dataclass, field
from datetime import datetime
import logging
from enum import Enum
import statistics
from collections import defaultdict

logger = logging.getLogger(__name__)

class MetricType(Enum):
    """Types of metrics that can be collected."""
    COUNTER = "counter"      # Counts occurrences (e.g., clicks)
    GAUGE = "gauge"         # Point-in-time values (e.g., load time)
    CONVERSION = "conversion"  # Boolean outcomes (e.g., signup completed)
    DURATION = "duration"    # Time-based metrics (e.g., session length)
    REVENUE = "revenue"     # Monetary values
    CUSTOM = "custom"       # User-defined metrics

@dataclass
class MetricEvent:
    """A single metric event in an experiment."""
    
    def __init__(
        self,
        experiment_id: str,
        variant_id: str,
        user_id: str,
        metric_name: str,
        value: float,
        timestamp: datetime,
        type: MetricType,
        device_type: Optional[str] = None,
        country: Optional[str] = None,
        **attributes: Any
    ):
        """Initialize a metric event.
        
        Args:
            experiment_id: ID of the experiment
            variant_id: ID of the variant (e.g., 'control', 'variant_a')
            user_id: ID of the user
            metric_name: Name of the metric
            value: Metric value
            timestamp: When the event occurred
            type: Type of metric
            device_type: Optional device type (e.g., 'mobile', 'desktop')
            country: Optional country code (e.g., 'US', 'UK')
            **attributes: Additional attributes for segmentation
        """
        self.experiment_id = experiment_id
        self.variant_id = variant_id
        self.user_id = user_id
        self.metric_name = metric_name
        self.value = value
        self.timestamp = timestamp
        self.type = type
        self.device_type = device_type
        self.country = country
        self.attributes = attributes

@dataclass
class MetricDefinition:
    """Definition of a metric to be tracked."""
    name: str
    type: MetricType
    description: str
    aggregation: str = "last"  # last, sum, avg, min, max
    unit: Optional[str] = None
    validation: Optional[Dict[str, Any]] = None

class MetricsCollector:
    """Collects and manages experiment metrics."""
    
    def __init__(self):
        self._metrics: Dict[str, MetricDefinition] = {}
        self._events: List[MetricEvent] = []
        self._user_events: Dict[str, Dict[str, List[MetricEvent]]] = defaultdict(lambda: defaultdict(list))
    
    def register_metric(self, definition: MetricDefinition) -> None:
        """Register a new metric definition."""
        if definition.name in self._metrics:
            raise ValueError(f"Metric {definition.name} already registered")
        self._metrics[definition.name] = definition
        logger.info(f"Registered metric: {definition.name} ({definition.type.value})")
    
    def validate_value(self, metric: MetricDefinition, value: Any) -> Union[int, float, bool]:
        """Validate and convert a metric value."""
        if metric.validation:
            if "min" in metric.validation and value < metric.validation["min"]:
                raise ValueError(f"Value {value} below minimum {metric.validation['min']}")
            if "max" in metric.validation and value > metric.validation["max"]:
                raise ValueError(f"Value {value} above maximum {metric.validation['max']}")
        
        if metric.type == MetricType.CONVERSION:
            return bool(value)
        elif metric.type in (MetricType.COUNTER, MetricType.DURATION):
            return int(value)
        else:
            return float(value)
    
    def record_event(
        self,
        experiment_id: str,
        variant_id: str,
        user_id: str,
        metric_name: str,
        value: Any,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Record a metric event."""
        if metric_name not in self._metrics:
            raise ValueError(f"Metric {metric_name} not registered")
            
        metric = self._metrics[metric_name]
        validated_value = self.validate_value(metric, value)
        
        event = MetricEvent(
            experiment_id=experiment_id,
            variant_id=variant_id,
            user_id=user_id,
            metric_name=metric_name,
            value=validated_value,
            timestamp=datetime.now(),
            type=metric.type,
            metadata=metadata or {}
        )
        
        self._events.append(event)
        self._user_events[experiment_id][user_id].append(event)
        logger.debug(f"Recorded {metric_name} event for user {user_id} in experiment {experiment_id}")
    
    def get_user_metrics(
        self,
        experiment_id: str,
        user_id: str,
        metric_names: Optional[Set[str]] = None
    ) -> Dict[str, List[MetricEvent]]:
        """Get all metric events for a user in an experiment."""
        events = self._user_events[experiment_id][user_id]
        if not metric_names:
            return {metric: [e for e in events if e.metric_name == metric]
                   for metric in self._metrics}
        return {metric: [e for e in events if e.metric_name == metric]
                for metric in metric_names}
    
    def get_experiment_metrics(
        self,
        experiment_id: str,
        metric_names: Optional[Set[str]] = None
    ) -> Dict[str, Dict[str, List[MetricEvent]]]:
        """Get all metric events for an experiment grouped by variant."""
        events = [e for e in self._events if e.experiment_id == experiment_id]
        metrics = metric_names or self._metrics.keys()
        
        result: Dict[str, Dict[str, List[MetricEvent]]] = defaultdict(lambda: defaultdict(list))
        for event in events:
            if event.metric_name in metrics:
                result[event.variant_id][event.metric_name].append(event)
        
        return result
    
    def compute_metric_stats(
        self,
        events: List[MetricEvent]
    ) -> Dict[str, Any]:
        """Compute statistics for a list of metric events."""
        if not events:
            return {}
            
        values = [e.value for e in events]
        metric_def = self._metrics[events[0].metric_name]
        
        stats = {
            "count": len(values),
            "first_timestamp": min(e.timestamp for e in events),
            "last_timestamp": max(e.timestamp for e in events)
        }
        
        if metric_def.type == MetricType.CONVERSION:
            stats.update({
                "conversion_rate": sum(1 for v in values if v) / len(values),
                "conversions": sum(1 for v in values if v)
            })
        else:
            stats.update({
                "sum": sum(values),
                "mean": statistics.mean(values),
                "median": statistics.median(values),
                "min": min(values),
                "max": max(values)
            })
            if len(values) > 1:
                stats["stddev"] = statistics.stdev(values)
        
        return stats 