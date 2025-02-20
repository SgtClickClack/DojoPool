#!/usr/bin/env python3
"""Script to run validation metrics monitoring."""

import argparse
import logging
import time
from datetime import datetime
from pathlib import Path

from .validation_metrics import ValidationMetricsMonitor


def setup_logging(log_dir: Path) -> None:
    """Setup logging configuration."""
    log_dir.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(log_dir / "monitoring.log"),
            logging.StreamHandler(),
        ],
    )


def run_monitoring(
    metrics_dir: str = "metrics/validation",
    snapshot_interval: int = 300,  # 5 minutes
    report_interval: int = 3600,  # 1 hour
    alert_check_interval: int = 60,  # 1 minute
) -> None:
    """Run the validation metrics monitoring system."""
    monitor = ValidationMetricsMonitor(metrics_dir=metrics_dir)
    logger = logging.getLogger(__name__)

    last_snapshot: float = time.time()
    last_report: float = time.time()
    last_alert_check: float = time.time()

    logger.info("Starting validation metrics monitoring...")

    try:
        while True:
            current_time = time.time()

            # Check for alerts
            if current_time - last_alert_check >= alert_check_interval:
                alerts = monitor.get_alerts()
                if alerts:
                    logger.warning(f"Found {len(alerts)} alerts:")
                    for alert in alerts:
                        logger.warning(
                            f"[{alert['level'].upper()}] {alert['field']}: {alert['message']}"
                        )
                last_alert_check = current_time

            # Save metrics snapshot
            if current_time - last_snapshot >= snapshot_interval:
                try:
                    monitor.save_metrics_snapshot()
                    last_snapshot = current_time
                except Exception as e:
                    logger.error(f"Error saving metrics snapshot: {e}")

            # Generate report
            if current_time - last_report >= report_interval:
                try:
                    report = monitor.generate_report()
                    logger.info(
                        f"Generated report: {len(report['alerts'])} alerts, "
                        f"{report['summary']['total_fields']} fields monitored"
                    )
                    last_report = current_time
                except Exception as e:
                    logger.error(f"Error generating report: {e}")

            # Sleep for a short interval
            time.sleep(
                min(
                    alert_check_interval,
                    snapshot_interval,
                    report_interval,
                    60,  # Maximum sleep time
                )
            )

    except KeyboardInterrupt:
        logger.info("Stopping validation metrics monitoring...")
    except Exception as e:
        logger.error(f"Unexpected error in monitoring loop: {e}")
        raise


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Run validation metrics monitoring")
    parser.add_argument(
        "--metrics-dir",
        default="metrics/validation",
        help="Directory to store metrics data",
    )
    parser.add_argument(
        "--snapshot-interval",
        type=int,
        default=300,
        help="Interval between metrics snapshots in seconds",
    )
    parser.add_argument(
        "--report-interval",
        type=int,
        default=3600,
        help="Interval between report generation in seconds",
    )
    parser.add_argument(
        "--alert-interval",
        type=int,
        default=60,
        help="Interval between alert checks in seconds",
    )

    args = parser.parse_args()

    # Setup logging
    log_dir = Path("logs/validation_monitoring")
    setup_logging(log_dir)

    # Run monitoring
    run_monitoring(
        metrics_dir=args.metrics_dir,
        snapshot_interval=args.snapshot_interval,
        report_interval=args.report_interval,
        alert_check_interval=args.alert_interval,
    )


if __name__ == "__main__":
    main()
