import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class CameraConfig:
    """Camera configuration settings."""

    device_id: int
    width: int = 1920
    height: int = 1080
    fps: int = 30
    exposure: float = -3.0  # Negative values for auto-exposure
    gain: float = 1.0


class PoolTableCalibration:
    """Pool table calibration data and methods."""

    def __init__(self):
        self.corners: List[Tuple[int, int]] = []
        self.homography_matrix: Optional[np.ndarray] = None
        self.table_dimensions: Tuple[float, float] = (2.54, 1.27)  # Standard table in meters

    def add_corner(self, x: int, y: int):
        """Add a corner point during calibration."""
        if len(self.corners) < 4:
            self.corners.append((x, y))
            return True
        return False

    def calculate_homography(self):
        """Calculate homography matrix from corner points."""
        if len(self.corners) != 4:
            raise ValueError("Need exactly 4 corner points for calibration")

        # Source points (corners in image)
        src_pts = np.float32(self.corners)

        # Destination points (corners in real-world coordinates)
        dst_pts = np.float32(
            [
                [0, 0],
                [self.table_dimensions[0], 0],
                [self.table_dimensions[0], self.table_dimensions[1]],
                [0, self.table_dimensions[1]],
            ]
        )

        self.homography_matrix = cv2.findHomography(src_pts, dst_pts)[0]
        return self.homography_matrix

    def image_to_table_coords(self, point: Tuple[int, int]) -> Tuple[float, float]:
        """Convert image coordinates to table coordinates."""
        if self.homography_matrix is None:
            raise ValueError("Table not calibrated")

        point_array = np.float32([point]).reshape(-1, 1, 2)
        transformed = cv2.perspectiveTransform(point_array, self.homography_matrix)
        return tuple(transformed[0][0])


class PoolCamera:
    """Camera management for pool table tracking."""

    def __init__(self, config: CameraConfig):
        self.config = config
        self.camera = None
        self.calibration = PoolTableCalibration()
        self.is_running = False

    def initialize(self) -> bool:
        """Initialize camera with configuration."""
        try:
            self.camera = cv2.VideoCapture(self.config.device_id)

            # Set camera properties
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, self.config.width)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config.height)
            self.camera.set(cv2.CAP_PROP_FPS, self.config.fps)
            self.camera.set(cv2.CAP_PROP_EXPOSURE, self.config.exposure)
            self.camera.set(cv2.CAP_PROP_GAIN, self.config.gain)

            # Verify camera is working
            if not self.camera.isOpened():
                raise RuntimeError("Failed to open camera")

            self.is_running = True
            logger.info(f"Camera initialized: {self.get_camera_info()}")
            return True

        except Exception as e:
            logger.error(f"Camera initialization failed: {str(e)}")
            return False

    def get_camera_info(self) -> dict:
        """Get current camera settings."""
        if not self.camera:
            return {}

        return {
            "width": int(self.camera.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(self.camera.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            "fps": int(self.camera.get(cv2.CAP_PROP_FPS)),
            "exposure": self.camera.get(cv2.CAP_PROP_EXPOSURE),
            "gain": self.camera.get(cv2.CAP_PROP_GAIN),
        }

    def capture_frame(self) -> Optional[np.ndarray]:
        """Capture a single frame from the camera."""
        if not self.is_running:
            return None

        ret, frame = self.camera.read()
        if not ret:
            logger.error("Failed to capture frame")
            return None

        return frame

    def start_calibration(self):
        """Start table calibration process."""
        self.calibration = PoolTableCalibration()
        logger.info("Starting table calibration")

    def add_calibration_point(self, x: int, y: int) -> bool:
        """Add a calibration point for table corners."""
        success = self.calibration.add_corner(x, y)
        if success:
            logger.info(f"Added calibration point ({x}, {y})")
            if len(self.calibration.corners) == 4:
                self.calibration.calculate_homography()
                logger.info("Table calibration completed")
        return success

    def is_calibrated(self) -> bool:
        """Check if table is calibrated."""
        return self.calibration.homography_matrix is not None

    def preprocess_frame(self, frame: np.ndarray) -> np.ndarray:
        """Preprocess frame for ball detection."""
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)

        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
        )

        return thresh

    def release(self):
        """Release camera resources."""
        if self.camera:
            self.camera.release()
            self.is_running = False
            logger.info("Camera released")

    def __enter__(self):
        """Context manager entry."""
        self.initialize()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.release()
