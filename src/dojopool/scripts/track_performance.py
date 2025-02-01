import json
import logging
import sqlite3
from datetime import datetime
from typing import Any, Dict

logger = logging.getLogger(__name__)


class PerformanceTracker:
    def __init__(self, db_path: str = "performance_history.db"):
        """Initialize the performance tracker."""
        self.db_path = db_path
        self.setup_database()

    def setup_database(self) -> None:
        """Create the database schema if it doesn't exist."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS performance_metrics (
                    timestamp TEXT,
                    total_images INTEGER,
                    total_size_original INTEGER,
                    total_size_optimized INTEGER,
                    total_size_webp INTEGER,
                    total_size_avif INTEGER,
                    webp_adoption_rate REAL,
                    avif_adoption_rate REAL,
                    lazy_loading_rate REAL,
                    responsive_image_rate REAL,
                    preloaded_images INTEGER
                )
            """
            )

    def collect_metrics(self) -> Dict[str, Any]:
        """Collect current performance metrics."""
        try:
            with open("performance_metrics.json", "r") as f:
                data = json.load(f)
                metrics = data[0] if isinstance(data, list) else data

            return {
                "timestamp": datetime.now().isoformat(),
                "total_images": int(metrics.get("total_images", 0)),
                "total_size_original": int(metrics.get("total_size_original", 0)),
                "total_size_optimized": int(metrics.get("total_size_optimized", 0)),
                "total_size_webp": int(metrics.get("total_size_webp", 0)),
                "total_size_avif": int(metrics.get("total_size_avif", 0)),
                "webp_adoption_rate": float(metrics.get("webp_adoption_rate", 0)),
                "avif_adoption_rate": float(metrics.get("avif_adoption_rate", 0)),
                "lazy_loading_rate": float(metrics.get("lazy_loading_rate", 0)),
                "responsive_image_rate": float(metrics.get("responsive_image_rate", 0)),
                "preloaded_images": int(metrics.get("preloaded_images", 0)),
            }
        except Exception as e:
            logger.error(f"Error collecting metrics: {str(e)}")
            return {}

    def store_metrics(self, metrics: Dict[str, Any]) -> None:
        """Store metrics in the database."""
        if not metrics:
            return

        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO performance_metrics VALUES (
                    :timestamp,
                    :total_images,
                    :total_size_original,
                    :total_size_optimized,
                    :total_size_webp,
                    :total_size_avif,
                    :webp_adoption_rate,
                    :avif_adoption_rate,
                    :lazy_loading_rate,
                    :responsive_image_rate,
                    :preloaded_images
                )
            """,
                metrics,
            )

    def generate_report(self) -> Dict[str, Any]:
        """Generate a performance report with trends."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Get latest metrics
                latest = conn.execute(
                    """
                    SELECT * FROM performance_metrics
                    ORDER BY timestamp DESC LIMIT 1
                """
                ).fetchone()

                if not latest:
                    logger.warning("No metrics data available yet")
                    return {"current": {}, "trends": {}}

                # Get historical trends
                trends = conn.execute(
                    """
                    SELECT
                        COALESCE(AVG(webp_adoption_rate), 0) as avg_webp_rate,
                        COALESCE(AVG(avif_adoption_rate), 0) as avg_avif_rate,
                        COALESCE(AVG(lazy_loading_rate), 0) as avg_lazy_rate,
                        COALESCE(AVG(total_size_optimized), 0) as avg_size
                    FROM performance_metrics
                    WHERE timestamp >= date('now', '-7 days')
                """
                ).fetchone()

                size_reduction = 0
                if latest[2] > 0:  # total_size_original
                    size_reduction = (latest[2] - latest[3]) / latest[2] * 100

                return {
                    "current": {
                        "timestamp": latest[0],
                        "total_images": latest[1],
                        "size_reduction": size_reduction,
                        "webp_adoption": latest[6],
                        "avif_adoption": latest[7],
                        "lazy_loading": latest[8],
                    },
                    "trends": {
                        "avg_webp_rate": trends[0],
                        "avg_avif_rate": trends[1],
                        "avg_lazy_rate": trends[2],
                        "avg_size": trends[3],
                    },
                }
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}")
            return {"current": {}, "trends": {}}


def main():
    # Set up logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

    # Initialize tracker
    tracker = PerformanceTracker()

    # Collect and store metrics
    metrics = tracker.collect_metrics()
    if metrics:
        tracker.store_metrics(metrics)
        logger.info("Successfully stored performance metrics")

        # Generate and log report
        report = tracker.generate_report()
        logger.info("\nPerformance Report:")
        logger.info(f"Images: {report['current']['total_images']}")
        logger.info(f"Size reduction: {report['current']['size_reduction']:.2f}%")
        logger.info(f"WebP adoption: {report['current']['webp_adoption']:.2f}%")
        logger.info(f"AVIF adoption: {report['current']['avif_adoption']:.2f}%")
        logger.info(f"Lazy loading: {report['current']['lazy_loading']:.2f}%")
    else:
        logger.error("Failed to collect performance metrics")


if __name__ == "__main__":
    main()
