from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from .analysis import AnalysisResult, ExperimentAnalyzer
from .interactive_viz import InteractiveVisualizer
from .metrics import MetricEvent

class ResultsDashboard:
    def __init__(self, analyzer: ExperimentAnalyzer) -> None: ...
    def update_data(
        self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None
    ) -> None: ...
    def create_dashboard(self) -> go.Figure: ...
    def get_metrics_summary(self) -> Dict[str, Any]: ...
