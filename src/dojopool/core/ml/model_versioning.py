"""Model versioning system for ML models.

This module provides functionality for versioning and tracking ML models.
"""

import hashlib
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

import joblib


class ModelVersion:
    """Model version tracking and management."""

    def __init__(self, model_path: str):
        """Initialize model version tracker.

        Args:
            model_path: Base path for model storage
        """
        self.model_path = Path(model_path)
        self.model_path.mkdir(parents=True, exist_ok=True)
        self.versions_file = self.model_path / "versions.json"
        self.versions: Dict[str, Dict] = self._load_versions()
        self.logger = logging.getLogger(__name__)

    def create_version(self, model: Any, metadata: Dict[str, Any]) -> str:
        """Create new model version.

        Args:
            model: Model instance
            metadata: Version metadata

        Returns:
            str: Version ID
        """
        version_id = str(uuid4())
        timestamp = datetime.utcnow()

        # Calculate model hash
        model_bytes = joblib.dumps(model)
        model_hash = hashlib.sha256(model_bytes).hexdigest()

        # Save model
        model_file = self.model_path / f"{version_id}.joblib"
        joblib.dump(model, model_file)

        # Record version info
        version_info = {
            "id": version_id,
            "created_at": timestamp.isoformat(),
            "model_hash": model_hash,
            "model_file": str(model_file),
            "metadata": metadata,
            "status": "active",
            "metrics": {},
            "deployment_history": [],
        }

        self.versions[version_id] = version_info
        self._save_versions()

        self.logger.info(f"Created model version {version_id}")
        return version_id

    def load_version(self, version_id: str) -> Any:
        """Load model version.

        Args:
            version_id: Version ID

        Returns:
            Model instance
        """
        if version_id not in self.versions:
            raise ValueError(f"Unknown version ID: {version_id}")

        version = self.versions[version_id]
        model_file = Path(version["model_file"])

        if not model_file.exists():
            raise FileNotFoundError(f"Model file not found: {model_file}")

        return joblib.load(model_file)

    def update_metrics(self, version_id: str, metrics: Dict[str, Any]):
        """Update version metrics.

        Args:
            version_id: Version ID
            metrics: Performance metrics
        """
        if version_id not in self.versions:
            raise ValueError(f"Unknown version ID: {version_id}")

        version = self.versions[version_id]
        version["metrics"] = metrics
        version["last_updated"] = datetime.utcnow().isoformat()

        self._save_versions()
        self.logger.info(f"Updated metrics for version {version_id}")

    def record_deployment(self, version_id: str, environment: str):
        """Record model deployment.

        Args:
            version_id: Version ID
            environment: Deployment environment
        """
        if version_id not in self.versions:
            raise ValueError(f"Unknown version ID: {version_id}")

        version = self.versions[version_id]
        deployment = {
            "environment": environment,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "successful",
        }

        version["deployment_history"].append(deployment)
        version["last_deployed"] = deployment["timestamp"]

        self._save_versions()
        self.logger.info(f"Recorded deployment of version {version_id} to {environment}")

    def deprecate_version(self, version_id: str, reason: str):
        """Deprecate model version.

        Args:
            version_id: Version ID
            reason: Reason for deprecation
        """
        if version_id not in self.versions:
            raise ValueError(f"Unknown version ID: {version_id}")

        version = self.versions[version_id]
        version["status"] = "deprecated"
        version["deprecation_reason"] = reason
        version["deprecated_at"] = datetime.utcnow().isoformat()

        self._save_versions()
        self.logger.info(f"Deprecated version {version_id}: {reason}")

    def get_version_info(self, version_id: str) -> Dict[str, Any]:
        """Get version information.

        Args:
            version_id: Version ID

        Returns:
            dict: Version information
        """
        if version_id not in self.versions:
            raise ValueError(f"Unknown version ID: {version_id}")

        return self.versions[version_id]

    def list_versions(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """List model versions.

        Args:
            status: Filter by status

        Returns:
            list: Version information
        """
        versions = list(self.versions.values())

        if status:
            versions = [v for v in versions if v["status"] == status]

        return sorted(versions, key=lambda v: v["created_at"], reverse=True)

    def compare_versions(self, version_id_1: str, version_id_2: str) -> Dict[str, Any]:
        """Compare two model versions.

        Args:
            version_id_1: First version ID
            version_id_2: Second version ID

        Returns:
            dict: Comparison results
        """
        if version_id_1 not in self.versions or version_id_2 not in self.versions:
            raise ValueError("Unknown version ID")

        v1 = self.versions[version_id_1]
        v2 = self.versions[version_id_2]

        # Compare metrics
        metric_diffs = {}
        for metric in set(v1["metrics"].keys()) | set(v2["metrics"].keys()):
            m1 = v1["metrics"].get(metric, 0)
            m2 = v2["metrics"].get(metric, 0)
            metric_diffs[metric] = {
                "difference": m2 - m1,
                "percentage_change": ((m2 - m1) / m1 * 100) if m1 != 0 else float("inf"),
            }

        return {
            "version_1": {"id": v1["id"], "created_at": v1["created_at"], "metrics": v1["metrics"]},
            "version_2": {"id": v2["id"], "created_at": v2["created_at"], "metrics": v2["metrics"]},
            "metric_differences": metric_diffs,
            "time_difference": (
                datetime.fromisoformat(v2["created_at"]) - datetime.fromisoformat(v1["created_at"])
            ).total_seconds(),
            "comparison_timestamp": datetime.utcnow().isoformat(),
        }

    def _load_versions(self) -> Dict[str, Dict]:
        """Load versions from file."""
        if not self.versions_file.exists():
            return {}

        try:
            with open(self.versions_file, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            self.logger.error("Failed to load versions file")
            return {}

    def _save_versions(self):
        """Save versions to file."""
        with open(self.versions_file, "w") as f:
            json.dump(self.versions, f, indent=2)
