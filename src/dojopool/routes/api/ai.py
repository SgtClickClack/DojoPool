from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from ...extensions import cache
from ...services.ai_service import AIService
from ...utils.decorators import admin_required, rate_limit

ai_bp = Blueprint("ai", __name__)
ai_service = AIService()


@ai_bp.route("/story/<int:match_id>", methods=["GET"])
@login_required
@rate_limit(limit=10, per=60)  # 10 requests per minute
def generate_story(match_id):
    """Generate a personalized story for a match."""
    try:
        context = request.args.get("context", {})
        result = ai_service.generate_story(
            user_id=current_user.id, match_id=match_id, context=context
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@ai_bp.route("/recommendations", methods=["GET"])
@login_required
@rate_limit(limit=20, per=60)  # 20 requests per minute
def get_recommendations():
    """Get personalized recommendations."""
    try:
        recommendation_type = request.args.get("type", "training")
        recommendations = ai_service.get_personalized_recommendations(
            user_id=current_user.id, recommendation_type=recommendation_type
        )
        return jsonify({"recommendations": recommendations})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@ai_bp.route("/match/<int:match_id>/analysis", methods=["GET"])
@login_required
@rate_limit(limit=15, per=60)  # 15 requests per minute
def analyze_match(match_id):
    """Get AI-powered match analysis."""
    try:
        analysis_type = request.args.get("type", "full")
        analysis = ai_service.analyze_match(match_id=match_id, analysis_type=analysis_type)
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@ai_bp.route("/game/<int:game_id>/difficulty", methods=["GET"])
@login_required
@rate_limit(limit=30, per=60)  # 30 requests per minute
def get_difficulty_adjustment(game_id):
    """Get adaptive difficulty settings."""
    try:
        settings = ai_service.get_difficulty_adjustment(user_id=current_user.id, game_id=game_id)
        return jsonify(settings)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@ai_bp.route("/batch/recommendations", methods=["POST"])
@login_required
@admin_required
def batch_recommendations():
    """Generate recommendations for multiple users (admin only)."""
    try:
        data = request.get_json()
        user_ids = data.get("user_ids", [])
        recommendation_type = data.get("type", "training")

        results = {}
        for user_id in user_ids:
            recommendations = ai_service.get_personalized_recommendations(
                user_id=user_id, recommendation_type=recommendation_type
            )
            results[user_id] = recommendations

        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@ai_bp.route("/batch/analysis", methods=["POST"])
@login_required
@admin_required
def batch_match_analysis():
    """Analyze multiple matches (admin only)."""
    try:
        data = request.get_json()
        match_ids = data.get("match_ids", [])
        analysis_type = data.get("type", "full")

        results = {}
        for match_id in match_ids:
            analysis = ai_service.analyze_match(match_id=match_id, analysis_type=analysis_type)
            results[match_id] = analysis

        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@ai_bp.route("/metrics", methods=["GET"])
@login_required
@admin_required
def get_ai_metrics():
    """Get AI system performance metrics (admin only)."""
    try:
        cache_key = "ai_metrics"
        metrics = cache.get(cache_key)

        if metrics is None:
            metrics = {
                "story_generation": {
                    "total_stories": 1000,
                    "avg_generation_time": 0.5,
                    "success_rate": 0.98,
                },
                "recommendations": {
                    "total_recommendations": 5000,
                    "avg_response_time": 0.3,
                    "acceptance_rate": 0.85,
                },
                "match_analysis": {
                    "total_analyses": 3000,
                    "avg_analysis_time": 0.8,
                    "accuracy_rate": 0.92,
                },
                "difficulty_adjustment": {
                    "total_adjustments": 8000,
                    "avg_calculation_time": 0.2,
                    "effectiveness_rate": 0.88,
                },
            }
            cache.set(cache_key, metrics, timeout=300)  # Cache for 5 minutes

        return jsonify(metrics)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@ai_bp.errorhandler(429)
def ratelimit_handler(e):
    """Handle rate limit exceeded errors."""
    return (
        jsonify(
            {
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please try again later.",
            }
        ),
        429,
    )
