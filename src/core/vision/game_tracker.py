"""Game tracking module."""

import cv2
import numpy as np
from typing import List, Dict, Optional
import logging
from datetime import datetime

from .ball_tracker import BallTracker

logger = logging.getLogger(__name__)

class GameTracker:
    """Track game state using ball positions."""
    
    def __init__(self):
        """Initialize the game tracker."""
        self.last_positions = {}
        self.last_update = None
        self.shots = []
        self.current_shot = None
        
    def process(self, balls: List[Dict]) -> List[Dict]:
        """Process ball positions and detect game events."""
        try:
            now = datetime.utcnow()
            events = []
            
            # First update - just store positions
            if not self.last_positions:
                self.last_positions = {
                    ball['color']: ball['position']
                    for ball in balls
                }
                self.last_update = now
                return events
            
            # Calculate ball movements
            movements = {}
            for ball in balls:
                color = ball['color']
                curr_pos = ball['position']
                if color in self.last_positions:
                    prev_pos = self.last_positions[color]
                    dx = curr_pos[0] - prev_pos[0]
                    dy = curr_pos[1] - prev_pos[1]
                    movements[color] = (dx, dy)
            
            # Detect shot events
            if self._is_shot(movements):
                if not self.current_shot:
                    # New shot started
                    self.current_shot = {
                        'start_time': now,
                        'initial_positions': self.last_positions.copy(),
                        'balls_moved': set()
                    }
                    events.append({
                        'type': 'shot_started',
                        'timestamp': now
                    })
                
                # Track which balls moved
                for color, (dx, dy) in movements.items():
                    if abs(dx) > 5 or abs(dy) > 5:  # Movement threshold
                        self.current_shot['balls_moved'].add(color)
            
            elif self.current_shot and self._is_table_static(movements):
                # Shot ended - all balls stopped
                shot_data = {
                    'type': 'shot_completed',
                    'timestamp': now,
                    'duration': (now - self.current_shot['start_time']).total_seconds(),
                    'balls_moved': list(self.current_shot['balls_moved'])
                }
                events.append(shot_data)
                self.shots.append(shot_data)
                self.current_shot = None
            
            # Update state
            self.last_positions = {
                ball['color']: ball['position']
                for ball in balls
            }
            self.last_update = now
            
            return events
            
        except Exception as e:
            logger.error(f"Error processing game state: {str(e)}")
            return []
    
    def _is_shot(self, movements: Dict[str, tuple]) -> bool:
        """Detect if a shot is occurring."""
        if not movements:
            return False
        
        # Look for significant ball movement
        for dx, dy in movements.values():
            if abs(dx) > 10 or abs(dy) > 10:  # Movement threshold
                return True
        
        return False
    
    def _is_table_static(self, movements: Dict[str, tuple]) -> bool:
        """Check if all balls have stopped moving."""
        if not movements:
            return True
        
        # Check if any ball is still moving
        for dx, dy in movements.values():
            if abs(dx) > 2 or abs(dy) > 2:  # Static threshold
                return False
        
        return True
    
    def get_shot_history(self) -> List[Dict]:
        """Get history of shots in the game."""
        return self.shots.copy()
    
    def reset(self):
        """Reset game tracking state."""
        self.last_positions = {}
        self.last_update = None
        self.shots = []
        self.current_shot = None 