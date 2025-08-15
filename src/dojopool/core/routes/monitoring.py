"""Routes for metrics monitoring."""

from typing import Any, Dict

from flask import Blueprint, jsonify, request

from ..auth.utils import login_required
from ..monitoring.metrics_monitor import AlertSeverity, metrics_monitor

bp = Blueprint("monitoring", __name__, url_prefix="/api/monitoring")


@bp.route("/metrics/<game_id>", methods=["GET"])
@login_required
def get_game_metrics(game_id: str):
    """Get metrics for a specific game.

    Args:
        game_id: ID of the game to get metrics for

    Returns:
        JSON response with game metrics
    """
    try:
        metrics = metrics_monitor.get_metrics(game_id)
        return jsonify(
            {
                "success": True,
                "data": {
                    "active_players": metrics.active_players,
                    "active_games": metrics.active_games,
                    "total_games_completed": metrics.total_games_completed,
                    "completion_rate": metrics.completion_rate,
                    "average_completion_time": metrics.average_completion_time,
                    "average_score": metrics.average_score,
                    "player_retention": metrics.player_retention,
                    "error_count": metrics.error_count,
                    "warning_count": metrics.warning_count,
                    "error_rate": metrics.error_rate,
                    "last_error": metrics.last_error,
                },
            }
        )
    except Exception as e:
        metrics_monitor.add_alert(
            AlertSeverity.ERROR, f"Failed to fetch metrics for game {game_id}", {"error": str(e)}
        )
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route("/alerts", methods=["GET"])
@login_required
def get_alerts():
    """Get active alerts.

    Returns:
        JSON response with alerts
    """
    try:
        severity = request.args.get("severity")
        alerts = metrics_monitor.get_alerts(AlertSeverity[severity.upper()] if severity else None)
        return jsonify(
            {
                "success": True,
                "data": [
                    {
                        "id": alert.id,
                        "severity": alert.severity.value,
                        "message": alert.message,
                        "timestamp": alert.timestamp.isoformat(),
                        "acknowledged": alert.acknowledged,
                        "acknowledged_by": alert.acknowledged_by,
                        "acknowledged_at": (
                            alert.acknowledged_at.isoformat() if alert.acknowledged_at else None
                        ),
                        "details": alert.details,
                    }
                    for alert in alerts
                ],
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route("/alerts/<alert_id>/acknowledge", methods=["POST"])
@login_required
def acknowledge_alert(alert_id: str):
    """Acknowledge an alert.

    Args:
        alert_id: ID of the alert to acknowledge

    Returns:
        JSON response indicating success/failure
    """
    try:
        user_id = request.json.get("user_id")
        if not user_id:
            return jsonify({"success": False, "error": "user_id is required"}), 400

        success = metrics_monitor.acknowledge_alert(alert_id, user_id)
        return jsonify(
            {"success": success, "message": "Alert acknowledged" if success else "Alert not found"}
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route("/metrics/<game_id>/record-completion", methods=["POST"])
@login_required
def record_game_completion(game_id: str):
    """Record a game completion.

    Args:
        game_id: ID of the completed game

    Returns:
        JSON response indicating success/failure
    """
    try:
        data: Dict[str, Any] = request.json
        if not all(k in data for k in ("score", "time")):
            return jsonify({"success": False, "error": "score and time are required"}), 400

        metrics_monitor.record_game_completion(game_id, float(data["score"]), float(data["time"]))
        return jsonify({"success": True, "message": "Game completion recorded"})
    except Exception as e:
        metrics_monitor.add_alert(
            AlertSeverity.ERROR,
            f"Failed to record game completion for {game_id}",
            {"error": str(e)},
        )
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route("/metrics/<game_id>/record-error", methods=["POST"])
@login_required
def record_error(game_id: str):
    """Record an error occurrence.

    Args:
        game_id: ID of the game where error occurred

    Returns:
        JSON response indicating success/failure
    """
    try:
        data: Dict[str, Any] = request.json
        if not all(k in data for k in ("type", "message")):
            return jsonify({"success": False, "error": "type and message are required"}), 400

        metrics_monitor.record_error(game_id, data["type"], data["message"], data.get("details"))
        return jsonify({"success": True, "message": "Error recorded"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
