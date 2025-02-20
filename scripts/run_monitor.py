import argparse
import logging
import os
import signal
import sys
import time
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from dojopool.monitor_basic import BasicMonitor


def setup_logging():
    """Setup logging configuration."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
        handlers=[logging.FileHandler("monitor.log"), logging.StreamHandler()],
    )


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    logging.info("Received shutdown signal. Stopping monitor...")
    if monitor:
        monitor.stop()
    sys.exit(0)


def main():
    parser = argparse.ArgumentParser(description="DojoPool Performance Monitor")
    parser.add_argument(
        "--auto-optimize",
        action="store_true",
        help="Enable automatic optimization of system resources",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=60,
        help="Monitoring interval in seconds (default: 60)",
    )
    args = parser.parse_args()

    setup_logging()
    logging.info("Starting DojoPool Performance Monitor...")

    if args.auto_optimize:
        logging.info("Auto-optimization is enabled")

    # Create and start the monitor
    global monitor
    monitor = BasicMonitor(auto_optimize=args.auto_optimize)
    monitor.start()

    try:
        while True:
            # Get and display optimization summary every interval
            summary = monitor.get_optimization_summary()
            if summary.get("message") != "No optimization history available":
                logging.info("\nOptimization Summary:")
                logging.info(
                    f"Total Recommendations: {summary['total_recommendations']}"
                )
                if summary.get("by_type"):
                    logging.info("\nRecommendations by Type:")
                    for type_, count in summary["by_type"].items():
                        logging.info(f"  {type_}: {count}")
                if summary.get("by_severity"):
                    logging.info("\nRecommendations by Severity:")
                    for severity, count in summary["by_severity"].items():
                        logging.info(f"  {severity}: {count}")

            time.sleep(args.interval)
    except KeyboardInterrupt:
        logging.info("\nShutting down monitor...")
    finally:
        if monitor:
            monitor.stop()


if __name__ == "__main__":
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    monitor = None
    main()
