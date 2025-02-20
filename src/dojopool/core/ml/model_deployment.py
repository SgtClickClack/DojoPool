"""Model deployment system.

This module provides functionality for automated model deployment and validation.
"""

import json
import logging
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from .model_evaluation import ModelEvaluator
from .model_monitor import ModelMonitor
from .model_versioning import ModelVersion


class ModelDeployer:
    """Automated model deployment and validation."""

    def __init__(
        self,
        base_path: str,
        monitor: ModelMonitor,
        version_manager: ModelVersion,
        evaluator: ModelEvaluator,
    ):
        """Initialize model deployer.

        Args:
            base_path: Base path for deployment artifacts
            monitor: ModelMonitor instance
            version_manager: ModelVersion instance
            evaluator: ModelEvaluator instance
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.monitor = monitor
        self.version_manager = version_manager
        self.evaluator = evaluator
        self.logger = logging.getLogger(__name__)

        # Deployment configuration
        self.config_file = self.base_path / "deployment_config.json"
        self.config = self._load_config()

        # Deployment history
        self.history_file = self.base_path / "deployment_history.json"
        self.history = self._load_history()

        # Environment paths
        self.environments = {
            "staging": self.base_path / "staging",
            "production": self.base_path / "production",
            "rollback": self.base_path / "rollback",
        }
        for path in self.environments.values():
            path.mkdir(exist_ok=True)

    def deploy_model(
        self,
        model_type: str,
        version_id: str,
        environment: str,
        validation_data: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Deploy model to specified environment.

        Args:
            model_type: Type of model to deploy
            version_id: Version ID to deploy
            environment: Target environment
            validation_data: Optional validation data

        Returns:
            dict: Deployment results
        """
        if environment not in self.environments:
            raise ValueError(f"Invalid environment: {environment}")

        self.logger.info(
            f"Starting deployment of {model_type} model version {version_id} to {environment}"
        )

        # Validate version
        version_info = self.version_manager.get_version_info(version_id)
        if version_info["status"] != "active":
            raise ValueError(f"Cannot deploy inactive version: {version_id}")

        # Create deployment record
        deployment = {
            "model_type": model_type,
            "version_id": version_id,
            "environment": environment,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "in_progress",
            "validation_results": None,
            "rollback_info": None,
        }

        try:
            # Backup current version
            self._backup_current_version(environment, model_type)

            # Deploy new version
            self._deploy_version(version_id, environment)

            # Validate deployment
            if validation_data:
                validation_results = self._validate_deployment(
                    model_type, environment, validation_data
                )
                deployment["validation_results"] = validation_results

                # Check validation thresholds
                if not self._check_validation_thresholds(validation_results):
                    raise ValueError("Deployment validation failed")

            # Update deployment status
            deployment["status"] = "successful"
            self.version_manager.record_deployment(version_id, environment)

        except Exception as e:
            self.logger.error(f"Deployment failed: {str(e)}")
            deployment["status"] = "failed"
            deployment["error"] = str(e)

            # Attempt rollback
            try:
                rollback_info = self._rollback_deployment(environment, model_type)
                deployment["rollback_info"] = rollback_info
            except Exception as rollback_error:
                self.logger.error(f"Rollback failed: {str(rollback_error)}")
                deployment["rollback_info"] = {
                    "status": "failed",
                    "error": str(rollback_error),
                }

            raise

        finally:
            # Record deployment
            self._record_deployment(deployment)

        self.logger.info(f"Completed deployment to {environment}")
        return deployment

    def get_deployment_status(self, environment: str):
        """Get current deployment status for an environment.

        Args:
            environment: Target environment

        Returns:
            dict: Deployment status
        """
        if environment not in self.environments:
            raise ValueError(f"Invalid environment: {environment}")

        # Get latest deployment
        deployments = [d for d in self.history if d["environment"] == environment]
        if not deployments:
            return {"status": "no_deployment"}

        latest = max(deployments, key=lambda d: d["timestamp"])

        # Get current health status
        health_status = self._check_deployment_health(latest["model_type"], environment)

        return {
            "current_deployment": latest,
            "health_status": health_status,
            "uptime": (
                datetime.utcnow() - datetime.fromisoformat(latest["timestamp"])
            ).total_seconds(),
        }

    def list_deployments(
        self,
        environment: Optional[str] = None,
        model_type: Optional[str] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """List deployment history.

        Args:
            environment: Optional environment filter
            model_type: Optional model type filter
            limit: Maximum number of deployments to return

        Returns:
            list: Deployment history
        """
        deployments = self.history

        if environment:
            deployments = [d for d in deployments if d["environment"] == environment]

        if model_type:
            deployments = [d for d in deployments if d["model_type"] == model_type]

        return sorted(deployments, key=lambda d: d["timestamp"], reverse=True)[:limit]

    def validate_environment(self, environment: str, validation_data: Dict[str, Any]):
        """Validate all models in an environment.

        Args:
            environment: Target environment
            validation_data: Validation data

        Returns:
            dict: Validation results
        """
        if environment not in self.environments:
            raise ValueError(f"Invalid environment: {environment}")

        results = {}
        for model_type in ["shot", "success", "position"]:
            try:
                model_results = self._validate_deployment(
                    model_type, environment, validation_data
                )
                results[model_type] = model_results
            except Exception as e:
                self.logger.error(f"Validation failed for {model_type}: {str(e)}")
                results[model_type] = {"status": "failed", "error": str(e)}

        return results

    def _backup_current_version(self, environment: str, model_type: str):
        """Backup current version before deployment."""
        env_path = self.environments[environment]
        backup_path = self.environments["rollback"] / f"{environment}_{model_type}"

        if (env_path / model_type).exists():
            if backup_path.exists():
                shutil.rmtree(backup_path)
            shutil.copytree(env_path / model_type, backup_path)

    def _deploy_version(self, version_id: str, environment: str):
        """Deploy model version to environment."""
        model = self.version_manager.load_version(version_id)
        version_info = self.version_manager.get_version_info(version_id)

        # Create temporary directory for atomic deployment
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)

            # Save model and metadata
            model_path = temp_path / "model.joblib"
            metadata_path = temp_path / "metadata.json"

            import joblib

            joblib.dump(model, model_path)
            with open(metadata_path, "w") as f:
                json.dump(version_info, f, indent=2)

            # Move to environment (atomic operation)
            target_path = (
                self.environments[environment] / version_info["metadata"]["model_type"]
            )
            if target_path.exists():
                shutil.rmtree(target_path)
            shutil.copytree(temp_path, target_path)

    def _validate_deployment(
        self, model_type: str, environment: str, validation_data: Dict[str, Any]
    ):
        """Validate deployed model."""
        # Load deployed model
        model_path = self.environments[environment] / model_type / "model.joblib"
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found in {environment}")

        import joblib

        model = joblib.load(model_path)

        # Evaluate model
        results = self.evaluator.evaluate_model(
            model_type,
            {
                "training": validation_data.get("training", []),
                "testing": validation_data.get("testing", []),
            },
        )

        # Add deployment-specific metrics
        results["deployment_metrics"] = {
            "load_time": self._measure_load_time(model_path),
            "memory_usage": self._measure_memory_usage(model),
            "prediction_latency": self._measure_prediction_latency(
                model,
                (
                    validation_data["testing"][:100]
                    if validation_data.get("testing")
                    else []
                ),
            ),
        }

        return results

    def _check_validation_thresholds(self, validation_results: Dict[str, Any]) -> bool:
        """Check if validation results meet thresholds."""
        thresholds = self.config["validation_thresholds"]

        # Check basic metrics
        metrics = validation_results["basic_metrics"]
        for metric, threshold in thresholds["metrics"].items():
            if metric in metrics and metrics[metric] < threshold:
                self.logger.warning(
                    f"Validation failed: {metric} = {metrics[metric]} < {threshold}"
                )
                return False

        # Check deployment metrics
        deploy_metrics = validation_results["deployment_metrics"]
        if deploy_metrics["load_time"] > thresholds["load_time"]:
            self.logger.warning(
                f"Validation failed: load_time = {deploy_metrics['load_time']} > "
                f"{thresholds['load_time']}"
            )
            return False

        if deploy_metrics["prediction_latency"] > thresholds["prediction_latency"]:
            self.logger.warning(
                f"Validation failed: prediction_latency = "
                f"{deploy_metrics['prediction_latency']} > "
                f"{thresholds['prediction_latency']}"
            )
            return False

        return True

    def _rollback_deployment(self, environment: str, model_type: str) -> Dict[str, Any]:
        """Rollback failed deployment."""
        backup_path = self.environments["rollback"] / f"{environment}_{model_type}"
        if not backup_path.exists():
            raise FileNotFoundError("No backup found for rollback")

        target_path = self.environments[environment] / model_type
        if target_path.exists():
            shutil.rmtree(target_path)
        shutil.copytree(backup_path, target_path)

        return {"status": "successful", "timestamp": datetime.utcnow().isoformat()}

    def _check_deployment_health(self, model_type: str, environment: str):
        """Check health of deployed model."""
        model_path = self.environments[environment] / model_type / "model.joblib"
        if not model_path.exists():
            return {"status": "not_deployed"}

        try:
            # Load metadata
            with open(model_path.parent / "metadata.json", "r") as f:
                metadata = json.load(f)

            # Get monitoring metrics
            metrics = self.monitor.analyze_performance(model_type)

            # Check health status
            status = "healthy"
            issues = []

            if (
                metrics.get("error_rate", 0)
                > self.config["health_thresholds"]["error_rate"]
            ):
                status = "degraded"
                issues.append("High error rate")

            if (
                metrics.get("avg_latency", 0)
                > self.config["health_thresholds"]["latency"]
            ):
                status = "degraded"
                issues.append("High latency")

            # Check age
            age = (
                datetime.utcnow() - datetime.fromisoformat(metadata["created_at"])
            ).days
            if age > self.config["health_thresholds"]["max_age_days"]:
                status = "degraded"
                issues.append(f"Model age: {age} days")

            return {
                "status": status,
                "issues": issues,
                "metrics": metrics,
                "metadata": metadata,
            }

        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _measure_load_time(self, model_path: Path) -> float:
        """Measure model load time."""
        import time

        import joblib

        start_time = time.time()
        joblib.load(model_path)
        return time.time() - start_time

    def _measure_memory_usage(self, model: Any) -> int:
        """Measure model memory usage."""
        import sys

        return sys.getsizeof(model)

    def _measure_prediction_latency(self, model: Any, samples: List[Dict]):
        """Measure average prediction latency."""
        if not samples:
            return 0.0

        import time

        import numpy as np

        latencies = []
        for sample in samples:
            start_time = time.time()
            model.predict(np.array([sample]))
            latencies.append(time.time() - start_time)

        return float(np.mean(latencies))

    def _record_deployment(self, deployment: Dict[str, Any]):
        """Record deployment in history."""
        self.history.append(deployment)
        self._save_history()

    def _load_config(self) -> Dict[str, Any]:
        """Load deployment configuration."""
        if not self.config_file.exists():
            return {
                "validation_thresholds": {
                    "metrics": {"accuracy": 0.8, "f1": 0.75, "mse": 0.1},
                    "load_time": 1.0,  # seconds
                    "prediction_latency": 0.1,  # seconds
                },
                "health_thresholds": {
                    "error_rate": 0.05,
                    "latency": 0.5,  # seconds
                    "max_age_days": 30,
                },
            }

        with open(self.config_file, "r") as f:
            return json.load(f)

    def _load_history(self):
        """Load deployment history."""
        if not self.history_file.exists():
            return []

        with open(self.history_file, "r") as f:
            return json.load(f)

    def _save_history(self):
        """Save deployment history."""
        with open(self.history_file, "w") as f:
            json.dump(self.history, f, indent=2)
