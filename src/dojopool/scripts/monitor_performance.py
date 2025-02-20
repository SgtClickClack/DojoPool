import logging
import os
import smtplib
import sqlite3
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

# Alert thresholds
THRESHOLDS = {
    "size_increase_percent": 5.0,  # Alert if size increases by 5%
    "webp_adoption_decrease": 5.0,  # Alert if WebP adoption drops by 5%
    "avif_adoption_decrease": 5.0,  # Alert if AVIF adoption drops by 5%
    "lazy_loading_decrease": 5.0,  # Alert if lazy loading drops by 5%
}


def get_metrics_comparison() -> Dict[str, Any]:
    """Compare current metrics with previous day."""
    db_path = Path("performance_history.db")
    if not db_path.exists():
        return {}

    with sqlite3.connect(db_path) as conn:
        # Get latest metrics
        latest = conn.execute(
            """
            SELECT * FROM performance_metrics
            ORDER BY timestamp DESC LIMIT 1
        """
        ).fetchone()

        # Get previous day's metrics
        previous = conn.execute(
            """
            SELECT * FROM performance_metrics
            WHERE timestamp < ?
            ORDER BY timestamp DESC LIMIT 1
        """,
            (latest[0],),
        ).fetchone()

        if not previous:
            return {}

        return {
            "size_change": (latest[3] - previous[3]) / previous[3] * 100,
            "webp_adoption_change": latest[6] - previous[6],
            "avif_adoption_change": latest[7] - previous[7],
            "lazy_loading_change": latest[8] - previous[8],
            "current": {
                "timestamp": latest[0],
                "total_size": latest[3],
                "webp_adoption": latest[6],
                "avif_adoption": latest[7],
                "lazy_loading": latest[8],
            },
        }


def check_for_regressions(metrics: Dict[str, Any]) -> List[str]:
    """Check for performance regressions based on thresholds."""
    if not metrics:
        return []

    alerts = []

    # Check size increase
    if metrics["size_change"] > THRESHOLDS["size_increase_percent"]:
        alerts.append(
            f"Total image size increased by {metrics['size_change']:.1f}% "
            f"(current: {metrics['current']['total_size'] / 1024 / 1024:.1f}MB)"
        )

    # Check WebP adoption
    if metrics["webp_adoption_change"] < -THRESHOLDS["webp_adoption_decrease"]:
        alerts.append(
            f"WebP adoption decreased by {-metrics['webp_adoption_change']:.1f}% "
            f"(current: {metrics['current']['webp_adoption']:.1f}%)"
        )

    # Check AVIF adoption
    if metrics["avif_adoption_change"] < -THRESHOLDS["avif_adoption_decrease"]:
        alerts.append(
            f"AVIF adoption decreased by {-metrics['avif_adoption_change']:.1f}% "
            f"(current: {metrics['current']['avif_adoption']:.1f}%)"
        )

    # Check lazy loading
    if metrics["lazy_loading_change"] < -THRESHOLDS["lazy_loading_decrease"]:
        alerts.append(
            f"Lazy loading adoption decreased by {-metrics['lazy_loading_change']:.1f}% "
            f"(current: {metrics['current']['lazy_loading']:.1f}%)"
        )

    return alerts


def send_alert_email(alerts: List[str]) -> None:
    """Send alert email for performance regressions."""
    if not alerts:
        return

    # Get email configuration
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port_str = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    alert_email = os.getenv("ALERT_EMAIL")

    # Validate configuration
    if not smtp_host:
        logger.error("SMTP_HOST not configured")
        return
    if not smtp_port_str:
        logger.error("SMTP_PORT not configured")
        return
    if not smtp_user:
        logger.error("SMTP_USER not configured")
        return
    if not smtp_pass:
        logger.error("SMTP_PASS not configured")
        return
    if not alert_email:
        logger.error("ALERT_EMAIL not configured")
        return

    try:
        smtp_port = int(smtp_port_str)

        msg = MIMEMultipart()
        msg["Subject"] = "Image Performance Alert"
        msg["From"] = smtp_user
        msg["To"] = alert_email

        body = "The following performance regressions were detected:\n\n"
        body += "\n".join(f"- {alert}" for alert in alerts)
        body += "\n\nPlease investigate these changes."

        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

        logger.info("Alert email sent successfully")

    except ValueError:
        logger.error(f"Invalid SMTP_PORT value: {smtp_port_str}")
    except Exception as e:
        logger.error(f"Failed to send alert email: {str(e)}")


def main():
    # Set up logging
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    # Get metrics comparison
    metrics = get_metrics_comparison()
    if not metrics:
        logger.warning("No metrics available for comparison")
        return

    # Check for regressions
    alerts = check_for_regressions(metrics)
    if alerts:
        logger.warning("Performance regressions detected:")
        for alert in alerts:
            logger.warning(f"- {alert}")
        send_alert_email(alerts)
    else:
        logger.info("No performance regressions detected")


if __name__ == "__main__":
    main()
