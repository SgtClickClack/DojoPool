import logging
import numpy as np
import cv2
from flask import Blueprint, jsonify, request, Response, render_template
from flask_login import login_required, current_user
from extensions import db, socketio
from models import User
from datetime import datetime
import io
from PIL import Image
from threading import Lock

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

umpire = Blueprint("umpire", __name__)

class GameMonitor:
    def __init__(self):
        self.monitors = {}  # Dictionary to store per-user monitors
        self.lock = Lock()  # Thread safety lock
        
        # Default HSV color ranges that will be calibrated
        self.default_color_ranges = {
            'white': {'lower': np.array([0, 0, 200]), 'upper': np.array([180, 30, 255])},  # Cue ball
            'red': {'lower': np.array([0, 100, 100]), 'upper': np.array([10, 255, 255])},
            'yellow': {'lower': np.array([20, 100, 100]), 'upper': np.array([30, 255, 255])},
            'green': {'lower': np.array([50, 100, 100]), 'upper': np.array([70, 255, 255])}
        }
    
    def get_user_monitor(self, user_id):
        """Get or create a monitor for a specific user"""
        with self.lock:
            if user_id not in self.monitors:
                self.monitors[user_id] = {
                    'color_ranges': self.default_color_ranges.copy(),
                    'is_calibrated': False,
                    'last_frame': None,
                    'detected_balls': [],
                    'shots_detected': 0,
                    'fouls': 0,
                    'last_shot_time': None
                }
            return self.monitors[user_id]
    
    def process_frame(self, frame, user_id):
        """Process a single frame to detect balls and shots"""
        monitor = self.get_user_monitor(user_id)
        
        try:
            # Convert frame to HSV color space
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            detected_balls = []
            
            # Detect balls of each color
            for color, ranges in monitor['color_ranges'].items():
                mask = cv2.inRange(hsv, ranges['lower'], ranges['upper'])
                
                # Apply morphological operations to reduce noise
                kernel = np.ones((5,5), np.uint8)
                mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
                mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
                
                # Find contours
                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                for contour in contours:
                    # Filter contours by area to remove noise
                    area = cv2.contourArea(contour)
                    if area > 100:  # Minimum area threshold
                        # Find the minimum enclosing circle
                        (x, y), radius = cv2.minEnclosingCircle(contour)
                        center = (int(x), int(y))
                        radius = int(radius)
                        
                        if 10 <= radius <= 30:  # Valid ball radius range
                            detected_balls.append({
                                'color': color,
                                'position': center,
                                'radius': radius
                            })
            
            # Detect shots by analyzing ball movement
            shot_detected = self._detect_shot(detected_balls, monitor['detected_balls'])
            if shot_detected:
                monitor['shots_detected'] += 1
                monitor['last_shot_time'] = datetime.now()
                
                # Emit shot detection event
                socketio.emit('shot_detected', {
                    'user_id': user_id,
                    'shot_count': monitor['shots_detected'],
                    'timestamp': datetime.now().isoformat()
                })
            
            # Update monitor state
            monitor['detected_balls'] = detected_balls
            monitor['last_frame'] = frame
            
            return {
                'status': 'success',
                'balls_detected': len(detected_balls),
                'shot_detected': shot_detected,
                'stats': {
                    'total_shots': monitor['shots_detected'],
                    'fouls': monitor['fouls']
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing frame: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def _detect_shot(self, current_balls, previous_balls):
        """Detect if a shot has occurred by analyzing ball movement"""
        if not previous_balls:
            return False
            
        # Calculate the maximum displacement of any ball
        max_displacement = 0
        for curr_ball in current_balls:
            curr_pos = curr_ball['position']
            
            # Find the same colored ball in previous frame
            for prev_ball in previous_balls:
                if prev_ball['color'] == curr_ball['color']:
                    prev_pos = prev_ball['position']
                    displacement = np.sqrt(
                        (curr_pos[0] - prev_pos[0])**2 + 
                        (curr_pos[1] - prev_pos[1])**2
                    )
                    max_displacement = max(max_displacement, displacement)
        
        # Consider it a shot if any ball moved more than the threshold
        SHOT_THRESHOLD = 20  # pixels
        return max_displacement > SHOT_THRESHOLD
    
    def calibrate_colors(self, frame, user_id):
        """Calibrate color ranges using a reference frame"""
        try:
            monitor = self.get_user_monitor(user_id)
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            
            # Automatic calibration using histogram analysis
            for color in monitor['color_ranges'].keys():
                mask = cv2.inRange(hsv, 
                                 monitor['color_ranges'][color]['lower'],
                                 monitor['color_ranges'][color]['upper'])
                
                if cv2.countNonZero(mask) > 0:
                    # Calculate histogram of non-zero pixels
                    roi = cv2.bitwise_and(hsv, hsv, mask=mask)
                    hist = cv2.calcHist([roi], [0, 1], mask, [180, 256], [0, 180, 0, 256])
                    
                    # Find the peak in the histogram
                    _, _, _, max_loc = cv2.minMaxLoc(hist)
                    h_peak, s_peak = max_loc
                    
                    # Update color ranges based on peak
                    h_range = 10
                    s_range = 50
                    monitor['color_ranges'][color]['lower'] = np.array([
                        max(0, h_peak - h_range),
                        max(0, s_peak - s_range),
                        50
                    ])
                    monitor['color_ranges'][color]['upper'] = np.array([
                        min(180, h_peak + h_range),
                        min(255, s_peak + s_range),
                        255
                    ])
            
            monitor['is_calibrated'] = True
            return True
            
        except Exception as e:
            logger.error(f"Calibration error: {str(e)}")
            return False

# Create game monitor instance
game_monitor = GameMonitor()

@umpire.route('/umpire')
@login_required
def umpire_page():
    """Render the umpire monitoring page"""
    return render_template('umpire.html')

@umpire.route('/api/process-frame', methods=['POST'])
@login_required
def process_frame():
    """Process a frame from the game camera"""
    try:
        # Get frame data from request
        if 'frame' not in request.files:
            return jsonify({'status': 'error', 'message': 'No frame data provided'}), 400
            
        frame_data = request.files['frame'].read()
        
        # Convert to OpenCV format
        nparr = np.frombuffer(frame_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({'status': 'error', 'message': 'Invalid frame data'}), 400
            
        # Process the frame
        result = game_monitor.process_frame(frame, current_user.id)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error processing frame: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@socketio.on('start_monitoring')
@login_required
def handle_start_monitoring():
    """Handle start monitoring event"""
    try:
        monitor = game_monitor.get_user_monitor(current_user.id)
        monitor['is_monitoring'] = True
        socketio.emit('monitoring_status', {'status': 'active'})
        return {'success': True}
    except Exception as e:
        logger.error(f"Error starting monitoring: {str(e)}")
        return {'success': False, 'error': str(e)}

@socketio.on('stop_monitoring')
@login_required
def handle_stop_monitoring():
    """Handle stop monitoring event"""
    try:
        monitor = game_monitor.get_user_monitor(current_user.id)
        monitor['is_monitoring'] = False
        socketio.emit('monitoring_status', {'status': 'inactive'})
    except Exception as e:
        logger.error(f"Error stopping monitoring: {str(e)}")

@umpire.errorhandler(404)
def page_not_found(error):
    return render_template('error.html', error_code=404, message="Page not found"), 404

@umpire.errorhandler(500)
def internal_server_error(error):
    return render_template('error.html', error_code=500, message="Internal server error"), 500

@umpire.errorhandler(403)
def forbidden(error):
    return render_template('error.html', error_code=403, message="Access forbidden"), 403
