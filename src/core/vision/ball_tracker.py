import cv2
import numpy as np
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class BallTracker:
    """Track pool balls using computer vision."""
    
    def __init__(self):
        """Initialize the ball tracker."""
        self.min_radius = 10
        self.max_radius = 30
        self.min_circularity = 0.8
        self.min_area = 100
        self.max_area = 1000
        
        # Ball color ranges in HSV
        self.color_ranges = {
            'white': [(0, 0, 200), (180, 30, 255)],  # Cue ball
            'yellow': [(20, 100, 100), (30, 255, 255)],  # 1, 9
            'blue': [(100, 100, 100), (120, 255, 255)],  # 2, 10
            'red': [(0, 100, 100), (10, 255, 255)],  # 3, 11
            'purple': [(140, 100, 100), (160, 255, 255)],  # 4, 12
            'orange': [(10, 100, 100), (20, 255, 255)],  # 5, 13
            'green': [(60, 100, 100), (80, 255, 255)],  # 6, 14
            'brown': [(10, 50, 50), (20, 150, 150)],  # 7, 15
            'black': [(0, 0, 0), (180, 255, 30)]  # 8
        }
    
    def track(self, frame: np.ndarray) -> List[Dict]:
        """Track balls in a frame."""
        try:
            # Convert to HSV
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            
            balls = []
            
            # Detect balls of each color
            for color, (lower, upper) in self.color_ranges.items():
                # Create mask for this color
                lower = np.array(lower)
                upper = np.array(upper)
                mask = cv2.inRange(hsv, lower, upper)
                
                # Find contours
                contours, _ = cv2.findContours(
                    mask,
                    cv2.RETR_EXTERNAL,
                    cv2.CHAIN_APPROX_SIMPLE
                )
                
                # Process each contour
                for contour in contours:
                    area = cv2.contourArea(contour)
                    if area < self.min_area or area > self.max_area:
                        continue
                    
                    # Check circularity
                    perimeter = cv2.arcLength(contour, True)
                    if perimeter == 0:
                        continue
                    circularity = 4 * np.pi * area / (perimeter * perimeter)
                    if circularity < self.min_circularity:
                        continue
                    
                    # Get ball position
                    M = cv2.moments(contour)
                    if M['m00'] == 0:
                        continue
                    x = int(M['m10'] / M['m00'])
                    y = int(M['m01'] / M['m00'])
                    
                    # Calculate radius
                    _, radius = cv2.minEnclosingCircle(contour)
                    if radius < self.min_radius or radius > self.max_radius:
                        continue
                    
                    # Add ball to list
                    balls.append({
                        'color': color,
                        'position': (x, y),
                        'radius': radius,
                        'area': area
                    })
            
            return balls
            
        except Exception as e:
            logger.error(f"Error tracking balls: {str(e)}")
            return []
    
    def set_color_range(self, color: str, lower: tuple, upper: tuple):
        """Set HSV color range for a ball color."""
        if color not in self.color_ranges:
            raise ValueError(f"Invalid color: {color}")
        self.color_ranges[color] = [lower, upper]
    
    def calibrate(self, frame: np.ndarray, color: str, roi: tuple) -> bool:
        """Calibrate color range using a region of interest."""
        try:
            # Extract ROI
            x, y, w, h = roi
            roi = frame[y:y+h, x:x+w]
            
            # Convert to HSV
            hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
            
            # Calculate color range
            hsv_mean = cv2.mean(hsv)
            hsv_std = cv2.meanStdDev(hsv)[1]
            
            # Set color range with tolerance
            tolerance = 2.0  # Standard deviations
            lower = tuple(max(0, m - tolerance * s) for m, s in zip(hsv_mean, hsv_std))
            upper = tuple(min(255, m + tolerance * s) for m, s in zip(hsv_mean, hsv_std))
            
            self.set_color_range(color, lower[:3], upper[:3])
            return True
            
        except Exception as e:
            logger.error(f"Calibration error: {str(e)}")
            return False 