from typing import Any, Literal, Optional, Union

import matplotlib.pyplot as plt
import plotly.graph_objects as go
import seaborn as sns

from .analysis import AnalysisResult

StyleType = Literal["darkgrid", "whitegrid", "dark", "white", "ticks"]

class ExperimentVisualizer:
    def __init__(self, style: StyleType = "whitegrid") -> None: ...
    def plot_metric_distribution(
        self, result: AnalysisResult, metric: str
    ) -> plt.Figure: ...
    def plot_time_series(self, result: AnalysisResult, metric: str) -> plt.Figure: ...
    def plot_correlation_matrix(self, result: AnalysisResult) -> plt.Figure: ...
    def plot_interactive_dashboard(self, result: AnalysisResult) -> go.Figure: ...
