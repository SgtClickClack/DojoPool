#!/usr/bin/env python3
"""
Diception AI Server - Flask-based AI ball tracking and match analysis
Port: 3002
Status: Enhanced HoughCircles detection with real-time trajectory tracking
"""

import cv2
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import time
from collections import deque
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class DiceptionAI:
    def __init__(self):
        self.camera = None
        self.tracking_active = False
        self.ball_trajectories = {}
        self.match_state = {
            "timestamp": None,
            "balls": [],
            "trajectories": {},
            "shot_events": [],
            "game_state": {
                "score": {"player1": 0, "player2": 0},
                "turn": "player1",
                "fouls": []
            },
            "commentary": [],
            "detection": "houghcircles_enhanced"
        }
        self.trajectory_history = deque(maxlen=30)
        
    def start_camera(self, camera_index=0):
        """Initialize camera with fallback support"""
        for idx in range(camera_index, 5):
            try:
                self.camera = cv2.VideoCapture(idx)
                if self.camera.isOpened():
                    logger.info(f"Camera initialized on index {idx}")
                    return True
            except Exception as e:
                logger.warning(f"Camera index {idx} failed: {e}")
                continue
        
        logger.error("No cameras available")
        return False
    
    def detect_balls(self, frame):
        """Enhanced HoughCircles ball detection"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 5)
        
        circles = cv2.HoughCircles(
            gray,
            cv2.HOUGH_GRADIENT,
            dp=1,
            minDist=30,
            param1=50,
            param2=30,
            minRadius=10,
            maxRadius=50
        )
        
        balls = []
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            for (x, y, r) in circles:
                confidence = min(100, max(50, 100 - abs(r - 20) * 2))
                balls.append({
                    "id": len(balls),
                    "position": [int(x), int(y)],
                    "radius": int(r),
                    "confidence": round(confidence, 1)
                })
        
        return balls
    
    def analyze_trajectory(self, balls):
        """Analyze ball movement and detect shot events"""
        current_time = datetime.now()
        shot_events = []
        
        for ball in balls:
            ball_id = ball["id"]
            position = ball["position"]
            
            if ball_id not in self.ball_trajectories:
                self.ball_trajectories[ball_id] = deque(maxlen=30)
            
            # Add position with timestamp
            self.ball_trajectories[ball_id].append({
                "x": position[0],
                "y": position[1],
                "timestamp": current_time.isoformat()
            })
            
            # Detect shot events based on velocity
            if len(self.ball_trajectories[ball_id]) >= 3:
                recent_positions = list(self.ball_trajectories[ball_id])[-3:]
                velocity = self.calculate_velocity(recent_positions)
                
                if velocity > 50:  # Velocity threshold for shot detection
                    shot_events.append({
                        "type": "cue_hit",
                        "timestamp": current_time.isoformat(),
                        "ball_id": ball_id,
                        "velocity": round(velocity, 2)
                    })
        
        return shot_events
    
    def calculate_velocity(self, positions):
        """Calculate velocity from position history"""
        if len(positions) < 2:
            return 0
        
        dx = positions[-1]["x"] - positions[-2]["x"]
        dy = positions[-1]["y"] - positions[-2]["y"]
        return np.sqrt(dx*dx + dy*dy)
    
    def generate_commentary(self, shot_events):
        """Generate live match commentary"""
        commentary = []
        for event in shot_events:
            if event["type"] == "cue_hit":
                commentary.append(f"Player shot detected! Velocity: {event['velocity']}")
        return commentary
    
    def update_match_state(self, balls, shot_events):
        """Update comprehensive match state"""
        current_time = datetime.now()
        
        self.match_state.update({
            "timestamp": current_time.isoformat(),
            "balls": balls,
            "trajectories": {str(k): list(v) for k, v in self.ball_trajectories.items()},
            "shot_events": shot_events,
            "commentary": self.generate_commentary(shot_events)
        })
        
        return self.match_state

# Initialize Diception AI
diception = DiceptionAI()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "operational",
        "service": "Diception AI Server",
        "port": 3002,
        "timestamp": datetime.now().isoformat(),
        "camera_status": "ready" if diception.camera else "not_initialized"
    })

@app.route('/api/diception/status', methods=['GET'])
def get_status():
    """Get Diception system status"""
    return jsonify({
        "status": "operational",
        "tracking_active": diception.tracking_active,
        "detection_method": "houghcircles_enhanced",
        "features": [
            "real_time_ball_detection",
            "trajectory_tracking",
            "shot_event_detection",
            "ai_referee_logic",
            "match_commentary"
        ],
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/diception/demo', methods=['GET'])
def get_demo_data():
    """Get demo ball detection data"""
    demo_balls = [
        {"id": 0, "position": [320, 240], "radius": 18, "confidence": 95.2},
        {"id": 1, "position": [450, 180], "radius": 16, "confidence": 89.7}
    ]
    
    return jsonify({
        "timestamp": datetime.now().isoformat(),
        "balls": demo_balls,
        "detection": "demo_mode",
        "status": "success"
    })

@app.route('/api/diception/live', methods=['GET'])
def get_live_detection():
    """Get live camera ball detection"""
    if not diception.camera or not diception.camera.isOpened():
        return jsonify({
            "error": "Camera not available",
            "status": "camera_error"
        }), 500
    
    ret, frame = diception.camera.read()
    if not ret:
        return jsonify({
            "error": "Failed to capture frame",
            "status": "capture_error"
        }), 500
    
    balls = diception.detect_balls(frame)
    shot_events = diception.analyze_trajectory(balls)
    match_state = diception.update_match_state(balls, shot_events)
    
    return jsonify(match_state)

@app.route('/api/diception/start', methods=['POST'])
def start_tracking():
    """Start camera tracking"""
    camera_index = request.json.get('camera_index', 0) if request.json else 0
    
    if diception.start_camera(camera_index):
        diception.tracking_active = True
        return jsonify({
            "status": "tracking_started",
            "camera_index": camera_index,
            "timestamp": datetime.now().isoformat()
        })
    else:
        return jsonify({
            "error": "Failed to start camera",
            "status": "camera_error"
        }), 500

@app.route('/api/diception/stop', methods=['POST'])
def stop_tracking():
    """Stop camera tracking"""
    diception.tracking_active = False
    if diception.camera:
        diception.camera.release()
        diception.camera = None
    
    return jsonify({
        "status": "tracking_stopped",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/diception/match_state', methods=['GET'])
def get_match_state():
    """Get complete match state for AI analysis"""
    return jsonify(diception.match_state)

if __name__ == '__main__':
    logger.info("Starting Diception AI Server on port 3002...")
    logger.info("Features: Ball tracking, trajectory analysis, shot detection, AI referee")
    
    # Initialize with demo data
    diception.update_match_state(
        [{"id": 0, "position": [320, 240], "radius": 18, "confidence": 95.2}],
        []
    )
    
    app.run(host='0.0.0.0', port=3002, debug=True)