"""Game monitoring module."""

import cv2
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional
from threading import Thread, Lock
from queue import Queue
import logging

from src.core.models import Game, db
from src.core.vision.camera import PoolCamera
from src.core.vision.ball_tracker import BallTracker
from src.core.vision.game_tracker import GameTracker

logger = logging.getLogger(__name__)

class GameMonitor:
    """Monitor and track pool games using computer vision."""
    
    def __init__(self):
        """Initialize the game monitor."""
        self.active_games: Dict[int, Dict] = {}  # game_id -> game_data
        self.camera = None
        self.ball_tracker = None
        self.game_tracker = None
        self.is_running = False
        self.frame_queue = Queue(maxsize=30)  # Buffer 1 second of frames at 30fps
        self.lock = Lock()
        self.processing_thread = None
        
    def start_game_tracking(self, game_id: int, venue_id: int) -> bool:
        """Start tracking a game."""
        with self.lock:
            if game_id in self.active_games:
                logger.warning(f"Game {game_id} is already being tracked")
                return False
            
            # Initialize components if needed
            if not self.camera:
                self.camera = PoolCamera()
            if not self.ball_tracker:
                self.ball_tracker = BallTracker()
            if not self.game_tracker:
                self.game_tracker = GameTracker()
            
            # Start camera if not running
            if not self.camera.is_running:
                success = self.camera.start()
                if not success:
                    logger.error("Failed to start camera")
                    return False
            
            # Add game to active games
            self.active_games[game_id] = {
                'venue_id': venue_id,
                'start_time': datetime.utcnow(),
                'events': []
            }
            
            # Start processing thread if not running
            if not self.is_running:
                self.is_running = True
                self.processing_thread = Thread(target=self._process_frames)
                self.processing_thread.daemon = True
                self.processing_thread.start()
            
            return True
    
    def stop_game_tracking(self, game_id: int) -> bool:
        """Stop tracking a game."""
        with self.lock:
            if game_id not in self.active_games:
                logger.warning(f"Game {game_id} is not being tracked")
                return False
            
            # Remove game from active games
            del self.active_games[game_id]
            
            # Stop processing if no active games
            if not self.active_games:
                self.is_running = False
                if self.camera:
                    self.camera.stop()
            
            return True
    
    def _process_frames(self):
        """Process frames from the camera."""
        while self.is_running:
            # Get frame from camera
            frame = self.camera.get_frame()
            if frame is None:
                continue
            
            # Add frame to queue
            if not self.frame_queue.full():
                self.frame_queue.put(frame)
            
            # Process frame for each active game
            with self.lock:
                for game_id, game_data in self.active_games.items():
                    # Track balls
                    balls = self.ball_tracker.track(frame)
                    
                    # Update game state
                    events = self.game_tracker.process(balls)
                    
                    # Store events
                    game_data['events'].extend(events)
                    
                    # Update game in database if needed
                    if events:
                        self._update_game_state(game_id, events[-1])
    
    def _update_game_state(self, game_id: int, event: Dict):
        """Update game state in database."""
        try:
            game = Game.query.get(game_id)
            if game:
                # Update game based on event
                if event['type'] == 'shot':
                    game.shots_taken += 1
                elif event['type'] == 'score':
                    game.score += event['points']
                
                db.session.commit()
        except Exception as e:
            logger.error(f"Error updating game state: {str(e)}")
    
    def get_game_events(self, game_id: Optional[int] = None) -> List[Dict]:
        """Get events for a game or all active games."""
        with self.lock:
            if game_id is not None:
                if game_id not in self.active_games:
                    return []
                return self.active_games[game_id]['events']
            
            # Return events for all games
            all_events = []
            for game_data in self.active_games.values():
                all_events.extend(game_data['events'])
            return sorted(all_events, key=lambda e: e['timestamp'])
    
    def calibrate_table(self, venue_id: int, corners: List[List[float]]) -> bool:
        """Calibrate table detection for a venue."""
        try:
            # Convert corners to numpy array
            corners = np.array(corners, dtype=np.float32)
            
            # Calculate homography matrix
            table_corners = np.array([
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 1]
            ], dtype=np.float32)
            
            matrix = cv2.getPerspectiveTransform(corners, table_corners)
            
            # Store calibration data
            with self.lock:
                self.calibration_data = {
                    'venue_id': venue_id,
                    'matrix': matrix
                }
            
            return True
        except Exception as e:
            logger.error(f"Calibration error: {str(e)}")
            return False 