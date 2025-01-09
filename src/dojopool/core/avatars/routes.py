from flask import Blueprint, request, jsonify, send_file
from flask_login import login_required, current_user
from src.core.models import User, db
from src.core.auth.utils import admin_required
from .generator import AvatarGenerator
from .animation import AvatarAnimator
import io
import base64
from datetime import datetime

bp = Blueprint('avatars', __name__, url_prefix='/avatars')

# Initialize components
avatar_generator = AvatarGenerator()
animation_manager = AvatarAnimator('assets/animations')

@bp.route('/generate', methods=['POST'])
@login_required
def generate_avatar():
    """Generate a new avatar."""
    try:
        data = request.get_json()
        
        # Generate avatar
        avatar_image = avatar_generator.generate(
            style=data.get('style', 'default'),
            features=data.get('features', {}),
            colors=data.get('colors', {})
        )
        
        # Convert to base64
        buffered = io.BytesIO()
        avatar_image.save(buffered, format="PNG")
        avatar_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        # Update user's avatar if requested
        if data.get('update_profile', False):
            current_user.avatar = buffered.getvalue()
            current_user.avatar_updated_at = datetime.utcnow()
            db.session.commit()
        
        return jsonify({
            'status': 'success',
            'data': {
                'avatar': f"data:image/png;base64,{avatar_base64}"
            }
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_avatar(user_id):
    """Get a user's avatar."""
    try:
        user = User.query.get_or_404(user_id)
        
        if not user.avatar:
            # Generate default avatar
            avatar_image = avatar_generator.generate_default()
            buffered = io.BytesIO()
            avatar_image.save(buffered, format="PNG")
            return send_file(
                io.BytesIO(buffered.getvalue()),
                mimetype='image/png'
            )
        
        return send_file(
            io.BytesIO(user.avatar),
            mimetype='image/png'
        )
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/me', methods=['PUT'])
@login_required
def update_avatar():
    """Update current user's avatar."""
    try:
        data = request.get_json()
        
        if 'avatar' not in data:
            return jsonify({
                'status': 'error',
                'message': 'No avatar data provided'
            }), 400
        
        # Decode base64 avatar
        try:
            avatar_data = base64.b64decode(data['avatar'].split(',')[1])
        except:
            return jsonify({
                'status': 'error',
                'message': 'Invalid avatar data format'
            }), 400
        
        # Update user's avatar
        current_user.avatar = avatar_data
        current_user.avatar_updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Avatar updated successfully'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/animate', methods=['POST'])
@login_required
def animate_avatar():
    """Create an animated version of an avatar."""
    try:
        data = request.get_json()
        
        # Get animation type
        animation_type = data.get('animation', 'pulse')
        if animation_type not in animation_manager.available_animations:
            return jsonify({
                'status': 'error',
                'message': 'Invalid animation type'
            }), 400
        
        # Get avatar image
        if 'avatar' in data:
            # Use provided avatar
            avatar_data = base64.b64decode(data['avatar'].split(',')[1])
            avatar_image = avatar_generator.from_bytes(avatar_data)
        else:
            # Use user's avatar or generate default
            if current_user.avatar:
                avatar_image = avatar_generator.from_bytes(current_user.avatar)
            else:
                avatar_image = avatar_generator.generate_default()
        
        # Generate animation
        animation = animation_manager.create_animation(
            avatar_image,
            animation_type,
            data.get('options', {})
        )
        
        # Convert to base64
        animation_base64 = base64.b64encode(animation).decode()
        
        return jsonify({
            'status': 'success',
            'data': {
                'animation': f"data:image/gif;base64,{animation_base64}"
            }
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/styles', methods=['GET'])
def get_avatar_styles():
    """Get available avatar styles."""
    try:
        styles = avatar_generator.get_available_styles()
        return jsonify({
            'status': 'success',
            'data': {
                'styles': styles
            }
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/animations', methods=['GET'])
def get_available_animations():
    """Get available avatar animations."""
    try:
        animations = animation_manager.get_available_animations()
        return jsonify({
            'status': 'success',
            'data': {
                'animations': animations
            }
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500 