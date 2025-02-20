from multiprocessing import Pool
from multiprocessing import Pool
"""Ball trajectory tracking module."""

from collections import deque
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import numpy as np
from numpy.typing import NDArray

from .ball_tracker import Ball


@dataclass
class BallTrajectory:
    """Represents a ball's trajectory."""

    ball_id: int
    positions: List[Tuple[float, float]]  # List of (x, y) positions
    velocities: List[Tuple[float, float]]  # List of (vx, vy) velocities
    timestamps: List[float]  # List of timestamps
    is_moving: bool  # Whether the ball is currently moving
    confidence: float  # Confidence in trajectory detection


class TrajectoryTracker:
    """Tracks ball trajectories over time."""

    def __init__(
        self,
        max_history: int = 30,
        min_movement_threshold: float = 2.0,
        max_tracking_gap: float = 0.5,
    ):
        """Initialize trajectory tracker.

        Args:
            max_history: Maximum number of positions to keep per ball
            min_movement_threshold: Minimum distance (pixels) to consider as movement
            max_tracking_gap: Maximum time gap (seconds) to maintain tracking
        """
        self.max_history = max_history
        self.min_movement_threshold = min_movement_threshold
        self.max_tracking_gap = max_tracking_gap

        # Track ball positions over time
        self.ball_histories: Dict[int, deque] = {}
        self.last_update_time: Optional[float] = None

    def update(self, balls: List[Ball], timestamp: float) -> List[BallTrajectory]:
        """Update trajectories with new ball positions.

        Args:
            balls: List of detected balls
            timestamp: Current timestamp in seconds

        Returns:
            List of updated ball trajectories
        """
        # Initialize histories for new balls
        for ball in balls:
            if ball.id not in self.ball_histories:
                self.ball_histories[ball.id] = deque(maxlen=self.max_history)

            # Add new position
            self.ball_histories[ball.id].append((ball.position, timestamp))

        # Remove old trajectories
        if self.last_update_time is not None:
            time_gap = timestamp - self.last_update_time
            if time_gap > self.max_tracking_gap:
                self.ball_histories.clear()

        self.last_update_time = timestamp

        # Calculate trajectories
        trajectories = []
        for ball_id, history in self.ball_histories.items():
            if len(history) < 2:
                continue

            # Extract positions and timestamps
            positions = [pos for pos, _ in history]
            timestamps = [ts for _, ts in history]

            # Calculate velocities
            velocities = []
            for i in range(1, len(positions)):
                dt = timestamps[i] - timestamps[i - 1]
                if dt > 0:
                    dx = positions[i][0] - positions[i - 1][0]
                    dy = positions[i][1] - positions[i - 1][1]
                    velocities.append((dx / dt, dy / dt))
                else:
                    velocities.append((0.0, 0.0))

            # Add zero velocity for the first position
            velocities.insert(0, (0.0, 0.0))

            # Determine if ball is moving
            if len(velocities) > 0:
                recent_velocity = velocities[-1]
                speed = np.sqrt(recent_velocity[0] ** 2 + recent_velocity[1] ** 2)
                is_moving = speed > self.min_movement_threshold
            else:
                is_moving = False

            # Calculate trajectory confidence based on consistency
            if len(velocities) > 1:
                velocity_changes = []
                for i in range(1, len(velocities)):
                    v1 = velocities[i - 1]
                    v2 = velocities[i]
                    change = np.sqrt((v2[0] - v1[0]) ** 2 + (v2[1] - v1[1]) ** 2)
                    velocity_changes.append(change)

                avg_change = np.mean(velocity_changes)
                confidence = 1.0 / (1.0 + avg_change)
            else:
                confidence = 1.0

            trajectories.append(
                BallTrajectory(
                    ball_id=ball_id,
                    positions=positions,
                    velocities=velocities,
                    timestamps=timestamps,
                    is_moving=is_moving,
                    confidence=confidence,
                )
            )

        return trajectories

    def predict_position(
        self, trajectory: BallTrajectory, time_delta: float
    ) -> Optional[Tuple[float, float]]:
        """Predict ball position after a time interval.

        Args:
            trajectory: Ball trajectory
            time_delta: Time interval in seconds

        Returns:
            Predicted (x, y) position or None if prediction is unreliable
        """
        if not trajectory.is_moving or trajectory.confidence < 0.5:
            return None

        if len(trajectory.positions) < 2:
            return None

        # Use recent velocity for prediction
        last_velocity = trajectory.velocities[-1]
        last_position = trajectory.positions[-1]

        # Simple linear prediction
        pred_x = last_position[0] + last_velocity[0] * time_delta
        pred_y = last_position[1] + last_velocity[1] * time_delta

        return (pred_x, pred_y)

    def detect_collisions(
        self, trajectories: List[BallTrajectory], ball_radius: float
    ) -> List[Tuple[int, int]]:
        """Detect potential ball collisions.

        Args:
            trajectories: List of ball trajectories
            ball_radius: Ball radius in pixels

        Returns:
            List of (ball_id1, ball_id2) pairs that may collide
        """
        collisions = []
        collision_threshold = ball_radius * 2

        for i, traj1 in enumerate(trajectories):
            if not traj1.is_moving:
                continue

            pos1 = traj1.positions[-1]
            vel1 = traj1.velocities[-1]

            for j in range(i + 1, len(trajectories)):
                traj2 = trajectories[j]
                if not traj2.is_moving:
                    continue

                pos2 = traj2.positions[-1]
                vel2 = traj2.velocities[-1]

                # Calculate relative position and velocity
                dx = pos2[0] - pos1[0]
                dy = pos2[1] - pos1[1]
                dvx = vel2[0] - vel1[0]
                dvy = vel2[1] - vel1[1]

                # Check if balls are approaching each other
                relative_motion = dx * dvx + dy * dvy
                if relative_motion >= 0:
                    continue

                # Check distance
                distance = np.sqrt(dx * dx + dy * dy)
                if distance < collision_threshold:
                    collisions.append((traj1.ball_id, traj2.ball_id))

        return collisions
