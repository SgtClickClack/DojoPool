"""Computer vision module for DojoPool."""

from dataclasses import dataclass
from typing import List, Optional, Tuple

import cv2
import numpy as np
import torch
import torch.nn as nn

from .shot_recommendation import BallPosition


@dataclass
class DetectedBall:
    """Details of a detected ball."""

    position: Tuple[float, float]  # (x, y) in pixels
    ball_number: int
    confidence: float
    bounding_box: Tuple[int, int, int, int]  # (x1, y1, x2, y2)


class BallDetector(nn.Module):
    """Neural network for ball detection and number recognition."""

    def __init__(self) -> None:
        """Initialize the ball detector network."""
        super().__init__()

        # Feature extraction
        self.features = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(256, 256, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
        )

        # Ball detection head
        self.detection_head = nn.Sequential(
            nn.Conv2d(256, 512, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(512, 5, kernel_size=1),  # x, y, w, h, confidence
        )

        # Ball number classification head
        self.classification_head = nn.Sequential(
            nn.Conv2d(256, 512, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(512, 16, kernel_size=1),  # 16 classes (0-15)
        )


class TableStateAnalyzer:
    """Analyze pool table state using computer vision."""

    def __init__(self) -> None:
        """Initialize the table state analyzer."""
        self.ball_detector = BallDetector()
        self._load_models()
        self._initialize_tracking()

    def _load_models(self):
        """Load trained models and weights."""
        # TODO: Load pre-trained weights
        model_path = "models/ball_detector.pth"
        try:
            state_dict = torch.load(model_path)
            self.ball_detector.load_state_dict(state_dict)
            self.ball_detector.eval()
        except FileNotFoundError:
            print(f"Warning: Model file {model_path} not found")

    def _initialize_tracking(self) -> None:
        """Initialize object tracking."""
        # Initialize OpenCV tracker
        self.tracker = cv2.TrackerCSRT_create()
        self.tracking_initialized = False
        self.tracked_balls = {}

    def preprocess_image(self, image: np.ndarray):
        """Preprocess image for neural network."""
        # Convert to RGB if needed
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_BGRA2RGB)
        elif image.shape[2] == 3 and image.dtype == np.uint8:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Resize to network input size
        image = cv2.resize(image, (640, 480))

        # Normalize
        image = image.astype(np.float32) / 255.0

        # Convert to tensor and add batch dimension
        tensor = torch.from_numpy(image).permute(2, 0, 1).unsqueeze(0)

        return tensor

    def detect_balls(self, image: np.ndarray):
        """Detect balls and their numbers in the image."""
        # Preprocess image
        tensor = self.preprocess_image(image)

        # Run detection
        with torch.no_grad():
            features = self.ball_detector.features(tensor)
            detections = self.ball_detector.detection_head(features)
            classifications = self.ball_detector.classification_head(features)

        # Process detections
        detected_balls = []
        for detection, classification in zip(detections[0], classifications[0]):
            if detection[4] > 0.5:  # Confidence threshold
                x, y, w, h = detection[:4].tolist()
                confidence = detection[4].item()
                ball_number = classification.argmax().item()

                # Convert to image coordinates
                x1 = int(x - w / 2)
                y1 = int(y - h / 2)
                x2 = int(x + w / 2)
                y2 = int(y + h / 2)

                detected_balls.append(
                    DetectedBall(
                        position=(x, y),
                        ball_number=ball_number,
                        confidence=confidence,
                        bounding_box=(x1, y1, x2, y2),
                    )
                )

        return detected_balls

    def track_balls(
        self, image: np.ndarray, detected_balls: Optional[List[DetectedBall]] = None
    ) -> List[DetectedBall]:
        """Track balls across frames."""
        if not self.tracking_initialized and detected_balls:
            # Initialize trackers for each ball
            for ball in detected_balls:
                tracker = cv2.TrackerCSRT_create()
                bbox = ball.bounding_box
                tracker.init(image, bbox)
                self.tracked_balls[ball.ball_number] = {
                    "tracker": tracker,
                    "position": ball.position,
                    "last_seen": 0,
                }
            self.tracking_initialized = True

        # Update tracking
        tracked_balls = []
        for ball_number, data in self.tracked_balls.items():
            success, bbox = data["tracker"].update(image)
            if success:
                x = (bbox[0] + bbox[2]) / 2
                y = (bbox[1] + bbox[3]) / 2
                tracked_balls.append(
                    DetectedBall(
                        position=(x, y),
                        ball_number=ball_number,
                        confidence=1.0,
                        bounding_box=bbox,
                    )
                )
                data["position"] = (x, y)
                data["last_seen"] = 0
            else:
                data["last_seen"] += 1
                if data["last_seen"] > 30:  # Remove if not seen for 30 frames
                    del self.tracked_balls[ball_number]

        return tracked_balls

    def analyze_frame(
        self, image: np.ndarray, table_dimensions: Tuple[float, float] = (100.0, 50.0)
    ) -> List[BallPosition]:
        """Analyze a frame and return normalized ball positions."""
        # Detect balls if tracking not initialized
        if not self.tracking_initialized:
            detected_balls = self.detect_balls(image)
        else:
            detected_balls = self.track_balls(image)

        # Convert to normalized positions
        table_width, table_height = table_dimensions
        image_height, image_width = image.shape[:2]

        ball_positions = []
        for ball in detected_balls:
            x, y = ball.position
            # Convert to normalized coordinates (0-100)
            norm_x = (x / image_width) * table_width
            norm_y = (y / image_height) * table_height

            ball_positions.append(
                BallPosition(x=norm_x, y=norm_y, ball_number=ball.ball_number)
            )

        return ball_positions

    def calibrate_camera(
        self, image: np.ndarray, reference_points: List[Tuple[float, float]]
    ) -> None:
        """Calibrate camera using reference points on the table."""
        # TODO: Implement camera calibration
        # - Detect table corners
        # - Calculate homography matrix
        # - Store calibration parameters
        pass
