"""Visualization tools for A/B testing analysis results."""

from typing import Any, Literal, Optional

import matplotlib.pyplot as plt
import plotly.graph_objects as go
import seaborn as sns

from .analysis import AnalysisResult

StyleType = Literal["white", "dark", "whitegrid", "darkgrid", "ticks"]


class ExperimentVisualizer:
    """Visualization tools for experiment analysis results."""

    def __init__(self, style: StyleType = "whitegrid"):
        """Initialize visualizer with specified style."""
        self.style = style
        sns.set_style(style)

    def plot_confidence_interval(
        self, result: AnalysisResult, save_path: Optional[str] = None, interactive: bool = True
    ) -> Any:
        """Plot confidence interval for the difference between variants."""
        if interactive:
            return self._plot_confidence_interval_interactive(result, save_path)
        else:
            return self._plot_confidence_interval_static(result, save_path)

    def _plot_confidence_interval_interactive(
        self, result: AnalysisResult, save_path: Optional[str] = None
    ) -> go.Figure:
        """Create interactive confidence interval plot."""
        fig = go.Figure()

        diff = result.difference
        ci_lower, ci_upper = result.confidence_interval

        fig.add_trace(
            go.Scatter(
                x=[diff],
                y=[1],
                error_x={
                    "type": "data",
                    "symmetric": False,
                    "array": [ci_upper - diff],
                    "arrayminus": [diff - ci_lower],
                    "color": "blue",
                },
                mode="markers",
                marker={"color": "blue", "size": 10},
                name="Difference",
                text=[
                    f"Difference: {diff:.2f}<br>"
                    + f"CI: [{ci_lower:.2f}, {ci_upper:.2f}]<br>"
                    + f"Significant: {'Yes' if result.is_significant else 'No'}"
                ],
                hoverinfo="text",
            )
        )

        fig.add_vline(x=0, line_dash="dash", line_color="gray")

        fig.update_layout(
            title=f"Confidence Interval for {result.metric_name}",
            xaxis_title="Difference (Treatment - Control)",
            yaxis_showticklabels=False,
            showlegend=False,
            hovermode="closest",
        )

        if save_path:
            fig.write_html(save_path)

        return fig

    def _plot_confidence_interval_static(
        self, result: AnalysisResult, save_path: Optional[str] = None
    ) -> plt.Figure:
        """Create static confidence interval plot."""
        plt.figure(figsize=(10, 6))

        diff = result.difference
        ci_lower, ci_upper = result.confidence_interval

        plt.errorbar(diff, 1, xerr=[[diff - ci_lower], [ci_upper - diff]], fmt="o", capsize=5)

        plt.axvline(x=0, color="gray", linestyle="--")

        plt.title(f"Confidence Interval for {result.metric_name}")
        plt.xlabel("Difference (Treatment - Control)")
        plt.yticks([])

        if save_path:
            plt.savefig(save_path)
            plt.close()
            return None

        return plt.gcf()

    def plot_effect_size(
        self, result: AnalysisResult, save_path: Optional[str] = None, interactive: bool = True
    ) -> Any:
        """Plot effect size visualization."""
        if interactive:
            return self._plot_effect_size_interactive(result, save_path)
        else:
            return self._plot_effect_size_static(result, save_path)

    def _plot_effect_size_interactive(
        self, result: AnalysisResult, save_path: Optional[str] = None
    ) -> go.Figure:
        """Create interactive effect size visualization."""
        fig = go.Figure()

        thresholds = {"Small": 0.2, "Medium": 0.5, "Large": 0.8}

        colors = ["rgba(255,200,200,0.2)", "rgba(255,150,150,0.2)", "rgba(255,100,100,0.2)"]
        for i, (label, value) in enumerate(thresholds.items()):
            fig.add_vrect(
                x0=0 if i == 0 else list(thresholds.values())[i - 1],
                x1=value,
                fillcolor=colors[i],
                layer="below",
                line_width=0,
            )
            fig.add_vrect(
                x0=-value,
                x1=0 if i == 0 else -list(thresholds.values())[i - 1],
                fillcolor=colors[i],
                layer="below",
                line_width=0,
            )

        for label, value in thresholds.items():
            fig.add_vline(x=value, line_dash="dash", line_color="gray")
            fig.add_vline(x=-value, line_dash="dash", line_color="gray")
            fig.add_annotation(x=value, y=1.1, text=label, showarrow=False)
            fig.add_annotation(x=-value, y=1.1, text=label, showarrow=False)

        fig.add_trace(
            go.Scatter(
                x=[result.effect_size],
                y=[1],
                mode="markers",
                marker={"color": "black", "size": 12},
                name="Effect Size",
                text=[f"Effect Size: {result.effect_size:.3f}"],
                hoverinfo="text",
            )
        )

        fig.update_layout(
            title=f"Effect Size Analysis for {result.metric_name}",
            xaxis_title="Cohen's d Effect Size",
            yaxis_showticklabels=False,
            xaxis_range=[-1, 1],
            showlegend=False,
            hovermode="closest",
        )

        if save_path:
            fig.write_html(save_path)

        return fig

    def _plot_effect_size_static(
        self, result: AnalysisResult, save_path: Optional[str] = None
    ) -> plt.Figure:
        """Create static effect size visualization."""
        plt.figure(figsize=(10, 6))

        thresholds = {"Small": 0.2, "Medium": 0.5, "Large": 0.8}

        for label, value in thresholds.items():
            plt.axvline(x=value, color="gray", linestyle="--")
            plt.axvline(x=-value, color="gray", linestyle="--")
            plt.text(value, 1.1, label)
            plt.text(-value, 1.1, label)

        plt.plot([result.effect_size], [1], "ko")

        plt.title(f"Effect Size Analysis for {result.metric_name}")
        plt.xlabel("Cohen's d Effect Size")
        plt.yticks([])
        plt.xlim(-1, 1)

        if save_path:
            plt.savefig(save_path)
            plt.close()
            return None

        return plt.gcf()
