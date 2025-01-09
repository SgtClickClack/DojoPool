"""Feature routes for map and avatar functionality."""
from flask import Blueprint, render_template, jsonify, request, current_app
from flask_login import login_required, current_user
from src.core.database import db
from src.models.venue import Venue
from src.services.avatar import AvatarService
from src.services.map import MapService

features_bp = Blueprint('features', __name__)

@features_bp.route('/map')
def map_view():
    """Render the DojoMap page."""
    return render_template('features/map.html')

@features_bp.route('/api/venues')
def get_venues():
    """Get all venue locations for the map."""
    venues = Venue.query.all()
    return jsonify([venue.to_dict() for venue in venues])

@features_bp.route('/avatar')
@login_required
def avatar_view():
    """Render the avatar creation/customization page."""
    return render_template('features/avatar.html')

@features_bp.route('/api/avatar/generate', methods=['POST'])
@login_required
def generate_avatar():
    """Generate a new avatar using AI."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
        
    file = request.files['image']
    if not file.filename:
        return jsonify({'error': 'No image selected'}), 400
        
    try:
        avatar_service = AvatarService()
        result = avatar_service.generate_avatar(file, current_user.id)
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Avatar generation error: {str(e)}")
        return jsonify({'error': 'Failed to generate avatar'}), 500

@features_bp.route('/api/avatar/customize', methods=['POST'])
@login_required
def customize_avatar():
    """Customize existing avatar."""
    data = request.get_json()
    try:
        avatar_service = AvatarService()
        result = avatar_service.customize_avatar(current_user.id, data)
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Avatar customization error: {str(e)}")
        return jsonify({'error': 'Failed to customize avatar'}), 500 