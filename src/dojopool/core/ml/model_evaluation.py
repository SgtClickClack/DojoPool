from multiprocessing import Pool
from multiprocessing import Pool
"""Automated model evaluation system.

This module provides comprehensive model evaluation and testing capabilities.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    explained_variance_score,
    f1_score,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import (
    KFold,
    StratifiedKFold,
    cross_validate,
    learning_curve,
)

from .model_monitor import ModelMonitor
from .model_retraining import ModelRetrainer
from .model_versioning import ModelVersion


class ModelEvaluator:
    """Automated model evaluation and testing."""

    def __init__(
        self,
        base_path: str,
        monitor: ModelMonitor,
        version_manager: ModelVersion,
        retrainer: ModelRetrainer,
    ):
        """Initialize model evaluator.

        Args:
            base_path: Base path for evaluation artifacts
            monitor: ModelMonitor instance
            version_manager: ModelVersion instance
            retrainer: ModelRetrainer instance
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.monitor = monitor
        self.version_manager = version_manager
        self.retrainer = retrainer
        self.logger = logging.getLogger(__name__)

        # Evaluation configuration
        self.config_file = self.base_path / "evaluation_config.json"
        self.config = self._load_config()

        # Results storage
        self.results_dir = self.base_path / "evaluation_results"
        self.results_dir.mkdir(exist_ok=True)

        # Visualization directory
        self.plots_dir = self.base_path / "evaluation_plots"
        self.plots_dir.mkdir(exist_ok=True)

    def evaluate_model(self, model_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform comprehensive model evaluation.

        Args:
            model_type: Type of model to evaluate
            data: Evaluation data

        Returns:
            dict: Evaluation results
        """
        self.logger.info(f"Starting comprehensive evaluation for {model_type} model")

        # Prepare data
        X_train, y_train = self._prepare_data(model_type, data["training"])
        X_test, y_test = self._prepare_data(model_type, data["testing"])

        # Get model instance
        model = self._get_model(model_type)

        # Basic performance metrics
        basic_metrics = self._evaluate_basic_metrics(model_type, model, X_test, y_test)

        # Cross-validation
        cv_results = self._perform_cross_validation(model_type, model, X_train, y_train)

        # Learning curves
        learning_curves = self._generate_learning_curves(
            model_type, model, X_train, y_train
        )

        # Feature importance
        feature_importance = self._analyze_feature_importance(model_type, model)

        # Error analysis
        error_analysis = self._perform_error_analysis(model_type, model, X_test, y_test)

        # Model complexity analysis
        complexity_analysis = self._analyze_model_complexity(
            model_type, model, X_train, y_train
        )

        # Generate visualizations
        self._generate_evaluation_plots(
            model_type, basic_metrics, cv_results, learning_curves, error_analysis
        )

        # Compile results
        results = {
            "model_type": model_type,
            "timestamp": datetime.utcnow().isoformat(),
            "basic_metrics": basic_metrics,
            "cross_validation": cv_results,
            "learning_curves": learning_curves,
            "feature_importance": feature_importance,
            "error_analysis": error_analysis,
            "complexity_analysis": complexity_analysis,
            "plots_directory": str(self.plots_dir),
        }

        # Save results
        self._save_evaluation_results(model_type, results)

        self.logger.info(f"Completed evaluation for {model_type} model")
        return results

    def compare_models(self, model_type: str, version_ids: List[str]) -> Dict[str, Any]:
        """Compare multiple model versions.

        Args:
            model_type: Type of models to compare
            version_ids: List of version IDs to compare

        Returns:
            dict: Comparison results
        """
        comparison = {
            "model_type": model_type,
            "timestamp": datetime.utcnow().isoformat(),
            "versions": [],
        }

        for version_id in version_ids:
            # Get version info
            version_info = self.version_manager.get_version_info(version_id)

            # Get performance metrics
            metrics = version_info.get("metrics", {})

            # Get training history
            training_history = self.retrainer.get_retraining_history(model_type)
            version_training = next(
                (t for t in training_history if t["version_id"] == version_id), None
            )

            comparison["versions"].append(
                {
                    "version_id": version_id,
                    "created_at": version_info["created_at"],
                    "metrics": metrics,
                    "training_info": version_training,
                    "deployment_history": version_info.get("deployment_history", []),
                }
            )

        # Calculate improvements
        if len(comparison["versions"]) > 1:
            comparison["improvements"] = self._calculate_improvements(
                comparison["versions"]
            )

        return comparison

    def get_evaluation_history(
        self, model_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get evaluation history.

        Args:
            model_type: Optional model type filter

        Returns:
            list: Evaluation history
        """
        history = []

        for result_file in self.results_dir.glob("*.json"):
            with open(result_file, "r") as f:
                result = json.load(f)
                if not model_type or result["model_type"] == model_type:
                    history.append(result)

        return sorted(history, key=lambda x: x["timestamp"], reverse=True)

    def analyze_evaluation_trends(self, model_type: str):
        """Analyze evaluation performance trends.

        Args:
            model_type: Model type to analyze

        Returns:
            dict: Trend analysis
        """
        history = self.get_evaluation_history(model_type)
        if not history:
            return {"error": "No evaluation history available"}

        # Extract metrics over time
        timestamps = [datetime.fromisoformat(h["timestamp"]) for h in history]
        metrics = {
            "accuracy": [h["basic_metrics"].get("accuracy", 0) for h in history],
            "cv_score": [h["cross_validation"].get("mean_score", 0) for h in history],
            "error_rate": [h["error_analysis"].get("error_rate", 0) for h in history],
        }

        # Calculate trends
        trends = {}
        for metric_name, values in metrics.items():
            trend = np.polyfit(range(len(values)), values, 1)[0]
            trends[f"{metric_name}_trend"] = float(trend)

        return {
            "total_evaluations": len(history),
            "first_evaluation": timestamps[0].isoformat(),
            "last_evaluation": timestamps[-1].isoformat(),
            "trends": trends,
            "metrics_history": {
                "timestamps": [t.isoformat() for t in timestamps],
                **metrics,
            },
        }

    def _evaluate_basic_metrics(
        self, model_type: str, model: Any, X: np.ndarray, y: np.ndarray
    ) -> Dict[str, float]:
        """Calculate basic performance metrics."""
        y_pred = model.predict(X)

        if model_type == "shot":
            return {
                "accuracy": float(accuracy_score(y, y_pred)),
                "precision": float(precision_score(y, y_pred, average="weighted")),
                "recall": float(recall_score(y, y_pred, average="weighted")),
                "f1": float(f1_score(y, y_pred, average="weighted")),
            }
        else:
            mse = mean_squared_error(y, y_pred)
            return {
                "mse": float(mse),
                "rmse": float(np.sqrt(mse)),
                "r2": float(r2_score(y, y_pred)),
                "explained_variance": float(explained_variance_score(y, y_pred)),
            }

    def _perform_cross_validation(
        self, model_type: str, model: Any, X: np.ndarray, y: np.ndarray
    ):
        """Perform cross-validation."""
        cv = StratifiedKFold(n_splits=5) if model_type == "shot" else KFold(n_splits=5)

        scoring = "accuracy" if model_type == "shot" else "neg_mean_squared_error"
        cv_results = cross_validate(
            model, X, y, cv=cv, scoring=scoring, return_train_score=True
        )

        return {
            "mean_score": float(cv_results["test_score"].mean()),
            "std_score": float(cv_results["test_score"].std()),
            "train_scores": cv_results["train_score"].tolist(),
            "test_scores": cv_results["test_score"].tolist(),
        }

    def _generate_learning_curves(
        self, model_type: str, model: Any, X: np.ndarray, y: np.ndarray
    ) -> Dict[str, Any]:
        """Generate learning curves."""
        train_sizes, train_scores, test_scores = learning_curve(
            model,
            X,
            y,
            train_sizes=np.linspace(0.1, 1.0, 10),
            cv=5,
            scoring="accuracy" if model_type == "shot" else "neg_mean_squared_error",
        )

        return {
            "train_sizes": train_sizes.tolist(),
            "train_scores_mean": train_scores.mean(axis=1).tolist(),
            "train_scores_std": train_scores.std(axis=1).tolist(),
            "test_scores_mean": test_scores.mean(axis=1).tolist(),
            "test_scores_std": test_scores.std(axis=1).tolist(),
        }

    def _analyze_feature_importance(self, model_type: str, model: Any):
        """Analyze feature importance."""
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            return {
                "feature_importance": importances.tolist(),
                "top_features": np.argsort(importances)[-5:].tolist(),
            }
        return {}

    def _perform_error_analysis(
        self, model_type: str, model: Any, X: np.ndarray, y: np.ndarray
    ) -> Dict[str, Any]:
        """Perform error analysis."""
        y_pred = model.predict(X)

        if model_type == "shot":
            cm = confusion_matrix(y, y_pred)
            return {
                "confusion_matrix": cm.tolist(),
                "error_rate": float(1 - accuracy_score(y, y_pred)),
                "misclassified_samples": int((y != y_pred).sum()),
            }
        else:
            errors = y - y_pred
            return {
                "error_distribution": {
                    "mean": float(errors.mean()),
                    "std": float(errors.std()),
                    "percentiles": np.percentile(errors, [25, 50, 75]).tolist(),
                },
                "error_rate": float(mean_squared_error(y, y_pred)),
                "outliers": int(np.abs(errors) > 2 * errors.std()).sum(),
            }

    def _analyze_model_complexity(
        self, model_type: str, model: Any, X: np.ndarray, y: np.ndarray
    ) -> Dict[str, Any]:
        """Analyze model complexity."""
        complexity = {"model_params": len(model.get_params()), "sample_size": len(X)}

        if hasattr(model, "n_features_in_"):
            complexity["n_features"] = int(model.n_features_in_)

        if hasattr(model, "n_layers_") or hasattr(model, "n_estimators"):
            complexity["model_depth"] = getattr(model, "n_layers_", None) or getattr(
                model, "n_estimators", None
            )

        return complexity

    def _generate_evaluation_plots(
        self,
        model_type: str,
        basic_metrics: Dict[str, float],
        cv_results: Dict[str, Any],
        learning_curves: Dict[str, Any],
        error_analysis: Dict[str, Any],
    ):
        """Generate evaluation plots."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

        # Learning curves plot
        plt.figure(figsize=(10, 6))
        plt.plot(
            learning_curves["train_sizes"],
            learning_curves["train_scores_mean"],
            label="Training score",
        )
        plt.plot(
            learning_curves["train_sizes"],
            learning_curves["test_scores_mean"],
            label="Cross-validation score",
        )
        plt.fill_between(
            learning_curves["train_sizes"],
            np.array(learning_curves["train_scores_mean"])
            - np.array(learning_curves["train_scores_std"]),
            np.array(learning_curves["train_scores_mean"])
            + np.array(learning_curves["train_scores_std"]),
            alpha=0.1,
        )
        plt.fill_between(
            learning_curves["train_sizes"],
            np.array(learning_curves["test_scores_mean"])
            - np.array(learning_curves["test_scores_std"]),
            np.array(learning_curves["test_scores_mean"])
            + np.array(learning_curves["test_scores_std"]),
            alpha=0.1,
        )
        plt.xlabel("Training examples")
        plt.ylabel("Score")
        plt.title(f"Learning Curves - {model_type.capitalize()} Model")
        plt.legend(loc="best")
        plt.savefig(self.plots_dir / f"learning_curves_{model_type}_{timestamp}.png")
        plt.close()

        # Error analysis plot
        if model_type == "shot":
            cm = np.array(error_analysis["confusion_matrix"])
            plt.figure(figsize=(8, 6))
            sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
            plt.xlabel("Predicted label")
            plt.ylabel("True label")
            plt.title(f"Confusion Matrix - {model_type.capitalize()} Model")
            plt.savefig(
                self.plots_dir / f"confusion_matrix_{model_type}_{timestamp}.png"
            )
            plt.close()
        else:
            plt.figure(figsize=(8, 6))
            plt.hist(error_analysis["error_distribution"]["percentiles"], bins=30)
            plt.xlabel("Error")
            plt.ylabel("Frequency")
            plt.title(f"Error Distribution - {model_type.capitalize()} Model")
            plt.savefig(
                self.plots_dir / f"error_distribution_{model_type}_{timestamp}.png"
            )
            plt.close()

    def _prepare_data(
        self, model_type: str, data: List[Dict]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for evaluation."""
        return self.retrainer._prepare_training_data(model_type, data)

    def _get_model(self, model_type: str):
        """Get model instance."""
        versions = self.version_manager.list_versions(status="active")
        version = next(
            (v for v in versions if v["metadata"]["model_type"] == model_type), None
        )

        if not version:
            raise ValueError(f"No active version found for {model_type} model")

        return self.version_manager.load_version(version["id"])

    def _calculate_improvements(self, versions: List[Dict[str, Any]]):
        """Calculate improvements between versions."""
        improvements = {}

        for i in range(1, len(versions)):
            current = versions[i]
            previous = versions[i - 1]

            metric_changes = {}
            for metric, value in current["metrics"].items():
                if metric in previous["metrics"]:
                    change = value - previous["metrics"][metric]
                    metric_changes[metric] = {
                        "absolute_change": float(change),
                        "percentage_change": (
                            float(change / previous["metrics"][metric] * 100)
                            if previous["metrics"][metric] != 0
                            else float("inf")
                        ),
                    }

            improvements[f"{previous['version_id']}_to_{current['version_id']}"] = {
                "metric_changes": metric_changes,
                "time_difference": (
                    datetime.fromisoformat(current["created_at"])
                    - datetime.fromisoformat(previous["created_at"])
                ).total_seconds(),
            }

        return improvements

    def _load_config(self) -> Dict[str, Any]:
        """Load evaluation configuration."""
        if not self.config_file.exists():
            return {
                "evaluation": {
                    "cv_folds": 5,
                    "test_size": 0.2,
                    "metrics": {
                        "shot": ["accuracy", "precision", "recall", "f1"],
                        "success": ["mse", "rmse", "r2"],
                        "position": ["mse", "rmse", "r2"],
                    },
                },
                "visualization": {"plot_format": "png", "dpi": 300, "style": "seaborn"},
            }

        with open(self.config_file, "r") as f:
            return json.load(f)

    def _save_evaluation_results(self, model_type: str, results: Dict[str, Any]):
        """Save evaluation results."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        result_file = self.results_dir / f"evaluation_{model_type}_{timestamp}.json"

        with open(result_file, "w") as f:
            json.dump(results, f, indent=2)
