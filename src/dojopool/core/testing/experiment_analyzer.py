"""
Statistical analysis module for A/B testing results.
Provides functionality to analyze experiment results and determine winners.
"""

import logging
import math
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

import numpy as np
from scipy import stats

from .ab_testing import ABTestManager
from .metrics import MetricsManager

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    """Results of statistical analysis for a metric."""

    metric_name: str
    control_mean: float
    variant_mean: float
    difference: float
    percent_change: float
    p_value: float
    confidence_interval: Tuple[float, float]
    sample_size: Dict[str, int]
    is_significant: bool
    effect_size: float
    power: float


class ExperimentAnalyzer:
    """Analyzes A/B test results using statistical methods."""

    def __init__(
        self,
        metrics_manager: MetricsManager,
        ab_manager: ABTestManager,
        confidence_level: float = 0.95,
        min_sample_size: int = 30,
    ):
        """
        Initialize the experiment analyzer.

        Args:
            metrics_manager: Manager containing experiment metrics
            ab_manager: Manager containing experiment definitions
            confidence_level: Confidence level for statistical tests (default: 0.95)
            min_sample_size: Minimum sample size required for analysis (default: 30)
        """
        self._metrics = metrics_manager
        self._ab_manager = ab_manager
        self._confidence_level = confidence_level
        self._min_sample_size = min_sample_size

    def analyze_experiment(self, experiment_id: str, metric_name: str) -> Optional[AnalysisResult]:
        """
        Analyze results for a specific metric in an experiment.

        Args:
            experiment_id: ID of the experiment to analyze
            metric_name: Name of the metric to analyze

        Returns:
            Analysis results including statistical significance and effect size
        """
        try:
            # Get experiment and metric data
            experiment = self._ab_manager.get_experiment(experiment_id)
            if not experiment:
                logger.error(f"Experiment {experiment_id} not found")
                return None

            # Get metric values for each variant
            export_data = self._metrics.export_metrics(experiment_id)
            if not export_data or "variants" not in export_data:
                logger.error(f"No metric data found for experiment {experiment_id}")
                return None

            # Get control and variant data
            control_variant = next((v for v in experiment.variants if v.id == "control"), None)
            test_variant = next((v for v in experiment.variants if v.id != "control"), None)
            if not control_variant or not test_variant:
                logger.error("Control or test variant not found")
                return None

            variants_data = export_data["variants"]
            control_values = variants_data.get(control_variant.id, {}).get(metric_name, [])
            variant_values = variants_data.get(test_variant.id, {}).get(metric_name, [])

            # Check sample size
            if (
                len(control_values) < self._min_sample_size
                or len(variant_values) < self._min_sample_size
            ):
                logger.warning(f"Insufficient sample size for experiment {experiment_id}")
                return None

            # Calculate basic statistics
            control_mean = float(np.mean(control_values))
            variant_mean = float(np.mean(variant_values))
            difference = variant_mean - control_mean
            percent_change = (
                (difference / control_mean) * 100 if control_mean != 0 else float("inf")
            )

            # Perform statistical test
            t_stat, p_value = stats.ttest_ind(control_values, variant_values)
            p_value = float(p_value)  # Convert from numpy type to float

            # Calculate confidence interval
            control_std = float(np.std(control_values, ddof=1))
            variant_std = float(np.std(variant_values, ddof=1))

            # Pooled standard error
            n1, n2 = len(control_values), len(variant_values)
            se = math.sqrt((control_std**2 / n1) + (variant_std**2 / n2))

            # Confidence interval
            alpha = 1 - self._confidence_level
            t_value = float(stats.t.ppf(1 - alpha / 2, n1 + n2 - 2))
            margin_of_error = t_value * se
            ci_lower = difference - margin_of_error
            ci_upper = difference + margin_of_error

            # Calculate effect size (Cohen's d)
            pooled_std = math.sqrt(
                ((n1 - 1) * control_std**2 + (n2 - 1) * variant_std**2) / (n1 + n2 - 2)
            )
            effect_size = abs(difference) / pooled_std if pooled_std != 0 else 0

            # Calculate statistical power
            power = float(
                1
                - stats.t.cdf(
                    stats.t.ppf(1 - alpha / 2, n1 + n2 - 2)
                    - effect_size * math.sqrt(n1 * n2 / (n1 + n2)),
                    n1 + n2 - 2,
                )
            )

            return AnalysisResult(
                metric_name=metric_name,
                control_mean=control_mean,
                variant_mean=variant_mean,
                difference=difference,
                percent_change=percent_change,
                p_value=p_value,
                confidence_interval=(ci_lower, ci_upper),
                sample_size={"control": n1, "variant": n2},
                is_significant=p_value < (1 - self._confidence_level),
                effect_size=effect_size,
                power=power,
            )

        except Exception as e:
            logger.error(f"Error analyzing experiment: {str(e)}")
            return None

    def determine_winner(
        self,
        experiment_id: str,
        metric_name: str,
        min_effect_size: float = 0.1,
        required_power: float = 0.8,
    ) -> Optional[str]:
        """
        Determine if there's a statistically significant winner.

        Args:
            experiment_id: ID of the experiment
            metric_name: Name of the metric to analyze
            min_effect_size: Minimum effect size required to declare a winner
            required_power: Minimum statistical power required

        Returns:
            ID of the winning variant, or None if no clear winner
        """
        try:
            result = self.analyze_experiment(experiment_id, metric_name)
            if not result:
                return None

            # Check if result is significant and meets requirements
            if (
                result.is_significant
                and result.effect_size >= min_effect_size
                and result.power >= required_power
            ):
                # Determine winner based on direction of change
                experiment = self._ab_manager.get_experiment(experiment_id)
                if not experiment:
                    return None

                control_variant = next((v for v in experiment.variants if v.id == "control"), None)
                test_variant = next((v for v in experiment.variants if v.id != "control"), None)
                if not control_variant or not test_variant:
                    return None

                return test_variant.id if result.difference > 0 else control_variant.id

            return None

        except Exception as e:
            logger.error(f"Error determining winner: {str(e)}")
            return None
