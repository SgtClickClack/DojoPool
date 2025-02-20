from flask_caching import Cache
from flask_caching import Cache
"""Routes for training module."""

from typing import Any, Dict, List

from flask import Blueprint, jsonify, request
from flask.typing import ResponseReturnValue

from ..auth.utils import login_required
from ..database import db
from ..models.training import TrainingExercise, TrainingSession

bp = Blueprint("training", __name__, url_prefix="/api/training")


@bp.route("/sessions", methods=["GET"])
@login_required
def get_training_sessions() -> ResponseReturnValue:
    """Get training sessions for the current user."""
    sessions = TrainingSession.query.filter_by(user_id=request.user.id).all()
    return jsonify(
        {
            "sessions": [
                {
                    "id": session.id,
                    "title": session.title,
                    "description": session.description,
                    "start_time": session.start_time.isoformat(),
                    "end_time": (
                        session.end_time.isoformat() if session.end_time else None
                    ),
                    "status": session.status,
                    "exercises": len(session.exercises),
                }
                for session in sessions
            ]
        }
    )


@bp.route("/sessions/<int:session_id>", methods=["GET"])
@login_required
def get_training_session(session_id: int) -> ResponseReturnValue:
    """Get details of a specific training session."""
    session = TrainingSession.query.get_or_404(session_id)

    # Verify ownership
    if session.user_id != request.user.id:
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify(
        {
            "id": session.id,
            "title": session.title,
            "description": session.description,
            "start_time": session.start_time.isoformat(),
            "end_time": session.end_time.isoformat() if session.end_time else None,
            "status": session.status,
            "exercises": [
                {
                    "id": exercise.id,
                    "type": exercise.type,
                    "difficulty": exercise.difficulty,
                    "instructions": exercise.instructions,
                    "completed": exercise.completed,
                    "score": exercise.score,
                }
                for exercise in session.exercises
            ],
        }
    )


@bp.route("/sessions", methods=["POST"])
@login_required
def create_training_session():
    """Create a new training session."""
    data = request.get_json()

    # Validate required fields
    if not data.get("title"):
        return jsonify({"error": "Title is required"}), 400

    session = TrainingSession(
        user_id=request.user.id,
        title=data["title"],
        description=data.get("description"),
        status="created",
    )

    db.session.add(session)
    db.session.commit()

    return (
        jsonify({"id": session.id, "title": session.title, "status": session.status}),
        201,
    )


@bp.route("/sessions/<int:session_id>/exercises", methods=["POST"])
@login_required
def add_exercise(session_id: int) -> ResponseReturnValue:
    """Add an exercise to a training session."""
    session = TrainingSession.query.get_or_404(session_id)

    # Verify ownership
    if session.user_id != request.user.id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ["type", "difficulty", "instructions"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    exercise = TrainingExercise(
        session_id=session_id,
        type=data["type"],
        difficulty=data["difficulty"],
        instructions=data["instructions"],
    )

    db.session.add(exercise)
    db.session.commit()

    return jsonify(
        {"id": exercise.id, "type": exercise.type, "difficulty": exercise.difficulty}
    )


@bp.route("/sessions/<int:session_id>/start", methods=["POST"])
@login_required
def start_training_session(session_id: int) -> ResponseReturnValue:
    """Start a training session."""
    session = TrainingSession.query.get_or_404(session_id)

    # Verify ownership
    if session.user_id != request.user.id:
        return jsonify({"error": "Unauthorized"}), 403

    if session.status != "created":
        return jsonify({"error": "Session cannot be started"}), 400

    if not session.exercises:
        return jsonify({"error": "Session has no exercises"}), 400

    session.status = "in_progress"
    db.session.commit()

    return jsonify(
        {
            "message": "Training session started",
            "id": session.id,
            "status": session.status,
        }
    )


@bp.route("/sessions/<int:session_id>/complete", methods=["POST"])
@login_required
def complete_training_session(session_id: int) -> ResponseReturnValue:
    """Complete a training session."""
    session = TrainingSession.query.get_or_404(session_id)

    # Verify ownership
    if session.user_id != request.user.id:
        return jsonify({"error": "Unauthorized"}), 403

    if session.status != "in_progress":
        return jsonify({"error": "Session is not in progress"}), 400

    session.status = "completed"
    db.session.commit()

    return jsonify(
        {
            "message": "Training session completed",
            "id": session.id,
            "status": session.status,
        }
    )


@bp.route("/exercises/<int:exercise_id>/complete", methods=["POST"])
@login_required
def complete_exercise(exercise_id: int) -> ResponseReturnValue:
    """Mark an exercise as completed."""
    exercise = TrainingExercise.query.get_or_404(exercise_id)

    # Verify session ownership
    if exercise.session.user_id != request.user.id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    score = data.get("score")

    if score is not None:
        exercise.score = score

    exercise.completed = True
    db.session.commit()

    return jsonify(
        {"message": "Exercise completed", "id": exercise.id, "score": exercise.score}
    )
