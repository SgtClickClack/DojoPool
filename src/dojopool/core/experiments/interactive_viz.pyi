from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
import plotly.figure_factory as ff
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from .analysis import AnalysisResult, ExperimentAnalyzer
from .metrics import MetricEvent

class InteractiveVisualizer:
    def __init__(self, analyzer: ExperimentAnalyzer) -> None: ...
    def create_time_series(
        self,
        metric_name: str,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
    ) -> go.Figure: ...
    def create_distribution(
        self, metric_name: str, metric_type: str = "mean"
    ) -> go.Figure: ...
    def create_correlation_matrix(self, metrics: List[str]) -> go.Figure: ...
    def create_scatter_plot(
        self, x_metric: str, y_metric: str, color_by: Optional[str] = None
    ) -> go.Figure: ...
    def create_box_plot(
        self, metric_name: str, group_by: Optional[str] = None
    ) -> go.Figure: ...
    def create_violin_plot(
        self, metric_name: str, group_by: Optional[str] = None
    ) -> go.Figure: ...
    def create_heatmap(
        self,
        metric_name: str,
        x_group: str,
        y_group: str,
        metric_type: str = "effect_size",
    ) -> go.Figure: ...
