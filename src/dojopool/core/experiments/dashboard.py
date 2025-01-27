"""Results dashboard for A/B testing experiments."""

from typing import List, Dict, Optional, Any, Tuple, cast, Union
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from .metrics import MetricEvent, MetricType
from .analysis import ExperimentAnalyzer, AnalysisResult
from .interactive_viz import InteractiveVisualizer

class ResultsDashboard:
    """Dashboard for analyzing and visualizing A/B test results."""
    
    def __init__(self):
        """Initialize the dashboard with analyzer and visualizer."""
        self.analyzer = ExperimentAnalyzer()
        self.visualizer = InteractiveVisualizer()
    
    def _optimize_data(
        self,
        events: List[MetricEvent],
        max_points: int = 10000
    ) -> List[MetricEvent]:
        """Optimize data for visualization by sampling if necessary.
        
        Args:
            events: List of events to optimize
            max_points: Maximum number of points to use for visualization
        """
        if len(events) <= max_points:
            return events
        
        # Use systematic sampling to maintain temporal distribution
        step = len(events) // max_points
        return sorted(events, key=lambda x: x.timestamp)[::step]
    
    def create_summary(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        metric_name: str,
        time_window: Optional[str] = None,
        save_path: Optional[str] = None,
        export_formats: Optional[List[str]] = None,
        max_points: int = 10000
    ) -> go.Figure:
        """Create a summary dashboard with key metrics and visualizations.
        
        Args:
            control_events: List of control group events
            variant_events: List of variant group events
            metric_name: Name of the metric being analyzed
            time_window: Optional time window filter (e.g., "7D" for 7 days)
            save_path: Optional path to save the dashboard
            export_formats: Optional list of formats to export (html, json, png)
            max_points: Maximum number of points to use for visualization
        
        Raises:
            ValueError: If events are empty or time_window format is invalid
            TypeError: If events contain invalid types
            OSError: If there are file system related errors during export
        """
        # Validate input events
        if not control_events or not variant_events:
            raise ValueError("Both control and variant events must be non-empty")
        
        # Validate event types
        if not all(isinstance(e, MetricEvent) for e in control_events + variant_events):
            raise TypeError("All events must be instances of MetricEvent")
        
        # Validate metric consistency
        control_metrics = {e.metric_name for e in control_events}
        variant_metrics = {e.metric_name for e in variant_events}
        if metric_name not in control_metrics or metric_name not in variant_metrics:
            raise ValueError(f"Metric '{metric_name}' not found in both control and variant events")
        
        # Validate time window format
        if time_window:
            if not isinstance(time_window, str) or len(time_window) < 2:
                raise ValueError("time_window must be a string in format '<number><unit>' (e.g., '7D')")
            try:
                value = int(time_window[:-1])
                unit = time_window[-1].upper()
                if unit not in {'D', 'H'}:
                    raise ValueError("time_window unit must be 'D' for days or 'H' for hours")
                if value <= 0:
                    raise ValueError("time_window value must be positive")
            except ValueError as e:
                raise ValueError(f"Invalid time_window format: {str(e)}")
        
        # Validate max_points
        if not isinstance(max_points, int) or max_points <= 0:
            raise ValueError("max_points must be a positive integer")
        
        # Validate export parameters
        if save_path and export_formats:
            supported_formats = {'html', 'json', 'png', 'pdf', 'svg'}
            invalid_formats = set(export_formats) - supported_formats
            if invalid_formats:
                raise ValueError(f"Unsupported export formats: {invalid_formats}")
            
            # Validate save path
            import os
            try:
                save_dir = os.path.dirname(os.path.abspath(save_path))
                os.makedirs(save_dir, exist_ok=True)
            except OSError as e:
                raise OSError(f"Cannot create directory for save_path: {str(e)}")
        
        # Filter events by time window if specified
        if time_window:
            try:
                control_events, variant_events = self._filter_time_window(
                    control_events, variant_events, time_window
                )
                if not control_events or not variant_events:
                    raise ValueError(f"No events found in specified time window: {time_window}")
            except Exception as e:
                raise ValueError(f"Error filtering events by time window: {str(e)}")
        
        # Optimize data for visualization
        viz_control = self._optimize_data(control_events, max_points)
        viz_variant = self._optimize_data(variant_events, max_points)
        
        # Use full dataset for statistical calculations
        result = self.analyzer.analyze_metric(control_events, variant_events, metric_name)
        
        # Create subplot figure
        fig = make_subplots(
            rows=3, cols=2,
            subplot_titles=[
                "Value Distributions",
                "Effect Size & Confidence Interval",
                "Segment Analysis",
                "Time Series Trend",
                "Statistical Summary",
                "Sample Size Analysis"
            ],
            vertical_spacing=0.12,
            horizontal_spacing=0.1,
            specs=[[{}, {}], [{}, {}], [{"type": "table"}, {}]]
        )
        
        # Add distribution plot using optimized data
        dist_fig = self.visualizer.plot_distributions(viz_control, viz_variant)
        for trace in dist_fig.data:
            fig.add_trace(trace, row=1, col=1)
        
        # Add effect size and CI plot
        effect_fig = self.visualizer.plot_effect_size(result)
        ci_fig = self.visualizer.plot_confidence_interval(result)
        for trace in list(effect_fig.data) + list(ci_fig.data):
            fig.add_trace(trace, row=1, col=2)
        
        # Add segment analysis with optimized data
        segments = ['device_type', 'country', 'browser']
        segment_results = {}
        valid_segments = []
        segment_errors = {}  # Dictionary to track errors per segment

        # First validate available segments
        available_segments = set()
        for event in viz_control + viz_variant:
            available_segments.update(event.attributes.keys())

        # Filter to only available segments
        segments = [s for s in segments if s in available_segments]

        if not segments:
            print("Warning: No valid segments found in events")
            fig.add_annotation(
                text="No valid segments available for analysis",
                xref="x3", yref="y3",
                x=0.5, y=0.5,
                showarrow=False,
                row=2, col=1
            )
        else:
            for segment in segments:
                try:
                    # Check if segment has enough data
                    segment_values = {e.attributes.get(segment) for e in viz_control + viz_variant}
                    segment_values.discard(None)
                    if len(segment_values) < 2:
                        segment_errors[segment] = "Insufficient unique values"
                        print(f"Warning: Segment '{segment}' has insufficient unique values")
                        continue
                        
                    # Check minimum group sizes
                    min_events = min(
                        min(len([e for e in viz_control if e.attributes.get(segment) == val]) for val in segment_values),
                        min(len([e for e in viz_variant if e.attributes.get(segment) == val]) for val in segment_values)
                    )
                    if min_events < 30:
                        segment_errors[segment] = "Groups with fewer than 30 events"
                        print(f"Warning: Segment '{segment}' has groups with fewer than 30 events")
                    
                    segment_analysis = self.analyzer.analyze_segments(
                        viz_control, viz_variant, metric_name, segment
                    )
                    if segment_analysis:
                        segment_results.update(segment_analysis)
                        valid_segments.append(segment)
                        
                except Exception as e:
                    segment_errors[segment] = str(e)
                    print(f"Warning: Could not analyze segment '{segment}': {str(e)}")
                    continue

            if valid_segments:
                try:
                    segment_fig = self.visualizer.plot_segment_heatmap(
                        control_events=viz_control,
                        variant_events=viz_variant,
                        segment_keys=valid_segments
                    )
                    for trace in list(segment_fig.data):
                        fig.add_trace(trace, row=2, col=1)
                    
                    # Add segment analysis summary
                    fig.add_annotation(
                        text=f"Analyzed segments: {', '.join(valid_segments)}",
                        xref="x3", yref="y3",
                        x=0.5, y=1.1,
                        showarrow=False,
                        row=2, col=1
                    )
                    
                except Exception as e:
                    error_msg = f"Error creating segment heatmap: {str(e)}"
                    print(f"Warning: {error_msg}")
                    fig.add_annotation(
                        text=f"Segment analysis error:<br>{error_msg}",
                        xref="x3", yref="y3",
                        x=0.5, y=0.5,
                        showarrow=False,
                        row=2, col=1
                    )
            else:
                error_summary = "<br>".join(f"{s}: {e}" for s, e in segment_errors.items())
                fig.add_annotation(
                    text=f"No valid segments for analysis:<br>{error_summary}",
                    xref="x3", yref="y3",
                    x=0.5, y=0.5,
                    showarrow=False,
                    row=2, col=1
                )
        
        # Add time series trend with optimized data
        time_fig = self._create_time_series(viz_control, viz_variant)
        for trace in time_fig.data:
            fig.add_trace(trace, row=2, col=2)
        
        # Add statistical summary table (using full dataset results)
        fig.add_trace(
            self._create_stats_table(result),
            row=3, col=1
        )
        
        # Add sample size analysis
        power_fig = self.visualizer.plot_power_curve(
            analyzer=self.analyzer,
            effect_sizes=[result.effect_size],
            sample_sizes=[min(result.control_count, result.variant_count)]
        )
        for trace in power_fig.data:
            fig.add_trace(trace, row=3, col=2)
        
        # Update layout
        fig.update_layout(
            title=f"Experiment Results Dashboard - {metric_name}",
            showlegend=True,
            height=1200,
            template="plotly_white"
        )
        
        # Handle exports
        if save_path:
            if export_formats:
                self._export_dashboard(fig, save_path, export_formats)
            else:
                fig.write_html(save_path)
        
        return fig
    
    def create_segment_view(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        metric_name: str,
        segment_keys: List[str],
        save_path: Optional[str] = None,
        max_points: int = 10000
    ) -> go.Figure:
        """Create a detailed view of segment-level results.
        
        Args:
            control_events: List of control group events
            variant_events: List of variant group events
            metric_name: Name of the metric being analyzed
            segment_keys: List of segment keys to analyze
            save_path: Optional path to save the visualization
            max_points: Maximum number of points to use for visualization
            
        Returns:
            Plotly figure with segment analysis
            
        Raises:
            ValueError: If events are empty or segment keys are invalid
            TypeError: If events contain invalid types
            OSError: If there are file system related errors during save
        """
        # Validate input events
        if not control_events or not variant_events:
            raise ValueError("Both control and variant events must be non-empty")
        
        # Validate event types
        if not all(isinstance(e, MetricEvent) for e in control_events + variant_events):
            raise TypeError("All events must be instances of MetricEvent")
        
        # Validate metric consistency
        control_metrics = {e.metric_name for e in control_events}
        variant_metrics = {e.metric_name for e in variant_events}
        if metric_name not in control_metrics or metric_name not in variant_metrics:
            raise ValueError(f"Metric '{metric_name}' not found in both control and variant events")
        
        # Validate segment keys
        if not segment_keys:
            raise ValueError("At least one segment key must be provided")
        if not all(isinstance(k, str) for k in segment_keys):
            raise TypeError("All segment keys must be strings")
        
        # Verify segments exist in events
        available_segments = set()
        for event in control_events + variant_events:
            available_segments.update(event.attributes.keys())
        
        invalid_segments = set(segment_keys) - available_segments
        if invalid_segments:
            raise ValueError(f"Invalid segment keys: {invalid_segments}. Available segments: {available_segments}")
        
        # Validate max_points
        if not isinstance(max_points, int) or max_points <= 0:
            raise ValueError("max_points must be a positive integer")
        
        # Validate save path if provided
        if save_path:
            import os
            try:
                save_dir = os.path.dirname(os.path.abspath(save_path))
                os.makedirs(save_dir, exist_ok=True)
            except OSError as e:
                raise OSError(f"Cannot create directory for save_path: {str(e)}")
        
        # Optimize data for visualization
        viz_control = self._optimize_data(control_events, max_points)
        viz_variant = self._optimize_data(variant_events, max_points)
        
        try:
            # Create multi-segment analysis
            fig = self.visualizer.plot_multi_segment_analysis(
                control_events=viz_control,
                variant_events=viz_variant,
                segment_keys=segment_keys,
                save_path=save_path
            )
            
            return fig
        except Exception as e:
            raise ValueError(f"Error creating segment visualization: {str(e)}")
    
    def _filter_time_window(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        window: str
    ) -> Tuple[List[MetricEvent], List[MetricEvent]]:
        """Filter events by time window.
        
        Args:
            control_events: List of control group events
            variant_events: List of variant group events
            window: Time window string in format '<number><unit>' (e.g., '7D' for 7 days)
            
        Returns:
            Tuple of filtered control and variant events
            
        Raises:
            ValueError: If window format is invalid or no events found in window
        """
        # Validate window format
        if not isinstance(window, str) or len(window) < 2:
            raise ValueError("Window must be a string in format '<number><unit>' (e.g., '7D')")
        
        try:
            value = int(window[:-1])
            unit = window[-1].upper()
        except (ValueError, IndexError):
            raise ValueError(f"Invalid window format: {window}")
        
        if value <= 0:
            raise ValueError("Window value must be positive")
        
        if unit == 'D':
            delta = timedelta(days=value)
        elif unit == 'H':
            delta = timedelta(hours=value)
        else:
            raise ValueError(f"Unsupported time window unit: {unit}. Use 'D' for days or 'H' for hours")
        
        cutoff = datetime.now() - delta
        
        filtered_control = [e for e in control_events if e.timestamp >= cutoff]
        filtered_variant = [e for e in variant_events if e.timestamp >= cutoff]
        
        if not filtered_control or not filtered_variant:
            raise ValueError(f"No events found in specified time window: {window}")
        
        return filtered_control, filtered_variant
    
    def _create_stats_table(self, result: AnalysisResult) -> go.Table:
        """Create a table with statistical summary."""
        headers = ["Metric", "Value"]
        cells = [
            ["Sample Size (Control)", str(result.control_count)],
            ["Sample Size (Variant)", str(result.variant_count)],
            ["Mean (Control)", f"{result.control_mean:.4f}"],
            ["Mean (Variant)", f"{result.variant_mean:.4f}"],
            ["Absolute Difference", f"{result.absolute_difference:.4f}"],
            ["Relative Difference", f"{result.relative_difference:.2f}%"],
            ["Effect Size", f"{result.effect_size:.4f}"],
            ["P-value", f"{result.p_value:.4f}"],
            ["Statistical Power", f"{result.statistical_power:.2f}"],
            ["Required Sample Size", str(result.required_sample_size or "N/A")],
            ["Statistically Significant", "Yes" if result.is_significant else "No"]
        ]
        
        return go.Table(
            header=dict(
                values=headers,
                fill_color='paleturquoise',
                align='left'
            ),
            cells=dict(
                values=list(zip(*cells)),
                fill_color='lavender',
                align='left'
            )
        )
    
    def _export_dashboard(
        self,
        fig: go.Figure,
        base_path: str,
        formats: List[str]
    ) -> Dict[str, str]:
        """Export dashboard in multiple formats.
        
        Args:
            fig: Figure to export
            base_path: Base path for export files
            formats: List of formats to export (supported: html, json, png, pdf, svg)
            
        Returns:
            Dictionary mapping format to exported file path
        
        Raises:
            ValueError: If an unsupported format is requested
            OSError: If there are file system related errors
        """
        supported_formats = {'html', 'json', 'png', 'pdf', 'svg'}
        results = {}
        
        # Validate formats
        invalid_formats = set(formats) - supported_formats
        if invalid_formats:
            raise ValueError(f"Unsupported export formats: {invalid_formats}")
        
        for fmt in formats:
            try:
                path = f"{base_path}.{fmt}"
                
                # Ensure directory exists
                import os
                os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
                
                # Export based on format
                if fmt == 'html':
                    fig.write_html(path)
                elif fmt == 'json':
                    fig.write_json(path)
                elif fmt in {'png', 'pdf', 'svg'}:
                    try:
                        fig.write_image(path)
                    except ValueError as e:
                        if "kaleido" in str(e).lower():
                            print(f"Warning: {fmt} export requires kaleido package. Skipping.")
                            continue
                        raise
                
                # Verify file was created
                if not os.path.exists(path):
                    raise OSError(f"Failed to create file: {path}")
                
                results[fmt] = path
                
            except Exception as e:
                print(f"Error exporting as {fmt}: {str(e)}")
                # Continue with other formats
                continue
        
        return results
    
    def _create_time_series(
        self,
        control_events: List[MetricEvent],
        variant_events: List[MetricEvent],
        window: str = "1D"
    ) -> go.Figure:
        """Create time series visualization of metric values."""
        def process_events(events: List[MetricEvent]) -> Tuple[List[datetime], List[float]]:
            # Sort events by timestamp
            sorted_events = sorted(events, key=lambda x: x.timestamp)
            timestamps = [e.timestamp for e in sorted_events]
            values = [e.value for e in sorted_events]
            
            # Calculate rolling average
            if len(values) > 1:
                values = np.convolve(values, np.ones(min(len(values), 7))/7, mode='valid')
                timestamps = timestamps[:len(values)]
            
            return timestamps, list(values)
        
        control_times, control_values = process_events(control_events)
        variant_times, variant_values = process_events(variant_events)
        
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=control_times,
            y=control_values,
            name="Control",
            line=dict(color="blue")
        ))
        
        fig.add_trace(go.Scatter(
            x=variant_times,
            y=variant_values,
            name="Variant",
            line=dict(color="red")
        ))
        
        fig.update_layout(
            xaxis_title="Time",
            yaxis_title="Value (7-day rolling average)",
            showlegend=True
        )
        
        return fig 