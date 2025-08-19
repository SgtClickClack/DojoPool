"""Vision system monitoring module."""

import logging
from datetime import datetime
from queue import Queue
from threading import Lock, Thread
from typing import Any, Callable, Dict, List, Optional

from ...core.monitoring import metrics
from .ball_tracker import BallTracker
from .camera import PoolCamera
from .game_tracker import GameTracker

logger = logging.getLogger(__name__)


class GameMonitor:
    """Monitors and coordinates game tracking components."""

    def __init__(
        self,
        camera: Optional[PoolCamera] = None,
        ball_tracker: Optional[BallTracker] = None,
        game_tracker: Optional[GameTracker] = None,
    ):
        """Initialize game monitor.

        Args:
            camera: Camera instance for capturing frames
            ball_tracker: Ball tracking component
            game_tracker: Game tracking component
        """
        self.camera = camera or PoolCamera()
        self.ball_tracker = ball_tracker or BallTracker()
        self.game_tracker = game_tracker or GameTracker()

        self.active_games: Dict[int, Dict] = {}  # game_id -> game_data
        self.is_running = False
        self.frame_queue = Queue(maxsize=30)  # Buffer 1 second of frames at 30fps
        self.lock = Lock()
        self.processing_thread = None
        self.frame_count = 0
        self.last_frame_time = None
        self.event_handlers = []

        # Event handlers
        self.on_ball_detected: Optional[Callable[[int, Dict], None]] = None
        self.on_shot_detected: Optional[Callable[[int, Dict], None]] = None
        self.on_pocket_detected: Optional[Callable[[int, Dict], None]] = None
        self.on_foul_detected: Optional[Callable[[int, Dict], None]] = None
        self.on_tracking_error: Optional[Callable[[int, Dict], None]] = None

    def start_game_tracking(self, game_id: int, venue_id: int) -> bool:
        """Start tracking a game."""
        with self.lock:
            if game_id in self.active_games:
                logger.warning(f"Game {game_id} is already being tracked")
                return False

            # Initialize components if needed
            if not self.camera.is_running:
                success = self.camera.start()
                if not success:
                    logger.error("Failed to start camera")
                    return False

            # Add game to active games
            self.active_games[game_id] = {
                "venue_id": venue_id,
                "start_time": datetime.utcnow(),
                "events": [],
                "ball_positions": {},
                "last_shot": None,
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

            del self.active_games[game_id]

            # Stop processing if no active games
            if not self.active_games and self.is_running:
                self.is_running = False
                if self.camera:
                    self.camera.stop()

            return True

    def process_frame(self, frame: Any) -> Dict:
        """Process a single frame.

        Args:
            frame: Video frame to process

        Returns:
            Dict: Frame processing results
        """
        if not self.is_running:
            return {}

        self.frame_count += 1
        current_time = datetime.utcnow()

        # Track ball positions
        ball_positions = self.ball_tracker.track_balls(frame)

        # Update game state
        game_state = self.game_tracker.update(ball_positions)

        # Calculate FPS
        if self.last_frame_time:
            time_diff = (current_time - self.last_frame_time).total_seconds()
            fps = 1 / time_diff if time_diff > 0 else 0
            metrics.VISION_FPS.set(fps)

        self.last_frame_time = current_time

        # Notify event handlers
        self._notify_handlers(
            {
                "frame_count": self.frame_count,
                "ball_positions": ball_positions,
                "game_state": game_state,
                "timestamp": current_time,
            }
        )

        return {"ball_positions": ball_positions, "game_state": game_state}

    def _process_frames(self):
        """Process frames from the camera."""
        while self.is_running:
            try:
                # Get frame from camera
                frame = self.camera.get_frame()
                if frame is None:
                    continue

                # Process each active game
                for game_id, game_data in self.active_games.items():
                    try:
                        # Detect balls
                        ball_positions = self.ball_tracker.detect_balls(frame)
                        if ball_positions and self.on_ball_detected:
                            self.on_ball_detected(game_id, ball_positions)
                            game_data["ball_positions"] = ball_positions

                        # Detect shots
                        shot_data = self.game_tracker.detect_shot(frame, ball_positions)
                        if shot_data:
                            if self.on_shot_detected:
                                self.on_shot_detected(game_id, shot_data)
                            game_data["last_shot"] = shot_data

                        # Detect pocketed balls
                        pocket_data = self.game_tracker.detect_pocketed_balls(
                            frame, game_data["ball_positions"]
                        )
                        if pocket_data and self.on_pocket_detected:
                            self.on_pocket_detected(game_id, pocket_data)

                        # Detect fouls
                        foul_data = self.game_tracker.detect_fouls(
                            frame, game_data["ball_positions"], game_data["last_shot"]
                        )
                        if foul_data and self.on_foul_detected:
                            self.on_foul_detected(game_id, foul_data)

                    except Exception as e:
                        logger.error(f"Error processing game {game_id}: {str(e)}")
                        if self.on_tracking_error:
                            self.on_tracking_error(
                                game_id, {"message": str(e), "type": "processing_error"}
                            )

            except Exception as e:
                logger.error(f"Frame processing error: {str(e)}")
                if self.on_tracking_error:
                    for game_id in self.active_games:
                        self.on_tracking_error(game_id, {"message": str(e), "type": "frame_error"})

    def add_event_handler(self, handler: Callable) -> None:
        """Add event handler callback."""
        if handler not in self.event_handlers:
            self.event_handlers.append(handler)

    def remove_event_handler(self, handler: Callable) -> None:
        """Remove event handler callback."""
        if handler in self.event_handlers:
            self.event_handlers.remove(handler)

    def _notify_handlers(self, event_data: Dict) -> None:
        """Notify all event handlers."""
        for handler in self.event_handlers:
            try:
                handler(event_data)
            except Exception as e:
                logger.error(f"Error in event handler: {e}")
                metrics.VISION_ERRORS.inc()

    def calibrate_table(self, venue_id: int, corners: Dict[str, Any]) -> bool:
        """Calibrate table detection for a venue."""
        try:
            if not self.camera or not self.ball_tracker:
                logger.error("Vision components not initialized")
                return False

            # Get calibration frame
            frame = self.camera.get_frame()
            if frame is None:
                logger.error("Failed to get calibration frame")
                return False

            # Calibrate ball tracker
            success = self.ball_tracker.calibrate(frame, corners)
            if not success:
                logger.error("Ball tracker calibration failed")
                return False

            # Calibrate game tracker
            if self.game_tracker:
                success = self.game_tracker.calibrate(frame, corners)
                if not success:
                    logger.error("Game tracker calibration failed")
                    return False

            return True

        except Exception as e:
            logger.error(f"Calibration error: {str(e)}")
            return False

    def get_game_events(self, game_id: Optional[int] = None) -> List[Dict]:
        """Get events for a game or all active games."""
        with self.lock:
            if game_id is not None:
                if game_id not in self.active_games:
                    return []
                return self.active_games[game_id]["events"]

            # Return events for all games
            all_events = []
            for game_data in self.active_games.values():
                all_events.extend(game_data["events"])
            return sorted(all_events, key=lambda e: e["timestamp"])
