from multiprocessing import Pool
from multiprocessing import Pool
"""Validation metrics monitoring integration."""

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List

from ..validation.validators import VenueValidator

logger = logging.getLogger(__name__)


class ValidationMetricsMonitor:
    """Monitor and report validation metrics."""

    def __init__(self, metrics_dir: str = "metrics/validation"):
        """Initialize the monitor."""
        self.metrics_dir = Path(metrics_dir)
        self.metrics_dir.mkdir(parents=True, exist_ok=True)
        self._setup_logging()

    def _setup_logging(self) -> None:
        """Setup logging configuration."""
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler(self.metrics_dir / "validation_metrics.log"),
                logging.StreamHandler(),
            ],
        )

    def collect_metrics(self) -> Dict[str, Any]:
        """Collect current validation metrics."""
        return VenueValidator.get_metrics()

    def save_metrics_snapshot(self):
        """Save current metrics to a timestamped file."""
        metrics = self.collect_metrics()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = self.metrics_dir / f"metrics_snapshot_{timestamp}.json"

        with open(file_path, "w") as f:
            json.dump(metrics, f, indent=2)

        logger.info(f"Saved metrics snapshot to {file_path}")

    def get_validation_trends(self, hours: int = 24):
        """Get validation trends over the specified time period."""
        trends: Dict[str, List[Dict[str, Any]]] = {}
        cutoff_time = datetime.now() - timedelta(hours=hours)

        # Collect all metric files within the time range
        metric_files = sorted(
            [
                f
                for f in self.metrics_dir.glob("metrics_snapshot_*.json")
                if self._get_timestamp_from_file(f) > cutoff_time
            ]
        )

        for file_path in metric_files:
            try:
                with open(file_path) as f:
                    metrics = json.load(f)
                timestamp = self._get_timestamp_from_file(file_path)

                for field, data in metrics.items():
                    if field == "_meta":
                        continue

                    if field not in trends:
                        trends[field] = []

                    trends[field].append(
                        {
                            "timestamp": timestamp.isoformat(),
                            "success_rate": data["success_rate"],
                            "avg_duration_ms": data["avg_duration_ms"],
                        }
                    )
            except Exception as e:
                logger.error(f"Error processing metrics file {file_path}: {e}")

        return trends

    def get_alerts(self) -> List[Dict[str, Any]]:
        """Get validation alerts based on metrics."""
        alerts = []
        metrics = self.collect_metrics()

        for field, data in metrics.items():
            if field == "_meta":
                continue

            # Alert on low success rates
            if data["success_rate"] < 95:
                alerts.append(
                    {
                        "level": "warning",
                        "field": field,
                        "message": f"Low validation success rate ({data['success_rate']:.1f}%) for {field}",
                        "timestamp": datetime.now().isoformat(),
                    }
                )

            # Alert on high average duration
            if data["avg_duration_ms"] > 100:  # More than 100ms
                alerts.append(
                    {
                        "level": "warning",
                        "field": field,
                        "message": f"High validation duration ({data['avg_duration_ms']:.1f}ms) for {field}",
                        "timestamp": datetime.now().isoformat(),
                    }
                )

            # Alert on high failure counts
            if data["failure_count"] > 1000:
                alerts.append(
                    {
                        "level": "error",
                        "field": field,
                        "message": f"High failure count ({data['failure_count']}) for {field}",
                        "timestamp": datetime.now().isoformat(),
                    }
                )

        return alerts

    def generate_report(self) -> Dict[str, Any]:
        """Generate a comprehensive validation metrics report."""
        current_metrics = self.collect_metrics()
        trends = self.get_validation_trends(hours=24)
        alerts = self.get_alerts()

        report = {
            "timestamp": datetime.now().isoformat(),
            "current_metrics": current_metrics,
            "trends": trends,
            "alerts": alerts,
            "summary": {
                "total_fields": len(current_metrics) - 1,  # Exclude _meta
                "alert_count": len(alerts),
                "fields_with_low_success_rate": [
                    field
                    for field, data in current_metrics.items()
                    if field != "_meta" and data["success_rate"] < 95
                ],
            },
        }

        # Save report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = self.metrics_dir / f"validation_report_{timestamp}.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        logger.info(f"Generated validation report: {report_path}")
        return report

    @staticmethod
    def _get_timestamp_from_file(file_path: Path) -> datetime:
        """Extract timestamp from metric filename."""
        try:
            # Expected format: metrics_snapshot_YYYYMMDD_HHMMSS.json
            timestamp_str = file_path.stem.split("_", 2)[2]
            return datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
        except Exception as e:
            logger.error(f"Error parsing timestamp from {file_path}: {e}")
            return datetime.fromtimestamp(file_path.stat().st_mtime)
