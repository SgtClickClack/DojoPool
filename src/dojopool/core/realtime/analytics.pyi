import asyncio
import json
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum, auto
from statistics import mean, stdev
from typing import Any, Dict, List, Optional, Union

from redis import ConnectionPool, Redis

from .constants import MetricTypes
from .log_config import logger

class AnalyticsPeriod(Enum):
    MINUTE = "minute"
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"

@dataclass
class MetricSnapshot:
    timestamp: datetime
    value: float
    metric_type: str
    metadata: Dict[str, Any]

class TrendDirection(Enum):
    UP = "up"
    DOWN = "down"
    STABLE = "stable"
    VOLATILE = "volatile"

class AnomalyType(Enum):
    SPIKE = "spike"
    DROP = "drop"
    TREND_CHANGE = "trend_change"
    PATTERN_BREAK = "pattern_break"

class RealTimeAnalytics:
    def __init__(self, redis_pool: ConnectionPool) -> None: ...
    def track_metric(
        self, metric_type: str, value: float, metadata: Optional[Dict[str, Any]] = None
    ) -> None: ...
    def get_current_value(self, metric_type: str) -> Optional[float]: ...
    def get_metrics_history(
        self, metric_type: str, period: AnalyticsPeriod, limit: Optional[int] = None
    ) -> List[MetricSnapshot]: ...
    def calculate_trend(
        self, metric_type: str, period: AnalyticsPeriod
    ) -> TrendDirection: ...
    def detect_anomalies(
        self, metric_type: str, period: AnalyticsPeriod, threshold: float = 2.0
    ) -> List[Dict[str, Any]]: ...
    def get_summary_stats(
        self, metric_type: str, period: AnalyticsPeriod
    ) -> Dict[str, float]: ...
    def compare_periods(
        self, metric_type: str, period1: AnalyticsPeriod, period2: AnalyticsPeriod
    ) -> Dict[str, Any]: ...
    def forecast_metric(
        self, metric_type: str, horizon: timedelta
    ) -> List[Dict[str, Any]]: ...
    def set_alert_threshold(
        self,
        metric_type: str,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
    ) -> None: ...
    def get_alert_thresholds(self, metric_type: str) -> Dict[str, Optional[float]]: ...
    async def start_monitoring(
        self, metric_type: MetricTypes, period: AnalyticsPeriod, window_size: int = 60
    ) -> None: ...
    def stop_monitoring(self, metric_type: str) -> None: ...
    def export_metrics(
        self, metric_type: str, start_time: datetime, end_time: datetime
    ) -> Dict[str, Any]: ...
    def import_metrics(self, data: Dict[str, Any]) -> None: ...
