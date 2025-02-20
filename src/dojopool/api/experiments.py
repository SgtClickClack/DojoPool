from multiprocessing import Pool
from multiprocessing import Pool
"""
API endpoints for A/B testing experiments.
"""

from typing import Any, Dict, List, Optional, Set, Tuple, Union

from flask import Blueprint, Response, current_app, jsonify, request
from werkzeug.wrappers import Response as WerkzeugResponse

from ..core.experiments.analysis import ExperimentAnalyzer
from ..core.experiments.manager import ExperimentManager
from ..monitoring import ErrorSeverity, error_logger

experiments_bp = Blueprint("experiments", __name__)
experiment_manager = ExperimentManager()
experiment_analyzer = ExperimentAnalyzer()


@experiments_bp.route("/experiments", methods=["POST"])
def create_experiment() -> Response:
    """Create a new experiment."""
    try:
        data = request.get_json()
        if not data or "name" not in data or "variants" not in data:
            return jsonify({"error": "Missing required fields: name, variants"}), 400

        experiment_id: Any = experiment_manager.create_experiment(
            name=data["name"],
            variants=data["variants"],
            traffic_percentage=data.get("traffic_percentage", 100.0),
        )

        return (
            jsonify(
                {
                    "experiment_id": experiment_id,
                    "message": "Experiment created successfully",
                }
            ),
            201,
        )

    except Exception as e:
        error_logger.log_error(
            error=e, severity=ErrorSeverity.ERROR, component="experiments_api"
        )
        return jsonify({"error": str(e)}), 500


@experiments_bp.route("/experiments/<experiment_id>/assign", methods=["POST"])
def assign_variant(experiment_id: str) -> Response:
    """Assign a user to an experiment variant."""
    try:
        data = request.get_json()
        if not data or "user_id" not in data:
            return jsonify({"error": "Missing required field: user_id"}), 400

        variant_id: Any = experiment_manager.assign_variant(
            experiment_id=experiment_id, user_id=data["user_id"]
        )

        if variant_id is None:
            return jsonify({"message": "User not included in experiment"}), 200

        return (
            jsonify(
                {"variant_id": variant_id, "message": "User assigned successfully"}
            ),
            200,
        )

    except Exception as e:
        error_logger.log_error(
            error=e, severity=ErrorSeverity.ERROR, component="experiments_api"
        )
        return jsonify({"error": str(e)}), 500


@experiments_bp.route("/experiments/<experiment_id>/metric", methods=["POST"])
def record_metric(experiment_id: str) -> Response:
    """Record a metric for an experiment."""
    try:
        data = request.get_json()
        required_fields: Set[Any] = {"user_id", "variant_id", "metric_name", "value"}
        if not data or not all(field in data for field in required_fields):
            return (
                jsonify({"error": f"Missing required fields: {required_fields}"}),
                400,
            )

        experiment_manager.record_metric(
            experiment_id=experiment_id,
            variant_id=data["variant_id"],
            user_id=data["user_id"],
            metric_name=data["metric_name"],
            value=float(data["value"]),
            attributes=data.get("attributes"),
        )

        return jsonify({"message": "Metric recorded successfully"}), 200

    except Exception as e:
        error_logger.log_error(
            error=e, severity=ErrorSeverity.ERROR, component="experiments_api"
        )
        return jsonify({"error": str(e)}), 500


@experiments_bp.route("/experiments/<experiment_id>/results", methods=["GET"])
def get_experiment_results(experiment_id: str) -> Response:
    """Get results for an experiment."""
    try:
        # Get experiment metrics
        metrics: Any = experiment_manager.get_experiment_results(experiment_id)
        if not metrics:
            return jsonify({"error": "No metrics found for experiment"}), 404

        # Get control and variant values
        control_values: List[Any] = []
        variant_values: Dict[str, list] = {}

        for variant_id, variant_metrics in metrics.items():
            for _metric_name, events in variant_metrics.items():
                values: Any = [event.value for event in events]
                if variant_id == "control":
                    control_values.extend(values)
                else:
                    if variant_id not in variant_values:
                        variant_values[variant_id] = []
                    variant_values[variant_id].extend(values)

        # Analyze results
        results: Any = experiment_analyzer.analyze_experiment(
            experiment_id=experiment_id,
            control_values=control_values,
            variant_values=variant_values,
        )

        return (
            jsonify(
                {
                    "experiment_id": results.experiment_id,
                    "control_results": {
                        "variant_id": results.control_results.variant_id,
                        "sample_size": results.control_results.sample_size,
                        "conversion_rate": results.control_results.conversion_rate,
                        "mean_value": results.control_results.mean_value,
                        "std_dev": results.control_results.std_dev,
                        "confidence_interval": results.control_results.confidence_interval,
                    },
                    "variant_results": [
                        {
                            "variant_id": v.variant_id,
                            "sample_size": v.sample_size,
                            "conversion_rate": v.conversion_rate,
                            "mean_value": v.mean_value,
                            "std_dev": v.std_dev,
                            "confidence_interval": v.confidence_interval,
                        }
                        for v in results.variant_results
                    ],
                    "p_value": results.p_value,
                    "is_significant": results.is_significant,
                    "minimum_detectable_effect": results.minimum_detectable_effect,
                    "power": results.power,
                }
            ),
            200,
        )

    except Exception as e:
        error_logger.log_error(
            error=e, severity=ErrorSeverity.ERROR, component="experiments_api"
        )
        return jsonify({"error": str(e)}), 500


def init_app(app: Any):
    """Initialize the experiments blueprint."""
    app.register_blueprint(experiments_bp, url_prefix="/api")
