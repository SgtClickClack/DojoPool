"""Tests for vision system functionality."""

from datetime import datetime
from unittest.mock import Mock, patch

import numpy as np
import pytest

from dojopool.core.vision.ball_tracker import BallTracker
from dojopool.core.vision.bridge import VisionGameBridge
from dojopool.core.vision.game_tracker import GameTracker
from dojopool.core.vision.monitor import GameMonitor


@pytest.fixture
def mock_frame():
    """Create a mock video frame."""
    return np.zeros((480, 640, 3), dtype=np.uint8)


@pytest.fixture
def mock_ball_positions():
    """Create mock ball position data."""
    return {
        0: {"x": 100, "y": 200},  # Cue ball
        1: {"x": 300, "y": 250},
        2: {"x": 320, "y": 260},
        8: {"x": 400, "y": 300},
    }


@pytest.fixture
def mock_corners():
    """Create mock table corner data."""
    return {
        "table": [[50, 50], [590, 50], [590, 430], [50, 430]],
        "pockets": [
            {"x": 50, "y": 50},
            {"x": 320, "y": 45},
            {"x": 590, "y": 50},
            {"x": 50, "y": 430},
            {"x": 320, "y": 435},
            {"x": 590, "y": 430},
        ],
    }


@pytest.fixture
def ball_tracker():
    """Create a test ball tracker instance."""
    return BallTracker()


@pytest.fixture
def game_tracker():
    """Create a test game tracker instance."""
    return GameTracker()


@pytest.fixture
def game_monitor():
    """Create a test game monitor instance."""
    return GameMonitor()


@pytest.fixture
def vision_bridge(ball_tracker, game_tracker, game_monitor):
    """Create a test vision bridge instance."""
    return VisionGameBridge(
        ball_tracker=ball_tracker, game_tracker=game_tracker, game_monitor=game_monitor
    )


class TestGameTracker:
    """Test the GameTracker class."""

    def test_calibration(self, mock_frame, mock_corners):
        """Test table calibration."""
        tracker = GameTracker()
        success = tracker.calibrate(mock_frame, mock_corners)
        assert success
        assert tracker.calibration_matrix is not None
        assert tracker.pocket_locations == mock_corners["pockets"]

    def test_shot_detection(self, mock_frame, mock_ball_positions):
        """Test shot detection."""
        tracker = GameTracker()

        # First update - no shot detected
        result = tracker.detect_shot(mock_frame, mock_ball_positions)
        assert result is None

        # Move a ball
        moved_positions = mock_ball_positions.copy()
        moved_positions[0]["x"] += 50  # Move cue ball

        # Should detect shot
        result = tracker.detect_shot(mock_frame, moved_positions)
        assert result is not None
        assert result["ball_id"] == 0
        assert result["velocity"] > 0
        assert "direction" in result

    def test_pocket_detection(self, mock_frame, mock_ball_positions, mock_corners):
        """Test pocket detection."""
        tracker = GameTracker()
        tracker.calibrate(mock_frame, mock_corners)

        # Move ball near pocket
        positions = mock_ball_positions.copy()
        positions[1]["x"] = mock_corners["pockets"][0]["x"]
        positions[1]["y"] = mock_corners["pockets"][0]["y"]

        # First update
        tracker.detect_pocketed_balls(mock_frame, positions)

        # Remove ball (pocketed)
        positions_after = positions.copy()
        del positions_after[1]

        # Should detect pocketed ball
        result = tracker.detect_pocketed_balls(mock_frame, positions_after)
        assert result is not None
        assert result["ball_number"] == 1
        assert result["pocket_number"] == 0

    def test_foul_detection(self, mock_frame, mock_ball_positions):
        """Test foul detection."""
        tracker = GameTracker()

        # Simulate cue ball scratch
        positions_after = mock_ball_positions.copy()
        del positions_after[0]  # Remove cue ball

        shot_data = {"ball_id": 0, "timestamp": datetime.utcnow().isoformat()}

        result = tracker.detect_fouls(mock_frame, positions_after, shot_data)
        assert result is not None
        assert result["type"] == "scratch"


class TestGameMonitor:
    """Test the GameMonitor class."""

    def test_game_tracking(self, mock_frame):
        """Test game tracking lifecycle."""
        monitor = GameMonitor()

        # Start tracking
        success = monitor.start_game_tracking(1, 1)
        assert success
        assert 1 in monitor.active_games
        assert monitor.is_running

        # Stop tracking
        success = monitor.stop_game_tracking(1)
        assert success
        assert 1 not in monitor.active_games
        assert not monitor.is_running

    def test_event_handlers(self, mock_frame, mock_ball_positions):
        """Test event handler callbacks."""
        monitor = GameMonitor()

        # Mock event handlers
        monitor.on_ball_detected = Mock()
        monitor.on_shot_detected = Mock()
        monitor.on_pocket_detected = Mock()
        monitor.on_foul_detected = Mock()

        # Start tracking
        monitor.start_game_tracking(1, 1)

        # Process frame
        with patch("src.dojopool.core.vision.monitor.PoolCamera") as mock_camera:
            mock_camera.return_value.get_frame.return_value = mock_frame
            with patch("src.dojopool.core.vision.monitor.BallTracker") as mock_tracker:
                mock_tracker.return_value.detect_balls.return_value = (
                    mock_ball_positions
                )

                monitor._process_frames()

                # Verify handlers called
                monitor.on_ball_detected.assert_called_with(1, mock_ball_positions)


class TestVisionBridge:
    """Test the VisionGameBridge class."""

    def test_event_handling(self, mock_ball_positions):
        """Test vision event handling."""
        mock_monitor = Mock()
        bridge = VisionGameBridge(mock_monitor)

        # Test ball detection handling
        bridge._handle_ball_detected(1, mock_ball_positions)

        # Test shot handling
        shot_data = {"ball_id": 0, "velocity": 10, "direction": {"x": 1, "y": 0}}
        bridge._handle_shot_detected(1, shot_data)

        # Test pocket handling
        pocket_data = {"ball_number": 1, "pocket_number": 0}
        bridge._handle_pocket_detected(1, pocket_data)

        # Test foul handling
        foul_data = {"type": "scratch", "details": "Cue ball pocketed"}
        bridge._handle_foul_detected(1, foul_data)

    def test_tracking_control(self):
        """Test tracking start/stop control."""
        mock_monitor = Mock()
        bridge = VisionGameBridge(mock_monitor)

        # Start tracking
        bridge.start_tracking(1, 1)
        mock_monitor.start_game_tracking.assert_called_with(1, 1)

        # Stop tracking
        bridge.stop_tracking(1)
        mock_monitor.stop_game_tracking.assert_called_with(1)


def test_ball_tracking(ball_tracker):
    """Test ball tracking functionality."""
    # TODO: Add ball tracking tests
    pass


def test_game_tracking(game_tracker):
    """Test game tracking functionality."""
    # TODO: Add game tracking tests
    pass


def test_game_monitoring(game_monitor):
    """Test game monitoring functionality."""
    # TODO: Add game monitoring tests
    pass


def test_vision_bridge(vision_bridge):
    """Test vision bridge functionality."""
    # TODO: Add vision bridge tests
    pass
