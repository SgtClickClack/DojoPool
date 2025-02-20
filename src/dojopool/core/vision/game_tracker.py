from multiprocessing import Pool
from multiprocessing import Pool
"""Game-specific vision tracking implementation."""

import logging
from datetime import datetime
from typing import Any, Dict, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class GameTracker:
    """Track game-specific events using computer vision."""

    def __init__(self):
        """Initialize the game tracker."""
        self.calibration_matrix = None
        self.pocket_locations = None
        self.last_ball_positions = {}
        self.shot_detection_threshold = 0.1  # Minimum speed for shot detection
        self.pocket_detection_radius = 30  # Pixels around pocket for detection

    def calibrate(self, frame: np.ndarray, corners: Dict[str, Any]) -> bool:
        """Calibrate the game tracker with table corners and pocket locations.

        Args:
            frame: Current video frame
            corners: Dictionary containing table corners and pocket locations

        Returns:
            bool: True if calibration successful
        """
        try:
            # Convert table corners to numpy array
            table_corners = np.array(corners["table"], dtype=np.float32)

            # Calculate perspective transform matrix
            table_rect = np.array(
                [[0, 0], [1000, 0], [1000, 500], [0, 500]], dtype=np.float32
            )

            self.calibration_matrix = cv2.getPerspectiveTransform(
                table_corners, table_rect
            )

            # Store pocket locations
            self.pocket_locations = corners.get("pockets", [])

            return True

        except Exception as e:
            logger.error(f"Calibration error: {str(e)}")
            return False

    def detect_shot(
        self, frame: np.ndarray, ball_positions: Dict[int, Dict[str, float]]
    ):
        """Detect if a shot has been taken.

        Args:
            frame: Current video frame
            ball_positions: Current positions of all balls

        Returns:
            Optional[Dict]: Shot data if detected, None otherwise
        """
        if not ball_positions or not self.last_ball_positions:
            self.last_ball_positions = ball_positions.copy()
            return None

        # Calculate ball velocities
        max_velocity = 0
        moving_ball = None

        for ball_id, pos in ball_positions.items():
            if ball_id in self.last_ball_positions:
                last_pos = self.last_ball_positions[ball_id]
                dx = pos["x"] - last_pos["x"]
                dy = pos["y"] - last_pos["y"]
                velocity = (dx * dx + dy * dy) ** 0.5

                if velocity > max_velocity:
                    max_velocity = velocity
                    moving_ball = ball_id

        # Update last positions
        self.last_ball_positions = ball_positions.copy()

        # Detect shot based on sudden ball movement
        if max_velocity > self.shot_detection_threshold:
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "ball_id": moving_ball,
                "velocity": max_velocity,
                "direction": {
                    "x": dx / max_velocity if max_velocity > 0 else 0,
                    "y": dy / max_velocity if max_velocity > 0 else 0,
                },
            }

        return None

    def detect_pocketed_balls(
        self, frame: np.ndarray, ball_positions: Dict[int, Dict[str, float]]
    ) -> Optional[Dict]:
        """Detect if any balls have been pocketed.

        Args:
            frame: Current video frame
            ball_positions: Current positions of all balls

        Returns:
            Optional[Dict]: Pocket data if ball pocketed, None otherwise
        """
        if not self.pocket_locations or not self.last_ball_positions:
            return None

        # Check for balls that were present but are now missing
        for ball_id, last_pos in self.last_ball_positions.items():
            if ball_id not in ball_positions:
                # Ball disappeared - check if near a pocket
                for pocket_idx, pocket_pos in enumerate(self.pocket_locations):
                    dx = last_pos["x"] - pocket_pos["x"]
                    dy = last_pos["y"] - pocket_pos["y"]
                    distance = (dx * dx + dy * dy) ** 0.5

                    if distance < self.pocket_detection_radius:
                        return {
                            "timestamp": datetime.utcnow().isoformat(),
                            "ball_number": ball_id,
                            "pocket_number": pocket_idx,
                            "position": {"x": last_pos["x"], "y": last_pos["y"]},
                        }

        return None

    def detect_fouls(
        self,
        frame: np.ndarray,
        ball_positions: Dict[int, Dict[str, float]],
        last_shot: Optional[Dict],
    ) -> Optional[Dict]:
        """Detect various types of fouls.

        Args:
            frame: Current video frame
            ball_positions: Current positions of all balls
            last_shot: Data about the last detected shot

        Returns:
            Optional[Dict]: Foul data if detected, None otherwise
        """
        if not last_shot or not self.last_ball_positions:
            return None

        foul_data = None

        # Detect cue ball scratch
        if 0 in self.last_ball_positions and 0 not in ball_positions:
            foul_data = {
                "type": "scratch",
                "timestamp": datetime.utcnow().isoformat(),
                "details": "Cue ball pocketed",
            }

        # Detect no rail contact after object ball hit
        elif last_shot and len(ball_positions) == len(self.last_ball_positions):
            # Implementation depends on rail detection capability
            pass

        # Detect wrong ball first hit
        # Implementation depends on game type and current player's ball group

        return foul_data

    def transform_coordinates(self, point: Tuple[float, float]):
        """Transform coordinates using calibration matrix.

        Args:
            point: Point to transform (x, y)

        Returns:
            Tuple[float, float]: Transformed coordinates
        """
        if self.calibration_matrix is None:
            return point

        transformed = cv2.perspectiveTransform(
            np.array([[[point[0], point[1]]]], dtype=np.float32),
            self.calibration_matrix,
        )
        return (transformed[0][0][0], transformed[0][0][1])
