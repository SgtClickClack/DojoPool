"""
REST API routes for A/B testing management.
"""

from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Request, Response, current_app, jsonify, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from ..auth import is_admin, require_auth
from .manager import Experiment, ExperimentManager
from .metrics import MetricEvent, MetricsCollector

bp: Blueprint = Blueprint("experiments", __name__, url_prefix="/api/experiments")
experiment_manager: ExperimentManager = ExperimentManager()
metrics_collector: MetricsCollector = MetricsCollector()


def admin_required(f: Callable) -> Callable:
    """Decorator to require admin access for a route."""

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any):
        if not is_admin():
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)

    return decorated


@bp.route("/", methods=["GET"])
@require_auth
def list_experiments():
    """List all experiments."""
    experiments = experiment_manager.get_active_experiments()
    return jsonify(
        [
            {
                "id": exp.id,
                "name": exp.name,
                "description": exp.description,
                "variants": exp.variants,
                "traffic_percentage": exp.traffic_percentage,
                "start_date": exp.start_date.isoformat(),
                "end_date": exp.end_date.isoformat() if exp.end_date else None,
                "is_active": exp.is_active,
            }
            for exp in experiments
        ]
    )


@bp.route("/", methods=["POST"])
@require_auth
@admin_required
def create_experiment():
    """Create a new experiment."""
    data: Any = request.get_json()

    try:
        experiment: Any = Experiment(
            id=data["id"],
            name=data["name"],
            description=data["description"],
            variants=data["variants"],
            traffic_percentage=float(data["traffic_percentage"]),
            start_date=datetime.fromisoformat(data["start_date"]),
            end_date=(
                datetime.fromisoformat(data["end_date"])
                if data.get("end_date")
                else None
            ),
            is_active=data.get("is_active", True),
        )
        experiment_manager.create_experiment(experiment)
        return jsonify({"message": "Experiment created successfully"}), 201
    except (KeyError, ValueError) as e:
        return jsonify({"error": str(e)}), 400


@bp.route("/<experiment_id>", methods=["GET"])
@require_auth
def get_experiment(experiment_id: str):
    """Get experiment details."""
    experiment: Any = experiment_manager.get_experiment(experiment_id)
    if not experiment:
        return jsonify({"error": "Experiment not found"}), 404

    return jsonify(
        {
            "id": experiment.id,
            "name": experiment.name,
            "description": experiment.description,
            "variants": experiment.variants,
            "traffic_percentage": experiment.traffic_percentage,
            "start_date": experiment.start_date.isoformat(),
            "end_date": (
                experiment.end_date.isoformat() if experiment.end_date else None
            ),
            "is_active": experiment.is_active,
        }
    )


@bp.route("/<experiment_id>/metrics", methods=["GET"])
@require_auth
@admin_required
def get_experiment_metrics(experiment_id: str) -> ResponseReturnValue:
    """Get metrics for an experiment."""
    experiment: Any = experiment_manager.get_experiment(experiment_id)
    if not experiment:
        return jsonify({"error": "Experiment not found"}), 404

    event_type: Any = request.args.get("event_type", type=str)
    start_time: Any = request.args.get("start_time", type=str)
    end_time: Any = request.args.get("end_time", type=str)

    try:
        if start_time:
            start_time: Any = datetime.fromisoformat(start_time)
        if end_time:
            end_time: Any = datetime.fromisoformat(end_time)

        metrics: Any = metrics_collector.get_experiment_metrics(
            experiment_id,
            event_type=event_type,
            start_time=start_time,
            end_time=end_time,
        )
        return jsonify(metrics)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@bp.route("/<experiment_id>/events", methods=["POST"])
@require_auth
def track_event(experiment_id: str) -> ResponseReturnValue:
    """Track a new event for an experiment."""
    data: Any = request.get_json()
    user_id: Any = request.user_id  # Assuming this is set by @require_auth

    try:
        event: MetricEvent = MetricEvent(
            experiment_id=experiment_id,
            user_id=user_id,
            variant=data["variant"],
            event_type=data["event_type"],
            value=float(data["value"]),
            timestamp=datetime.now(),
            metadata=data.get("metadata"),
        )
        metrics_collector.track_event(event)
        return jsonify({"message": "Event tracked successfully"}), 201
    except (KeyError, ValueError) as e:
        return jsonify({"error": str(e)}), 400


@bp.route("/<experiment_id>/assignment", methods=["GET"])
@require_auth
def get_assignment(experiment_id: str) -> ResponseReturnValue:
    """Get or create a variant assignment for the current user."""
    user_id: Any = request.user_id  # Assuming this is set by @require_auth

    try:
        variant: Any = experiment_manager.assign_user(user_id, experiment_id)
        return jsonify({"experiment_id": experiment_id, "variant": variant})
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
