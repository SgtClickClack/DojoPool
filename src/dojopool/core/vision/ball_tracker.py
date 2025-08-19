"""Pool ball tracking and detection module."""

import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict, cast, Any
from dataclasses import dataclass
from numpy.typing import NDArray


@dataclass
class Ball:
    """Represents a detected pool ball."""

    id: int  # Ball number (0 for cue ball)
    position: Tuple[float, float]  # (x, y) in normalized coordinates
    confidence: float  # Detection confidence score
    color: Tuple[int, int, int]  # RGB color
    radius: float  # Detected radius in pixels


class BallTracker:
    """Tracks pool balls using computer vision."""

    def __init__(
        self,
        table_calibration: Optional[Dict[str, float]] = None,
        ball_diameter_mm: float = 57.0,
        min_confidence: float = 0.7,
    ):
        """Initialize the ball tracker.

        Args:
            table_calibration: Calibration data for the pool table
            ball_diameter_mm: Diameter of pool balls in millimeters
            min_confidence: Minimum confidence threshold for detections
        """
        self.table_calibration = table_calibration
        self.ball_diameter_mm = ball_diameter_mm
        self.min_confidence = min_confidence

        # Initialize ball color templates
        self.ball_colors: Dict[int, Tuple[int, int, int]] = {
            0: (255, 255, 255),  # Cue ball
            1: (255, 255, 0),  # Yellow
            2: (0, 0, 255),  # Blue
            3: (255, 0, 0),  # Red
            4: (128, 0, 128),  # Purple
            5: (255, 165, 0),  # Orange
            6: (0, 255, 0),  # Green
            7: (128, 0, 0),  # Maroon
            8: (0, 0, 0),  # Black
            9: (255, 255, 0),  # Yellow striped
            10: (0, 0, 255),  # Blue striped
            11: (255, 0, 0),  # Red striped
            12: (128, 0, 128),  # Purple striped
            13: (255, 165, 0),  # Orange striped
            14: (0, 255, 0),  # Green striped
            15: (128, 0, 0),  # Maroon striped
        }

    def detect_balls(self, frame: NDArray[np.uint8]) -> List[Ball]:
        """Detect pool balls in the frame.

        Args:
            frame: Input image frame in BGR format

        Returns:
            List of detected Ball objects
        """
        # Convert to HSV for better color detection
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # Detect circles using Hough transform
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        circles = cv2.HoughCircles(
            gray,
            cv2.HOUGH_GRADIENT,
            dp=1,
            minDist=int(self.ball_diameter_mm / 2),
            param1=30,  # Reduced from 50 for better sensitivity
            param2=20,  # Reduced from 30 for better sensitivity
            minRadius=max(10, int(self.ball_diameter_mm / 3)),
            maxRadius=min(50, int(self.ball_diameter_mm * 1.5)),
        )

        detected_balls = []
        if circles is not None:
            # Convert circles to integer coordinates
            circles = np.round(circles).astype(np.int32)

            for circle in circles[0]:
                x, y, radius = circle

                # Extract color from circle region
                mask = np.zeros(frame.shape[:2], dtype=np.uint8)
                cv2.circle(mask, (x, y), int(radius * 0.8), (255,), -1)
                mean_color = cast(Tuple[float, float, float], cv2.mean(frame, mask=mask)[:3])

                # Find closest matching ball color
                ball_id, confidence = self._identify_ball(mean_color)

                if confidence >= self.min_confidence:
                    # Convert to normalized coordinates if calibration exists
                    norm_pos = (
                        self._normalize_position((float(x), float(y)))
                        if self.table_calibration
                        else (float(x), float(y))
                    )

                    detected_balls.append(
                        Ball(
                            id=ball_id,
                            position=norm_pos,
                            confidence=confidence,
                            color=self.ball_colors[ball_id],
                            radius=float(radius),
                        )
                    )

        return detected_balls

    def _identify_ball(self, color: Tuple[float, float, float]) -> Tuple[int, float]:
        """Identify ball number based on color.

        Args:
            color: BGR color tuple

        Returns:
            Tuple of (ball_id, confidence)
        """
        # Special case for white ball (high value, low saturation)
        brightness = sum(color) / 3.0
        max_diff = max(abs(c - brightness) for c in color)
        if brightness > 200 and max_diff < 30:
            return 0, 0.9  # Cue ball with high confidence

        # Convert color formats
        color_array = np.array([[[color[0], color[1], color[2]]]], dtype=np.uint8)
        target_hsv = cv2.cvtColor(color_array, cv2.COLOR_BGR2HSV)[0, 0]

        best_match = 0
        best_confidence = 0.0

        for ball_id, rgb in self.ball_colors.items():
            if ball_id == 0:  # Skip cue ball, handled above
                continue

            # Convert template color to HSV
            bgr = (rgb[2], rgb[1], rgb[0])  # RGB to BGR
            template_array = np.array([[[bgr[0], bgr[1], bgr[2]]]], dtype=np.uint8)
            template_hsv = cv2.cvtColor(template_array, cv2.COLOR_BGR2HSV)[0, 0]

            # Calculate color similarity
            h_diff = (
                min(
                    abs(int(target_hsv[0]) - int(template_hsv[0])),
                    180 - abs(int(target_hsv[0]) - int(template_hsv[0])),
                )
                / 180.0
            )
            s_diff = abs(float(target_hsv[1]) - float(template_hsv[1])) / 255.0
            v_diff = abs(float(target_hsv[2]) - float(template_hsv[2])) / 255.0

            # Weight hue more heavily than saturation and value
            confidence = 1.0 - (0.6 * h_diff + 0.2 * s_diff + 0.2 * v_diff)

            if confidence > best_confidence:
                best_match = ball_id
                best_confidence = confidence

        return best_match, best_confidence

    def _normalize_position(self, pos: Tuple[float, float]) -> Tuple[float, float]:
        """Convert pixel coordinates to normalized table coordinates.

        Args:
            pos: (x, y) position in pixels

        Returns:
            Normalized (x, y) coordinates in range [0, 1]
        """
        if not self.table_calibration:
            return pos

        # TODO: Implement perspective transform using table_calibration
        # For now, just return simple normalization
        x, y = pos
        return (
            x / self.table_calibration.get("width", 1.0),
            y / self.table_calibration.get("height", 1.0),
        )
