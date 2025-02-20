"""
Statistical analysis module for A/B testing results.
Provides tools for analyzing experiment results and determining statistical significance.
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Tuple

import numpy as np
from scipy import stats

from ..monitoring.error_logger import ErrorSeverity, error_logger

logger = logging.getLogger(__name__)


@dataclass
class VariantResults:
    """Results for a single variant in an experiment."""

    variant_id: str
    sample_size: int
    conversion_rate: float
    mean_value: float
    std_dev: float
    confidence_interval: Tuple[float, float]


@dataclass
class ExperimentResults:
    """Complete results for an A/B test experiment."""

    experiment_id: str
    control_results: VariantResults
    variant_results: List[VariantResults]
    p_value: float
    is_significant: bool
    minimum_detectable_effect: float
    power: float


class ExperimentAnalyzer:
    """Analyzes A/B test results for statistical significance."""

    def __init__(self, confidence_level: float = 0.95, power: float = 0.8):
        """Initialize the analyzer with confidence level and power."""
        self.confidence_level = confidence_level
        self.power = power

    def _calculate_confidence_interval(
        self, mean: float, std_dev: float, sample_size: int
    ):
        """Calculate confidence interval for the mean."""
        z_score = float(stats.norm.ppf((1 + self.confidence_level) / 2))
        margin_error = z_score * (std_dev / np.sqrt(sample_size))
        return (float(mean - margin_error), float(mean + margin_error))

    def _calculate_minimum_sample_size(
        self, baseline_rate: float, minimum_detectable_effect: float
    ) -> int:
        """Calculate minimum sample size needed for statistical significance."""
        effect_size = minimum_detectable_effect / np.sqrt(
            2 * baseline_rate * (1 - baseline_rate)
        )
        return int(
            np.ceil(
                stats.norm.ppf(self.power)
                + stats.norm.ppf(self.confidence_level) / effect_size**2
            )
        )

    def analyze_variant(self, variant_id: str, values: List[float]) -> VariantResults:
        """Analyze results for a single variant."""
        try:
            values_array = np.array(values)
            sample_size = len(values)
            mean_value = float(np.mean(values_array))
            std_dev = float(np.std(values_array, ddof=1))
            conversion_rate = float(np.mean(values_array > 0))

            confidence_interval = self._calculate_confidence_interval(
                mean_value, std_dev, sample_size
            )

            return VariantResults(
                variant_id=variant_id,
                sample_size=sample_size,
                conversion_rate=conversion_rate,
                mean_value=mean_value,
                std_dev=std_dev,
                confidence_interval=confidence_interval,
            )

        except Exception as e:
            error_logger.log_error(
                error=e, severity=ErrorSeverity.ERROR, component="experiment_analyzer"
            )
            raise

    def analyze_experiment(
        self,
        experiment_id: str,
        control_values: List[float],
        variant_values: Dict[str, List[float]],
        minimum_detectable_effect: float = 0.1,
    ) -> ExperimentResults:
        """
        Analyze experiment results for statistical significance.

        Args:
            experiment_id: ID of the experiment
            control_values: List of metric values for control group
            variant_values: Dict mapping variant IDs to their metric values
            minimum_detectable_effect: Smallest meaningful difference to detect

        Returns:
            ExperimentResults with analysis details
        """
        try:
            # Analyze control group
            control_results = self.analyze_variant("control", control_values)

            # Analyze each variant
            variant_results = []
            p_values = []

            for variant_id, values in variant_values.items():
                # Calculate variant statistics
                variant_result = self.analyze_variant(variant_id, values)
                variant_results.append(variant_result)

                # Perform t-test for statistical significance
                t_stat, p_value = stats.ttest_ind(control_values, values)
                p_values.append(float(p_value))

            # Use minimum p-value for overall significance
            min_p_value = min(p_values) if p_values else 1.0
            is_significant = min_p_value < (1 - self.confidence_level)

            # Calculate achieved power
            effect_size = (
                abs(
                    control_results.mean_value
                    - max(vr.mean_value for vr in variant_results)
                )
                / control_results.std_dev
            )

            achieved_power = float(
                stats.norm.cdf(
                    effect_size * np.sqrt(control_results.sample_size / 2)
                    - stats.norm.ppf(self.confidence_level)
                )
            )

            return ExperimentResults(
                experiment_id=experiment_id,
                control_results=control_results,
                variant_results=variant_results,
                p_value=min_p_value,
                is_significant=is_significant,
                minimum_detectable_effect=minimum_detectable_effect,
                power=achieved_power,
            )

        except Exception as e:
            error_logger.log_error(
                error=e, severity=ErrorSeverity.ERROR, component="experiment_analyzer"
            )
            raise
