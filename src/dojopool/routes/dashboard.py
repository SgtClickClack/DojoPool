"""Dashboard routes with enhanced statistics."""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Request, Response, current_app, g, jsonify, render_template
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.middleware.session import session_security_middleware
from dojopool.services.statistics import StatisticsService

bp: Blueprint = Blueprint("dashboard", __name__)


@bp.route("/dashboard")
@session_security_middleware()
def dashboard() -> str:
    """Render the main dashboard page."""
    # Get user statistics
    stats: Any = StatisticsService.get_user_statistics(getattr(g, "user_id", None))

    return render_template("dashboard.html", stats=stats, active_page="dashboard")


@bp.route("/api/dashboard/stats")
@session_security_middleware()
def get_stats():
    """Get dashboard statistics as JSON."""
    stats: Any = StatisticsService.get_user_statistics(getattr(g, "user_id", None))
    return jsonify(stats)


@bp.route("/api/dashboard/stats/games")
@session_security_middleware()
def get_game_stats():
    """Get game-specific statistics."""
    stats: Any = StatisticsService._get_game_stats(getattr(g, "user_id", None))
    return jsonify(stats)


@bp.route("/api/dashboard/stats/achievements")
@session_security_middleware()
def get_achievement_stats():
    """Get achievement-specific statistics."""
    stats: Any = StatisticsService._get_achievement_stats(getattr(g, "user_id", None))
    return jsonify(stats)


@bp.route("/api/dashboard/stats/tournaments")
@session_security_middleware()
def get_tournament_stats():
    """Get tournament-specific statistics."""
    stats: Any = StatisticsService._get_tournament_stats(getattr(g, "user_id", None))
    return jsonify(stats)


@bp.route("/api/dashboard/stats/ratings")
@session_security_middleware()
def get_rating_stats():
    """Get rating-specific statistics."""
    stats: Any = StatisticsService._get_rating_stats(getattr(g, "user_id", None))
    return jsonify(stats)


@bp.route("/api/dashboard/stats/power-ups")
@session_security_middleware()
def get_power_up_stats():
    """Get power-up specific statistics."""
    stats: Any = StatisticsService._get_power_up_stats(getattr(g, "user_id", None))
    return jsonify(stats)
