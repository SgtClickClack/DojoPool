from multiprocessing import Pool
import gc
from multiprocessing import Pool
import gc
"""Interactive visualization tools for A/B testing analysis results."""

from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
import plotly.figure_factory as ff
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from .analysis import AnalysisResult, ExperimentAnalyzer
from .metrics import MetricEvent


class InteractiveVisualizer:
    """Interactive visualization tools for experiment analysis results."""

    def plot_confidence_interval(
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

    def plot_effect_size(
        self, result: AnalysisResult, save_path: Optional[str] = None
    ) -> go.Figure:
        """Create interactive effect size visualization."""
        fig = go.Figure()

        thresholds = {"Small": 0.2, "Medium": 0.5, "Large": 0.8}

        colors = [
            "rgba(255,200,200,0.2)",
            "rgba(255,150,150,0.2)",
            "rgba(255,100,100,0.2)",
        ]
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

    def plot_power_curve(
        self,
        analyzer: ExperimentAnalyzer,
        effect_sizes: Optional[List[float]] = None,
        sample_sizes: Optional[List[int]] = None,
        save_path: Optional[str] = None,
    ) -> go.Figure:
        """Create interactive power curve visualization."""
        if effect_sizes is None:
            effect_sizes = [0.2, 0.5, 0.8]  # Small, medium, large
        if sample_sizes is None:
            sample_sizes = list(range(20, 500, 20))

        fig = go.Figure()

        for effect_size in effect_sizes:
            powers = []
            for n in sample_sizes:
                control = [float(x) for x in np.random.normal(0, 1, n)]
                variant = [float(x) for x in np.random.normal(effect_size, 1, n)]
                power = analyzer._calculate_power(control, variant, effect_size)
                powers.append(power)

            fig.add_trace(
                go.Scatter(
                    x=sample_sizes,
                    y=powers,
                    mode="lines",
                    name=f"Effect Size = {effect_size}",
                    hovertemplate="Sample Size: %{x}<br>Power: %{y:.3f}",
                )
            )

        fig.add_hline(
            y=0.8,
            line_dash="dash",
            line_color="gray",
            annotation={"text": "0.8 Power Threshold"},
        )

        fig.update_layout(
            title="Statistical Power Analysis",
            xaxis_title="Sample Size per Group",
            yaxis_title="Statistical Power",
            hovermode="closest",
            showlegend=True,
        )

        if save_path:
            fig.write_html(save_path)

        return fig

    def plot_sample_size_estimation(
        self,
        analyzer: ExperimentAnalyzer,
        min_effect: float = 0.1,
        max_effect: float = 1.0,
        save_path: Optional[str] = None,
    ) -> go.Figure:
        """Create interactive sample size estimation visualization."""
        fig = go.Figure()

        effect_sizes = [float(x) for x in np.linspace(min_effect, max_effect, 50)]
        sample_sizes = [analyzer.get_required_sample_size(es) for es in effect_sizes]

        fig.add_trace(
            go.Scatter(
                x=effect_sizes,
                y=sample_sizes,
                mode="lines",
                name="Required Sample Size",
                hovertemplate="Effect Size: %{x:.2f}<br>Required n: %{y:d}",
            )
        )

        common_effects = {"Small (0.2)": 0.2, "Medium (0.5)": 0.5, "Large (0.8)": 0.8}

        for label, es in common_effects.items():
            n = analyzer.get_required_sample_size(es)
            fig.add_vline(x=es, line_dash="dash", line_color="gray")
            fig.add_hline(y=n, line_dash="dash", line_color="gray")
            fig.add_trace(
                go.Scatter(
                    x=[es],
                    y=[n],
                    mode="markers",
                    marker={"color": "red", "size": 10},
                    name=label,
                    text=[f"{label}<br>n = {n}"],
                    hoverinfo="text",
                )
            )

        fig.update_layout(
            title="Required Sample Size Estimation",
            xaxis_title="Effect Size",
            yaxis_title="Required Sample Size per Group",
            hovermode="closest",
            showlegend=True,
        )

        if save_path:
            fig.write_html(save_path)

        return fig

    def plot_distributions(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        save_path: Optional[str] = None,
    ) -> go.Figure:
        """Create interactive distribution plots comparing control and variant groups."""
        control_values = [e.value for e in control_events]
        variant_values = [e.value for e in variant_events]

        fig = go.Figure()

        # Add histogram for control group
        fig.add_trace(
            go.Histogram(
                x=control_values,
                name="Control",
                opacity=0.75,
                nbinsx=30,
                histnorm="probability",
            )
        )

        # Add histogram for variant group
        fig.add_trace(
            go.Histogram(
                x=variant_values,
                name="Variant",
                opacity=0.75,
                nbinsx=30,
                histnorm="probability",
            )
        )

        # Add KDE curves
        hist_data = [control_values, variant_values]
        group_labels = ["Control", "Variant"]
        kde_fig = ff.create_distplot(hist_data, group_labels, show_hist=False)

        for trace in kde_fig.data:
            fig.add_trace(trace)

        # Add mean lines
        control_mean = np.mean(control_values)
        variant_mean = np.mean(variant_values)

        fig.add_vline(
            x=control_mean,
            line_dash="dash",
            line_color="blue",
            annotation={"text": f"Control Mean: {control_mean:.2f}"},
        )
        fig.add_vline(
            x=variant_mean,
            line_dash="dash",
            line_color="red",
            annotation={"text": f"Variant Mean: {variant_mean:.2f}"},
        )

        fig.update_layout(
            title=f"Distribution Comparison for {control_events[0].metric_name}",
            xaxis_title="Value",
            yaxis_title="Density",
            barmode="overlay",
            hovermode="closest",
        )

        if save_path:
            fig.write_html(save_path)

        return fig

    def create_statistical_summary(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        save_path: Optional[str] = None,
    ):
        """Create interactive statistical summary visualization."""
        control_values = np.array([e.value for e in control_events])
        variant_values = np.array([e.value for e in variant_events])

        # Calculate statistics
        stats = {
            "Metric": [
                "Count",
                "Mean",
                "Median",
                "Std Dev",
                "Min",
                "25%",
                "75%",
                "Max",
            ],
            "Control": [
                len(control_values),
                np.mean(control_values),
                np.median(control_values),
                np.std(control_values),
                np.min(control_values),
                np.percentile(control_values, 25),
                np.percentile(control_values, 75),
                np.max(control_values),
            ],
            "Variant": [
                len(variant_values),
                np.mean(variant_values),
                np.median(variant_values),
                np.std(variant_values),
                np.min(variant_values),
                np.percentile(variant_values, 25),
                np.percentile(variant_values, 75),
                np.max(variant_values),
            ],
        }

        # Create table
        fig = go.Figure(
            data=[
                go.Table(
                    header={
                        "values": ["Statistic", "Control", "Variant"],
                        "fill_color": "paleturquoise",
                        "align": "left",
                    },
                    cells={
                        "values": [
                            stats["Metric"],
                            [
                                f"{x:,.2f}" if isinstance(x, float) else f"{x:,}"
                                for x in stats["Control"]
                            ],
                            [
                                f"{x:,.2f}" if isinstance(x, float) else f"{x:,}"
                                for x in stats["Variant"]
                            ],
                        ],
                        "fill_color": "lavender",
                        "align": "right",
                    },
                )
            ]
        )

        fig.update_layout(
            title=f"Statistical Summary for {control_events[0].metric_name}", width=600
        )

        if save_path:
            fig.write_html(save_path)

        return fig

    def create_dashboard(
        self,
        result: AnalysisResult,
        analyzer: ExperimentAnalyzer,
        save_path: Optional[str] = None,
    ):
        """Create an interactive dashboard combining all visualizations."""
        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Confidence Interval",
                "Effect Size Analysis",
                "Power Analysis",
                "Sample Size Estimation",
            ),
        )

        # Add confidence interval plot
        ci_fig = self.plot_confidence_interval(result)
        for trace in ci_fig.data:
            fig.add_trace(trace, row=1, col=1)

        # Add effect size plot
        es_fig = self.plot_effect_size(result)
        for trace in es_fig.data:
            fig.add_trace(trace, row=1, col=2)

        # Add power curve plot
        power_fig = self.plot_power_curve(analyzer)
        for trace in power_fig.data:
            fig.add_trace(trace, row=2, col=1)

        # Add sample size estimation plot
        size_fig = self.plot_sample_size_estimation(analyzer)
        for trace in size_fig.data:
            fig.add_trace(trace, row=2, col=2)

        fig.update_layout(
            title="A/B Test Analysis Dashboard",
            showlegend=True,
            height=1000,
            width=1200,
        )

        if save_path:
            fig.write_html(save_path)

        return fig

    def plot_time_series(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        window_size: str = "1D",
        save_path: Optional[str] = None,
    ):
        """Create interactive time series visualization.

        Args:
            control_events: List of control group events
            variant_events: List of variant group events
            window_size: Rolling window size (e.g., '1H' for 1 hour, '1D' for 1 day)
            save_path: Optional path to save the plot
        """

        # Convert events to dataframes
        def events_to_df(events: List[MetricEvent]) -> pd.DataFrame:
            return pd.DataFrame(
                [
                    {
                        "timestamp": e.timestamp,
                        "value": float(e.value),
                        "user_id": e.user_id,
                    }
                    for e in events
                ]
            )

        control_df = events_to_df(control_events)
        variant_df = events_to_df(variant_events)

        # Calculate rolling metrics
        def calculate_rolling_metrics(
            df: pd.DataFrame,
        ):
            df = df.set_index("timestamp").sort_index()
            rolling = df["value"].rolling(window=window_size)
            mean = rolling.mean()
            std = rolling.std()
            return mean, std, df["value"]

        control_mean, control_std, control_raw = calculate_rolling_metrics(control_df)
        variant_mean, variant_std, variant_raw = calculate_rolling_metrics(variant_df)

        # Create figure
        fig = go.Figure()

        # Add raw data points with low opacity
        fig.add_trace(
            go.Scatter(
                x=control_raw.index,
                y=control_raw.values,
                mode="markers",
                name="Control Raw",
                marker={"color": "blue", "size": 4, "opacity": 0.1},
                showlegend=False,
            )
        )

        fig.add_trace(
            go.Scatter(
                x=variant_raw.index,
                y=variant_raw.values,
                mode="markers",
                name="Variant Raw",
                marker={"color": "red", "size": 4, "opacity": 0.1},
                showlegend=False,
            )
        )

        # Add rolling means
        fig.add_trace(
            go.Scatter(
                x=control_mean.index,
                y=control_mean.values,
                mode="lines",
                name=f"Control ({window_size} Rolling Mean)",
                line={"color": "blue", "width": 2},
            )
        )

        fig.add_trace(
            go.Scatter(
                x=variant_mean.index,
                y=variant_mean.values,
                mode="lines",
                name=f"Variant ({window_size} Rolling Mean)",
                line={"color": "red", "width": 2},
            )
        )

        # Add confidence bands
        fig.add_trace(
            go.Scatter(
                x=control_mean.index.tolist() + control_mean.index.tolist()[::-1],
                y=(control_mean + control_std).tolist()
                + (control_mean - control_std).tolist()[::-1],
                fill="toself",
                fillcolor="rgba(0,0,255,0.1)",
                line={"color": "rgba(0,0,255,0)"},
                name="Control ±1σ",
                showlegend=True,
            )
        )

        fig.add_trace(
            go.Scatter(
                x=variant_mean.index.tolist() + variant_mean.index.tolist()[::-1],
                y=(variant_mean + variant_std).tolist()
                + (variant_mean - variant_std).tolist()[::-1],
                fill="toself",
                fillcolor="rgba(255,0,0,0.1)",
                line={"color": "rgba(255,0,0,0)"},
                name="Variant ±1σ",
                showlegend=True,
            )
        )

        # Update layout
        fig.update_layout(
            title=f"Time Series Analysis for {control_events[0].metric_name}",
            xaxis_title="Time",
            yaxis_title="Value",
            hovermode="x unified",
            showlegend=True,
        )

        if save_path:
            fig.write_html(save_path)

        return fig

    def plot_cumulative_metrics(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        metric_type: str = "mean",
        save_path: Optional[str] = None,
    ) -> go.Figure:
        """Create interactive cumulative metrics visualization.

        Args:
            control_events: List of control group events
            variant_events: List of variant group events
            metric_type: Type of cumulative metric ('mean', 'sum', or 'conversion')
            save_path: Optional path to save the plot
        """

        # Convert events to dataframes
        def events_to_df(events: List[MetricEvent]):
            return pd.DataFrame(
                [
                    {
                        "timestamp": e.timestamp,
                        "value": float(e.value),
                        "user_id": e.user_id,
                    }
                    for e in events
                ]
            ).sort_values("timestamp")

        control_df = events_to_df(control_events)
        variant_df = events_to_df(variant_events)

        # Calculate cumulative metrics
        def calculate_cumulative_metric(
            df: pd.DataFrame,
        ):
            if metric_type == "mean":
                cumulative = df["value"].expanding().mean().to_numpy()
            elif metric_type == "sum":
                cumulative = df["value"].expanding().sum().to_numpy()
            else:  # conversion
                cumulative = (df["value"] > 0).expanding().mean().to_numpy()

            # Calculate confidence intervals
            std_err = df["value"].expanding().std().to_numpy() / np.sqrt(
                np.arange(1, len(df) + 1)
            )
            ci = 1.96 * std_err  # 95% confidence interval

            return cumulative, ci

        control_cum, control_ci = calculate_cumulative_metric(control_df)
        variant_cum, variant_ci = calculate_cumulative_metric(variant_df)

        # Create figure
        fig = go.Figure()

        # Add cumulative lines
        fig.add_trace(
            go.Scatter(
                x=control_df["timestamp"],
                y=control_cum,
                mode="lines",
                name="Control",
                line={"color": "blue", "width": 2},
            )
        )

        fig.add_trace(
            go.Scatter(
                x=variant_df["timestamp"],
                y=variant_cum,
                mode="lines",
                name="Variant",
                line={"color": "red", "width": 2},
            )
        )

        # Add confidence bands
        fig.add_trace(
            go.Scatter(
                x=control_df["timestamp"].tolist()
                + control_df["timestamp"].tolist()[::-1],
                y=(control_cum + control_ci).tolist()
                + (control_cum - control_ci).tolist()[::-1],
                fill="toself",
                fillcolor="rgba(0,0,255,0.1)",
                line={"color": "rgba(0,0,255,0)"},
                name="Control 95% CI",
                showlegend=True,
            )
        )

        fig.add_trace(
            go.Scatter(
                x=variant_df["timestamp"].tolist()
                + variant_df["timestamp"].tolist()[::-1],
                y=(variant_cum + variant_ci).tolist()
                + (variant_cum - variant_ci).tolist()[::-1],
                fill="toself",
                fillcolor="rgba(255,0,0,0.1)",
                line={"color": "rgba(255,0,0,0)"},
                name="Variant 95% CI",
                showlegend=True,
            )
        )

        # Update layout
        metric_name = control_events[0].metric_name
        title_suffix = {
            "mean": "Cumulative Mean",
            "sum": "Cumulative Sum",
            "conversion": "Cumulative Conversion Rate",
        }[metric_type]

        fig.update_layout(
            title=f"{title_suffix} for {metric_name}",
            xaxis_title="Time",
            yaxis_title=title_suffix,
            hovermode="x unified",
            showlegend=True,
        )

        if save_path:
            fig.write_html(save_path)

        return fig

    def create_time_dashboard(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        save_path: Optional[str] = None,
    ) -> go.Figure:
        """Create a comprehensive time series dashboard."""
        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Time Series with Rolling Mean",
                "Cumulative Mean",
                "Cumulative Conversion Rate",
                "Daily Pattern Analysis",
            ),
        )

        # Add time series plot
        ts_fig = self.plot_time_series(control_events, variant_events, window_size="1D")
        for trace in ts_fig.data:
            fig.add_trace(trace, row=1, col=1)

        # Add cumulative mean plot
        cum_mean_fig = self.plot_cumulative_metrics(
            control_events, variant_events, metric_type="mean"
        )
        for trace in cum_mean_fig.data:
            fig.add_trace(trace, row=1, col=2)

        # Add cumulative conversion plot
        cum_conv_fig = self.plot_cumulative_metrics(
            control_events, variant_events, metric_type="conversion"
        )
        for trace in cum_conv_fig.data:
            fig.add_trace(trace, row=2, col=1)

        # Add daily pattern analysis
        def add_daily_pattern(events: List[MetricEvent], name: str, row: int, col: int):
            df = pd.DataFrame(
                [{"hour": e.timestamp.hour, "value": float(e.value)} for e in events]
            )
            hourly_mean = df.groupby("hour")["value"].mean()
            hourly_std = df.groupby("hour")["value"].std()

            fig.add_trace(
                go.Scatter(
                    x=list(range(24)),
                    y=hourly_mean,
                    mode="lines",
                    name=f"{name} Mean",
                    line={"color": "blue" if name == "Control" else "red"},
                ),
                row=row,
                col=col,
            )

            fig.add_trace(
                go.Scatter(
                    x=list(range(24)) + list(range(24))[::-1],
                    y=(hourly_mean + hourly_std).tolist()
                    + (hourly_mean - hourly_std).tolist()[::-1],
                    fill="toself",
                    fillcolor=(
                        "rgba(0,0,255,0.1)"
                        if name == "Control"
                        else "rgba(255,0,0,0.1)"
                    ),
                    line={"color": "rgba(0,0,0,0)"},
                    name=f"{name} ±1σ",
                    showlegend=True,
                ),
                row=row,
                col=col,
            )

        add_daily_pattern(control_events, "Control", 2, 2)
        add_daily_pattern(variant_events, "Variant", 2, 2)

        # Update layout
        fig.update_layout(
            height=1000,
            width=1200,
            title_text=f"Time Series Analysis Dashboard for {control_events[0].metric_name}",
            showlegend=True,
        )

        # Update x-axis labels for daily pattern
        fig.update_xaxes(title_text="Hour of Day", row=2, col=2)
        fig.update_yaxes(title_text="Average Value", row=2, col=2)

        if save_path:
            fig.write_html(save_path)

        return fig

    def plot_segmentation_analysis(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        segment_key: str,
        save_path: Optional[str] = None,
    ) -> go.Figure:
        """Create interactive segmentation analysis visualization.

        Args:
            control_events: List of control group events
            variant_events: List of variant group events
            segment_key: Key to segment by (e.g., 'device_type', 'country', 'user_type')
            save_path: Optional path to save the plot
        """

        def events_to_df(events: List[MetricEvent]):
            return pd.DataFrame(
                [
                    {
                        "value": float(e.value),
                        "segment": getattr(e, segment_key),
                        "group": "Control" if e in control_events else "Variant",
                    }
                    for e in events
                ]
            )

        # Combine events and calculate statistics
        df = events_to_df(control_events + variant_events)
        segments = df["segment"].unique()

        # Create subplots for different visualizations
        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Segment Distribution",
                "Mean Values by Segment",
                "Effect Size by Segment",
                "Sample Size by Segment",
            ),
        )

        # 1. Segment Distribution
        for group in ["Control", "Variant"]:
            segment_counts = df[df["group"] == group]["segment"].value_counts()
            fig.add_trace(
                go.Bar(
                    x=segments,
                    y=[segment_counts.get(s, 0) for s in segments],
                    name=group,
                    text=[f"{segment_counts.get(s, 0):,}" for s in segments],
                    textposition="auto",
                ),
                row=1,
                col=1,
            )

        # 2. Mean Values by Segment
        segment_means = df.groupby(["segment", "group"])["value"].mean().unstack()
        segment_sems = df.groupby(["segment", "group"])["value"].sem().unstack()

        for group in ["Control", "Variant"]:
            fig.add_trace(
                go.Bar(
                    x=segments,
                    y=segment_means[group],
                    name=f"{group} Mean",
                    error_y={
                        "type": "data",
                        "array": segment_sems[group],
                        "visible": True,
                    },
                ),
                row=1,
                col=2,
            )

        # 3. Effect Size by Segment
        effect_sizes = []
        for segment in segments:
            control_vals = df[(df["group"] == "Control") & (df["segment"] == segment)][
                "value"
            ]
            variant_vals = df[(df["group"] == "Variant") & (df["segment"] == segment)][
                "value"
            ]

            if len(control_vals) > 0 and len(variant_vals) > 0:
                effect_size = (variant_vals.mean() - control_vals.mean()) / np.sqrt(
                    (control_vals.var() + variant_vals.var()) / 2
                )
                effect_sizes.append(effect_size)
            else:
                effect_sizes.append(0)

        fig.add_trace(
            go.Bar(
                x=segments,
                y=effect_sizes,
                name="Effect Size",
                text=[f"{es:.2f}" for es in effect_sizes],
                textposition="auto",
            ),
            row=2,
            col=1,
        )

        # Add reference lines for effect size interpretation
        for effect_size, label in [(0.2, "Small"), (0.5, "Medium"), (0.8, "Large")]:
            fig.add_hline(
                y=effect_size,
                line_dash="dash",
                line_color="gray",
                annotation={"text": label},
                row="2",
                col="1",
            )

        # 4. Sample Size Requirements
        min_samples = []
        for segment in segments:
            control_vals = df[(df["group"] == "Control") & (df["segment"] == segment)][
                "value"
            ]
            variant_vals = df[(df["group"] == "Variant") & (df["segment"] == segment)][
                "value"
            ]

            if len(control_vals) > 0 and len(variant_vals) > 0:
                pooled_std = np.sqrt((control_vals.var() + variant_vals.var()) / 2)
                effect = abs(variant_vals.mean() - control_vals.mean()) / pooled_std
                # Calculate minimum sample size for 80% power
                min_n = (
                    int(16 * (1.96 + 0.84) ** 2 / (effect**2))
                    if effect > 0
                    else float("inf")
                )
                min_samples.append(min_n)
            else:
                min_samples.append(0)

        fig.add_trace(
            go.Bar(
                x=segments,
                y=min_samples,
                name="Required Sample Size",
                text=[f"{int(n):,}" if n < float("inf") else "∞" for n in min_samples],
                textposition="auto",
            ),
            row=2,
            col=2,
        )

        # Update layout
        fig.update_layout(
            title=f"Segmentation Analysis by {segment_key}",
            height=800,
            width=1200,
            showlegend=True,
            barmode="group",
        )

        # Update axes labels
        fig.update_xaxes(title_text="Segment", row=2, col=2)
        fig.update_xaxes(title_text="Segment", row=2, col=1)
        fig.update_yaxes(title_text="Count", row=1, col=1)
        fig.update_yaxes(title_text="Mean Value", row=1, col=2)
        fig.update_yaxes(title_text="Effect Size", row=2, col=1)
        fig.update_yaxes(title_text="Required Sample Size", row=2, col=2)

        if save_path:
            fig.write_html(save_path)

        return fig

    def create_segmentation_dashboard(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        segment_keys: List[str],
        save_path: Optional[str] = None,
    ) -> go.Figure:
        """Create a comprehensive segmentation analysis dashboard.

        Args:
            control_events: List of control group events
            variant_events: List of variant group events
            segment_keys: List of keys to segment by
            save_path: Optional path to save the plot
        """
        # Create tabs for each segmentation
        figures = []
        for segment_key in segment_keys:
            fig = self.plot_segmentation_analysis(
                control_events, variant_events, segment_key
            )
            figures.append(fig)

        # Combine all figures into a single HTML file with tabs
        if save_path:
            with open(save_path, "w") as f:
                f.write(
                    "<html><head><title>Segmentation Analysis Dashboard</title></head><body>"
                )
                f.write('<div class="tab">')
                for i, key in enumerate(segment_keys):
                    f.write(
                        f'<button class="tablinks" onclick="openTab(event, \'tab{i}\')">{key}</button>'
                    )
                f.write("</div>")

                for i, fig in enumerate(figures):
                    f.write(f'<div id="tab{i}" class="tabcontent">')
                    f.write(fig.to_html(full_html=False, include_plotlyjs="cdn"))
                    f.write("</div>")

                # Add tab switching JavaScript
                f.write(
                    """
                <style>
                .tab { overflow: hidden; border: 1px solid #ccc; background-color: #f1f1f1; }
                .tab button { background-color: inherit; float: left; border: none; outline: none;
                             cursor: pointer; padding: 14px 16px; transition: 0.3s; }
                .tab button:hover { background-color: #ddd; }
                .tab button.active { background-color: #ccc; }
                .tabcontent { display: none; padding: 6px 12px; border: 1px solid #ccc;
                             border-top: none; }
                </style>
                <script>
                function openTab(evt, tabName) {
                    var i, tabcontent, tablinks;
                    tabcontent = document.getElementsByClassName("tabcontent");
                    for (i = 0; i < tabcontent.length; i++) {
                        tabcontent[i].style.display = "none";
                    }
                    tablinks = document.getElementsByClassName("tablinks");
                    for (i = 0; i < tablinks.length; i++) {
                        tablinks[i].className = tablinks[i].className.replace(" active", "");
                    }
                    document.getElementById(tabName).style.display = "block";
                    evt.currentTarget.className += " active";
                }
                // Open first tab by default
                document.getElementsByClassName("tablinks")[0].click();
                </script>
                """
                )
                f.write("</body></html>")

        return figures[0]  # Return first figure as preview

    def _optimize_data_for_visualization(
        self, df: pd.DataFrame, max_points: int = 10000
    ) -> pd.DataFrame:
        """Optimize large datasets for visualization.

        For large datasets, this method will:
        1. Sample data if above max_points threshold
        2. Pre-aggregate data where possible
        3. Optimize memory usage

        Args:
            df: Input DataFrame
            max_points: Maximum number of points to plot

        Returns:
            Optimized DataFrame
        """
        if len(df) <= max_points:
            return df

        # Memory optimization
        for col in df.select_dtypes(include=["float64"]).columns:
            if df[col].min() >= -32768 and df[col].max() <= 32767:
                df[col] = df[col].astype("float32")

        # Smart sampling based on distribution
        if len(df) > max_points:
            # Preserve important points (extremes, outliers)
            q1, q3 = df["value"].quantile([0.25, 0.75])
            iqr = q3 - q1
            outliers = df[
                (df["value"] < (q1 - 1.5 * iqr)) | (df["value"] > (q3 + 1.5 * iqr))
            ]

            # Sample remaining points
            non_outliers = df[
                (df["value"] >= (q1 - 1.5 * iqr)) & (df["value"] <= (q3 + 1.5 * iqr))
            ]
            sample_size = max(max_points - len(outliers), 0)
            sampled = non_outliers.sample(
                n=min(sample_size, len(non_outliers)), random_state=42
            )

            # Combine outliers and sampled points
            df = pd.concat([outliers, sampled]).sort_index()

        return df

    def plot_multi_segment_analysis(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        segment_keys: List[str],
        save_path: Optional[str] = None,
        export_formats: Optional[List[str]] = None,
        max_points: int = 10000,
    ) -> go.Figure:
        """Create multi-dimensional segmentation analysis visualization."""

        def events_to_df(events: List[MetricEvent]) -> pd.DataFrame:
            return pd.DataFrame(
                [
                    {
                        "value": float(e.value),
                        **{key: getattr(e, key) for key in segment_keys},
                        "group": "Control" if e in control_events else "Variant",
                    }
                    for e in events
                ]
            )

        # Combine events and optimize for visualization
        df = events_to_df(control_events + variant_events)
        df = self._optimize_data_for_visualization(df, max_points)

        # Create subplots for different analyses
        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Segment Combinations Distribution",
                "Mean Values by Segment Combination",
                "Effect Size Matrix",
                "Sample Size Requirements",
            ),
        )

        # 1. Segment Combinations Distribution
        segment_combinations = df.groupby(segment_keys + ["group"]).size()
        segment_combinations = segment_combinations.reset_index()
        segment_combinations = segment_combinations.rename(columns={0: "count"})
        pivot_counts = segment_combinations.pivot_table(
            index=segment_keys[:-1],
            columns=segment_keys[-1],
            values="count",
            aggfunc="sum",
        ).fillna(0)

        fig.add_trace(
            go.Heatmap(
                z=pivot_counts.values,
                x=pivot_counts.columns,
                y=[str(idx) for idx in pivot_counts.index],
                colorscale="Viridis",
                text=pivot_counts.values.astype(int),
                texttemplate="%{text}",
                textfont={"size": 10},
                name="Distribution",
            ),
            row=1,
            col=1,
        )

        # 2. Mean Values Matrix
        mean_by_segment = (
            df.groupby(segment_keys + ["group"])["value"].mean().reset_index()
        )
        pivot_means = mean_by_segment.pivot_table(
            index=segment_keys[:-1], columns=segment_keys[-1], values="value"
        )

        fig.add_trace(
            go.Heatmap(
                z=pivot_means.values,
                x=pivot_means.columns,
                y=[str(idx) for idx in pivot_means.index],
                colorscale="RdBu",
                text=np.round(pivot_means.values, 2),
                texttemplate="%{text}",
                textfont={"size": 10},
                name="Mean Values",
            ),
            row=1,
            col=2,
        )

        # 3. Effect Size Matrix
        effect_sizes = []
        segment_combos = []

        for combo in pivot_means.index:
            row_data = df.copy()  # Create a copy to avoid modifying original
            for key, value in zip(segment_keys[:-1], combo):
                row_data = row_data[row_data[key] == value]

            control_vals = row_data[row_data["group"] == "Control"]["value"].to_numpy()
            variant_vals = row_data[row_data["group"] == "Variant"]["value"].to_numpy()

            if len(control_vals) > 0 and len(variant_vals) > 0:
                effect_size = (np.mean(variant_vals) - np.mean(control_vals)) / np.sqrt(
                    (np.var(control_vals) + np.var(variant_vals)) / 2.0
                )
            else:
                effect_size = 0

            effect_sizes.append(effect_size)
            segment_combos.append(str(combo))

        fig.add_trace(
            go.Bar(
                x=segment_combos,
                y=effect_sizes,
                name="Effect Size",
                text=[f"{es:.2f}" for es in effect_sizes],
                textposition="auto",
            ),
            row=2,
            col=1,
        )

        # Add reference lines for effect size interpretation
        for effect_size, label in [(0.2, "Small"), (0.5, "Medium"), (0.8, "Large")]:
            fig.add_hline(
                y=effect_size,
                line_dash="dash",
                line_color="gray",
                annotation={"text": label},
                row="2",
                col="1",
            )

        # 4. Sample Size Requirements
        min_samples = []

        for combo in pivot_means.index:
            row_data = df.copy()  # Create a copy to avoid modifying original
            for key, value in zip(segment_keys[:-1], combo):
                row_data = row_data[row_data[key] == value]

            control_vals = row_data[row_data["group"] == "Control"]["value"].to_numpy()
            variant_vals = row_data[row_data["group"] == "Variant"]["value"].to_numpy()

            if len(control_vals) > 0 and len(variant_vals) > 0:
                pooled_std = np.sqrt(
                    (np.var(control_vals) + np.var(variant_vals)) / 2.0
                )
                effect = abs(np.mean(variant_vals) - np.mean(control_vals)) / pooled_std
                min_n = (
                    int(16 * (1.96 + 0.84) ** 2 / (effect**2))
                    if effect > 0
                    else float("inf")
                )
            else:
                min_n = 0

            min_samples.append(min_n)

        fig.add_trace(
            go.Bar(
                x=segment_combos,
                y=min_samples,
                name="Required Sample Size",
                text=[f"{int(n):,}" if n < float("inf") else "∞" for n in min_samples],
                textposition="auto",
            ),
            row=2,
            col=2,
        )

        # Update layout
        fig.update_layout(
            title=f"Multi-dimensional Segmentation Analysis ({', '.join(segment_keys)})",
            height=1000,
            width=1400,
            showlegend=True,
            barmode="group",
        )

        # Update axes labels
        fig.update_xaxes(title_text=f"Segments ({segment_keys[-1]})", row=1, col=1)
        fig.update_xaxes(title_text=f"Segments ({segment_keys[-1]})", row=1, col=2)
        fig.update_xaxes(title_text="Segment Combinations", row=2, col=1)
        fig.update_xaxes(title_text="Segment Combinations", row=2, col=2)
        fig.update_yaxes(
            title_text=f"Segments ({', '.join(segment_keys[:-1])})", row=1, col=1
        )
        fig.update_yaxes(
            title_text=f"Segments ({', '.join(segment_keys[:-1])})", row=1, col=2
        )
        fig.update_yaxes(title_text="Effect Size", row=2, col=1)
        fig.update_yaxes(title_text="Required Sample Size", row=2, col=2)

        if save_path:
            if export_formats:
                self.export_analysis(
                    fig, save_path.replace(".html", ""), export_formats
                )
            else:
                fig.write_html(str(save_path))

        return fig

    def plot_segment_heatmap(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        segment_keys: List[str],
        metric_type: str = "effect_size",
        save_path: Optional[str] = None,
        export_formats: Optional[List[str]] = None,
        max_points: int = 10000,
    ) -> go.Figure:
        """Create interactive heatmap visualization for segment combinations."""

        def events_to_df(events: List[MetricEvent]):
            data: List[Dict[str, Union[float, str]]] = []
            for event in events:
                row: Dict[str, Union[float, str]] = {"value": float(event.value)}
                for key in segment_keys:
                    row[key] = str(event.attributes.get(key, "Unknown"))
                data.append(row)
            return pd.DataFrame(data)

        # Convert events to DataFrames and optimize
        control_df = events_to_df(control_events)
        variant_df = events_to_df(variant_events)

        control_df = self._optimize_data_for_visualization(control_df, max_points)
        variant_df = self._optimize_data_for_visualization(variant_df, max_points)

        # Create segment combinations
        segments: List[Dict[str, Any]] = []
        for i, key1 in enumerate(segment_keys[:-1]):
            for key2 in segment_keys[i + 1 :]:
                # Calculate metrics for each combination
                metrics: List[float] = []
                key1_vals = sorted([str(x) for x in control_df[key1].unique()])
                key2_vals = sorted([str(x) for x in control_df[key2].unique()])

                for val1 in key1_vals:
                    for val2 in key2_vals:
                        # Get values for this segment combination
                        c_mask = (control_df[key1] == val1) & (control_df[key2] == val2)
                        v_mask = (variant_df[key1] == val1) & (variant_df[key2] == val2)

                        c_values = np.array(
                            control_df[c_mask]["value"].to_numpy(), dtype=np.float64
                        )
                        v_values = np.array(
                            variant_df[v_mask]["value"].to_numpy(), dtype=np.float64
                        )

                        if len(c_values) < 30 or len(v_values) < 30:
                            metrics.append(float("nan"))
                            continue

                        if metric_type == "effect_size":
                            # Calculate Cohen's d
                            c_var = float(np.var(c_values, ddof=1))
                            v_var = float(np.var(v_values, ddof=1))
                            pooled_std = float(
                                np.sqrt(
                                    (
                                        (len(c_values) - 1) * c_var
                                        + (len(v_values) - 1) * v_var
                                    )
                                    / (len(c_values) + len(v_values) - 2)
                                )
                            )
                            c_mean = float(np.mean(c_values))
                            v_mean = float(np.mean(v_values))
                            metric = float(abs(v_mean - c_mean) / pooled_std)
                        elif metric_type == "p_value":
                            # Calculate p-value
                            from scipy import stats

                            _, p_value = stats.ttest_ind(c_values, v_values)
                            metric = float(p_value)
                        else:  # lift
                            # Calculate relative improvement
                            c_mean = float(np.mean(c_values))
                            v_mean = float(np.mean(v_values))
                            metric = float((v_mean - c_mean) / c_mean * 100)

                        metrics.append(metric)

                segments.append(
                    {
                        "key1": str(key1),
                        "key2": str(key2),
                        "metrics": metrics,
                        "key1_vals": key1_vals,
                        "key2_vals": key2_vals,
                    }
                )

        # Create heatmap
        fig = go.Figure()
        traces: List[go.Heatmap] = []

        for segment in segments:
            # Create heatmap for each segment combination
            z_matrix = np.array(segment["metrics"], dtype=np.float64)
            z_matrix = z_matrix.reshape(
                len(segment["key1_vals"]), len(segment["key2_vals"])
            )

            # Add heatmap trace
            heatmap = go.Heatmap(
                z=z_matrix.tolist(),  # Convert to list for JSON serialization
                x=[str(x) for x in segment["key2_vals"]],  # Ensure strings
                y=[str(x) for x in segment["key1_vals"]],  # Ensure strings
                colorscale="RdBu",
                reversescale=True if metric_type == "p_value" else False,
                name=f"{segment['key1']} vs {segment['key2']}",
                visible=False,
                hoverongaps=False,
                hovertemplate=(
                    f"{segment['key1']}: %{{y}}<br>"
                    + f"{segment['key2']}: %{{x}}<br>"
                    + f"{metric_type}: %{{z:.3f}}"
                ),
            )
            traces.append(heatmap)

        # Add all traces to figure
        for trace in traces:
            fig.add_trace(trace)

        # Make first heatmap visible if there are any traces
        if traces:
            traces[0].visible = True

        # Add dropdown menu
        buttons = []
        for i in range(len(traces)):
            visible = [i == j for j in range(len(traces))]
            segment = segments[i]
            buttons.append(
                {
                    "args": [
                        {"visible": visible},
                        {"title": f"{segment['key1']} vs {segment['key2']}"},
                    ],
                    "label": f"{segment['key1']} vs {segment['key2']}",
                    "method": "update",
                }
            )

        fig.update_layout(
            updatemenus=[
                {
                    "buttons": buttons,
                    "direction": "down",
                    "showactive": True,
                    "x": 0.1,
                    "y": 1.15,
                }
            ],
            title=f"Segment Combination Analysis ({metric_type})",
            height=600,
        )

        if save_path:
            if export_formats:
                self.export_analysis(
                    fig, save_path.replace(".html", ""), export_formats
                )
            else:
                fig.write_html(str(save_path))

        return fig

    def export_analysis(
        self, fig: go.Figure, base_path: str, formats: Optional[List[str]] = None
    ) -> Dict[str, str]:
        """Export visualization in multiple formats.

        Args:
            fig: The plotly figure to export
            base_path: Base path for saving files (without extension)
            formats: List of formats to export (default: ['html', 'png', 'json'])

        Returns:
            Dictionary mapping format to saved file path
        """
        if formats is None:
            formats = ["html", "png", "json"]

        results: Dict[str, str] = {}

        for fmt in formats:
            output_path = f"{base_path}.{fmt}"

            if fmt == "html":
                fig.write_html(output_path)
            elif fmt == "png":
                fig.write_image(output_path)
            elif fmt == "json":
                fig.write_json(output_path)
            elif fmt == "pdf":
                fig.write_image(output_path)
            elif fmt == "svg":
                fig.write_image(output_path)

            results[fmt] = output_path

        return results

    def create_analysis_dashboard(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        analyzer: ExperimentAnalyzer,
        metric_name: str,
        save_path: Optional[str] = None,
    ):
        """Create a comprehensive analysis dashboard combining multiple visualizations.

        Args:
            control_events: List of control group events
            variant_events: List of variant group events
            analyzer: ExperimentAnalyzer instance for statistical calculations
            metric_name: Name of the metric to analyze
            save_path: Optional path to save the dashboard

        Returns:
            A Plotly figure containing the combined dashboard
        """
        # Create analysis result
        result = analyzer.analyze_metric(control_events, variant_events, metric_name)

        # Create figure with subplots
        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Value Distributions",
                "Confidence Interval",
                "Effect Size Analysis",
                "Power Analysis",
            ),
            vertical_spacing=0.15,
            horizontal_spacing=0.1,
        )

        # Add distribution plot
        control_values = np.array([e.value for e in control_events])
        variant_values = np.array([e.value for e in variant_events])

        fig.add_trace(
            go.Histogram(
                x=control_values,
                name="Control",
                opacity=0.75,
                nbinsx=30,
                histnorm="probability",
            ),
            row=1,
            col=1,
        )
        fig.add_trace(
            go.Histogram(
                x=variant_values,
                name="Variant",
                opacity=0.75,
                nbinsx=30,
                histnorm="probability",
            ),
            row=1,
            col=1,
        )

        # Add confidence interval plot
        diff = result.absolute_difference
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
                    f"Difference: {diff:.2f}<br>CI: [{ci_lower:.2f}, {ci_upper:.2f}]"
                ],
                hoverinfo="text",
            ),
            row=1,
            col=2,
        )
        fig.add_vline(x=0, line_dash="dash", line_color="gray", row=1, col=2)

        # Add effect size visualization
        thresholds = {"Small": 0.2, "Medium": 0.5, "Large": 0.8}
        for _label, value in thresholds.items():
            fig.add_vline(x=value, line_dash="dash", line_color="gray", row=2, col=1)
            fig.add_vline(x=-value, line_dash="dash", line_color="gray", row=2, col=1)

        fig.add_trace(
            go.Scatter(
                x=[result.effect_size],
                y=[1],
                mode="markers",
                marker={"color": "black", "size": 12},
                name="Effect Size",
                text=[f"Effect Size: {result.effect_size:.3f}"],
                hoverinfo="text",
            ),
            row=2,
            col=1,
        )

        # Add power curve
        sample_sizes = list(range(20, 500, 20))
        powers = []
        for n in sample_sizes:
            power = analyzer._calculate_power(
                control_values[:n] if len(control_values) >= n else control_values,
                variant_values[:n] if len(variant_values) >= n else variant_values,
                result.effect_size,
            )
            powers.append(power)

        fig.add_trace(
            go.Scatter(
                x=sample_sizes,
                y=powers,
                mode="lines",
                name="Power Curve",
                hovertemplate="Sample Size: %{x}<br>Power: %{y:.3f}",
            ),
            row=2,
            col=2,
        )
        fig.add_hline(y=0.8, line_dash="dash", line_color="gray", row=2, col=2)

        # Update layout
        fig.update_layout(
            title=f"Analysis Dashboard for {metric_name}",
            height=800,
            showlegend=True,
            hovermode="closest",
        )

        # Update axes labels
        fig.update_xaxes(title_text="Value", row=1, col=1)
        fig.update_xaxes(title_text="Difference", row=1, col=2)
        fig.update_xaxes(title_text="Effect Size", row=2, col=1)
        fig.update_xaxes(title_text="Sample Size", row=2, col=2)

        fig.update_yaxes(title_text="Probability", row=1, col=1)
        fig.update_yaxes(showticklabels=False, row=1, col=2)
        fig.update_yaxes(showticklabels=False, row=2, col=1)
        fig.update_yaxes(title_text="Statistical Power", row=2, col=2)

        if save_path:
            fig.write_html(save_path)

        return fig
