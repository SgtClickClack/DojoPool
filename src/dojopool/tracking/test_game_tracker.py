"""Tests for game tracking system."""

import pytest
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from collections import deque
from .game_tracker import (
    BallPosition,
    Shot,
    TableCalibration,
    BallTracker,
    ShotDetector,
    GameTracker,
)


@pytest.fixture
def table_calibration() -> TableCalibration:
    """Create a test table calibration."""
    corners = np.array(
        [
            [100, 100],  # Top-left
            [500, 100],  # Top-right
            [500, 300],  # Bottom-right
            [100, 300],  # Bottom-left
        ],
        dtype=np.float32,
    )
    dimensions = (2.54, 1.27)  # Standard 8-foot table in meters
    return TableCalibration(corners, dimensions)


@pytest.fixture
def mock_frame() -> np.ndarray:
    """Create a mock video frame."""
    return np.zeros((480, 640, 3), dtype=np.uint8)


@pytest.fixture
def sample_ball_positions() -> list[BallPosition]:
    """Create sample ball positions."""
    now = datetime.now()
    return [
        BallPosition(ball_id=0, x=0.5, y=0.5, confidence=0.95, timestamp=now),  # Cue ball
        BallPosition(ball_id=1, x=1.0, y=0.5, confidence=0.90, timestamp=now),
    ]


class TestTableCalibration:
    """Test cases for TableCalibration."""

    def test_image_to_table_conversion(self, table_calibration: TableCalibration) -> None:
        """Test coordinate conversion."""
        # Test point in image space
        image_point = np.array([300, 200])

        # Convert to table coordinates
        table_point = table_calibration.image_to_table(image_point)

        # Point should be within table dimensions
        assert 0 <= table_point[0] <= table_calibration.dimensions[0]
        assert 0 <= table_point[1] <= table_calibration.dimensions[1]


class TestBallTracker:
    """Test cases for BallTracker."""

    @patch("cv2.dnn.readNet")
    def test_ball_detection(
        self, mock_readnet: Mock, table_calibration: TableCalibration, mock_frame: np.ndarray
    ) -> None:
        """Test ball detection."""
        # Mock detection output
        mock_net = Mock()
        mock_net.forward.return_value = np.array(
            [[0.3, 0.3, 0.1, 0.1, 0.9] + [0.1] * 15 + [0.9]]  # Ball detection
        )
        mock_readnet.return_value = mock_net

        tracker = BallTracker(table_calibration)
        balls = tracker.detect_balls(mock_frame)

        assert len(balls) == 1
        assert isinstance(balls[0], BallPosition)
        assert balls[0].confidence > 0.5

    def test_position_history(self, table_calibration: TableCalibration) -> None:
        """Test position history tracking."""
        tracker = BallTracker(table_calibration)
        ball = BallPosition(0, 1.0, 1.0, 0.9, datetime.now())

        # Add position to history
        with tracker._lock:
            if ball.ball_id not in tracker._position_history:
                tracker._position_history[ball.ball_id] = deque(maxlen=100)
            tracker._position_history[ball.ball_id].append((ball.x, ball.y, ball.timestamp))

        assert len(tracker._position_history[0]) == 1


class TestShotDetector:
    """Test cases for ShotDetector."""

    def test_shot_detection(
        self, table_calibration: TableCalibration, sample_ball_positions: list[BallPosition]
    ) -> None:
        """Test shot detection."""
        detector = ShotDetector(table_calibration)

        # Create moving ball positions
        moving_positions = [
            BallPosition(
                ball_id=pos.ball_id,
                x=pos.x + 0.5,  # Move balls
                y=pos.y,
                confidence=pos.confidence,
                timestamp=pos.timestamp + timedelta(seconds=0.1),
            )
            for pos in sample_ball_positions
        ]

        # Process frames
        shot = detector.process_frame(moving_positions, sample_ball_positions)

        assert shot is not None
        assert isinstance(shot, Shot)
        assert shot.start_time is not None
        assert len(shot.ball_positions) > 0

    def test_no_shot_detection(
        self, table_calibration: TableCalibration, sample_ball_positions: list[BallPosition]
    ) -> None:
        """Test when no shot is detected."""
        detector = ShotDetector(table_calibration)

        # Use same positions (no movement)
        shot = detector.process_frame(sample_ball_positions, sample_ball_positions)

        assert shot is None


class TestGameTracker:
    """Test cases for GameTracker."""

    @patch("cv2.VideoCapture")
    def test_game_tracker_initialization(
        self, mock_capture: Mock, table_calibration: TableCalibration
    ) -> None:
        """Test game tracker initialization."""
        mock_capture.return_value = Mock()
        corners = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=np.float32)
        dimensions = (2.54, 1.27)

        tracker = GameTracker(0, corners, dimensions)

        assert tracker._running == False
        assert isinstance(tracker.ball_tracker, BallTracker)
        assert isinstance(tracker.shot_detector, ShotDetector)

    @patch("cv2.VideoCapture")
    def test_start_stop(self, mock_capture: Mock, table_calibration: TableCalibration) -> None:
        """Test starting and stopping tracking."""
        mock_capture.return_value = Mock()
        corners = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=np.float32)
        dimensions = (2.54, 1.27)

        tracker = GameTracker(0, corners, dimensions)

        # Start tracking
        tracker.start()
        assert tracker._running == True

        # Stop tracking
        tracker.stop()
        assert tracker._running == False

    @patch("cv2.VideoCapture")
    def test_shot_recording(
        self,
        mock_capture: Mock,
        table_calibration: TableCalibration,
        sample_ball_positions: list[BallPosition],
    ) -> None:
        """Test shot recording."""
        mock_capture.return_value = Mock()
        corners = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=np.float32)
        dimensions = (2.54, 1.27)

        tracker = GameTracker(0, corners, dimensions)

        # Add a shot manually
        shot = Shot(
            shot_id="test_shot",
            start_time=datetime.now(),
            end_time=datetime.now() + timedelta(seconds=1),
            ball_positions=sample_ball_positions,
            is_valid=True,
            type="normal",
            pocketed_balls=set([1]),
            foul_detected=False,
            confidence=0.9,
        )

        with tracker._lock:
            tracker._shots.append(shot)

        # Get shots
        shots = tracker.get_shots()
        assert len(shots) == 1
        assert shots[0].shot_id == "test_shot"

    @patch("cv2.VideoCapture")
    def test_ball_position_tracking(
        self,
        mock_capture: Mock,
        table_calibration: TableCalibration,
        sample_ball_positions: list[BallPosition],
    ) -> None:
        """Test ball position tracking."""
        mock_capture.return_value = Mock()
        corners = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=np.float32)
        dimensions = (2.54, 1.27)

        tracker = GameTracker(0, corners, dimensions)

        # Set ball positions
        with tracker._lock:
            tracker._previous_balls = sample_ball_positions

        # Get positions
        positions = tracker.get_ball_positions()
        assert positions == sample_ball_positions
