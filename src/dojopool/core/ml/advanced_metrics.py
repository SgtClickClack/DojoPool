"""Advanced evaluation metrics for comprehensive model assessment."""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.calibration import calibration_curve
from sklearn.metrics import (
    auc,
    brier_score_loss,
    calibration_curve,
    log_loss,
    max_error,
    mean_absolute_percentage_error,
    mean_squared_log_error,
    median_absolute_error,
    precision_recall_curve,
    roc_curve,
)


class AdvancedMetrics:
    """Advanced metrics calculator for model evaluation."""

    def __init__(self, base_path: str):
        """Initialize advanced metrics calculator.

        Args:
            base_path: Base path for storing metric results
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.metrics_dir = self.base_path / "metrics"
        self.metrics_dir.mkdir(exist_ok=True)
        self.logger = logging.getLogger(__name__)

    def calculate_advanced_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prob: Optional[np.ndarray] = None,
        model_type: str = "shot",
    ) -> Dict[str, Any]:
        """Calculate advanced evaluation metrics.

        Args:
            y_true: True labels/values
            y_pred: Predicted labels/values
            y_prob: Prediction probabilities (for classification)
            model_type: Type of model ('shot', 'success', 'position')

        Returns:
            dict: Advanced metrics
        """
        metrics = {}

        if model_type == "shot":
            # Classification metrics
            if y_prob is not None:
                metrics.update(self._calculate_probabilistic_metrics(y_true, y_prob))
            metrics.update(self._calculate_classification_metrics(y_true, y_pred))
        else:
            # Regression metrics
            metrics.update(self._calculate_regression_metrics(y_true, y_pred))

        # Common metrics
        metrics.update(self._calculate_common_metrics(y_true, y_pred))

        return metrics

    def analyze_prediction_stability(
        self, predictions: List[Dict[str, Any]], model_type: str
    ) -> Dict[str, Any]:
        """Analyze prediction stability over time.

        Args:
            predictions: List of prediction records
            model_type: Type of model

        Returns:
            dict: Stability analysis results
        """
        df = pd.DataFrame(predictions)

        # Convert timestamps to datetime
        df["timestamp"] = pd.to_datetime(df["timestamp"])

        # Calculate stability metrics
        stability = {
            "prediction_drift": self._calculate_prediction_drift(df),
            "confidence_stability": self._analyze_confidence_stability(df),
            "temporal_consistency": self._analyze_temporal_consistency(df),
            "error_stability": self._analyze_error_stability(df),
        }

        return stability

    def evaluate_calibration(
        self, y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10
    ) -> Dict[str, Any]:
        """Evaluate model calibration.

        Args:
            y_true: True labels
            y_prob: Prediction probabilities
            n_bins: Number of bins for calibration curve

        Returns:
            dict: Calibration metrics
        """
        prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=n_bins)

        calibration = {
            "reliability_curve": {
                "true_probabilities": prob_true.tolist(),
                "predicted_probabilities": prob_pred.tolist(),
            },
            "brier_score": float(brier_score_loss(y_true, y_prob)),
            "calibration_error": float(np.mean(np.abs(prob_true - prob_pred))),
            "confidence_distribution": self._analyze_confidence_distribution(y_prob),
        }

        return calibration

    def analyze_error_patterns(
        self, y_true: np.ndarray, y_pred: np.ndarray, features: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """Analyze error patterns in predictions.

        Args:
            y_true: True labels/values
            y_pred: Predicted labels/values
            features: Optional feature matrix for error analysis

        Returns:
            dict: Error pattern analysis
        """
        errors = y_true - y_pred

        patterns = {
            "error_distribution": self._analyze_error_distribution(errors),
            "error_autocorrelation": float(self._calculate_error_autocorrelation(errors)),
            "systematic_bias": float(np.mean(errors)),
            "error_variance": float(np.var(errors)),
        }

        if features is not None:
            patterns["feature_error_correlation"] = self._analyze_feature_error_correlation(
                features, errors
            )

        return patterns

    def _calculate_probabilistic_metrics(
        self, y_true: np.ndarray, y_prob: np.ndarray
    ) -> Dict[str, float]:
        """Calculate probabilistic classification metrics."""
        # ROC curve and AUC
        fpr, tpr, _ = roc_curve(y_true, y_prob)
        roc_auc = auc(fpr, tpr)

        # Precision-Recall curve and AUC
        precision, recall, _ = precision_recall_curve(y_true, y_prob)
        pr_auc = auc(recall, precision)

        return {
            "roc_auc": float(roc_auc),
            "pr_auc": float(pr_auc),
            "log_loss": float(log_loss(y_true, y_prob)),
            "brier_score": float(brier_score_loss(y_true, y_prob)),
        }

    def _calculate_classification_metrics(
        self, y_true: np.ndarray, y_pred: np.ndarray
    ) -> Dict[str, float]:
        """Calculate advanced classification metrics."""
        from sklearn.metrics import (
            balanced_accuracy_score,
            cohen_kappa_score,
            fowlkes_mallows_score,
            matthews_corrcoef,
        )

        return {
            "kappa": float(cohen_kappa_score(y_true, y_pred)),
            "mcc": float(matthews_corrcoef(y_true, y_pred)),
            "balanced_accuracy": float(balanced_accuracy_score(y_true, y_pred)),
            "fowlkes_mallows": float(fowlkes_mallows_score(y_true, y_pred)),
        }

    def _calculate_regression_metrics(
        self, y_true: np.ndarray, y_pred: np.ndarray
    ) -> Dict[str, float]:
        """Calculate advanced regression metrics."""
        metrics = {
            "mape": float(mean_absolute_percentage_error(y_true, y_pred)),
            "msle": float(mean_squared_log_error(y_true, y_pred)),
            "median_ae": float(median_absolute_error(y_true, y_pred)),
            "max_error": float(max_error(y_true, y_pred)),
        }

        # Calculate adjusted R-squared if possible
        if len(y_true) > 1:
            from sklearn.metrics import r2_score

            r2 = r2_score(y_true, y_pred)
            n = len(y_true)
            p = 1  # number of predictors, assuming single output
            adj_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1)
            metrics["adjusted_r2"] = float(adj_r2)

        return metrics

    def _calculate_common_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Calculate metrics common to all model types."""
        return {
            "residual_normality": float(self._test_residual_normality(y_true - y_pred)),
            "prediction_variance": float(np.var(y_pred)),
            "prediction_range": float(np.ptp(y_pred)),
        }

    def _calculate_prediction_drift(self, df: pd.DataFrame) -> Dict[str, float]:
        """Calculate prediction drift metrics."""
        # Split data into two halves
        mid_point = len(df) // 2
        first_half = df.iloc[:mid_point]
        second_half = df.iloc[mid_point:]

        return {
            "mean_drift": float(second_half["prediction"].mean() - first_half["prediction"].mean()),
            "variance_drift": float(
                second_half["prediction"].var() - first_half["prediction"].var()
            ),
            "distribution_shift": float(
                np.abs(
                    np.percentile(second_half["prediction"], 75)
                    - np.percentile(first_half["prediction"], 75)
                )
            ),
        }

    def _analyze_confidence_stability(self, df: pd.DataFrame) -> Dict[str, float]:
        """Analyze stability of prediction confidence."""
        if "confidence" not in df.columns:
            return {}

        return {
            "confidence_mean": float(df["confidence"].mean()),
            "confidence_std": float(df["confidence"].std()),
            "confidence_trend": float(np.polyfit(range(len(df)), df["confidence"], 1)[0]),
        }

    def _analyze_temporal_consistency(self, df: pd.DataFrame) -> Dict[str, float]:
        """Analyze temporal consistency of predictions."""
        predictions = df["prediction"].values
        return {
            "autocorrelation": float(np.corrcoef(predictions[:-1], predictions[1:])[0, 1]),
            "trend_strength": float(np.polyfit(range(len(predictions)), predictions, 1)[0]),
        }

    def _analyze_error_stability(self, df: pd.DataFrame) -> Dict[str, float]:
        """Analyze stability of prediction errors."""
        if "error" not in df.columns:
            return {}

        errors = df["error"].values
        return {
            "error_autocorrelation": float(np.corrcoef(errors[:-1], errors[1:])[0, 1]),
            "error_trend": float(np.polyfit(range(len(errors)), errors, 1)[0]),
        }

    def _analyze_confidence_distribution(self, probabilities: np.ndarray) -> Dict[str, float]:
        """Analyze distribution of prediction confidences."""
        return {
            "mean_confidence": float(np.mean(probabilities)),
            "confidence_std": float(np.std(probabilities)),
            "confidence_skew": float(pd.Series(probabilities).skew()),
            "confidence_kurtosis": float(pd.Series(probabilities).kurtosis()),
        }

    def _analyze_error_distribution(self, errors: np.ndarray) -> Dict[str, float]:
        """Analyze distribution of prediction errors."""
        return {
            "error_mean": float(np.mean(errors)),
            "error_std": float(np.std(errors)),
            "error_skew": float(pd.Series(errors).skew()),
            "error_kurtosis": float(pd.Series(errors).kurtosis()),
            "error_range": float(np.ptp(errors)),
        }

    def _calculate_error_autocorrelation(self, errors: np.ndarray) -> float:
        """Calculate autocorrelation of errors."""
        return np.corrcoef(errors[:-1], errors[1:])[0, 1]

    def _analyze_feature_error_correlation(
        self, features: np.ndarray, errors: np.ndarray
    ) -> Dict[str, float]:
        """Analyze correlation between features and prediction errors."""
        correlations = {}
        for i in range(features.shape[1]):
            corr = np.corrcoef(features[:, i], errors)[0, 1]
            correlations[f"feature_{i}"] = float(corr)
        return correlations

    def _test_residual_normality(self, residuals: np.ndarray) -> float:
        """Test normality of residuals using skewness and kurtosis."""
        from scipy import stats

        _, p_value = stats.normaltest(residuals)
        return p_value
