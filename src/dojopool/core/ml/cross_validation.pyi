import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from sklearn.metrics import (
    explained_variance_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import KFold, learning_curve

from .game_predictor import GamePredictor
from .model_monitor import ModelMonitor

class CrossValidation:
    def __init__(self, model: Any, n_splits: int = 5) -> None: ...
    def perform_cv(self, X: np.ndarray, y: np.ndarray) -> Dict[str, List[float]]: ...
    def plot_learning_curve(
        self, X: np.ndarray, y: np.ndarray, cv: Optional[int] = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]: ...
    def save_results(
        self, results: Dict[str, List[float]], save_path: Optional[Path] = None
    ) -> None: ...
    def load_results(self, load_path: Path) -> Dict[str, List[float]]: ...
    def get_best_fold(self, results: Dict[str, List[float]]) -> Tuple[int, float]: ...
