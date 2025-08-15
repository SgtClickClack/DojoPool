"""Real-time analytics module for tracking system metrics."""

import asyncio
import json
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum, auto
from statistics import mean, stdev
from typing import Any, Dict, List, Optional

from redis import ConnectionPool, Redis

from .constants import MetricTypes
from .log_config import logger


class AnalyticsPeriod(Enum):
    """Time periods for analytics aggregation."""

    MINUTE = 60
    HOUR = 3600
    DAY = 86400
    WEEK = 604800


@dataclass
class MetricSnapshot:
    """Snapshot of metric values at a point in time."""

    timestamp: datetime
    value: float
    metadata: Dict[str, Any]


class TrendDirection(Enum):
    """Trend direction indicators."""

    UP = auto()
    DOWN = auto()
    STABLE = auto()


class AnomalyType(Enum):
    """Types of anomalies that can be detected."""

    SPIKE = "spike"  # Sudden increase
    DROP = "drop"  # Sudden decrease
    TREND_BREAK = "trend_break"  # Break in trend
    LEVEL_SHIFT = "level_shift"  # Sustained change in level


class RealTimeAnalytics:
    """Real-time analytics manager."""

    def __init__(self):
        """Initialize analytics manager."""
        self._redis_pool = ConnectionPool(
            host="localhost", port=6379, db=1  # Separate DB for analytics
        )
        self._redis = Redis(connection_pool=self._redis_pool)
        self._snapshot_interval = 60  # Take snapshots every minute
        self._retention_periods = {
            AnalyticsPeriod.MINUTE: timedelta(hours=24),  # Keep minute data for 24 hours
            AnalyticsPeriod.HOUR: timedelta(days=7),  # Keep hourly data for 7 days
            AnalyticsPeriod.DAY: timedelta(days=90),  # Keep daily data for 90 days
            AnalyticsPeriod.WEEK: timedelta(days=365),  # Keep weekly data for 1 year
        }
        self._anomaly_thresholds = {
            MetricTypes.LATENCY.value: {
                "z_score": 3.0,  # Number of standard deviations for anomaly
                "min_samples": 30,  # Minimum samples needed
                "trend_window": 60,  # Window size for trend analysis (minutes)
                "change_threshold": 0.25,  # Minimum change to consider significant
            }
        }

    async def record_metric(
        self, metric_type: MetricTypes, value: float, metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Record a metric value with optional metadata."""
        try:
            snapshot = MetricSnapshot(
                timestamp=datetime.utcnow(), value=value, metadata=metadata or {}
            )

            # Store raw metric
            key = f"analytics:raw:{metric_type.value}:{snapshot.timestamp.timestamp()}"
            self._redis.set(
                key,
                json.dumps(
                    {
                        "timestamp": snapshot.timestamp.isoformat(),
                        "value": snapshot.value,
                        "metadata": snapshot.metadata,
                    }
                ),
                ex=int(self._retention_periods[AnalyticsPeriod.MINUTE].total_seconds()),
            )

            # Update running aggregates
            await self._update_aggregates(metric_type, snapshot)

        except Exception as e:
            logger.error(f"Error recording analytics metric: {str(e)}", exc_info=True)

    async def _update_aggregates(self, metric_type: MetricTypes, snapshot: MetricSnapshot) -> None:
        """Update metric aggregates for different time periods."""
        try:
            for period in AnalyticsPeriod:
                # Get period start timestamp
                period_start = self._get_period_start(snapshot.timestamp, period)
                key = f"analytics:aggregate:{metric_type.value}:{period.name}:{period_start.timestamp()}"

                # Update aggregate in Redis
                with self._redis.pipeline() as pipe:
                    pipe.watch(key)
                    current = pipe.get(key)

                    if current:
                        aggregate = json.loads(current)
                        aggregate["count"] += 1
                        aggregate["sum"] += snapshot.value
                        aggregate["min"] = min(aggregate["min"], snapshot.value)
                        aggregate["max"] = max(aggregate["max"], snapshot.value)
                        # Update metadata counters
                        for k, v in snapshot.metadata.items():
                            if k not in aggregate["metadata"]:
                                aggregate["metadata"][k] = {}
                            if str(v) not in aggregate["metadata"][k]:
                                aggregate["metadata"][k][str(v)] = 0
                            aggregate["metadata"][k][str(v)] += 1
                    else:
                        aggregate = {
                            "period_start": period_start.isoformat(),
                            "count": 1,
                            "sum": snapshot.value,
                            "min": snapshot.value,
                            "max": snapshot.value,
                            "metadata": {k: {str(v): 1} for k, v in snapshot.metadata.items()},
                        }

                    # Store updated aggregate
                    pipe.set(
                        key,
                        json.dumps(aggregate),
                        ex=int(self._retention_periods[period].total_seconds()),
                    )
                    pipe.execute()

        except Exception as e:
            logger.error(f"Error updating analytics aggregates: {str(e)}", exc_info=True)

    def _get_period_start(self, timestamp: datetime, period: AnalyticsPeriod) -> datetime:
        """Get the start of the period containing the timestamp."""
        if period == AnalyticsPeriod.MINUTE:
            return timestamp.replace(second=0, microsecond=0)
        elif period == AnalyticsPeriod.HOUR:
            return timestamp.replace(minute=0, second=0, microsecond=0)
        elif period == AnalyticsPeriod.DAY:
            return timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
        else:  # WEEK
            return (timestamp - timedelta(days=timestamp.weekday())).replace(
                hour=0, minute=0, second=0, microsecond=0
            )

    async def get_metric_stats(
        self,
        metric_type: MetricTypes,
        period: AnalyticsPeriod,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Get statistical analysis of metrics over a time period."""
        try:
            end_time = end_time or datetime.utcnow()
            start_time = start_time or (end_time - self._retention_periods[period])

            # Get all aggregates in the time range
            aggregates = []
            current_time = self._get_period_start(start_time, period)

            while current_time <= end_time:
                key = f"analytics:aggregate:{metric_type.value}:{period.name}:{current_time.timestamp()}"
                data = self._redis.get(key)
                if data:
                    aggregates.append(json.loads(data))

                # Move to next period
                if period == AnalyticsPeriod.MINUTE:
                    current_time += timedelta(minutes=1)
                elif period == AnalyticsPeriod.HOUR:
                    current_time += timedelta(hours=1)
                elif period == AnalyticsPeriod.DAY:
                    current_time += timedelta(days=1)
                else:  # WEEK
                    current_time += timedelta(weeks=1)

            if not aggregates:
                return {}

            # Calculate statistics
            total_count = sum(agg["count"] for agg in aggregates)
            total_sum = sum(agg["sum"] for agg in aggregates)

            return {
                "period": period.name,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "total_count": total_count,
                "average": total_sum / total_count if total_count > 0 else 0,
                "min": min(agg["min"] for agg in aggregates),
                "max": max(agg["max"] for agg in aggregates),
                "metadata_summary": self._summarize_metadata(aggregates),
            }

        except Exception as e:
            logger.error(f"Error getting metric stats: {str(e)}", exc_info=True)
            return {}

    def _summarize_metadata(self, aggregates: List[Dict[str, Any]]) -> Dict[str, Dict[str, int]]:
        """Summarize metadata across aggregates."""
        summary = {}

        for aggregate in aggregates:
            for key, values in aggregate["metadata"].items():
                if key not in summary:
                    summary[key] = {}
                for value, count in values.items():
                    if value not in summary[key]:
                        summary[key][value] = 0
                    summary[key][value] += count

        return summary

    async def start_cleanup_task(self) -> None:
        """Start periodic cleanup of old analytics data."""
        while True:
            try:
                for period in AnalyticsPeriod:
                    pattern = f"analytics:*:{period.name}:*"
                    cutoff_time = datetime.utcnow() - self._retention_periods[period]

                    # Scan and delete old data in batches
                    cursor = 0
                    while True:
                        cursor, keys = self._redis.scan(cursor, match=pattern, count=1000)

                        if keys:
                            # Filter keys older than cutoff
                            keys_to_delete = []
                            for key in keys:
                                try:
                                    timestamp = float(key.split(":")[-1])
                                    if datetime.fromtimestamp(timestamp) < cutoff_time:
                                        keys_to_delete.append(key)
                                except Exception:
                                    continue

                            # Delete old keys
                            if keys_to_delete:
                                self._redis.delete(*keys_to_delete)

                        if cursor == 0:
                            break

            except Exception as e:
                logger.error(f"Error in analytics cleanup: {str(e)}", exc_info=True)

            await asyncio.sleep(3600)  # Run cleanup hourly

    async def analyze_trend(
        self, metric_type: MetricTypes, period: AnalyticsPeriod, window_size: int = 60  # minutes
    ) -> Dict[str, Any]:
        """Analyze trend for a metric over time."""
        try:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(minutes=window_size)

            # Get metric data
            stats = await self.get_metric_stats(metric_type, period, start_time, end_time)
            if not stats:
                return {}

            # Calculate trend
            values = [agg["value"] for agg in stats.get("aggregates", [])]
            if len(values) < 2:
                return {"direction": TrendDirection.STABLE, "strength": 0}

            # Calculate trend direction and strength
            slope = self._calculate_slope(values)
            direction = self._get_trend_direction(slope)
            strength = abs(slope) / mean(values) if mean(values) != 0 else 0

            return {
                "direction": direction,
                "strength": strength,
                "slope": slope,
                "window_size": window_size,
                "sample_count": len(values),
            }

        except Exception as e:
            logger.error(f"Error analyzing trend: {str(e)}", exc_info=True)
            return {}

    def _calculate_slope(self, values: List[float]) -> float:
        """Calculate the slope of values over time."""
        if len(values) < 2:
            return 0

        x = list(range(len(values)))
        x_mean = mean(x)
        y_mean = mean(values)

        numerator = sum((xi - x_mean) * (yi - y_mean) for xi, yi in zip(x, values))
        denominator = sum((xi - x_mean) ** 2 for xi in x)

        return numerator / denominator if denominator != 0 else 0

    def _get_trend_direction(self, slope: float) -> TrendDirection:
        """Determine trend direction from slope."""
        if abs(slope) < 0.001:  # Threshold for considering trend stable
            return TrendDirection.STABLE
        return TrendDirection.UP if slope > 0 else TrendDirection.DOWN

    async def detect_anomalies(
        self, metric_type: MetricTypes, period: AnalyticsPeriod, window_size: int = 60  # minutes
    ) -> List[Dict[str, Any]]:
        """Detect anomalies in metric data."""
        try:
            thresholds = self._anomaly_thresholds.get(metric_type.value, {})
            if not thresholds:
                return []

            # Get metric data
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(minutes=window_size)
            stats = await self.get_metric_stats(metric_type, period, start_time, end_time)

            values = [agg["value"] for agg in stats.get("aggregates", [])]
            if len(values) < thresholds["min_samples"]:
                return []

            anomalies = []

            # Detect spikes and drops using z-score
            mean_val = mean(values)
            std_val = stdev(values) if len(values) > 1 else 0

            for i, value in enumerate(values):
                if std_val > 0:
                    z_score = abs(value - mean_val) / std_val
                    if z_score > thresholds["z_score"]:
                        anomalies.append(
                            {
                                "type": AnomalyType.SPIKE if value > mean_val else AnomalyType.DROP,
                                "timestamp": (start_time + timedelta(minutes=i)).isoformat(),
                                "value": value,
                                "z_score": z_score,
                                "threshold": thresholds["z_score"],
                            }
                        )

            # Detect trend breaks
            if len(values) >= thresholds["trend_window"]:
                for i in range(thresholds["trend_window"], len(values)):
                    window1 = values[i - thresholds["trend_window"] : i]
                    window2 = values[i : i + thresholds["trend_window"]]

                    if len(window2) >= thresholds["min_samples"]:
                        trend1 = self._calculate_slope(window1)
                        trend2 = self._calculate_slope(window2)

                        if abs(trend1 - trend2) > thresholds["change_threshold"]:
                            anomalies.append(
                                {
                                    "type": AnomalyType.TREND_BREAK,
                                    "timestamp": (start_time + timedelta(minutes=i)).isoformat(),
                                    "value": values[i],
                                    "trend_change": abs(trend1 - trend2),
                                }
                            )

            # Detect level shifts
            window_size = min(thresholds["trend_window"], len(values) // 2)
            if window_size > 0:
                for i in range(window_size, len(values) - window_size):
                    window1 = values[i - window_size : i]
                    window2 = values[i : i + window_size]

                    mean1 = mean(window1)
                    mean2 = mean(window2)

                    if abs(mean2 - mean1) / mean1 > thresholds["change_threshold"]:
                        anomalies.append(
                            {
                                "type": AnomalyType.LEVEL_SHIFT,
                                "timestamp": (start_time + timedelta(minutes=i)).isoformat(),
                                "value": values[i],
                                "shift_magnitude": abs(mean2 - mean1) / mean1,
                            }
                        )

            return sorted(anomalies, key=lambda x: x["timestamp"])

        except Exception as e:
            logger.error(f"Error detecting anomalies: {str(e)}", exc_info=True)
            return []

    async def get_metric_insights(
        self, metric_type: MetricTypes, period: AnalyticsPeriod, window_size: int = 60
    ) -> Dict[str, Any]:
        """Get comprehensive insights for a metric."""
        try:
            # Get basic stats
            stats = await self.get_metric_stats(metric_type, period)

            # Get trend analysis
            trend = await self.analyze_trend(metric_type, period, window_size)

            # Get anomalies
            anomalies = await self.detect_anomalies(metric_type, period, window_size)

            # Combine insights
            return {
                "stats": stats,
                "trend": trend,
                "anomalies": anomalies,
                "summary": {
                    "has_anomalies": len(anomalies) > 0,
                    "trend_direction": trend.get("direction", TrendDirection.STABLE),
                    "trend_strength": trend.get("strength", 0),
                    "anomaly_count": len(anomalies),
                },
            }

        except Exception as e:
            logger.error(f"Error getting metric insights: {str(e)}", exc_info=True)
            return {}


# Global analytics instance
analytics_manager = RealTimeAnalytics()
