from multiprocessing import Pool
from multiprocessing import Pool
"""Enhanced visualization system providing advanced plotting and interactive visualization capabilities."""

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Optional

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import seaborn as sns
from plotly.subplots import make_subplots

from ..ml.model_monitor import ModelMonitor
from ..ml.model_retraining import ModelRetrainer
from ..ml.model_versioning import ModelVersion


class EnhancedVisualizer:
    """Advanced visualization system with interactive capabilities."""

    def __init__(self, base_path: str):
        """Initialize the enhanced visualization system.

        Args:
            base_path: Base path for storing visualizations
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.plots_dir = self.base_path / "plots"
        self.plots_dir.mkdir(exist_ok=True)
        self.logger = logging.getLogger(__name__)

        # Set style configurations
        plt.style.use("seaborn")
        sns.set_palette("husl")

    def create_performance_dashboard(
        self,
        monitor: ModelMonitor,
        version_manager: ModelVersion,
        retrainer: ModelRetrainer,
        time_window: timedelta = timedelta(days=30),
        save_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create comprehensive performance dashboard.

        Args:
            monitor: ModelMonitor instance
            version_manager: ModelVersion instance
            retrainer: ModelRetrainer instance
            time_window: Time window for analysis
            save_path: Optional path to save dashboard

        Returns:
            dict: Dashboard data and plot paths
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        plots = {}

        # Performance Overview
        fig = self._create_performance_overview(monitor, time_window)
        plot_path = self.plots_dir / f"performance_overview_{timestamp}.html"
        fig.write_html(str(plot_path))
        plots["performance_overview"] = str(plot_path)

        # Model Version Analysis
        fig = self._create_version_analysis(version_manager)
        plot_path = self.plots_dir / f"version_analysis_{timestamp}.html"
        fig.write_html(str(plot_path))
        plots["version_analysis"] = str(plot_path)

        # Training History Analysis
        fig = self._create_training_analysis(retrainer)
        plot_path = self.plots_dir / f"training_analysis_{timestamp}.html"
        fig.write_html(str(plot_path))
        plots["training_analysis"] = str(plot_path)

        # Resource Usage Analysis
        fig = self._create_resource_analysis(monitor)
        plot_path = self.plots_dir / f"resource_analysis_{timestamp}.html"
        fig.write_html(str(plot_path))
        plots["resource_analysis"] = str(plot_path)

        if save_path:
            dashboard_data = {
                "timestamp": timestamp,
                "plots": plots,
                "summary": self._generate_summary(monitor, version_manager, retrainer),
            }
            with open(save_path, "w") as f:
                json.dump(dashboard_data, f, indent=2)

        return plots

    def _create_performance_overview(
        self, monitor: ModelMonitor, time_window: timedelta
    ) -> go.Figure:
        """Create performance overview visualization."""
        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Accuracy Trends",
                "Latency Distribution",
                "Error Rate Analysis",
                "Prediction Volume",
            ),
        )

        # Get performance data
        metrics = monitor.get_recent_metrics(time_window)

        # Accuracy Trends
        for model_type in ["shot", "success", "position"]:
            accuracy_data = [m for m in metrics if m["model_type"] == model_type]
            if accuracy_data:
                df = pd.DataFrame(accuracy_data)
                fig.add_trace(
                    go.Scatter(
                        x=df["timestamp"],
                        y=df["accuracy"],
                        name=f"{model_type.capitalize()} Model",
                        mode="lines+markers",
                    ),
                    row=1,
                    col=1,
                )

        # Latency Distribution
        for model_type in ["shot", "success", "position"]:
            latency_data = [
                m["latency"] for m in metrics if m["model_type"] == model_type
            ]
            if latency_data:
                fig.add_trace(
                    go.Histogram(
                        x=latency_data,
                        name=f"{model_type.capitalize()} Model",
                        nbinsx=30,
                        opacity=0.7,
                    ),
                    row=1,
                    col=2,
                )

        # Error Rate Analysis
        for model_type in ["shot", "success", "position"]:
            error_data = [m for m in metrics if m["model_type"] == model_type]
            if error_data:
                df = pd.DataFrame(error_data)
                fig.add_trace(
                    go.Scatter(
                        x=df["timestamp"],
                        y=1 - df["accuracy"],
                        name=f"{model_type.capitalize()} Model",
                        mode="lines+markers",
                    ),
                    row=2,
                    col=1,
                )

        # Prediction Volume
        for model_type in ["shot", "success", "position"]:
            volume_data = [m for m in metrics if m["model_type"] == model_type]
            if volume_data:
                df = pd.DataFrame(volume_data)
                fig.add_trace(
                    go.Scatter(
                        x=df["timestamp"],
                        y=df["prediction_count"],
                        name=f"{model_type.capitalize()} Model",
                        mode="lines+markers",
                    ),
                    row=2,
                    col=2,
                )

        # Update layout
        fig.update_layout(
            height=800,
            width=1200,
            title_text="Model Performance Overview",
            showlegend=True,
        )

        return fig

    def _create_version_analysis(self, version_manager: ModelVersion) -> go.Figure:
        """Create version analysis visualization."""
        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Version Performance Comparison",
                "Version Age Distribution",
                "Usage Statistics",
                "Performance Evolution",
            ),
        )

        # Get version data
        versions = version_manager.list_versions()

        # Version Performance Comparison
        performance_data = {"version": [], "accuracy": [], "model_type": []}
        for v in versions:
            performance_data["version"].append(v["version_id"])
            performance_data["accuracy"].append(v.get("metrics", {}).get("accuracy", 0))
            performance_data["model_type"].append(v["model_type"])

        df = pd.DataFrame(performance_data)
        for model_type in df["model_type"].unique():
            model_df = df[df["model_type"] == model_type]
            fig.add_trace(
                go.Bar(
                    x=model_df["version"],
                    y=model_df["accuracy"],
                    name=f"{model_type.capitalize()} Model",
                ),
                row=1,
                col=1,
            )

        # Version Age Distribution
        age_data = {"age_days": [], "model_type": []}
        for v in versions:
            created = datetime.fromisoformat(v["created_at"])
            age = (datetime.utcnow() - created).days
            age_data["age_days"].append(age)
            age_data["model_type"].append(v["model_type"])

        df = pd.DataFrame(age_data)
        for model_type in df["model_type"].unique():
            model_df = df[df["model_type"] == model_type]
            fig.add_trace(
                go.Histogram(
                    x=model_df["age_days"],
                    name=f"{model_type.capitalize()} Model",
                    nbinsx=20,
                    opacity=0.7,
                ),
                row=1,
                col=2,
            )

        # Usage Statistics
        usage_data = {"version": [], "usage_count": [], "model_type": []}
        for v in versions:
            usage_data["version"].append(v["version_id"])
            usage_data["usage_count"].append(v.get("usage_count", 0))
            usage_data["model_type"].append(v["model_type"])

        df = pd.DataFrame(usage_data)
        for model_type in df["model_type"].unique():
            model_df = df[df["model_type"] == model_type]
            fig.add_trace(
                go.Bar(
                    x=model_df["version"],
                    y=model_df["usage_count"],
                    name=f"{model_type.capitalize()} Model",
                ),
                row=2,
                col=1,
            )

        # Performance Evolution
        evolution_data = {"version": [], "performance_delta": [], "model_type": []}
        for model_type in {v["model_type"] for v in versions}:
            type_versions = sorted(
                [v for v in versions if v["model_type"] == model_type],
                key=lambda x: x["created_at"],
            )
            for i in range(1, len(type_versions)):
                curr_perf = type_versions[i].get("metrics", {}).get("accuracy", 0)
                prev_perf = type_versions[i - 1].get("metrics", {}).get("accuracy", 0)
                evolution_data["version"].append(type_versions[i]["version_id"])
                evolution_data["performance_delta"].append(curr_perf - prev_perf)
                evolution_data["model_type"].append(model_type)

        df = pd.DataFrame(evolution_data)
        for model_type in df["model_type"].unique():
            model_df = df[df["model_type"] == model_type]
            fig.add_trace(
                go.Scatter(
                    x=model_df["version"],
                    y=model_df["performance_delta"],
                    name=f"{model_type.capitalize()} Model",
                    mode="lines+markers",
                ),
                row=2,
                col=2,
            )

        # Update layout
        fig.update_layout(
            height=800, width=1200, title_text="Model Version Analysis", showlegend=True
        )

        return fig

    def _create_training_analysis(self, retrainer: ModelRetrainer) -> go.Figure:
        """Create training analysis visualization."""
        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Training Duration Trends",
                "Performance Improvement",
                "Training Frequency",
                "Resource Usage",
            ),
        )

        # Get training history
        history = retrainer.get_training_history()

        # Training Duration Trends
        duration_data = {"timestamp": [], "duration": [], "model_type": []}
        for entry in history:
            duration_data["timestamp"].append(entry["timestamp"])
            duration_data["duration"].append(entry["duration"])
            duration_data["model_type"].append(entry["model_type"])

        df = pd.DataFrame(duration_data)
        for model_type in df["model_type"].unique():
            model_df = df[df["model_type"] == model_type]
            fig.add_trace(
                go.Scatter(
                    x=model_df["timestamp"],
                    y=model_df["duration"],
                    name=f"{model_type.capitalize()} Model",
                    mode="lines+markers",
                ),
                row=1,
                col=1,
            )

        # Performance Improvement
        improvement_data = {"timestamp": [], "improvement": [], "model_type": []}
        for entry in history:
            if "old_metrics" in entry and "new_metrics" in entry:
                old_perf = entry["old_metrics"].get("accuracy", 0)
                new_perf = entry["new_metrics"].get("accuracy", 0)
                improvement_data["timestamp"].append(entry["timestamp"])
                improvement_data["improvement"].append(new_perf - old_perf)
                improvement_data["model_type"].append(entry["model_type"])

        df = pd.DataFrame(improvement_data)
        for model_type in df["model_type"].unique():
            model_df = df[df["model_type"] == model_type]
            fig.add_trace(
                go.Scatter(
                    x=model_df["timestamp"],
                    y=model_df["improvement"],
                    name=f"{model_type.capitalize()} Model",
                    mode="lines+markers",
                ),
                row=1,
                col=2,
            )

        # Training Frequency
        frequency_data = {"month": [], "count": [], "model_type": []}
        for entry in history:
            month = datetime.fromisoformat(entry["timestamp"]).strftime("%Y-%m")
            frequency_data["month"].append(month)
            frequency_data["count"].append(1)
            frequency_data["model_type"].append(entry["model_type"])

        df = pd.DataFrame(frequency_data)
        df = df.groupby(["month", "model_type"])["count"].sum().reset_index()
        for model_type in df["model_type"].unique():
            model_df = df[df["model_type"] == model_type]
            fig.add_trace(
                go.Bar(
                    x=model_df["month"],
                    y=model_df["count"],
                    name=f"{model_type.capitalize()} Model",
                ),
                row=2,
                col=1,
            )

        # Resource Usage
        resource_data = {"timestamp": [], "memory_usage": [], "model_type": []}
        for entry in history:
            if "resource_usage" in entry:
                resource_data["timestamp"].append(entry["timestamp"])
                resource_data["memory_usage"].append(
                    entry["resource_usage"].get("memory_mb", 0)
                )
                resource_data["model_type"].append(entry["model_type"])

        df = pd.DataFrame(resource_data)
        for model_type in df["model_type"].unique():
            model_df = df[df["model_type"] == model_type]
            fig.add_trace(
                go.Scatter(
                    x=model_df["timestamp"],
                    y=model_df["memory_usage"],
                    name=f"{model_type.capitalize()} Model",
                    mode="lines+markers",
                ),
                row=2,
                col=2,
            )

        # Update layout
        fig.update_layout(
            height=800,
            width=1200,
            title_text="Training Analysis Dashboard",
            showlegend=True,
        )

        return fig

    def _create_resource_analysis(self, monitor: ModelMonitor) -> go.Figure:
        """Create resource usage analysis visualization."""
        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Memory Usage Trends",
                "CPU Utilization",
                "Prediction Latency Distribution",
                "Resource Efficiency",
            ),
        )

        # Get resource metrics
        metrics = monitor.get_resource_metrics()

        # Memory Usage Trends
        memory_data = {"timestamp": [], "memory_usage": [], "model_type": []}
        for m in metrics:
            memory_data["timestamp"].append(m["timestamp"])
            memory_data["memory_usage"].append(m.get("memory_mb", 0))
            memory_data["model_type"].append(m["model_type"])

        df = pd.DataFrame(memory_data)
        for model_type in df["model_type"].unique():
            model_df = df[df["model_type"] == model_type]
            fig.add_trace(
                go.Scatter(
                    x=model_df["timestamp"],
                    y=model_df["memory_usage"],
                    name=f"{model_type.capitalize()} Model",
                    mode="lines+markers",
                ),
                row=1,
                col=1,
            )

        # CPU Utilization
        cpu_data = {"timestamp": [], "cpu_usage": [], "model_type": []}
        for m in metrics:
            cpu_data["timestamp"].append(m["timestamp"])
            cpu_data["cpu_usage"].append(m.get("cpu_percent", 0))
            cpu_data["model_type"].append(m["model_type"])

        df = pd.DataFrame(cpu_data)
        for model_type in df["model_type"].unique():
            model_df = df[df["model_type"] == model_type]
            fig.add_trace(
                go.Scatter(
                    x=model_df["timestamp"],
                    y=model_df["cpu_usage"],
                    name=f"{model_type.capitalize()} Model",
                    mode="lines+markers",
                ),
                row=1,
                col=2,
            )

        # Prediction Latency Distribution
        latency_data = {"latency": [], "model_type": []}
        for m in metrics:
            if "prediction_latencies" in m:
                latency_data["latency"].extend(m["prediction_latencies"])
                latency_data["model_type"].extend(
                    [m["model_type"]] * len(m["prediction_latencies"])
                )

        df = pd.DataFrame(latency_data)
        for model_type in df["model_type"].unique():
            model_df = df[df["model_type"] == model_type]
            fig.add_trace(
                go.Histogram(
                    x=model_df["latency"],
                    name=f"{model_type.capitalize()} Model",
                    nbinsx=30,
                    opacity=0.7,
                ),
                row=2,
                col=1,
            )

        # Resource Efficiency
        efficiency_data = {"timestamp": [], "efficiency_score": [], "model_type": []}
        for m in metrics:
            if "accuracy" in m and "cpu_percent" in m:
                efficiency = m["accuracy"] / (m["cpu_percent"] + 1)  # Avoid div by 0
                efficiency_data["timestamp"].append(m["timestamp"])
                efficiency_data["efficiency_score"].append(efficiency)
                efficiency_data["model_type"].append(m["model_type"])

        df = pd.DataFrame(efficiency_data)
        for model_type in df["model_type"].unique():
            model_df = df[df["model_type"] == model_type]
            fig.add_trace(
                go.Scatter(
                    x=model_df["timestamp"],
                    y=model_df["efficiency_score"],
                    name=f"{model_type.capitalize()} Model",
                    mode="lines+markers",
                ),
                row=2,
                col=2,
            )

        # Update layout
        fig.update_layout(
            height=800,
            width=1200,
            title_text="Resource Usage Analysis",
            showlegend=True,
        )

        return fig

    def _generate_summary(
        self,
        monitor: ModelMonitor,
        version_manager: ModelVersion,
        retrainer: ModelRetrainer,
    ):
        """Generate summary statistics."""
        summary = {"performance": {}, "versions": {}, "training": {}, "resources": {}}

        # Performance summary
        metrics = monitor.get_recent_metrics(timedelta(days=7))
        for model_type in ["shot", "success", "position"]:
            type_metrics = [m for m in metrics if m["model_type"] == model_type]
            if type_metrics:
                summary["performance"][model_type] = {
                    "avg_accuracy": np.mean([m["accuracy"] for m in type_metrics]),
                    "avg_latency": np.mean([m["latency"] for m in type_metrics]),
                    "prediction_count": sum(
                        m["prediction_count"] for m in type_metrics
                    ),
                }

        # Version summary
        versions = version_manager.list_versions()
        for model_type in ["shot", "success", "position"]:
            type_versions = [v for v in versions if v["model_type"] == model_type]
            if type_versions:
                summary["versions"][model_type] = {
                    "total_versions": len(type_versions),
                    "active_versions": len(
                        [v for v in type_versions if v["is_active"]]
                    ),
                    "avg_age_days": np.mean(
                        [
                            (
                                datetime.utcnow()
                                - datetime.fromisoformat(v["created_at"])
                            ).days
                            for v in type_versions
                        ]
                    ),
                }

        # Training summary
        history = retrainer.get_training_history()
        for model_type in ["shot", "success", "position"]:
            type_history = [h for h in history if h["model_type"] == model_type]
            if type_history:
                summary["training"][model_type] = {
                    "total_trainings": len(type_history),
                    "avg_duration": np.mean([h["duration"] for h in type_history]),
                    "avg_improvement": np.mean(
                        [
                            h["new_metrics"].get("accuracy", 0)
                            - h["old_metrics"].get("accuracy", 0)
                            for h in type_history
                            if "old_metrics" in h and "new_metrics" in h
                        ]
                    ),
                }

        # Resource summary
        resource_metrics = monitor.get_resource_metrics()
        for model_type in ["shot", "success", "position"]:
            type_metrics = [
                m for m in resource_metrics if m["model_type"] == model_type
            ]
            if type_metrics:
                summary["resources"][model_type] = {
                    "avg_memory_mb": np.mean(
                        [m.get("memory_mb", 0) for m in type_metrics]
                    ),
                    "avg_cpu_percent": np.mean(
                        [m.get("cpu_percent", 0) for m in type_metrics]
                    ),
                    "avg_latency": np.mean(
                        [
                            np.mean(m["prediction_latencies"])
                            for m in type_metrics
                            if "prediction_latencies" in m
                        ]
                    ),
                }

        return summary
