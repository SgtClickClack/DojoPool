"""Version cleanup system.

This module provides functionality for automated cleanup of old or unused model versions.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from .model_monitor import ModelMonitor
from .model_versioning import ModelVersion


class VersionCleanup:
    """Automated version cleanup system."""

    def __init__(self, version_manager: ModelVersion, monitor: ModelMonitor):
        """Initialize version cleanup system.

        Args:
            version_manager: ModelVersion instance
            monitor: ModelMonitor instance
        """
        self.version_manager = version_manager
        self.monitor = monitor
        self.logger = logging.getLogger(__name__)

        # Configuration
        self.config = {
            "max_versions_per_type": 5,
            "max_version_age_days": 90,
            "min_versions_to_keep": 2,
            "performance_threshold": 0.8,
            "unused_threshold_days": 30,
            "cleanup_schedule_days": 7,
        }

        # Cleanup history
        self.history_file = Path(version_manager.model_path) / "cleanup_history.json"
        self.history = self._load_history()

    def run_cleanup(self, dry_run: bool = False) -> Dict[str, Any]:
        """Run version cleanup process.

        Args:
            dry_run: If True, only simulate cleanup

        Returns:
            dict: Cleanup results
        """
        self.logger.info("Starting version cleanup process")
        start_time = datetime.utcnow()

        # Get all versions
        all_versions = self.version_manager.list_versions()
        versions_by_type = self._group_versions_by_type(all_versions)

        cleanup_results = {
            "timestamp": start_time.isoformat(),
            "dry_run": dry_run,
            "versions_processed": len(all_versions),
            "versions_to_delete": [],
            "versions_kept": [],
            "cleanup_reasons": {},
            "errors": [],
        }

        for model_type, versions in versions_by_type.items():
            try:
                # Identify versions to clean up
                to_delete = self._identify_versions_to_clean(model_type, versions)

                if not dry_run:
                    # Perform cleanup
                    for version_id in to_delete:
                        try:
                            self._delete_version(version_id)
                            cleanup_results["versions_to_delete"].append(
                                {
                                    "version_id": version_id,
                                    "model_type": model_type,
                                    "reason": cleanup_results["cleanup_reasons"].get(
                                        version_id, "general_cleanup"
                                    ),
                                }
                            )
                        except Exception as e:
                            cleanup_results["errors"].append(
                                {"version_id": version_id, "error": str(e)}
                            )
                else:
                    # Just record what would be deleted
                    cleanup_results["versions_to_delete"].extend(
                        [
                            {
                                "version_id": version_id,
                                "model_type": model_type,
                                "reason": cleanup_results["cleanup_reasons"].get(
                                    version_id, "general_cleanup"
                                ),
                            }
                            for version_id in to_delete
                        ]
                    )

                # Record kept versions
                kept_versions = {v["id"] for v in versions} - set(to_delete)
                cleanup_results["versions_kept"].extend(
                    [
                        {"version_id": version_id, "model_type": model_type}
                        for version_id in kept_versions
                    ]
                )

            except Exception as e:
                self.logger.error(f"Error processing {model_type}: {str(e)}")
                cleanup_results["errors"].append({"model_type": model_type, "error": str(e)})

        # Record cleanup
        if not dry_run:
            self._record_cleanup(cleanup_results)

        self.logger.info("Completed version cleanup process")
        return cleanup_results

    def get_cleanup_candidates(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get list of versions that are candidates for cleanup.

        Returns:
            dict: Cleanup candidates by model type
        """
        all_versions = self.version_manager.list_versions()
        versions_by_type = self._group_versions_by_type(all_versions)
        candidates = {}

        for model_type, versions in versions_by_type.items():
            to_delete = self._identify_versions_to_clean(model_type, versions)
            if to_delete:
                candidates[model_type] = [
                    {
                        "version_id": v_id,
                        "reason": self._get_cleanup_reason(
                            v_id, next(v for v in versions if v["id"] == v_id)
                        ),
                    }
                    for v_id in to_delete
                ]

        return candidates

    def get_cleanup_history(self) -> List[Dict[str, Any]]:
        """Get cleanup history.

        Returns:
            list: Cleanup history records
        """
        return sorted(self.history, key=lambda x: x["timestamp"], reverse=True)

    def configure(self, config: Dict[str, Any]):
        """Configure cleanup parameters.

        Args:
            config: Configuration parameters
        """
        self.config.update(config)

    def _identify_versions_to_clean(
        self, model_type: str, versions: List[Dict[str, Any]]
    ) -> Set[str]:
        """Identify versions that should be cleaned up."""
        if not versions:
            return set()

        # Sort versions by creation date
        versions = sorted(versions, key=lambda v: v["created_at"], reverse=True)

        to_delete = set()
        kept_count = 0
        datetime.utcnow()

        for version in versions:
            version_id = version["id"]

            # Skip if we're at minimum versions to keep
            if len(versions) - len(to_delete) <= self.config["min_versions_to_keep"]:
                break

            # Check various cleanup criteria
            cleanup_reason = self._get_cleanup_reason(version_id, version)

            if cleanup_reason:
                to_delete.add(version_id)
                self.cleanup_reasons[version_id] = cleanup_reason
            else:
                kept_count += 1

                # Check if we're over max versions per type
                if kept_count >= self.config["max_versions_per_type"]:
                    to_delete.add(version_id)
                    self.cleanup_reasons[version_id] = "max_versions_exceeded"

        return to_delete

    def _get_cleanup_reason(self, version_id: str, version_info: Dict[str, Any]) -> Optional[str]:
        """Get reason for cleaning up a version."""
        current_time = datetime.utcnow()
        created_time = datetime.fromisoformat(version_info["created_at"])

        # Check age
        if (current_time - created_time).days > self.config["max_version_age_days"]:
            return "age_exceeded"

        # Check status
        if version_info["status"] == "deprecated":
            return "deprecated"

        # Check performance
        if (
            version_info.get("metrics", {}).get("accuracy", 1.0)
            < self.config["performance_threshold"]
        ):
            return "poor_performance"

        # Check usage
        last_used = version_info.get("last_deployed", version_info["created_at"])
        if (current_time - datetime.fromisoformat(last_used)).days > self.config[
            "unused_threshold_days"
        ]:
            return "unused"

        return None

    def _delete_version(self, version_id: str):
        """Delete a model version."""
        # Get version info
        version_info = self.version_manager.get_version_info(version_id)

        # Delete model file
        model_file = Path(version_info["model_file"])
        if model_file.exists():
            model_file.unlink()

        # Update versions registry
        self.version_manager.deprecate_version(version_id, reason="Automated cleanup")

    def _group_versions_by_type(
        self, versions: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Group versions by model type."""
        grouped = {}
        for version in versions:
            model_type = version["metadata"]["model_type"]
            if model_type not in grouped:
                grouped[model_type] = []
            grouped[model_type].append(version)
        return grouped

    def _record_cleanup(self, results: Dict[str, Any]):
        """Record cleanup operation in history."""
        self.history.append(results)
        self._save_history()

    def _load_history(self) -> List[Dict[str, Any]]:
        """Load cleanup history."""
        if not self.history_file.exists():
            return []

        try:
            with open(self.history_file, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            self.logger.error("Failed to load cleanup history file")
            return []

    def _save_history(self):
        """Save cleanup history."""
        with open(self.history_file, "w") as f:
            json.dump(self.history, f, indent=2)
