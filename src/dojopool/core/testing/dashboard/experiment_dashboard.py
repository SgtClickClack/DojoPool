"""
Dashboard for visualizing A/B test results.
Provides visualization and reporting tools for experiment analysis.
"""

import logging
from typing import Dict, Optional

import plotly.graph_objects as go
from plotly.subplots import make_subplots

from ..ab_testing import ABTestManager
from ..experiment_analyzer import ExperimentAnalyzer
from ..metrics import MetricsManager

logger = logging.getLogger(__name__)


class ExperimentDashboard:
    """Dashboard for visualizing and analyzing experiment results."""

    def __init__(
        self,
        analyzer: ExperimentAnalyzer,
        metrics_manager: MetricsManager,
        ab_manager: ABTestManager,
    ):
        """Initialize the experiment dashboard."""
        self._analyzer = analyzer
        self._metrics = metrics_manager
        self._ab_manager = ab_manager

    def generate_experiment_summary(self, experiment_id: str) -> Dict:
        """
        Generate a summary of experiment results.

        Args:
            experiment_id: ID of the experiment to analyze

        Returns:
            Dict containing experiment summary statistics
        """
        experiment = self._ab_manager.get_experiment(experiment_id)
        if not experiment:
            logger.error(f"Experiment {experiment_id} not found")
            return {}

        metrics_data = self._metrics.export_metrics(experiment_id)
        if not metrics_data or "variants" not in metrics_data:
            logger.error(f"No metrics data found for experiment {experiment_id}")
            return {}

        summary = {
            "experiment_name": experiment.name,
            "description": experiment.description,
            "start_date": experiment.start_date,
            "metrics": {},
        }

        # Analyze each metric
        for metric_name in metrics_data["variants"]["control"].keys():
            result = self._analyzer.analyze_experiment(experiment_id, metric_name)
            if result:
                summary["metrics"][metric_name] = {
                    "control_mean": result.control_mean,
                    "variant_mean": result.variant_mean,
                    "percent_change": result.percent_change,
                    "is_significant": result.is_significant,
                    "p_value": result.p_value,
                    "confidence_interval": result.confidence_interval,
                    "effect_size": result.effect_size,
                    "power": result.power,
                    "sample_size": result.sample_size,
                }

        return summary

    def plot_metric_comparison(self, experiment_id: str, metric_name: str):
        """
        Create a visualization comparing metric values between variants.

        Args:
            experiment_id: ID of the experiment to visualize
            metric_name: Name of the metric to plot

        Returns:
            Plotly figure object for the visualization
        """
        experiment = self._ab_manager.get_experiment(experiment_id)
        if not experiment:
            logger.error(f"Experiment {experiment_id} not found")
            return None

        metrics_data = self._metrics.export_metrics(experiment_id)
        if not metrics_data or "variants" not in metrics_data:
            logger.error(f"No metrics data found for experiment {experiment_id}")
            return None

        # Create figure with secondary y-axis
        fig = make_subplots(specs=[[{"secondary_y": True}]])

        # Add traces for each variant
        has_data = False
        for variant_id, variant_data in metrics_data["variants"].items():
            if metric_name not in variant_data:
                continue

            values = variant_data[metric_name]
            if not values:
                continue

            has_data = True

            # Box plot on primary y-axis
            fig.add_trace(
                go.Box(
                    y=values,
                    name=f"{variant_id} Distribution",
                    boxpoints="all",
                    jitter=0.3,
                    pointpos=-1.8,
                ),
                secondary_y=False,
            )

            # Time series on secondary y-axis
            fig.add_trace(
                go.Scatter(y=values, name=f"{variant_id} Trend", mode="lines+markers"),
                secondary_y=True,
            )

        if not has_data:
            logger.error(f"No data found for metric {metric_name}")
            return None

        # Update layout
        fig.update_layout(
            title=f"{metric_name} Comparison",
            xaxis_title="Variant",
            yaxis_title="Value Distribution",
            yaxis2_title="Time Series",
        )

        return fig

    def generate_report(self, experiment_id: str) -> str:
        """
        Generate a complete HTML report for the experiment.

        Args:
            experiment_id: ID of the experiment to report on

        Returns:
            HTML string containing the complete report
        """
        summary = self.generate_experiment_summary(experiment_id)
        if not summary:
            return "<h1>Error: No data available for experiment</h1>"

        html = f"""
        <html>
        <head>
            <title>Experiment Report: {summary['experiment_name']}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .metric {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; }}
                .significant {{ background-color: #e6ffe6; }}
                .not-significant {{ background-color: #fff6e6; }}
            </style>
        </head>
        <body>
            <h1>Experiment Report: {summary['experiment_name']}</h1>
            <p><strong>Description:</strong> {summary['description']}</p>
            <p><strong>Start Date:</strong> {summary['start_date']}</p>

            <h2>Metrics Summary</h2>
        """

        for metric_name, metric_data in summary["metrics"].items():
            significance_class = (
                "significant" if metric_data["is_significant"] else "not-significant"
            )
            html += f"""
            <div class="metric {significance_class}">
                <h3>{metric_name}</h3>
                <p><strong>Control Mean:</strong> {metric_data['control_mean']:.2f}</p>
                <p><strong>Variant Mean:</strong> {metric_data['variant_mean']:.2f}</p>
                <p><strong>Percent Change:</strong> {metric_data['percent_change']:.2f}%</p>
                <p><strong>Statistical Significance:</strong> {'Yes' if metric_data['is_significant'] else 'No'}</p>
                <p><strong>P-value:</strong> {metric_data['p_value']:.4f}</p>
                <p><strong>Effect Size:</strong> {metric_data['effect_size']:.2f}</p>
                <p><strong>Statistical Power:</strong> {metric_data['power']:.2f}</p>
                <p><strong>Sample Size:</strong> Control: {metric_data['sample_size']['control']},
                   Variant: {metric_data['sample_size']['variant']}</p>
            </div>
            """

            # Add visualization
            fig = self.plot_metric_comparison(experiment_id, metric_name)
            if fig:
                html += f"<div>{fig.to_html(full_html=False)}</div>"

        html += """
        </body>
        </html>
        """

        return html
