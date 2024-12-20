from flask import Blueprint, request, jsonify
from ..auth.decorators import login_required
from .service import TrainingService
from .models import TrainingProgram, Exercise

training_bp = Blueprint('training', __name__)
training_service = TrainingService()

@training_bp.route('/training/recommend', methods=['GET'])
@login_required
def recommend_program():
    """Get a recommended training program."""
    try:
        recommendation = training_service.recommend_program(request.user.id)
        if not recommendation:
            return jsonify({'message': 'No suitable programs found'}), 404
            
        program = recommendation['program']
        return jsonify({
            'program': {
                'id': program.id,
                'name': program.name,
                'description': program.description,
                'difficulty': program.difficulty,
                'duration_weeks': program.duration_weeks
            },
            'match_score': recommendation['match_score'],
            'reasons': recommendation['reasons']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@training_bp.route('/training/programs/<int:program_id>/exercises', methods=['GET'])
@login_required
def get_program_exercises(program_id):
    """Get exercises for a specific program."""
    try:
        program = TrainingProgram.query.get(program_id)
        if not program:
            return jsonify({'error': 'Program not found'}), 404
            
        exercises = Exercise.query.filter_by(program_id=program_id).all()
        return jsonify({
            'exercises': [{
                'id': ex.id,
                'name': ex.name,
                'description': ex.description,
                'type': ex.type,
                'difficulty': ex.difficulty,
                'target_metrics': ex.target_metrics
            } for ex in exercises]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@training_bp.route('/training/exercises/generate', methods=['POST'])
@login_required
def generate_exercise():
    """Generate a new personalized exercise."""
    try:
        program_id = request.json.get('program_id')
        if not program_id:
            return jsonify({'error': 'Program ID required'}), 400
            
        exercise = training_service.generate_exercise(program_id, request.user.id)
        return jsonify({
            'exercise': {
                'id': exercise.id,
                'name': exercise.name,
                'description': exercise.description,
                'type': exercise.type,
                'difficulty': exercise.difficulty,
                'target_metrics': exercise.target_metrics
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@training_bp.route('/training/progress', methods=['POST'])
@login_required
def track_progress():
    """Track progress for an exercise."""
    try:
        data = request.json
        if not data or 'exercise_id' not in data or 'metrics' not in data:
            return jsonify({'error': 'Exercise ID and metrics required'}), 400
            
        progress = training_service.track_progress(
            request.user.id,
            data['exercise_id'],
            data['metrics']
        )
        
        return jsonify({
            'progress': {
                'id': progress.id,
                'completion_date': progress.completion_date,
                'performance_metrics': progress.performance_metrics,
                'notes': progress.notes
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@training_bp.route('/training/progress', methods=['GET'])
@login_required
def get_progress():
    """Get user's training progress."""
    try:
        program_id = request.args.get('program_id', type=int)
        progress = training_service.get_user_progress(request.user.id, program_id)
        return jsonify({'progress': progress})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 