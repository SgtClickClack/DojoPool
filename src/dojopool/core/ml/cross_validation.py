"""Cross validation pipeline.

This module provides comprehensive cross-validation functionality for model evaluation.
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
from sklearn.model_selection import KFold, learning_curve

from .game_predictor import GamePredictor
from .model_monitor import ModelMonitor


class CrossValidation:
    """Comprehensive cross-validation pipeline."""

    def __init__(self, base_path: str, predictor: GamePredictor):
        """Initialize cross validation pipeline.

        Args:
            base_path: Base path for storing results
            predictor: GamePredictor instance
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.predictor = predictor
        self.monitor = ModelMonitor()
        self.logger = logging.getLogger(__name__)

        # Results storage
        self.results_dir = self.base_path / "cv_results"
        self.results_dir.mkdir(exist_ok=True)

        # Configuration
        self.config_file = self.base_path / "cv_config.json"
        self.config = self._load_config()

    def run_cross_validation(
        self, model_type: str, data: List[Dict], n_splits: int = 5, shuffle: bool = True
    ) -> Dict[str, Any]:
        """Run comprehensive cross-validation.

        Args:
            model_type: Type of model to validate
            data: Training/validation data
            n_splits: Number of CV splits
            shuffle: Whether to shuffle data

        Returns:
            dict: Cross-validation results
        """
        self.logger.info(f"Starting cross-validation for {model_type} model")

        # Prepare data
        X, y = self._prepare_data(model_type, data)

        # Initialize K-Fold
        kf = KFold(n_splits=n_splits, shuffle=shuffle)

        # Initialize metrics storage
        fold_metrics = []
        predictions = []
        actuals = []

        # Run cross-validation
        for fold, (train_idx, val_idx) in enumerate(kf.split(X)):
            self.logger.info(f"Processing fold {fold + 1}/{n_splits}")

            # Split data
            X_train, X_val = X[train_idx], X[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]

            # Train model
            model = self._train_model(model_type, X_train, y_train)

            # Get predictions
            y_pred = model.predict(X_val)
            predictions.extend(y_pred)
            actuals.extend(y_val)

            # Calculate fold metrics
            metrics = self._calculate_metrics(model_type, y_val, y_pred)
            fold_metrics.append(metrics)

        # Calculate aggregate metrics
        aggregate_metrics = self._aggregate_metrics(fold_metrics)

        # Generate learning curves
        learning_curves = self._generate_learning_curves(
            model_type, X, y, n_splits=n_splits
        )

        # Save results
        results = {
            "model_type": model_type,
            "timestamp": datetime.utcnow().isoformat(),
            "config": {"n_splits": n_splits, "shuffle": shuffle, "data_size": len(X)},
            "fold_metrics": fold_metrics,
            "aggregate_metrics": aggregate_metrics,
            "learning_curves": learning_curves,
        }

        self._save_results(results)

        self.logger.info(f"Completed cross-validation for {model_type} model")
        return results

    def analyze_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze cross-validation results.

        Args:
            results: Cross-validation results

        Returns:
            dict: Analysis results
        """
        analysis = {
            "model_type": results["model_type"],
            "timestamp": datetime.utcnow().isoformat(),
            "metrics_summary": self._analyze_metrics(results["fold_metrics"]),
            "learning_curve_analysis": self._analyze_learning_curves(
                results["learning_curves"]
            ),
            "recommendations": self._generate_recommendations(results),
        }

        return analysis

    def get_latest_results(
        self, model_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get latest cross-validation results.

        Args:
            model_type: Optional model type filter

        Returns:
            list: Latest results
        """
        results = []
        for file in self.results_dir.glob("*.json"):
            with open(file, "r") as f:
                result = json.load(f)
                if not model_type or result["model_type"] == model_type:
                    results.append(result)

        return sorted(results, key=lambda x: x["timestamp"], reverse=True)

    def _prepare_data(
        self, model_type: str, data: List[Dict]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for cross-validation."""
        return self.predictor._prepare_training_data(model_type, data)

    def _train_model(self, model_type: str, X: np.ndarray, y: np.ndarray) -> Any:
        """Train model for a fold."""
        if model_type == "shot":
            model = self.predictor.shot_classifier.__class__()
        elif model_type == "success":
            model = self.predictor.success_predictor.__class__()
        else:
            model = self.predictor.position_predictor.__class__()

        model.fit(X, y)
        return model

    def _calculate_metrics(
        self, model_type: str, y_true: np.ndarray, y_pred: np.ndarray
    ):
        """Calculate metrics for a fold."""
        if model_type == "shot":
            return {
                "accuracy": float(accuracy_score(y_true, y_pred)),
                "precision": float(precision_score(y_true, y_pred, average="weighted")),
                "recall": float(recall_score(y_true, y_pred, average="weighted")),
                "f1": float(f1_score(y_true, y_pred, average="weighted")),
            }
        else:
            mse = mean_squared_error(y_true, y_pred)
            return {"mse": float(mse), "rmse": float(np.sqrt(mse))}

    def _aggregate_metrics(self, fold_metrics: List[Dict[str, float]]):
        """Aggregate metrics across folds."""
        metrics = {}
        for metric in fold_metrics[0].keys():
            values = [fold[metric] for fold in fold_metrics]
            metrics[metric] = {
                "mean": float(np.mean(values)),
                "std": float(np.std(values)),
                "min": float(np.min(values)),
                "max": float(np.max(values)),
            }
        return metrics

    def _generate_learning_curves(
        self, model_type: str, X: np.ndarray, y: np.ndarray, n_splits: int
    ):
        """Generate learning curves."""
        # Define train sizes
        train_sizes = np.linspace(0.1, 1.0, 10)

        # Get model instance
        if model_type == "shot":
            model = self.predictor.shot_classifier.__class__()
            scoring = "accuracy"
        else:
            model = (
                self.predictor.success_predictor.__class__()
                if model_type == "success"
                else self.predictor.position_predictor.__class__()
            )
            scoring = "neg_mean_squared_error"

        # Generate learning curves
        train_sizes, train_scores, val_scores = learning_curve(
            model,
            X,
            y,
            train_sizes=train_sizes,
            cv=n_splits,
            scoring=scoring,
            n_jobs=-1,
        )

        return {
            "train_sizes": train_sizes.tolist(),
            "train_scores": train_scores.tolist(),
            "validation_scores": val_scores.tolist(),
        }

    def _analyze_metrics(self, fold_metrics: List[Dict[str, float]]) -> Dict[str, Any]:
        """Analyze metrics distribution across folds."""
        analysis = {}

        for metric in fold_metrics[0].keys():
            values = [fold[metric] for fold in fold_metrics]
            analysis[metric] = {
                "distribution": {
                    "mean": float(np.mean(values)),
                    "std": float(np.std(values)),
                    "cv": float(np.std(values) / np.mean(values)),
                    "quartiles": [
                        float(np.percentile(values, p)) for p in [25, 50, 75]
                    ],
                },
                "stability": (
                    "stable" if np.std(values) / np.mean(values) < 0.1 else "unstable"
                ),
            }

        return analysis

    def _analyze_learning_curves(self, curves: Dict[str, Any]):
        """Analyze learning curves."""
        train_scores = np.array(curves["train_scores"])
        val_scores = np.array(curves["validation_scores"])
        train_sizes = np.array(curves["train_sizes"])

        # Calculate convergence
        final_gap = np.mean(train_scores[-1]) - np.mean(val_scores[-1])

        # Detect overfitting
        overfitting_score = np.mean(
            [train - val for train, val in zip(train_scores[-1], val_scores[-1])]
        )

        # Analyze learning speed
        learning_speed = np.mean(
            [
                (score2 - score1) / (size2 - size1)
                for score1, score2, size1, size2 in zip(
                    np.mean(val_scores[:-1], axis=1),
                    np.mean(val_scores[1:], axis=1),
                    train_sizes[:-1],
                    train_sizes[1:],
                )
            ]
        )

        return {
            "convergence_gap": float(final_gap),
            "overfitting_score": float(overfitting_score),
            "learning_speed": float(learning_speed),
            "status": {
                "converged": abs(final_gap) < 0.1,
                "overfitting": overfitting_score > 0.1,
                "learning_effectively": learning_speed > 0,
            },
        }

    def _generate_recommendations(self, results: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on results."""
        recommendations = []

        # Analyze metrics stability
        metrics_analysis = self._analyze_metrics(results["fold_metrics"])
        for metric, analysis in metrics_analysis.items():
            if analysis["stability"] == "unstable":
                recommendations.append(
                    f"High variance in {metric} across folds - consider:"
                    "\n- Collecting more training data"
                    "\n- Using stratified sampling"
                    "\n- Implementing data augmentation"
                )

        # Analyze learning curves
        curves_analysis = self._analyze_learning_curves(results["learning_curves"])

        if not curves_analysis["status"]["converged"]:
            recommendations.append(
                "Model has not converged - consider:"
                "\n- Training for more epochs"
                "\n- Increasing model capacity"
                "\n- Collecting more training data"
            )

        if curves_analysis["status"]["overfitting"]:
            recommendations.append(
                "Model shows signs of overfitting - consider:"
                "\n- Adding regularization"
                "\n- Reducing model complexity"
                "\n- Implementing early stopping"
                "\n- Using dropout"
            )

        if not curves_analysis["status"]["learning_effectively"]:
            recommendations.append(
                "Model is not learning effectively - consider:"
                "\n- Adjusting learning rate"
                "\n- Modifying model architecture"
                "\n- Feature engineering"
                "\n- Data preprocessing improvements"
            )

        return recommendations

    def _save_results(self, results: Dict[str, Any]):
        """Save cross-validation results."""
        timestamp = datetime.fromisoformat(results["timestamp"])
        filename = (
            f"cv_results_{results['model_type']}_"
            f"{timestamp.strftime('%Y%m%d_%H%M%S')}.json"
        )

        with open(self.results_dir / filename, "w") as f:
            json.dump(results, f, indent=2)

    def _load_config(self) -> Dict[str, Any]:
        """Load cross-validation configuration."""
        if not self.config_file.exists():
            return {
                "n_splits_default": 5,
                "shuffle_default": True,
                "min_samples_per_fold": 50,
                "stability_threshold": 0.1,
                "convergence_threshold": 0.1,
                "overfitting_threshold": 0.1,
            }

        with open(self.config_file, "r") as f:
            return json.load(f)
