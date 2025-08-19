"""Performance optimization dashboard for ML models.

This module provides functionality for monitoring and visualizing model performance metrics.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from prometheus_client import Counter, Gauge, Histogram

from .model_monitor import ModelMonitor
from .model_retraining import ModelRetrainer
from .model_versioning import ModelVersion


class PerformanceDashboard:
    """Performance monitoring and optimization dashboard."""

    def __init__(
        self, monitor: ModelMonitor, version_manager: ModelVersion, retrainer: ModelRetrainer
    ):
        """Initialize performance dashboard.

        Args:
            monitor: ModelMonitor instance
            version_manager: ModelVersion instance
            retrainer: ModelRetrainer instance
        """
        self.monitor = monitor
        self.version_manager = version_manager
        self.retrainer = retrainer
        self.logger = logging.getLogger(__name__)

        # Prometheus metrics
        self._setup_prometheus_metrics()

        # Performance thresholds
        self.thresholds = {
            "accuracy": 0.8,
            "latency": 0.5,  # seconds
            "error_rate": 0.05,
            "drift_threshold": 0.1,
        }

    def _setup_prometheus_metrics(self):
        """Set up Prometheus metrics."""
        # Prediction metrics
        self.prediction_accuracy = Gauge(
            "model_prediction_accuracy", "Model prediction accuracy by type", ["model_type"]
        )
        self.prediction_latency = Histogram(
            "model_prediction_latency_seconds",
            "Model prediction latency in seconds",
            ["model_type"],
            buckets=(0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
        )
        self.prediction_errors = Counter(
            "model_prediction_errors_total",
            "Total prediction errors by type",
            ["model_type", "error_type"],
        )

        # Training metrics
        self.training_duration = Gauge(
            "model_training_duration_seconds", "Model training duration in seconds", ["model_type"]
        )
        self.training_samples = Gauge(
            "model_training_samples", "Number of training samples used", ["model_type"]
        )
        self.model_version = Gauge(
            "model_version_info", "Current model version information", ["model_type", "version_id"]
        )

        # Performance metrics
        self.model_performance = Gauge(
            "model_performance_metrics",
            "Various model performance metrics",
            ["model_type", "metric_name"],
        )
        self.feature_drift = Gauge(
            "model_feature_drift", "Feature drift detection metrics", ["model_type", "feature_name"]
        )

    def update_metrics(self):
        """Update all dashboard metrics."""
        for model_type in ["shot", "success", "position"]:
            self._update_model_metrics(model_type)

    def _update_model_metrics(self, model_type: str):
        """Update metrics for a specific model type."""
        # Get current performance metrics
        performance = self.monitor.analyze_performance(model_type)

        # Update prediction metrics
        if "accuracy" in performance:
            self.prediction_accuracy.labels(model_type=model_type).set(performance["accuracy"])

        if "avg_latency" in performance:
            self.prediction_latency.labels(model_type=model_type).observe(
                performance["avg_latency"]
            )

        if "error_count" in performance:
            self.prediction_errors.labels(model_type=model_type, error_type="total").inc(
                performance["error_count"]
            )

        # Get training metrics
        training_history = self.retrainer.get_retraining_history(model_type)
        if training_history:
            latest_training = training_history[-1]
            self.training_duration.labels(model_type=model_type).set(latest_training["duration"])
            self.training_samples.labels(model_type=model_type).set(latest_training["samples_used"])

        # Get version info
        versions = self.version_manager.list_versions(status="active")
        for version in versions:
            if version["metadata"]["model_type"] == model_type:
                self.model_version.labels(model_type=model_type, version_id=version["id"]).set(1)

        # Update performance metrics
        metrics = self._get_detailed_metrics(model_type)
        for name, value in metrics.items():
            self.model_performance.labels(model_type=model_type, metric_name=name).set(value)

        # Update feature drift metrics
        drift_metrics = self._analyze_feature_drift(model_type)
        for feature, drift in drift_metrics.items():
            self.feature_drift.labels(model_type=model_type, feature_name=feature).set(drift)

    def get_performance_summary(self) -> Dict[str, Any]:
        """Get comprehensive performance summary.

        Returns:
            dict: Performance summary
        """
        summary = {}

        for model_type in ["shot", "success", "position"]:
            # Get current performance
            performance = self.monitor.analyze_performance(model_type)

            # Get training history
            training_history = self.retrainer.get_retraining_history(model_type)

            # Get version info
            versions = self.version_manager.list_versions(status="active")
            current_version = next(
                (v for v in versions if v["metadata"]["model_type"] == model_type), None
            )

            # Analyze trends
            trends = self.retrainer.analyze_training_trends(model_type)

            summary[model_type] = {
                "current_performance": performance,
                "training_history": {
                    "total_trainings": len(training_history),
                    "last_training": training_history[-1] if training_history else None,
                },
                "version_info": current_version,
                "trends": trends,
                "health_status": self._check_health_status(
                    model_type, performance, current_version
                ),
            }

        return summary

    def get_optimization_recommendations(self) -> Dict[str, List[str]]:
        """Get model optimization recommendations.

        Returns:
            dict: Recommendations by model type
        """
        recommendations = {}

        for model_type in ["shot", "success", "position"]:
            model_recommendations = []

            # Get current metrics
            performance = self.monitor.analyze_performance(model_type)

            # Check accuracy
            if performance.get("accuracy", 1.0) < self.thresholds["accuracy"]:
                model_recommendations.append(
                    f"Consider retraining model due to low accuracy "
                    f"({performance['accuracy']:.2f} < {self.thresholds['accuracy']})"
                )

            # Check latency
            if performance.get("avg_latency", 0) > self.thresholds["latency"]:
                model_recommendations.append(
                    f"Optimize model for lower latency "
                    f"({performance['avg_latency']:.2f}s > {self.thresholds['latency']}s)"
                )

            # Check error rate
            error_rate = performance.get("error_rate", 0)
            if error_rate > self.thresholds["error_rate"]:
                model_recommendations.append(
                    f"Investigate high error rate "
                    f"({error_rate:.2%} > {self.thresholds['error_rate']:.2%})"
                )

            # Check feature drift
            drift_metrics = self._analyze_feature_drift(model_type)
            high_drift_features = [
                f for f, d in drift_metrics.items() if d > self.thresholds["drift_threshold"]
            ]
            if high_drift_features:
                model_recommendations.append(
                    f"High feature drift detected in: {', '.join(high_drift_features)}"
                )

            # Check training frequency
            last_training = self.retrainer.get_last_training_time(model_type)
            if last_training:
                days_since_training = (datetime.utcnow() - last_training).days
                if days_since_training > 30:
                    model_recommendations.append(
                        f"Consider retraining model (last trained {days_since_training} days ago)"
                    )

            recommendations[model_type] = model_recommendations

        return recommendations

    def _get_detailed_metrics(self, model_type: str) -> Dict[str, float]:
        """Get detailed performance metrics."""
        performance = self.monitor.analyze_performance(model_type)

        metrics = {
            "accuracy": performance.get("accuracy", 0),
            "latency": performance.get("avg_latency", 0),
            "error_rate": performance.get("error_rate", 0),
        }

        if model_type == "shot":
            metrics.update(
                {
                    "precision": performance.get("precision", 0),
                    "recall": performance.get("recall", 0),
                    "f1": performance.get("f1", 0),
                }
            )
        else:
            metrics.update({"mse": performance.get("mse", 0), "rmse": performance.get("rmse", 0)})

        return metrics

    def _analyze_feature_drift(self, model_type: str) -> Dict[str, float]:
        """Analyze feature drift for a model type."""
        # This would need to be implemented based on your feature drift detection system
        # For now, returning placeholder values
        return {"feature_1": 0.05, "feature_2": 0.08, "feature_3": 0.12}

    def _check_health_status(
        self, model_type: str, performance: Dict[str, Any], version_info: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Check health status of a model."""
        status = {"status": "healthy", "issues": []}

        # Check performance metrics
        if performance.get("accuracy", 1.0) < self.thresholds["accuracy"]:
            status["issues"].append("Low accuracy")
            status["status"] = "degraded"

        if performance.get("avg_latency", 0) > self.thresholds["latency"]:
            status["issues"].append("High latency")
            status["status"] = "degraded"

        if performance.get("error_rate", 0) > self.thresholds["error_rate"]:
            status["issues"].append("High error rate")
            status["status"] = "degraded"

        # Check version age
        if version_info:
            version_age = (
                datetime.utcnow() - datetime.fromisoformat(version_info["created_at"])
            ).days
            if version_age > 30:
                status["issues"].append(f"Model version age: {version_age} days")

        # Set critical status if multiple issues
        if len(status["issues"]) > 1:
            status["status"] = "critical"

        return status
