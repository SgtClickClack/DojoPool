import numpy as np
from flask import Blueprint, jsonify, request

from ..auth.decorators import login_required
from .game_analysis import GameAnalysis

game_analysis_bp = Blueprint("game_analysis", __name__)
game_analysis = GameAnalysis()


@game_analysis_bp.route("/analysis/shot", methods=["POST"])
@login_required
def analyze_shot():
    """Analyze a shot sequence."""
    try:
        if "frame_sequence" not in request.files:
            return jsonify({"error": "Frame sequence required"}), 400

        frame_sequence = request.files.getlist("frame_sequence")
        # Convert frames to numpy arrays
        frames = [np.array(frame) for frame in frame_sequence]

        analysis = game_analysis.analyze_shot(frames)
        return jsonify({"analysis": analysis})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@game_analysis_bp.route("/analysis/game/<int:game_id>/patterns", methods=["GET"])
@login_required
def analyze_game_patterns(game_id):
    """Analyze patterns in a complete game."""
    try:
        patterns = game_analysis.analyze_game_patterns(game_id)
        return jsonify({"patterns": patterns})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@game_analysis_bp.route("/analysis/game/<int:game_id>/statistics", methods=["GET"])
@login_required
def get_game_statistics(game_id):
    """Get comprehensive game statistics."""
    try:
        statistics = game_analysis.generate_game_statistics(game_id)
        return jsonify({"statistics": statistics})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
