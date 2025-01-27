"""
Matchmaking experiment configuration and implementation.
Tests skill-based vs. current matchmaking algorithms.
"""

from typing import List, Optional, Dict
from datetime import datetime
import logging

from ..ab_testing import ABTestManager, Variant, VariantType
from ..metrics import MetricsManager, MetricType

logger = logging.getLogger(__name__)

class MatchmakingExperiment:
    """Manages the matchmaking A/B test experiment."""
    
    def __init__(self, ab_manager: ABTestManager, metrics_manager: MetricsManager):
        """Initialize the matchmaking experiment."""
        self._ab_manager = ab_manager
        self._metrics = metrics_manager
        self._experiment_id: Optional[str] = None
        
    def setup(self) -> str:
        """
        Set up the matchmaking experiment.
        
        Returns:
            str: The experiment ID
        """
        # Define variants
        variants = [
            Variant(
                id="control",
                name="Current Matchmaking",
                type=VariantType.STRING,
                value="current"
            ),
            Variant(
                id="skill_based",
                name="Skill-based Matchmaking",
                type=VariantType.STRING,
                value="skill_based"
            )
        ]
        
        # Create experiment
        self._experiment_id = self._ab_manager.create_experiment(
            name="Matchmaking Algorithm Test",
            description="Testing skill-based vs current matchmaking algorithms",
            variants=variants
        )
        
        # Register metrics
        self._metrics.register_metric(
            name="match_duration",
            type=MetricType.GAUGE,
            description="Duration of matches in minutes"
        )
        
        self._metrics.register_metric(
            name="player_retention",
            type=MetricType.GAUGE,
            description="Number of consecutive matches played"
        )
        
        self._metrics.register_metric(
            name="win_rate_variance",
            type=MetricType.GAUGE,
            description="Variance in win rates between players"
        )
        
        return self._experiment_id
    
    def record_match_metrics(
        self,
        match_id: str,
        duration_minutes: float,
        player_stats: Dict[str, Dict]
    ) -> None:
        """
        Record metrics for a completed match.
        
        Args:
            match_id: Unique identifier for the match
            duration_minutes: Duration of the match in minutes
            player_stats: Dictionary containing player statistics
        """
        if not self._experiment_id:
            logger.error("Experiment not set up")
            return
            
        # Get variant assignment for this match
        variant = self._ab_manager.get_variant(self._experiment_id, match_id)
        if not variant:
            logger.error(f"No variant assigned for match {match_id}")
            return
            
        # Record match duration
        self._metrics.record_metric(
            experiment_id=self._experiment_id,
            variant_id=variant.id,
            name="match_duration",
            value=duration_minutes
        )
        
        # Calculate and record win rate variance
        win_rates = [stats.get("win_rate", 0) for stats in player_stats.values()]
        if win_rates:
            import numpy as np
            variance = float(np.var(win_rates))
            self._metrics.record_metric(
                experiment_id=self._experiment_id,
                variant_id=variant.id,
                name="win_rate_variance",
                value=variance
            )
        
        # Record player retention (consecutive matches)
        for player_id, stats in player_stats.items():
            consecutive_matches = stats.get("consecutive_matches", 1)
            self._metrics.record_metric(
                experiment_id=self._experiment_id,
                variant_id=variant.id,
                name="player_retention",
                value=consecutive_matches
            )
    
    def get_matchmaking_algorithm(self, match_id: str) -> str:
        """
        Get the matchmaking algorithm to use for a match.
        
        Args:
            match_id: Unique identifier for the match
            
        Returns:
            str: The algorithm type to use ('current' or 'skill_based')
        """
        if not self._experiment_id:
            logger.error("Experiment not set up")
            return "current"
            
        variant = self._ab_manager.get_variant(self._experiment_id, match_id)
        if not variant:
            logger.error(f"No variant assigned for match {match_id}")
            return "current"
            
        return variant.value 