import logging
import statistics
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Union

class MetricType(Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"

@dataclass
class MetricEvent:
    name: str
    value: Union[int, float]
    timestamp: datetime
    labels: Dict[str, str]
    metric_type: MetricType
    device_type: Optional[str] = None

class MetricDefinition:
    def __init__(
        self, name: str, metric_type: MetricType, description: str
    ) -> None: ...
    def validate_event(self, event: MetricEvent) -> bool: ...

class MetricsCollector:
    def __init__(self) -> None: ...
    def add_metric(self, definition: MetricDefinition) -> None: ...
    def record_event(self, event: MetricEvent) -> None: ...
    def get_metrics(
        self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None
    ) -> Dict[str, List[MetricEvent]]: ...
