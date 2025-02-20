"""Performance reporting system.

This module provides functionality for automated performance reporting and analysis.
"""

import json
import logging
import smtplib
from datetime import datetime, timedelta
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any, Dict, List

import matplotlib.pyplot as plt
from jinja2 import Template

from .model_monitor import ModelMonitor
from .model_retraining import ModelRetrainer
from .model_versioning import ModelVersion
from .performance_dashboard import PerformanceDashboard


class PerformanceReporting:
    """Automated performance reporting system."""

    def __init__(
        self,
        base_path: str,
        monitor: ModelMonitor,
        version_manager: ModelVersion,
        retrainer: ModelRetrainer,
        dashboard: PerformanceDashboard,
    ):
        """Initialize performance reporting system.

        Args:
            base_path: Base path for report storage
            monitor: ModelMonitor instance
            version_manager: ModelVersion instance
            retrainer: ModelRetrainer instance
            dashboard: PerformanceDashboard instance
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.monitor = monitor
        self.version_manager = version_manager
        self.retrainer = retrainer
        self.dashboard = dashboard
        self.logger = logging.getLogger(__name__)

        # Report storage
        self.reports_dir = self.base_path / "reports"
        self.reports_dir.mkdir(exist_ok=True)
        self.plots_dir = self.base_path / "plots"
        self.plots_dir.mkdir(exist_ok=True)

        # Configuration
        self.config_file = self.base_path / "reporting_config.json"
        self.config = self._load_config()

        # Email template
        self.email_template = Template(
            """
        <html>
        <body>
        <h2>ML Model Performance Report</h2>
        <p>Report Period: {{ start_time }} to {{ end_time }}</p>

        {% for model_type, metrics in performance_summary.items() %}
        <h3>{{ model_type|title }} Model</h3>
        <ul>
            <li>Current Accuracy: {{ "%.2f"|format(metrics.current_performance.accuracy|float) }}</li>
            <li>Average Latency: {{ "%.3f"|format(metrics.current_performance.avg_latency|float) }}s</li>
            <li>Health Status: {{ metrics.health_status.status }}</li>
            {% if metrics.health_status.issues %}
            <li>Issues:
                <ul>
                {% for issue in metrics.health_status.issues %}
                    <li>{{ issue }}</li>
                {% endfor %}
                </ul>
            </li>
            {% endif %}
        </ul>
        {% endfor %}

        <h3>Recommendations</h3>
        <ul>
        {% for model_type, recs in recommendations.items() %}
            {% if recs %}
            <li>{{ model_type|title }} Model:
                <ul>
                {% for rec in recs %}
                    <li>{{ rec }}</li>
                {% endfor %}
                </ul>
            </li>
            {% endif %}
        {% endfor %}
        </ul>

        <p>For detailed metrics and visualizations, please check the attached plots.</p>
        </body>
        </html>
        """
        )

    def generate_report(
        self, report_period: timedelta = timedelta(days=1), include_plots: bool = True
    ) -> Dict[str, Any]:
        """Generate performance report.

        Args:
            report_period: Time period to report on
            include_plots: Whether to generate plots

        Returns:
            dict: Report data
        """
        self.logger.info("Generating performance report")
        start_time = datetime.utcnow() - report_period

        # Get performance summary
        performance_summary = self.dashboard.get_performance_summary()

        # Get recommendations
        recommendations = self.dashboard.get_optimization_recommendations()

        # Generate plots if requested
        plots = {}
        if include_plots:
            plots = self._generate_plots(start_time)

        # Compile report
        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "period": {
                "start": start_time.isoformat(),
                "end": datetime.utcnow().isoformat(),
            },
            "performance_summary": performance_summary,
            "recommendations": recommendations,
            "plots": plots,
        }

        # Save report
        self._save_report(report)

        self.logger.info("Completed performance report generation")
        return report

    def send_report(self, report: Dict[str, Any], recipients: List[str]):
        """Send performance report via email.

        Args:
            report: Report data
            recipients: Email recipients
        """
        if not self.config.get("email"):
            self.logger.error("Email configuration not found")
            return

        try:
            # Create message
            msg = MIMEMultipart()
            msg["Subject"] = (
                f"ML Model Performance Report - {datetime.utcnow().strftime('%Y-%m-%d')}"
            )
            msg["From"] = self.config["email"]["sender"]
            msg["To"] = ", ".join(recipients)

            # Add HTML content
            html_content = self.email_template.render(
                start_time=report["period"]["start"],
                end_time=report["period"]["end"],
                performance_summary=report["performance_summary"],
                recommendations=report["recommendations"],
            )
            msg.attach(MIMEText(html_content, "html"))

            # Attach plots
            for plot_name, plot_path in report["plots"].items():
                with open(plot_path, "rb") as f:
                    img = MIMEImage(f.read())
                    img.add_header("Content-ID", f"<{plot_name}>")
                    img.add_header("Content-Disposition", "inline", filename=plot_name)
                    msg.attach(img)

            # Send email
            with smtplib.SMTP(self.config["email"]["smtp_server"]) as server:
                server.starttls()
                server.login(
                    self.config["email"]["username"], self.config["email"]["password"]
                )
                server.send_message(msg)

            self.logger.info(f"Sent performance report to {len(recipients)} recipients")

        except Exception as e:
            self.logger.error(f"Failed to send report: {str(e)}")

    def get_latest_reports(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get latest performance reports.

        Args:
            limit: Maximum number of reports to return

        Returns:
            list: Latest reports
        """
        reports = []
        for file in sorted(self.reports_dir.glob("*.json"), reverse=True):
            if len(reports) >= limit:
                break
            with open(file, "r") as f:
                reports.append(json.load(f))
        return reports

    def configure_reporting(self, config: Dict[str, Any]):
        """Configure reporting parameters.

        Args:
            config: Configuration parameters
        """
        self.config.update(config)
        self._save_config()

    def _generate_plots(self, start_time: datetime) -> Dict[str, str]:
        """Generate performance visualization plots."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        plots = {}

        for model_type in ["shot", "success", "position"]:
            # Accuracy trends
            plt.figure(figsize=(10, 6))
            trends = self.monitor._get_accuracy_trends()[model_type]
            plt.plot(trends["trend"], label="Accuracy")
            plt.axhline(
                y=self.dashboard.thresholds["accuracy"],
                color="r",
                linestyle="--",
                label="Threshold",
            )
            plt.title(f"{model_type.capitalize()} Model - Accuracy Trend")
            plt.xlabel("Window")
            plt.ylabel("Accuracy")
            plt.legend()
            plot_path = self.plots_dir / f"accuracy_trend_{model_type}_{timestamp}.png"
            plt.savefig(plot_path)
            plt.close()
            plots[f"accuracy_trend_{model_type}"] = str(plot_path)

            # Latency trends
            plt.figure(figsize=(10, 6))
            trends = self.monitor._get_latency_trends()[model_type]
            plt.plot(trends["trend"], label="Latency")
            plt.axhline(
                y=self.dashboard.thresholds["latency"],
                color="r",
                linestyle="--",
                label="Threshold",
            )
            plt.title(f"{model_type.capitalize()} Model - Latency Trend")
            plt.xlabel("Prediction")
            plt.ylabel("Latency (s)")
            plt.legend()
            plot_path = self.plots_dir / f"latency_trend_{model_type}_{timestamp}.png"
            plt.savefig(plot_path)
            plt.close()
            plots[f"latency_trend_{model_type}"] = str(plot_path)

            # Training history
            history = self.retrainer.get_retraining_history(model_type)
            if history:
                plt.figure(figsize=(10, 6))
                metrics = [
                    (
                        h["new_metrics"]["accuracy"]
                        if "accuracy" in h["new_metrics"]
                        else h["new_metrics"].get("mse", 0)
                    )
                    for h in history
                ]
                plt.plot(metrics, label="Performance")
                plt.title(f"{model_type.capitalize()} Model - Training History")
                plt.xlabel("Training Iteration")
                plt.ylabel("Metric Value")
                plt.legend()
                plot_path = (
                    self.plots_dir / f"training_history_{model_type}_{timestamp}.png"
                )
                plt.savefig(plot_path)
                plt.close()
                plots[f"training_history_{model_type}"] = str(plot_path)

        return plots

    def _save_report(self, report: Dict[str, Any]):
        """Save report to file."""
        timestamp = datetime.fromisoformat(report["timestamp"])
        filename = f"report_{timestamp.strftime('%Y%m%d_%H%M%S')}.json"

        with open(self.reports_dir / filename, "w") as f:
            json.dump(report, f, indent=2)

    def _load_config(self) -> Dict[str, Any]:
        """Load reporting configuration."""
        if not self.config_file.exists():
            return {
                "report_frequency": "daily",
                "include_plots": True,
                "retention_days": 30,
                "email": {
                    "enabled": False,
                    "smtp_server": "smtp.gmail.com",
                    "port": 587,
                    "sender": "",
                    "username": "",
                    "password": "",
                },
                "notification_thresholds": {
                    "accuracy_drop": 0.05,
                    "latency_increase": 0.2,
                    "error_rate_increase": 0.1,
                },
            }

        with open(self.config_file, "r") as f:
            return json.load(f)
