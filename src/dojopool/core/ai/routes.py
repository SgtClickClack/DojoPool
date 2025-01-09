from flask import Blueprint, request, jsonify
from ..auth.decorators import login_required
from .service import AIService
import numpy as np
import cv2

ai_bp = Blueprint('ai', __name__)
ai_service = AIService()

@ai_bp.route('/ai/analyze-shot', methods=['POST'])
@login_required
def analyze_shot():
    """Analyze a shot sequence and provide insights."""
    if 'frames' not in request.files:
        return jsonify({'error': 'No frames provided'}), 400
        
    try:
        # Process uploaded frames
        frames = []
        for frame_file in request.files.getlist('frames'):
            # Read frame data
            frame_data = frame_file.read()
            # Convert to numpy array
            nparr = np.frombuffer(frame_data, np.uint8)
            # Decode image
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            frames.append(frame)
            
        if not frames:
            return jsonify({'error': 'No valid frames found'}), 400
            
        # Analyze shot
        analysis = ai_service.analyze_shot(frames)
        return jsonify(analysis)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/ai/recommend-players', methods=['GET'])
@login_required
def recommend_players():
    """Get player recommendations for practice or matches."""
    skill_level = request.args.get('skill_level')
    if not skill_level:
        return jsonify({'error': 'Skill level not provided'}), 400
        
    try:
        recommendations = ai_service.recommend_players(
            user_id=request.user.id,
            skill_level=skill_level
        )
        return jsonify({'recommendations': recommendations})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/ai/predict-performance', methods=['GET'])
@login_required
def predict_performance():
    """Get performance predictions and improvement suggestions."""
    try:
        predictions = ai_service.predict_performance(request.user.id)
        return jsonify(predictions)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/ai/shot-history', methods=['GET'])
@login_required
def get_shot_history():
    """Get analyzed shot history with insights."""
    try:
        # Get shot history from database (to be implemented)
        return jsonify({'message': 'Shot history feature coming soon'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 