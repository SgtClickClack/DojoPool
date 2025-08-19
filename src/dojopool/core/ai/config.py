"""AI service configuration."""

from dataclasses import dataclass, field
from typing import Dict, List, Any


@dataclass
class ModelConfig:
    """Configuration for ML models."""

    batch_size: int = 32
    max_samples: int = 1000
    random_state: int = 42
    n_estimators: int = 100


@dataclass
class CacheConfig:
    """Configuration for AI caching."""

    ttl: int = 3600  # 1 hour
    prefix: str = "ai:"
    max_size: int = 1000


@dataclass
class AnalysisConfig:
    """Configuration for game analysis."""

    min_shots_required: int = 5
    pressure_time_threshold: float = 15.0  # seconds
    success_rate_threshold: float = 0.5
    high_foul_threshold: int = 3
    trend_window_size: int = 10


@dataclass
class AIConfig:
    """Main AI service configuration."""

    model: ModelConfig = field(default_factory=ModelConfig)
    cache: CacheConfig = field(default_factory=CacheConfig)
    analysis: AnalysisConfig = field(default_factory=AnalysisConfig)

    feature_weights: Dict[str, float] = field(default_factory=dict)
    difficulty_levels: List[Dict[str, Any]] = field(default_factory=list)

    def __post_init__(self):
        if not self.feature_weights:
            self.feature_weights = {
                "accuracy": 0.3,
                "consistency": 0.2,
                "speed": 0.15,
                "position": 0.2,
                "decision": 0.15,
            }

        if not self.difficulty_levels:
            self.difficulty_levels = [
                {"level": "beginner", "threshold": 0.3},
                {"level": "intermediate", "threshold": 0.6},
                {"level": "advanced", "threshold": 0.8},
                {"level": "expert", "threshold": 1.0},
            ]


# Default configuration instance
default_config = AIConfig()
