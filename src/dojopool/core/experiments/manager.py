"""
Experiment manager for A/B testing.
Manages experiments, assignments, and metrics collection.
"""

from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass, field
from datetime import datetime
import logging
import json
import hashlib
from .assignment import AssignmentManager, AssignmentStrategy
from .metrics import MetricsCollector, MetricDefinition, MetricType
from .targeting import TimeWindow
from ..monitoring.error_logger import error_logger, ErrorSeverity
from ..monitoring.system_metrics import SystemMetricsCollector

logger = logging.getLogger(__name__)

@dataclass
class Experiment:
    """Represents an A/B test experiment."""
    id: str
    name: str
    description: str = ""
    variants: List[Dict[str, Any]] = field(default_factory=list)
    traffic_percentage: float = 100.0
    is_active: bool = True
    start_date: datetime = field(default_factory=datetime.now)
    end_date: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    assignment_strategy: AssignmentStrategy = AssignmentStrategy.RANDOM
    schedule: Optional[TimeWindow] = None

class ExperimentManager:
    """Manages A/B test experiments."""
    
    def __init__(self):
        self._experiments: Dict[str, Experiment] = {}
        self._assignment_manager = AssignmentManager()
        self._metrics_collector = MetricsCollector()
        self._default_metrics = {"conversion", "engagement", "retention"}

    def _generate_experiment_id(self, name: str) -> str:
        """Generate a unique experiment ID from the name."""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        name_hash = hashlib.md5(name.encode()).hexdigest()[:8]
        return f"{name.lower().replace(' ', '_')}_{timestamp}_{name_hash}"

    def create_experiment(self, name: str, variants: List[str], traffic_percentage: float = 100.0) -> str:
        """Create a new experiment."""
        try:
            # Validate variants and normalize weights
            if not variants:
                error = ValueError("At least one variant must be provided")
                error_logger.log_error(
                    error=error,
                    severity=ErrorSeverity.ERROR,
                    component="experiment_manager"
                )
                raise error
                
            # Create experiment ID and validate
            experiment_id = self._generate_experiment_id(name)
            if experiment_id in self._experiments:
                error = ValueError(f"Experiment {name} already exists")
                error_logger.log_error(
                    error=error,
                    severity=ErrorSeverity.ERROR,
                    component="experiment_manager"
                )
                raise error
                
            # Create experiment
            variant_configs = [
                {"id": variant_id, "name": variant_id, "weight": 1.0}
                for variant_id in variants
            ]
            experiment = Experiment(
                id=experiment_id,
                name=name,
                description=f"A/B test experiment: {name}",
                variants=variant_configs,
                traffic_percentage=traffic_percentage
            )
            self._experiments[experiment_id] = experiment
                
            # Initialize metrics
            for metric_name in self._default_metrics:
                self._metrics_collector.register_metric(MetricDefinition(
                    name=metric_name,
                    type=MetricType.CONVERSION,
                    description=f"Default metric: {metric_name}",
                    validation={"min": 0, "max": 1}
                ))
                
            return experiment_id
            
        except Exception as e:
            error_logger.log_error(
                error=e,
                severity=ErrorSeverity.ERROR,
                component="experiment_manager"
            )
            raise

    def get_experiment(self, experiment_id: str) -> Optional[Experiment]:
        """Get experiment by ID."""
        return self._experiments.get(experiment_id)

    def get_active_experiments(self) -> List[Experiment]:
        """Get all active experiments."""
        now = datetime.now()
        return [
            exp for exp in self._experiments.values()
            if exp.is_active and
            (exp.end_date is None or exp.end_date > now) and
            (exp.schedule is None or exp.schedule.is_active(now))
        ]

    def assign_variant(self, experiment_id: str, user_id: str) -> Optional[str]:
        """Assign a user to a variant."""
        experiment = self._experiments.get(experiment_id)
        if not experiment or not experiment.is_active:
            return None
            
        return self._assignment_manager.assign_variant(
            experiment_id=experiment_id,
            user_id=user_id,
            variants=experiment.variants,
            traffic_percentage=experiment.traffic_percentage,
            strategy=experiment.assignment_strategy
        )

    def record_metric(
        self,
        experiment_id: str,
        variant_id: str,
        user_id: str,
        metric_name: str,
        value: float,
        attributes: Optional[Dict[str, str]] = None
    ) -> None:
        """Record a metric for an experiment."""
        try:
            self._metrics_collector.record_event(
                experiment_id=experiment_id,
                variant_id=variant_id,
                user_id=user_id,
                metric_name=metric_name,
                value=value,
                metadata=attributes
            )
        except Exception as e:
            error_logger.log_error(
                error=e,
                severity=ErrorSeverity.ERROR,
                component="experiment_manager"
            )
            raise

    def get_experiment_results(self, experiment_id: str) -> Dict[str, Any]:
        """Get results for an experiment."""
        try:
            if experiment_id not in self._experiments:
                error = ValueError(f"Experiment {experiment_id} not found")
                error_logger.log_error(
                    error=error,
                    severity=ErrorSeverity.WARNING,
                    component="experiment_manager"
                )
                return {}
                
            experiment = self._experiments[experiment_id]
            metrics = self._metrics_collector.get_experiment_metrics(experiment_id)
            
            # Flatten metrics into a list for stats computation
            all_events = []
            for variant_metrics in metrics.values():
                for metric_events in variant_metrics.values():
                    all_events.extend(metric_events)
            
            return self._metrics_collector.compute_metric_stats(all_events)
            
        except Exception as e:
            error_logger.log_error(
                error=e,
                severity=ErrorSeverity.ERROR,
                component="experiment_manager"
            )
            return {} 