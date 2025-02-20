"""Automated deployment orchestration system for model deployment automation."""

import json
import logging
import smtplib
import threading
import time
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any, Dict, List, Optional

import jinja2

from .model_deployment import ModelDeployer
from .model_evaluation import ModelEvaluator
from .model_monitor import ModelMonitor
from .model_versioning import ModelVersion


class AutomatedDeployment:
    """Automated deployment orchestration system."""

    def __init__(
        self,
        base_path: str,
        deployer: ModelDeployer,
        monitor: ModelMonitor,
        version_manager: ModelVersion,
        evaluator: ModelEvaluator,
    ):
        """Initialize automated deployment system.

        Args:
            base_path: Base path for deployment automation
            deployer: ModelDeployer instance
            monitor: ModelMonitor instance
            version_manager: ModelVersion instance
            evaluator: ModelEvaluator instance
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.deployer = deployer
        self.monitor = monitor
        self.version_manager = version_manager
        self.evaluator = evaluator
        self.logger = logging.getLogger(__name__)

        # Configuration
        self.config_file = self.base_path / "automation_config.json"
        self.config = self._load_config()

        # Deployment schedule
        self.schedule_file = self.base_path / "deployment_schedule.json"
        self.schedule = self._load_schedule()

        # Deployment queue
        self.queue_file = self.base_path / "deployment_queue.json"
        self.queue = self._load_queue()

        # Start scheduler thread
        self.scheduler_thread = threading.Thread(
            target=self._run_scheduler, daemon=True
        )
        self.scheduler_thread.start()

    def schedule_deployment(
        self,
        model_type: str,
        version_id: str,
        environment: str,
        schedule_time: datetime,
        validation_data: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Schedule model deployment.

        Args:
            model_type: Type of model to deploy
            version_id: Version ID to deploy
            environment: Target environment
            schedule_time: Scheduled deployment time
            validation_data: Optional validation data

        Returns:
            dict: Scheduled deployment info
        """
        # Validate inputs
        if environment not in self.deployer.environments:
            raise ValueError(f"Invalid environment: {environment}")

        if schedule_time < datetime.now():
            raise ValueError("Cannot schedule deployment in the past")

        # Create deployment schedule entry
        schedule_entry = {
            "id": f"deploy_{int(time.time())}",
            "model_type": model_type,
            "version_id": version_id,
            "environment": environment,
            "schedule_time": schedule_time.isoformat(),
            "validation_data": validation_data,
            "status": "scheduled",
        }

        # Add to schedule
        self.schedule.append(schedule_entry)
        self._save_schedule()

        self.logger.info(
            f"Scheduled deployment of {model_type} version {version_id} "
            f"to {environment} at {schedule_time}"
        )

        return schedule_entry

    def cancel_deployment(self, schedule_id: str):
        """Cancel scheduled deployment.

        Args:
            schedule_id: Scheduled deployment ID

        Returns:
            bool: Whether cancellation was successful
        """
        for entry in self.schedule:
            if entry["id"] == schedule_id and entry["status"] == "scheduled":
                entry["status"] = "cancelled"
                self._save_schedule()
                self.logger.info(f"Cancelled scheduled deployment {schedule_id}")
                return True
        return False

    def get_deployment_status(self, schedule_id: str):
        """Get status of scheduled deployment.

        Args:
            schedule_id: Scheduled deployment ID

        Returns:
            dict: Deployment status info
        """
        for entry in self.schedule:
            if entry["id"] == schedule_id:
                return entry
        return None

    def list_scheduled_deployments(self, status: Optional[str] = None):
        """List scheduled deployments.

        Args:
            status: Optional status filter

        Returns:
            list: Scheduled deployments
        """
        if status:
            return [entry for entry in self.schedule if entry["status"] == status]
        return self.schedule

    def _run_scheduler(self):
        """Run deployment scheduler."""
        while True:
            try:
                self._process_schedule()
                time.sleep(60)  # Check every minute
            except Exception as e:
                self.logger.error(f"Scheduler error: {str(e)}")

    def _process_schedule(self):
        """Process deployment schedule."""
        current_time = datetime.now()

        for entry in self.schedule:
            if entry["status"] != "scheduled":
                continue

            schedule_time = datetime.fromisoformat(entry["schedule_time"])
            if current_time >= schedule_time:
                self._execute_deployment(entry)

    def _execute_deployment(self, schedule_entry: Dict[str, Any]):
        """Execute scheduled deployment."""
        try:
            # Update status
            schedule_entry["status"] = "in_progress"
            self._save_schedule()

            # Execute deployment
            result = self.deployer.deploy_model(
                schedule_entry["model_type"],
                schedule_entry["version_id"],
                schedule_entry["environment"],
                schedule_entry["validation_data"],
            )

            # Update schedule entry
            schedule_entry["status"] = (
                "completed" if result["status"] == "successful" else "failed"
            )
            schedule_entry["result"] = result
            schedule_entry["completed_at"] = datetime.now().isoformat()

        except Exception as e:
            self.logger.error(f"Deployment execution failed: {str(e)}")
            schedule_entry["status"] = "failed"
            schedule_entry["error"] = str(e)
            schedule_entry["completed_at"] = datetime.now().isoformat()

        finally:
            self._save_schedule()
            self._send_deployment_notification(schedule_entry)

    def _load_config(self) -> Dict[str, Any]:
        """Load automation configuration."""
        if self.config_file.exists():
            with open(self.config_file, "r") as f:
                return json.load(f)

        # Default configuration
        config = {
            "notification_email": None,
            "deployment_window": {"start_hour": 0, "end_hour": 4},
            "validation_thresholds": {
                "min_accuracy": 0.9,
                "max_latency": 100,
                "max_memory_mb": 1024,
            },
            "retry_config": {"max_retries": 3, "retry_delay": 300},
        }

        with open(self.config_file, "w") as f:
            json.dump(config, f, indent=4)

        return config

    def _load_schedule(self):
        """Load deployment schedule."""
        if self.schedule_file.exists():
            with open(self.schedule_file, "r") as f:
                return json.load(f)
        return []

    def _save_schedule(self):
        """Save deployment schedule."""
        with open(self.schedule_file, "w") as f:
            json.dump(self.schedule, f, indent=4)

    def _load_queue(self):
        """Load deployment queue."""
        if self.queue_file.exists():
            with open(self.queue_file, "r") as f:
                return json.load(f)
        return []

    def _save_queue(self):
        """Save deployment queue."""
        with open(self.queue_file, "w") as f:
            json.dump(self.queue, f, indent=4)

    def _send_deployment_notification(self, deployment: Dict[str, Any]):
        """Send deployment notification."""
        if not self.config["notification_email"]:
            return

        # Create email message
        msg = MIMEMultipart()
        msg["Subject"] = f"Deployment {deployment['status']}: {deployment['id']}"
        msg["From"] = "deployment@dojopool.com"
        msg["To"] = self.config["notification_email"]

        # Create HTML content
        template = jinja2.Template(
            """
            <h2>Deployment Status Update</h2>
            <p>Deployment ID: {{ deployment.id }}</p>
            <p>Status: {{ deployment.status }}</p>
            <p>Model Type: {{ deployment.model_type }}</p>
            <p>Version ID: {{ deployment.version_id }}</p>
            <p>Environment: {{ deployment.environment }}</p>
            <p>Scheduled Time: {{ deployment.schedule_time }}</p>
            {% if deployment.completed_at %}
            <p>Completed At: {{ deployment.completed_at }}</p>
            {% endif %}

            {% if deployment.result %}
            <h3>Deployment Results</h3>
            <ul>
                {% if deployment.result.validation_results %}
                <li>Validation Results:
                    <ul>
                        {% for metric, value in deployment.result.validation_results.items() %}
                        <li>{{ metric }}: {{ value }}</li>
                        {% endfor %}
                    </ul>
                </li>
                {% endif %}
                {% if deployment.result.rollback_info %}
                <li>Rollback Info:
                    <ul>
                        <li>Status: {{ deployment.result.rollback_info.status }}</li>
                        {% if deployment.result.rollback_info.error %}
                        <li>Error: {{ deployment.result.rollback_info.error }}</li>
                        {% endif %}
                    </ul>
                </li>
                {% endif %}
            </ul>
            {% endif %}

            {% if deployment.error %}
            <h3>Error</h3>
            <p>{{ deployment.error }}</p>
            {% endif %}
        """
        )

        html_content = template.render(deployment=deployment)
        msg.attach(MIMEText(html_content, "html"))

        # Send email
        with smtplib.SMTP("localhost") as server:
            server.send_message(msg)
