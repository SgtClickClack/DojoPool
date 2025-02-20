from multiprocessing import Pool
import gc
from multiprocessing import Pool
import gc
"""Ball tracking module for monitoring ball positions and movements."""

import math
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple

from ..validation.shot_validation import Ball, Point


@dataclass
class BallTrajectory:
    """Represents a ball's trajectory during a shot."""

    ball: Ball
    positions: List[Point] = field(default_factory=list)
    velocities: List[Point] = field(default_factory=list)
    timestamps: List[float] = field(default_factory=list)
    rail_contacts: List[int] = field(default_factory=list)
    collisions: List[int] = field(default_factory=list)


class BallTracker:
    """Tracks ball positions and movements during a game."""

    def __init__(self, table_dimensions: Tuple[float, float] = (254, 127)):
        """Initialize ball tracker.

        Args:
            table_dimensions: Table dimensions in cm (length, width)
        """
        self.table_length, self.table_width = table_dimensions
        self.trajectories: Dict[int, List[BallTrajectory]] = (
            {}
        )  # shot_id -> trajectories
        self.current_positions: Dict[int, Ball] = {}  # ball_number -> Ball
        self.pocketed_balls: Set[int] = set()
        self.last_update = datetime.utcnow()

    def update_positions(self, frame_data: Dict) -> Dict:
        """Update ball positions from frame data.

        Args:
            frame_data: Dictionary containing ball positions and states

        Returns:
            Dict containing events (collisions, pockets, etc.)
        """
        events = {"collisions": [], "pockets": [], "rails": [], "fouls": []}

        current_time = datetime.utcnow()
        dt = (current_time - self.last_update).total_seconds()
        self.last_update = current_time

        # Update positions and detect events
        for ball_data in frame_data["balls"]:
            ball_number = ball_data["number"]
            new_position = Point(ball_data["x"], ball_data["y"])

            # Create or update ball
            if ball_number not in self.current_positions:
                self.current_positions[ball_number] = Ball(
                    number=ball_number, position=new_position
                )
            else:
                old_position = self.current_positions[ball_number].position

                # Calculate velocity
                if dt > 0:
                    velocity = Point(
                        (new_position.x - old_position.x) / dt,
                        (new_position.y - old_position.y) / dt,
                    )
                    self.current_positions[ball_number].velocity = velocity

                # Check for rail contacts
                if self._check_rail_contact(old_position, new_position):
                    events["rails"].append(
                        {
                            "ball": ball_number,
                            "position": new_position,
                            "time": current_time.isoformat(),
                        }
                    )

                # Update position
                self.current_positions[ball_number].position = new_position

            # Check if ball is pocketed
            if ball_data.get("pocketed") and ball_number not in self.pocketed_balls:
                self.pocketed_balls.add(ball_number)
                events["pockets"].append(
                    {
                        "ball": ball_number,
                        "pocket": self._determine_pocket(new_position),
                        "time": current_time.isoformat(),
                    }
                )

        # Detect collisions
        collisions = self._detect_collisions(frame_data.get("collisions", []))
        events["collisions"].extend(collisions)

        # Detect fouls
        fouls = self._detect_fouls(frame_data)
        events["fouls"].extend(fouls)

        return events

    def start_shot_tracking(self, shot_id: int):
        """Start tracking a new shot.

        Args:
            shot_id: Unique identifier for the shot
        """
        self.trajectories[shot_id] = []
        for ball in self.current_positions.values():
            if not ball.is_pocketed:
                self.trajectories[shot_id].append(BallTrajectory(ball=ball))

    def update_shot_tracking(self, shot_id: int, frame_data: Dict):
        """Update trajectories for current shot.

        Args:
            shot_id: Shot identifier
            frame_data: Frame data containing ball positions
        """
        if shot_id not in self.trajectories:
            return

        current_time = datetime.utcnow().timestamp()

        for trajectory in self.trajectories[shot_id]:
            ball_number = trajectory.ball.number
            if ball_number in self.current_positions:
                ball = self.current_positions[ball_number]
                trajectory.positions.append(ball.position)
                trajectory.velocities.append(ball.velocity or Point(0, 0))
                trajectory.timestamps.append(current_time)

    def end_shot_tracking(self, shot_id: int) -> List[BallTrajectory]:
        """End tracking for current shot and return trajectories.

        Args:
            shot_id: Shot identifier

        Returns:
            List of ball trajectories for the shot
        """
        return self.trajectories.pop(shot_id, [])

    def get_ball_position(self, ball_number: int):
        """Get current position of a ball.

        Args:
            ball_number: Ball number to query

        Returns:
            Current position or None if ball is pocketed
        """
        if ball_number in self.pocketed_balls:
            return None
        return self.current_positions.get(ball_number, None)

    def get_ball_velocity(self, ball_number: int):
        """Get current velocity of a ball.

        Args:
            ball_number: Ball number to query

        Returns:
            Current velocity or None if ball is pocketed
        """
        if ball_number in self.pocketed_balls:
            return None
        ball = self.current_positions.get(ball_number)
        return ball.velocity if ball else None

    def _check_rail_contact(
        self, old_pos: Point, new_pos: Point, threshold: float = 2.0
    ):
        """Check if ball contacted a rail between positions.

        Args:
            old_pos: Previous position
            new_pos: New position
            threshold: Distance threshold for rail contact in cm

        Returns:
            True if rail contact detected
        """
        # Check top rail
        if old_pos.y > threshold and new_pos.y <= threshold:
            return True
        # Check bottom rail
        if old_pos.y < (self.table_width - threshold) and new_pos.y >= (
            self.table_width - threshold
        ):
            return True
        # Check left rail
        if old_pos.x > threshold and new_pos.x <= threshold:
            return True
        # Check right rail
        if old_pos.x < (self.table_length - threshold) and new_pos.x >= (
            self.table_length - threshold
        ):
            return True
        return False

    def _determine_pocket(self, position: Point) -> int:
        """Determine which pocket a ball entered.

        Args:
            position: Ball position

        Returns:
            Pocket number (1-6)
        """
        # Define pocket positions
        pockets = {
            1: Point(0, 0),  # Top left
            2: Point(self.table_length / 2, 0),  # Top center
            3: Point(self.table_length, 0),  # Top right
            4: Point(0, self.table_width),  # Bottom left
            5: Point(self.table_length / 2, self.table_width),  # Bottom center
            6: Point(self.table_length, self.table_width),  # Bottom right
        }

        # Find closest pocket
        return min(pockets.items(), key=lambda p: position.distance_to(p[1]))[0]

    def _detect_collisions(self, collision_data: List[Dict]) -> List[Dict]:
        """Process collision data from frame.

        Args:
            collision_data: List of collision events from frame

        Returns:
            List of processed collision events
        """
        collisions = []
        for collision in collision_data:
            ball1 = collision["ball1"]
            ball2 = collision["ball2"]
            position = Point(collision["x"], collision["y"])

            collisions.append(
                {
                    "ball1": ball1,
                    "ball2": ball2,
                    "position": position,
                    "time": self.last_update.isoformat(),
                    "velocity1": self.get_ball_velocity(ball1),
                    "velocity2": self.get_ball_velocity(ball2),
                }
            )

        return collisions

    def _detect_fouls(self, frame_data: Dict):
        """Detect fouls from frame data.

        Args:
            frame_data: Frame data containing ball positions and events

        Returns:
            List of detected fouls
        """
        fouls = []

        # Check for cue ball scratch
        if 0 in self.pocketed_balls:  # 0 is cue ball
            fouls.append({"type": "scratch", "time": self.last_update.isoformat()})

        # Check for no rail contact after object ball hit
        if frame_data.get("shot_complete"):
            if not frame_data.get("rail_contact") and not frame_data.get(
                "ball_pocketed"
            ):
                fouls.append({"type": "no_rail", "time": self.last_update.isoformat()})

        return fouls

    def get_shot_statistics(self, shot_id: int):
        """Calculate statistics for a shot.

        Args:
            shot_id: Shot identifier

        Returns:
            Dictionary containing shot statistics
        """
        if shot_id not in self.trajectories:
            return {}

        stats = {
            "duration": 0,
            "max_velocity": 0,
            "total_distance": 0,
            "rail_contacts": 0,
            "collisions": 0,
        }

        for trajectory in self.trajectories[shot_id]:
            if not trajectory.timestamps:
                continue

            # Duration
            stats["duration"] = trajectory.timestamps[-1] - trajectory.timestamps[0]

            # Max velocity
            for velocity in trajectory.velocities:
                speed = math.sqrt(velocity.x**2 + velocity.y**2)
                stats["max_velocity"] = max(stats["max_velocity"], speed)

            # Total distance
            for i in range(1, len(trajectory.positions)):
                stats["total_distance"] += trajectory.positions[i].distance_to(
                    trajectory.positions[i - 1]
                )

            # Counts
            stats["rail_contacts"] += len(trajectory.rail_contacts)
            stats["collisions"] += len(trajectory.collisions)

        return stats
