import gc
import gc
"""
Analysis tools for A/B testing results.
Provides statistical analysis and visualization of test data.
"""

import json
import logging
import statistics
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import matplotlib
import numpy as np
from scipy import stats

matplotlib.use("Agg")  # Use Agg backend
import os
import time

import matplotlib.pyplot as plt

from .ab_testing import Experiment
from .metrics import MetricsManager

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    """Result of analyzing an experiment."""

    experiment_id: str
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    significant: bool
    improvement: float
    p_value: float
    winning_variant: Optional[str]
    sample_sizes: Dict[str, int]
    variant_results: Dict[str, Dict[str, Any]]
    confidence_level: float
    total_users: int


class TestAnalyzer:
    """Analyzer for A/B test experiments."""

    def __init__(self, metrics_manager: MetricsManager):
        """Initialize the analyzer."""
        self.metrics = metrics_manager
        self._results_dir = Path("analysis_results")

    def get_analysis_result(self, experiment_id: str) -> Optional[AnalysisResult]:
        """Get the latest analysis result for an experiment."""
        try:
            # Find the latest result file for this experiment
            result_files = list(self._results_dir.glob(f"{experiment_id}_*.json"))
            if not result_files:
                return None

            latest_file = max(result_files, key=lambda x: int(x.stem.split("_")[1]))
            return self._load_result(str(latest_file))

        except Exception as e:
            logger.error(f"Error loading analysis result: {str(e)}")
            return None

    def analyze_experiment(
        self, experiment: Experiment, metric_name: str, confidence_level: float = 0.95
    ):
        """
        Analyze the results of an experiment.

        Args:
            experiment: The experiment to analyze
            metric_name: Name of the metric to analyze
            confidence_level: Required confidence level (default: 0.95)

        Returns:
            AnalysisResult containing statistical analysis and insights
        """
        try:
            # Get metrics for each variant
            variant_data: Dict[str, List[float]] = {}
            variant_results: Dict[str, Dict[str, Any]] = {}
            total_users = 0

            for variant in experiment.variants:
                # Get metric values for this variant
                values = self.metrics.get_metric_values(
                    metric_name,
                    tags={f"experiment_{experiment.id}", f"variant_{variant.id}"},
                )

                if not values:
                    continue

                variant_data[variant.id] = values
                total_users += len(values)

                # Calculate basic statistics
                variant_results[variant.id] = {
                    "users": len(values),
                    "mean": statistics.mean(values),
                    "median": statistics.median(values),
                    "std_dev": statistics.stdev(values) if len(values) > 1 else 0,
                    "conversion_rate": sum(1 for v in values if v > 0) / len(values),
                }

            if len(variant_data) < 2:
                raise ValueError("Not enough variants with data")

            # Perform statistical tests
            control_id = experiment.variants[0].id  # First variant is control
            control_data = variant_data[control_id]

            winning_variant = None
            best_improvement = 0
            significant = False
            min_p_value = 1.0

            for variant_id, variant_data in variant_data.items():
                if variant_id == control_id:
                    continue

                # For binary data (conversions), use chi-square test
                control_successes = sum(1 for v in control_data if v > 0)
                control_failures = len(control_data) - control_successes
                variant_successes = sum(1 for v in variant_data if v > 0)
                variant_failures = len(variant_data) - variant_successes

                contingency = np.array(
                    [
                        [control_successes, control_failures],
                        [variant_successes, variant_failures],
                    ]
                )

                chi2, p_value = stats.chi2_contingency(contingency)[:2]
                variant_results[variant_id]["p_value"] = p_value

                # Check if result is significant
                if p_value < (1 - confidence_level):
                    variant_results[variant_id]["significant"] = True
                    significant = True

                    # Calculate improvement
                    control_rate = variant_results[control_id]["conversion_rate"]
                    variant_rate = variant_results[variant_id]["conversion_rate"]
                    improvement = (variant_rate - control_rate) / control_rate
                    variant_results[variant_id]["improvement"] = improvement

                    # Update winning variant if this is the best improvement
                    if improvement > best_improvement:
                        winning_variant = variant_id
                        best_improvement = improvement

                # Track lowest p-value
                min_p_value = min(min_p_value, p_value)

            # Create analysis result
            result = AnalysisResult(
                experiment_id=experiment.id,
                start_date=experiment.start_date,
                end_date=experiment.end_date or datetime.now(),
                total_users=total_users,
                variant_results=variant_results,
                confidence_level=confidence_level,
                p_value=min_p_value,
                significant=significant,
                winning_variant=winning_variant,
                improvement=best_improvement if winning_variant else None,
            )

            # Save result
            self._save_result(result)

            # Generate visualizations
            self._generate_plots(result, variant_data)

            return result

        except Exception as e:
            logger.error(f"Error analyzing experiment: {str(e)}")
            raise

    def get_experiment_insights(self, experiment_id: str) -> Dict[str, Any]:
        """Get insights for an experiment."""
        result = self.get_analysis_result(experiment_id)
        if not result:
            return {"status": "No analysis results available"}

        if not result.end_date:
            return {"status": "Running"}

        insights = {
            "status": "Completed",
            "start_date": result.start_date,
            "end_date": result.end_date,
            "significant": result.significant,
            "improvement": result.improvement,
            "p_value": result.p_value,
            "winning_variant": result.winning_variant,
            "sample_sizes": result.sample_sizes,
        }
        return insights

    def _save_result(self, result: AnalysisResult):
        """Save analysis result to disk."""
        try:
            # Create results directory if it doesn't exist
            os.makedirs(self._results_dir, exist_ok=True)

            # Generate filename with timestamp
            timestamp = int(time.time())
            filename = f"{result.experiment_id}_{timestamp}.json"
            filepath = os.path.join(self._results_dir, filename)

            # Convert result to dict for serialization
            result_dict = {
                "experiment_id": result.experiment_id,
                "start_date": (
                    result.start_date.isoformat() if result.start_date else None
                ),
                "end_date": result.end_date.isoformat() if result.end_date else None,
                "significant": result.significant,
                "improvement": result.improvement,
                "p_value": result.p_value,
                "winning_variant": result.winning_variant,
                "sample_sizes": result.sample_sizes,
            }

            with open(filepath, "w") as f:
                json.dump(result_dict, f)

        except Exception as e:
            logger.error(f"Error saving analysis result: {str(e)}")

    def _load_latest_result(self, experiment_id: str):
        """Load the latest analysis result for an experiment."""
        try:
            # Find all result files for this experiment
            result_files = list(self._results_dir.glob(f"{experiment_id}_*.json"))
            if not result_files:
                return None

            # Get latest file by extracting timestamp from filename
            latest_file = max(
                result_files,
                key=lambda p: int("".join(filter(str.isdigit, p.stem.split("_")[1]))),
            )

            # Load and parse result
            with open(latest_file, "r") as f:
                data = json.load(f)

            return AnalysisResult(
                experiment_id=data["experiment_id"],
                start_date=datetime.fromisoformat(data["start_date"]),
                end_date=datetime.fromisoformat(data["end_date"]),
                total_users=data["total_users"],
                variant_results=data["variant_results"],
                confidence_level=data["confidence_level"],
                p_value=data["p_value"],
                significant=data["significant"],
                winning_variant=data["winning_variant"],
                improvement=data["improvement"],
            )

        except Exception as e:
            logger.error(f"Error loading analysis result: {str(e)}")
            return None

    def _generate_plots(
        self, result: AnalysisResult, variant_data: Dict[str, List[float]]
    ):
        """Generate visualization plots for the analysis result."""
        try:
            # Create figure with subplots
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))

            # Plot 1: Bar chart of conversion rates by variant
            variants = list(result.variant_results.keys())
            conversion_rates = [
                result.variant_results[v]["conversion_rate"] for v in variants
            ]

            ax1.bar(variants, conversion_rates)
            ax1.set_title("Conversion Rate by Variant")
            ax1.set_ylabel("Conversion Rate")

            # Plot 2: Sample sizes by variant
            sample_sizes = [result.variant_results[v]["users"] for v in variants]

            ax2.bar(variants, sample_sizes)
            ax2.set_title("Sample Size by Variant")
            ax2.set_ylabel("Number of Users")

            # Save plots
            timestamp = int(result.end_date.timestamp())
            plot_path = self._results_dir / f"{result.experiment_id}_{timestamp}.png"
            plt.savefig(plot_path)
            plt.close()

        except Exception as e:
            logger.error(f"Error generating plots: {str(e)}")

    def _load_result(self, file_path: str) -> Optional[AnalysisResult]:
        """Load analysis result from a JSON file."""
        try:
            with open(file_path, "r") as f:
                data = json.load(f)

            return AnalysisResult(
                experiment_id=data["experiment_id"],
                start_date=(
                    datetime.fromisoformat(data["start_date"])
                    if data.get("start_date")
                    else None
                ),
                end_date=(
                    datetime.fromisoformat(data["end_date"])
                    if data.get("end_date")
                    else None
                ),
                significant=data["significant"],
                improvement=data["improvement"],
                p_value=data["p_value"],
                winning_variant=data.get("winning_variant"),
                sample_sizes=data["sample_sizes"],
                variant_results=data["variant_results"],
                confidence_level=data["confidence_level"],
                total_users=data["total_users"],
            )
        except Exception as e:
            logger.error(f"Error loading result from {file_path}: {str(e)}")
            return None
