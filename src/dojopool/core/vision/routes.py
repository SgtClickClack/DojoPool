from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from src.core.models import Game, db
from src.core.auth.utils import admin_required
from src.core.vision.camera import PoolCamera, CameraConfig
from src.core.vision.ball_tracker import BallTracker
from src.core.vision.game_tracker import GameTracker
from src.core.vision.monitor import GameMonitor
from datetime import datetime

bp = Blueprint('vision', __name__, url_prefix='/vision')

# Initialize vision components
camera = None
ball_tracker = None
game_tracker = None
game_monitor = None

def init_vision_system():
    """Initialize the vision system components."""
    global camera, ball_tracker, game_tracker, game_monitor
    try:
        camera = PoolCamera(CameraConfig(device_id=0))  # Using default camera
        ball_tracker = BallTracker()
        game_tracker = GameTracker()
        game_monitor = GameMonitor()
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to initialize vision system: {str(e)}")
        return False

_vision_system_initialized = False

@bp.before_app_request
def setup_vision_system():
    """Set up vision system before first request."""
    global _vision_system_initialized
    if not _vision_system_initialized:
        if init_vision_system():
            current_app.logger.info("Vision system initialized successfully")
        else:
            current_app.logger.error("Failed to initialize vision system")
        _vision_system_initialized = True

@bp.route('/calibrate', methods=['POST'])
@admin_required
def calibrate_table(admin_user):
    """Calibrate the pool table detection."""
    try:
        # Get calibration image and corners
        image_data = request.json.get('image')
        corners = request.json.get('corners')
        venue_id = request.json.get('venue_id')
        
        if not image_data or not corners or not venue_id:
            return jsonify({
                'status': 'error',
                'message': 'Missing required data'
            }), 400
        
        # Calibrate table
        success = game_monitor.calibrate_table(venue_id, corners)
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Table calibration successful'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Table calibration failed'
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Calibration error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/track', methods=['POST'])
@login_required
def track_game():
    """Track a game in progress."""
    try:
        # Get game ID and venue ID
        game_id = request.json.get('game_id')
        venue_id = request.json.get('venue_id')
        
        if not game_id or not venue_id:
            return jsonify({
                'status': 'error',
                'message': 'Missing game ID or venue ID'
            }), 400
        
        # Start game tracking
        success = game_monitor.start_game_tracking(game_id, venue_id)
        if not success:
            return jsonify({
                'status': 'error',
                'message': 'Failed to start game tracking'
            }), 500
        
        return jsonify({
            'status': 'success',
            'message': 'Game tracking started'
        })
        
    except Exception as e:
        current_app.logger.error(f"Tracking error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/events', methods=['GET'])
@login_required
def get_game_events():
    """Get recent game events."""
    try:
        events = game_monitor.get_game_events()
        return jsonify({
            'status': 'success',
            'data': {
                'events': events
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting game events: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/status', methods=['GET'])
@admin_required
def get_vision_status(admin_user):
    """Get vision system status."""
    try:
        status = {
            'camera_connected': camera and camera.is_running,
            'monitoring_active': game_monitor and game_monitor.is_running,
            'active_games': len(game_monitor.active_games) if game_monitor else 0
        }
        
        return jsonify({
            'status': 'success',
            'data': status
        })
        
    except Exception as e:
        current_app.logger.error(f"Status check error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500 