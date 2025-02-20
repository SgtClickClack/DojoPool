"""Bridge module connecting computer vision events to game state."""

from datetime import datetime
from typing import Any, Dict

from flask_socketio import emit

from ..extensions import db
from ..models.game import Game
from .monitor import GameMonitor


class VisionGameBridge:
    """Bridge between computer vision system and game state."""

    def __init__(self, game_monitor: GameMonitor):
        """Initialize the bridge.

        Args:
            game_monitor: The game monitor instance to bridge
        """
        self.game_monitor = game_monitor
        self.setup_event_handlers()

    def setup_event_handlers(self):
        """Set up handlers for vision system events."""
        # Connect vision system events to game state updates
        self.game_monitor.on_ball_detected = self._handle_ball_detected
        self.game_monitor.on_shot_detected = self._handle_shot_detected
        self.game_monitor.on_pocket_detected = self._handle_pocket_detected
        self.game_monitor.on_foul_detected = self._handle_foul_detected
        self.game_monitor.on_tracking_error = self._handle_tracking_error

    def _handle_ball_detected(self, game_id: int, ball_data: Dict[str, Any]):
        """Handle ball detection event.

        Args:
            game_id: The game ID
            ball_data: Data about detected ball positions
        """
        game = Game.query.get(game_id)
        if not game:
            return

        # Update game state with new ball positions
        game.game_state.setdefault("ball_positions", {}).update(ball_data)
        db.session.commit()

        # Broadcast ball position update
        room = f"game_{game_id}"
        emit(
            "ball_positions_update",
            {"positions": ball_data, "timestamp": datetime.utcnow().isoformat()},
            room=room,
            namespace="/game",
        )

    def _handle_shot_detected(self, game_id: int, shot_data: Dict[str, Any]):
        """Handle shot detection event.

        Args:
            game_id: The game ID
            shot_data: Data about the detected shot
        """
        game = Game.query.get(game_id)
        if not game:
            return

        # Process the shot through game logic
        result = game.process_shot(shot_data)

        if result.get("success"):
            # Broadcast shot result
            room = f"game_{game_id}"
            emit(
                "shot_result",
                {"success": True, "data": result.get("data"), "game": game.to_dict()},
                room=room,
                namespace="/game",
            )

    def _handle_pocket_detected(self, game_id: int, pocket_data: Dict[str, Any]):
        """Handle pocket detection event.

        Args:
            game_id: The game ID
            pocket_data: Data about the ball being pocketed
        """
        game = Game.query.get(game_id)
        if not game:
            return

        # Process the pocket through game logic
        result = game.process_ball_pocketed(pocket_data)

        if result.get("success"):
            room = f"game_{game_id}"
            # Broadcast pocket result
            emit(
                "pocket_result",
                {"success": True, "data": result.get("data"), "game": game.to_dict()},
                room=room,
                namespace="/game",
            )

            # Check for game completion
            if game.is_game_over():
                emit(
                    "game_completed",
                    {
                        "winner": game.winner_id,
                        "final_score": game.score,
                        "stats": game.stats,
                    },
                    room=room,
                    namespace="/game",
                )

    def _handle_foul_detected(self, game_id: int, foul_data: Dict[str, Any]):
        """Handle foul detection event.

        Args:
            game_id: The game ID
            foul_data: Data about the detected foul
        """
        game = Game.query.get(game_id)
        if not game:
            return

        # Process the foul through game logic
        result = game.process_foul(foul_data)

        if result.get("success"):
            # Broadcast foul result
            room = f"game_{game_id}"
            emit(
                "foul_result",
                {"success": True, "data": result.get("data"), "game": game.to_dict()},
                room=room,
                namespace="/game",
            )

    def _handle_tracking_error(self, game_id: int, error_data: Dict[str, Any]):
        """Handle tracking error event.

        Args:
            game_id: The game ID
            error_data: Data about the tracking error
        """
        # Broadcast error to game room
        room = f"game_{game_id}"
        emit(
            "tracking_error",
            {
                "message": error_data.get("message", "Unknown tracking error"),
                "timestamp": datetime.utcnow().isoformat(),
            },
            room=room,
            namespace="/game",
        )

    def start_tracking(self, game_id: int, venue_id: int) -> bool:
        """Start tracking a game.

        Args:
            game_id: The game ID to track
            venue_id: The venue ID where the game is being played

        Returns:
            bool: True if tracking started successfully
        """
        return self.game_monitor.start_game_tracking(game_id, venue_id)

    def stop_tracking(self, game_id: int):
        """Stop tracking a game.

        Args:
            game_id: The game ID to stop tracking

        Returns:
            bool: True if tracking stopped successfully
        """
        return self.game_monitor.stop_game_tracking(game_id)
