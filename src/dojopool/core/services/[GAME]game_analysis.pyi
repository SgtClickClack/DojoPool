from dataclasses import dataclass
from typing import Dict, List

import numpy as np
import tensorflow as tf
from scipy.stats import gaussian_kde
from src.core.config import AI_CONFIG
from src.core.services.shot_analysis import ShotAnalyzer
from src.extensions import cache
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.models import load_model

class GameMetrics:
    pass

class PlayerStyle:
    pass

class GameAnalyzer:
    pass
