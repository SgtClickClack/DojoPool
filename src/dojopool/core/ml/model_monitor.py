"""Model monitoring module.

This module provides real-time monitoring and evaluation of ML model performance.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import numpy as np
from prometheus_client import Counter, Gauge, Histogram
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from ...utils.monitoring import REGISTRY


class ModelMonitor:
    """Real-time ML model performance monitoring."""

    def __init__(self):
        """Initialize model monitor."""
        # Performance metrics
        self.predictions_total = Counter(
            "model_predictions_total",
            "Total number of predictions made",
            ["model_type"],
            registry=REGISTRY,
        )
        self.prediction_accuracy = Gauge(
            "model_prediction_accuracy",
            "Model prediction accuracy",
            ["model_type"],
            registry=REGISTRY,
        )
        self.prediction_latency = Histogram(
            "model_prediction_latency_seconds",
            "Model prediction latency in seconds",
            ["model_type"],
            registry=REGISTRY,
        )
        self.feature_drift = Gauge(
            "model_feature_drift",
            "Feature distribution drift score",
            ["feature_name"],
            registry=REGISTRY,
        )

        # Performance windows
        self.prediction_history = {"shot": [], "position": [], "success": []}
        self.performance_window = timedelta(hours=1)
        self.max_history_size = 1000

        # Logging setup
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)

    def record_prediction(
        self,
        model_type: str,
        prediction: Dict[str, Any],
        actual: Optional[Any] = None,
        latency: float = 0.0,
    ):
        """Record a model prediction and update metrics.

        Args:
            model_type: Type of model (shot, position, success)
            prediction: Prediction details
            actual: Actual outcome (if available)
            latency: Prediction latency in seconds
        """
        # Update counters
        self.predictions_total.labels(model_type=model_type).inc()
        self.prediction_latency.labels(model_type=model_type).observe(latency)

        # Record prediction
        record = {
            "timestamp": datetime.utcnow().isoformat(),
            "prediction": prediction,
            "actual": actual,
            "latency": latency,
        }

        self._update_prediction_history(model_type, record)
        self._update_performance_metrics(model_type)

        # Log prediction details
        self.logger.info(
            f"Model prediction recorded - Type: {model_type}, " f"Latency: {latency:.3f}s"
        )

    def analyze_performance(self, model_type: str) -> Dict[str, Any]:
        """Analyze model performance over the current window.

        Args:
            model_type: Type of model to analyze

        Returns:
            dict: Performance metrics
        """
        history = self._get_current_window(model_type)
        if not history:
            return {"error": "No predictions in current window"}

        predictions = []
        actuals = []
        latencies = []

        for record in history:
            if record["actual"] is not None:
                predictions.append(record["prediction"])
                actuals.append(record["actual"])
            latencies.append(record["latency"])

        if not predictions:
            return {
                "prediction_count": len(history),
                "avg_latency": np.mean(latencies),
                "p95_latency": np.percentile(latencies, 95),
                "p99_latency": np.percentile(latencies, 99),
            }

        return {
            "prediction_count": len(history),
            "accuracy": accuracy_score(actuals, predictions),
            "precision": precision_score(actuals, predictions, average="weighted"),
            "recall": recall_score(actuals, predictions, average="weighted"),
            "f1_score": f1_score(actuals, predictions, average="weighted"),
            "avg_latency": np.mean(latencies),
            "p95_latency": np.percentile(latencies, 95),
            "p99_latency": np.percentile(latencies, 99),
        }

    def detect_drift(
        self, current_features: List[Dict], reference_features: List[Dict]
    ) -> Dict[str, float]:
        """Detect feature drift between current and reference data.

        Args:
            current_features: Current feature distributions
            reference_features: Reference feature distributions

        Returns:
            dict: Drift scores for each feature
        """
        drift_scores = {}

        for feature in current_features[0].keys():
            current_values = [f[feature] for f in current_features]
            reference_values = [f[feature] for f in reference_features]

            drift_score = self._calculate_drift_score(current_values, reference_values)
            drift_scores[feature] = drift_score

            # Update Prometheus metric
            self.feature_drift.labels(feature_name=feature).set(drift_score)

        return drift_scores

    def get_monitoring_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive monitoring dashboard data.

        Returns:
            dict: Dashboard data
        """
        return {
            "shot_model": self.analyze_performance("shot"),
            "position_model": self.analyze_performance("position"),
            "success_model": self.analyze_performance("success"),
            "prediction_volumes": {
                model_type: len(history) for model_type, history in self.prediction_history.items()
            },
            "latency_trends": self._get_latency_trends(),
            "accuracy_trends": self._get_accuracy_trends(),
            "drift_alerts": self._get_drift_alerts(),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _update_prediction_history(self, model_type: str, record: Dict):
        """Update prediction history for a model type."""
        self.prediction_history[model_type].append(record)

        # Maintain maximum history size
        if len(self.prediction_history[model_type]) > self.max_history_size:
            self.prediction_history[model_type].pop(0)

    def _update_performance_metrics(self, model_type: str):
        """Update Prometheus metrics for model performance."""
        performance = self.analyze_performance(model_type)
        if "accuracy" in performance:
            self.prediction_accuracy.labels(model_type=model_type).set(performance["accuracy"])

    def _get_current_window(self, model_type: str) -> List[Dict]:
        """Get predictions within the current time window."""
        cutoff_time = datetime.utcnow() - self.performance_window
        return [
            record
            for record in self.prediction_history[model_type]
            if datetime.fromisoformat(record["timestamp"]) > cutoff_time
        ]

    def _calculate_drift_score(self, current: List[float], reference: List[float]) -> float:
        """Calculate distribution drift score using KL divergence."""
        # Convert to numpy arrays and ensure non-zero probabilities
        current_hist = np.histogram(current, bins=20, density=True)[0] + 1e-10
        reference_hist = np.histogram(reference, bins=20, density=True)[0] + 1e-10

        # Normalize
        current_hist = current_hist / current_hist.sum()
        reference_hist = reference_hist / reference_hist.sum()

        # Calculate KL divergence
        kl_div = np.sum(current_hist * np.log(current_hist / reference_hist))

        # Convert to drift score between 0 and 1
        return float(1 - np.exp(-kl_div))

    def _get_latency_trends(self) -> Dict[str, List[float]]:
        """Get latency trends for each model type."""
        trends = {}
        for model_type, history in self.prediction_history.items():
            if history:
                window = self._get_current_window(model_type)
                latencies = [record["latency"] for record in window]
                trends[model_type] = {
                    "mean": float(np.mean(latencies)),
                    "p95": float(np.percentile(latencies, 95)),
                    "p99": float(np.percentile(latencies, 99)),
                    "trend": latencies[-10:],  # Last 10 predictions
                }
        return trends

    def _get_accuracy_trends(self) -> Dict[str, List[float]]:
        """Get accuracy trends for each model type."""
        trends = {}
        window_size = 50  # Rolling window size

        for model_type, _history in self.prediction_history.items():
            window = self._get_current_window(model_type)
            if not window:
                continue

            accuracies = []
            for i in range(len(window) - window_size + 1):
                window_slice = window[i : i + window_size]
                predictions = []
                actuals = []

                for record in window_slice:
                    if record["actual"] is not None:
                        predictions.append(record["prediction"])
                        actuals.append(record["actual"])

                if predictions:
                    accuracy = accuracy_score(actuals, predictions)
                    accuracies.append(float(accuracy))

            if accuracies:
                trends[model_type] = {
                    "current": accuracies[-1],
                    "trend": accuracies[-10:],  # Last 10 windows
                    "mean": float(np.mean(accuracies)),
                    "std": float(np.std(accuracies)),
                }

        return trends

    def _get_drift_alerts(self) -> List[Dict[str, Any]]:
        """Get active drift alerts."""
        alerts = []
        drift_threshold = 0.3  # Alert threshold

        for feature_name, drift_score in self.feature_drift._value.items():
            if drift_score > drift_threshold:
                alerts.append(
                    {
                        "feature": feature_name,
                        "drift_score": float(drift_score),
                        "severity": "high" if drift_score > 0.5 else "medium",
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                )

        return alerts
