import gc
import gc
"""AI-powered pool game tracking system."""

import logging
import threading
from collections import deque
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class BallPosition:
    """Ball position with metadata."""

    ball_id: int
    x: float
    y: float
    confidence: float
    timestamp: datetime


@dataclass
class Shot:
    """Shot detection with metadata."""

    shot_id: str
    start_time: datetime
    end_time: Optional[datetime]
    ball_positions: List[BallPosition]
    is_valid: bool
    type: str  # 'break', 'normal', 'jump', 'bank'
    pocketed_balls: Set[int]
    foul_detected: bool
    confidence: float


class TableCalibration:
    """Pool table calibration data."""

    def __init__(self, corners: np.ndarray, dimensions: Tuple[float, float]):
        """Initialize calibration."""
        self.corners = corners  # Table corner points in image space
        self.dimensions = dimensions  # Real-world table dimensions (width, height)
        # Convert corners to float32 before passing to getPerspectiveTransform
        corners_float32 = corners.astype(np.float32)
        target_corners = np.float32(
            [
                [0, 0],
                [dimensions[0], 0],
                [dimensions[0], dimensions[1]],
                [0, dimensions[1]],
            ]
        )
        self.transform = cv2.getPerspectiveTransform(corners_float32, target_corners)

    def image_to_table(self, point: np.ndarray) -> np.ndarray:
        """Convert image coordinates to table coordinates."""
        point = np.array([point], dtype=np.float32)
        transformed = cv2.perspectiveTransform(point[None, :, :], self.transform)
        return transformed[0, 0].astype(np.float32)


class BallTracker:
    """Track pool balls using computer vision."""

    def __init__(self, calibration: TableCalibration):
        """Initialize tracker."""
        self.calibration = calibration
        self._ball_detector = self._create_ball_detector()
        self._position_history: Dict[int, deque[Tuple[float, float, datetime]]] = {}
        self._lock = threading.Lock()

    def _create_ball_detector(self):
        """Create ball detection model."""
        # Load YOLOv4 model trained on pool ball dataset
        model = cv2.dnn.readNet(
            "models/yolov4-pool-balls.weights", "models/yolov4-pool-balls.cfg"
        )
        model.setPreferableBackend(cv2.dnn.DNN_BACKEND_CUDA)
        model.setPreferableTarget(cv2.dnn.DNN_TARGET_CUDA)
        return model

    def detect_balls(self, frame: np.ndarray) -> List[BallPosition]:
        """Detect and track balls in frame."""
        # Preprocess frame
        blob = cv2.dnn.blobFromImage(
            frame, 1 / 255.0, (416, 416), swapRB=True, crop=False
        )
        self._ball_detector.setInput(blob)

        # Run detection
        detections = self._ball_detector.forward()

        # Process detections
        balls: List[BallPosition] = []
        height, width = frame.shape[:2]

        for detection in detections:
            confidence = detection[4]
            if confidence > 0.5:  # Confidence threshold
                # Get ball position
                center_x = int(detection[0] * width)
                center_y = int(detection[1] * height)

                # Convert to table coordinates
                table_pos = self.calibration.image_to_table(
                    np.array([center_x, center_y])
                )

                # Get ball ID from class prediction
                class_scores = detection[5:]
                ball_id = int(np.argmax(class_scores))  # Convert to int

                balls.append(
                    BallPosition(
                        ball_id=ball_id,
                        x=float(table_pos[0]),
                        y=float(table_pos[1]),
                        confidence=float(confidence),
                        timestamp=datetime.now(),
                    )
                )

        # Update position history
        with self._lock:
            for ball in balls:
                if ball.ball_id not in self._position_history:
                    self._position_history[ball.ball_id] = deque(maxlen=100)
                self._position_history[ball.ball_id].append(
                    (ball.x, ball.y, ball.timestamp)
                )

        return balls


class ShotDetector:
    """Detect and analyze pool shots."""

    def __init__(self, calibration: TableCalibration):
        """Initialize detector."""
        self.calibration = calibration
        self._current_shot: Optional[Shot] = None
        self._shot_positions: List[BallPosition] = []
        self._motion_threshold = 0.1  # meters/second
        self._lock = threading.Lock()

    def process_frame(
        self,
        balls: List[BallPosition],
        previous_balls: Optional[List[BallPosition]] = None,
    ) -> Optional[Shot]:
        """Process frame and detect shots."""
        with self._lock:
            if not previous_balls:
                return None

            # Calculate ball velocities
            max_velocity = 0.0
            for ball in balls:
                prev_ball = next(
                    (b for b in previous_balls if b.ball_id == ball.ball_id), None
                )
                if prev_ball:
                    dt = (ball.timestamp - prev_ball.timestamp).total_seconds()
                    if dt > 0:
                        dx = ball.x - prev_ball.x
                        dy = ball.y - prev_ball.y
                        velocity = np.sqrt(dx * dx + dy * dy) / dt
                        max_velocity = max(max_velocity, velocity)

            # Shot detection logic
            if max_velocity > self._motion_threshold:
                if not self._current_shot:
                    # Start new shot
                    self._current_shot = Shot(
                        shot_id=f"shot_{datetime.now().timestamp()}",
                        start_time=datetime.now(),
                        end_time=None,
                        ball_positions=[],
                        is_valid=True,
                        type="normal",
                        pocketed_balls=set(),
                        foul_detected=False,
                        confidence=1.0,
                    )

                # Add positions to current shot
                if self._current_shot:
                    self._current_shot.ball_positions.extend(balls)
            elif self._current_shot:
                # End current shot
                self._current_shot.end_time = datetime.now()
                shot = self._current_shot
                self._current_shot = None
                return shot

            return None


class GameTracker:
    """Track pool game state and enforce rules."""

    def __init__(
        self,
        camera_id: int,
        table_corners: np.ndarray,
        table_dimensions: Tuple[float, float],
    ):
        """Initialize game tracker."""
        self.camera_id = camera_id
        self.calibration = TableCalibration(table_corners, table_dimensions)
        self.ball_tracker = BallTracker(self.calibration)
        self.shot_detector = ShotDetector(self.calibration)

        self._capture = cv2.VideoCapture(camera_id)
        self._previous_balls: Optional[List[BallPosition]] = None
        self._running = False
        self._lock = threading.Lock()
        self._shots: List[Shot] = []

    def start(self) -> None:
        """Start game tracking."""
        with self._lock:
            if self._running:
                return
            self._running = True
            self._tracking_thread = threading.Thread(
                target=self._track_loop, daemon=True
            )
            self._tracking_thread.start()

    def stop(self):
        """Stop game tracking."""
        with self._lock:
            self._running = False
            if hasattr(self, "_tracking_thread"):
                self._tracking_thread.join()
            self._capture.release()

    def _track_loop(self):
        """Main tracking loop."""
        while self._running:
            try:
                # Capture frame
                ret, frame = self._capture.read()
                if not ret:
                    logger.error("Failed to capture frame")
                    continue

                # Detect balls
                balls = self.ball_tracker.detect_balls(frame)

                # Detect shots
                if self._previous_balls:
                    shot = self.shot_detector.process_frame(balls, self._previous_balls)
                    if shot:
                        self._shots.append(shot)

                self._previous_balls = balls

            except Exception as e:
                logger.error(f"Error in tracking loop: {e}")
                continue

    def get_shots(self):
        """Get list of detected shots."""
        with self._lock:
            return self._shots.copy()

    def get_ball_positions(self) -> Optional[List[BallPosition]]:
        """Get current ball positions."""
        with self._lock:
            return self._previous_balls
