"""Automated model retraining system.

This module provides functionality for automated model retraining and evaluation.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_squared_error,
    precision_score,
    recall_score,
)
from sklearn.model_selection import cross_val_score

from .game_predictor import GamePredictor
from .model_monitor import ModelMonitor


class ModelRetrainer:
    """Automated model retraining and evaluation."""

    def __init__(self, base_path: str, predictor: GamePredictor):
        """Initialize model retrainer.

        Args:
            base_path: Base path for model storage
            predictor: GamePredictor instance
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.predictor = predictor
        self.monitor = ModelMonitor()
        self.logger = logging.getLogger(__name__)

        # Configuration
        self.config_file = self.base_path / "retraining_config.json"
        self.config = self._load_config()

        # Training history
        self.history_file = self.base_path / "retraining_history.json"
        self.history = self._load_history()

    def configure_retraining(self, config: Dict[str, Any]):
        """Configure retraining parameters.

        Args:
            config: Configuration parameters
        """
        self.config.update(config)
        self._save_config()
        self.logger.info("Updated retraining configuration")

    def check_retraining_needed(self, model_type: str) -> Tuple[bool, str]:
        """Check if retraining is needed for a model type.

        Args:
            model_type: Type of model to check

        Returns:
            tuple: (needs_retraining, reason)
        """
        if not self.config.get("retraining_triggers"):
            return False, "No retraining triggers configured"

        triggers = self.config["retraining_triggers"]

        # Check data volume trigger
        if "min_new_samples" in triggers:
            new_samples = self._count_new_samples(model_type)
            if new_samples >= triggers["min_new_samples"]:
                return True, f"Sufficient new samples ({new_samples})"

        # Check performance degradation
        if "performance_threshold" in triggers:
            current_performance = self.monitor.analyze_performance(model_type)
            if (
                current_performance.get("accuracy", 1.0)
                < triggers["performance_threshold"]
            ):
                return True, "Performance below threshold"

        # Check time-based trigger
        if "max_age_days" in triggers:
            last_training = self._get_last_training_time(model_type)
            if last_training:
                age = (datetime.utcnow() - last_training).days
                if age >= triggers["max_age_days"]:
                    return True, f"Model age exceeds threshold ({age} days)"

        return False, "No retraining needed"

    def retrain_model(
        self, model_type: str, training_data: List[Dict]
    ) -> Dict[str, Any]:
        """Retrain a specific model type.

        Args:
            model_type: Type of model to retrain
            training_data: Training data

        Returns:
            dict: Training results
        """
        start_time = datetime.utcnow()
        self.logger.info(f"Starting retraining for {model_type} model")

        # Prepare data
        X_train, y_train = self._prepare_training_data(model_type, training_data)

        # Evaluate current model
        old_metrics = self._evaluate_model(model_type, X_train, y_train)

        # Train new model
        if model_type == "shot":
            results = self.predictor.train_models(training_data)
            new_version_id = results["versions"]["shot"]
        elif model_type == "success":
            results = self.predictor.train_models(training_data)
            new_version_id = results["versions"]["success"]
        elif model_type == "position":
            results = self.predictor.train_models(training_data)
            new_version_id = results["versions"]["position"]
        else:
            raise ValueError(f"Unknown model type: {model_type}")

        # Evaluate new model
        new_metrics = self._evaluate_model(model_type, X_train, y_train)

        # Record training
        training_record = {
            "model_type": model_type,
            "timestamp": start_time.isoformat(),
            "duration": (datetime.utcnow() - start_time).total_seconds(),
            "samples_used": len(X_train),
            "old_metrics": old_metrics,
            "new_metrics": new_metrics,
            "version_id": new_version_id,
        }

        self.history.append(training_record)
        self._save_history()

        self.logger.info(f"Completed retraining for {model_type} model")
        return training_record

    def evaluate_model(
        self, model_type: str, evaluation_data: List[Dict]
    ) -> Dict[str, Any]:
        """Evaluate model performance.

        Args:
            model_type: Type of model to evaluate
            evaluation_data: Evaluation data

        Returns:
            dict: Evaluation metrics
        """
        X_eval, y_eval = self._prepare_training_data(model_type, evaluation_data)
        return self._evaluate_model(model_type, X_eval, y_eval)

    def get_retraining_history(self, model_type: Optional[str] = None):
        """Get retraining history.

        Args:
            model_type: Optional model type filter

        Returns:
            list: Training history records
        """
        if model_type:
            return [h for h in self.history if h["model_type"] == model_type]
        return self.history

    def analyze_training_trends(self, model_type: str):
        """Analyze training performance trends.

        Args:
            model_type: Model type to analyze

        Returns:
            dict: Trend analysis
        """
        history = self.get_retraining_history(model_type)
        if not history:
            return {"error": "No training history available"}

        # Extract metrics over time
        timestamps = [datetime.fromisoformat(h["timestamp"]) for h in history]
        accuracies = [h["new_metrics"].get("accuracy", 0) for h in history]
        durations = [h["duration"] for h in history]
        sample_counts = [h["samples_used"] for h in history]

        # Calculate trends
        accuracy_trend = np.polyfit(range(len(accuracies)), accuracies, 1)[0]
        duration_trend = np.polyfit(range(len(durations)), durations, 1)[0]

        return {
            "total_trainings": len(history),
            "first_training": timestamps[0].isoformat(),
            "last_training": timestamps[-1].isoformat(),
            "accuracy_trend": float(accuracy_trend),
            "duration_trend": float(duration_trend),
            "avg_samples_per_training": sum(sample_counts) / len(sample_counts),
            "metrics_history": {
                "timestamps": [t.isoformat() for t in timestamps],
                "accuracies": accuracies,
                "durations": durations,
                "sample_counts": sample_counts,
            },
        }

    def _prepare_training_data(
        self, model_type: str, data: List[Dict]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for training/evaluation."""
        if model_type == "shot":
            return self.predictor._prepare_shot_data(data)
        elif model_type == "success":
            return self.predictor._prepare_success_data(data)
        elif model_type == "position":
            return self.predictor._prepare_position_data(data)
        else:
            raise ValueError(f"Unknown model type: {model_type}")

    def _evaluate_model(self, model_type: str, X: np.ndarray, y: np.ndarray):
        """Evaluate model performance."""
        if model_type == "shot":
            model = self.predictor.shot_classifier
            scores = cross_val_score(model, X, y, cv=5)
            y_pred = model.predict(X)
            return {
                "accuracy": float(accuracy_score(y, y_pred)),
                "precision": float(precision_score(y, y_pred, average="weighted")),
                "recall": float(recall_score(y, y_pred, average="weighted")),
                "f1": float(f1_score(y, y_pred, average="weighted")),
                "cv_scores": scores.tolist(),
                "cv_mean": float(scores.mean()),
                "cv_std": float(scores.std()),
            }
        else:
            model = (
                self.predictor.success_predictor
                if model_type == "success"
                else self.predictor.position_predictor
            )
            y_pred = model.predict(X)
            mse = mean_squared_error(y, y_pred)
            scores = cross_val_score(
                model, X, y, cv=5, scoring="neg_mean_squared_error"
            )
            return {
                "mse": float(mse),
                "rmse": float(np.sqrt(mse)),
                "cv_scores": (-scores).tolist(),
                "cv_mean": float(-scores.mean()),
                "cv_std": float(scores.std()),
            }

    def _count_new_samples(self, model_type: str) -> int:
        """Count new training samples since last training."""
        last_training = self._get_last_training_time(model_type)
        if not last_training:
            return 0

        # This would need to be implemented based on your data storage system
        # For now, returning a placeholder value
        return 100

    def _get_last_training_time(self, model_type: str):
        """Get timestamp of last training for a model type."""
        history = self.get_retraining_history(model_type)
        if not history:
            return None
        return datetime.fromisoformat(history[-1]["timestamp"])

    def _load_config(self) -> Dict[str, Any]:
        """Load retraining configuration."""
        if not self.config_file.exists():
            return {
                "retraining_triggers": {
                    "min_new_samples": 1000,
                    "performance_threshold": 0.8,
                    "max_age_days": 30,
                },
                "evaluation": {"cv_folds": 5, "min_improvement": 0.02},
            }

        with open(self.config_file, "r") as f:
            return json.load(f)

    def _save_config(self):
        """Save retraining configuration."""
        with open(self.config_file, "w") as f:
            json.dump(self.config, f, indent=2)

    def _load_history(self):
        """Load training history."""
        if not self.history_file.exists():
            return []

        with open(self.history_file, "r") as f:
            return json.load(f)

    def _save_history(self):
        """Save training history."""
        with open(self.history_file, "w") as f:
            json.dump(self.history, f, indent=2)
