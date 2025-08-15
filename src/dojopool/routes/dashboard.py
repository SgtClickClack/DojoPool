"""Dashboard routes with enhanced statistics."""

from flask import Blueprint, g, jsonify, render_template

from dojopool.core.middleware.session import session_security_middleware
from dojopool.services.statistics import StatisticsService

bp = Blueprint("dashboard", __name__)


@bp.route("/dashboard")
@session_security_middleware()
def dashboard():
    """Render the main dashboard page."""
    # Get user statistics
    stats = StatisticsService.get_user_statistics(g.user_id)
    # Get user object (with avatar and wallet info)
    from dojopool.models.user import User
    user = User.query.get(g.user_id)
    # Attach wallet_balance if available
    if hasattr(user, 'wallet') and user.wallet:
        user.wallet_balance = user.wallet.balance
    else:
        user.wallet_balance = 0
    return render_template("dashboard.html", user=user, stats=stats, active_page="dashboard")


@bp.route("/api/dashboard/stats")
@session_security_middleware()
def get_stats():
    """Get dashboard statistics as JSON."""
    stats = StatisticsService.get_user_statistics(g.user_id)
    return jsonify(stats)


@bp.route("/api/dashboard/stats/games")
@session_security_middleware()
def get_game_stats():
    """Get game-specific statistics."""
    stats = StatisticsService._get_game_stats(g.user_id)
    return jsonify(stats)


@bp.route("/api/dashboard/stats/achievements")
@session_security_middleware()
def get_achievement_stats():
    """Get achievement-specific statistics."""
    stats = StatisticsService._get_achievement_stats(g.user_id)
    return jsonify(stats)


@bp.route("/api/dashboard/stats/tournaments")
@session_security_middleware()
def get_tournament_stats():
    """Get tournament-specific statistics."""
    stats = StatisticsService._get_tournament_stats(g.user_id)
    return jsonify(stats)


@bp.route("/api/dashboard/stats/ratings")
@session_security_middleware()
def get_rating_stats():
    """Get rating-specific statistics."""
    stats = StatisticsService._get_rating_stats(g.user_id)
    return jsonify(stats)


@bp.route("/api/dashboard/stats/power-ups")
@session_security_middleware()
def get_power_up_stats():
    """Get power-up specific statistics."""
    stats = StatisticsService._get_power_up_stats(g.user_id)
    return jsonify(stats)
