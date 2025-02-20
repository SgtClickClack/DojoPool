import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import KFold, cross_val_score, train_test_split

from .model_monitor import ModelMonitor
from .model_retraining import ModelRetrainer
from .model_versioning import ModelVersion

class ModelEvaluator:
    def __init__(self, model_path: Path, monitor: ModelMonitor) -> None: ...
    def evaluate_model(self, X: np.ndarray, y: np.ndarray) -> Dict[str, float]: ...
    def compare_models(
        self, model_a: Any, model_b: Any, X: np.ndarray, y: np.ndarray
    ) -> Dict[str, Any]: ...
    def plot_metrics(self, metrics: Dict[str, float]) -> plt.Figure: ...
    def save_evaluation(
        self, metrics: Dict[str, float], save_path: Optional[Path] = None
    ) -> None: ...
    def load_evaluation(self, load_path: Path) -> Dict[str, float]: ...
    def get_evaluation_history(self) -> List[Dict[str, Any]]: ...
    def validate_metrics(
        self, metrics: Dict[str, float], threshold: float = 0.8
    ) -> bool: ...
    def generate_report(self, metrics: Dict[str, float]) -> str: ...
