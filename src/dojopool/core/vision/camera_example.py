"""Example of real-time ball tracking using a webcam."""

import cv2
import numpy as np
import time
from typing import Tuple, List, cast
from numpy.typing import NDArray

from .ball_tracker import BallTracker
from .trajectory import TrajectoryTracker, BallTrajectory


def draw_ball(
    frame: NDArray[np.uint8],
    center: Tuple[int, int],
    radius: float,
    color: Tuple[int, int, int],
    ball_id: int,
    confidence: float,
) -> None:
    """Draw ball detection visualization on frame."""
    # Draw circle outline
    cv2.circle(frame, center, int(radius), color, 2)

    # Draw ball number
    text = f"{ball_id} ({confidence:.2f})"
    text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
    text_x = center[0] - text_size[0] // 2
    text_y = center[1] + text_size[1] // 2
    cv2.putText(frame, text, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)


def draw_trajectory(
    frame: NDArray[np.uint8], trajectory: BallTrajectory, color: Tuple[int, int, int]
) -> None:
    """Draw ball trajectory visualization on frame."""
    # Draw past positions
    positions = [(int(x), int(y)) for x, y in trajectory.positions]
    if len(positions) > 1:
        # Draw line connecting positions
        cv2.polylines(frame, [np.array(positions)], False, color, 1)

        # Draw velocity vector if ball is moving
        if trajectory.is_moving:
            last_pos = positions[-1]
            last_vel = trajectory.velocities[-1]
            end_x = int(last_pos[0] + last_vel[0] * 20)  # Scale for visualization
            end_y = int(last_pos[1] + last_vel[1] * 20)
            cv2.arrowedLine(frame, last_pos, (end_x, end_y), color, 2)


def draw_collision_warning(
    frame: NDArray[np.uint8], ball_pos1: Tuple[int, int], ball_pos2: Tuple[int, int]
) -> None:
    """Draw collision warning visualization."""
    # Draw line connecting balls
    cv2.line(frame, ball_pos1, ball_pos2, (0, 0, 255), 2)

    # Draw warning text
    mid_x = (ball_pos1[0] + ball_pos2[0]) // 2
    mid_y = (ball_pos1[1] + ball_pos2[1]) // 2
    cv2.putText(
        frame, "COLLISION", (mid_x - 30, mid_y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2
    )


def main():
    """Run ball tracking demo using webcam."""
    # Initialize webcam
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam")
        return

    # Set resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    # Initialize trackers
    ball_tracker = BallTracker(
        ball_diameter_mm=40.0, min_confidence=0.6  # Adjust based on your setup
    )

    trajectory_tracker = TrajectoryTracker(
        max_history=30, min_movement_threshold=2.0, max_tracking_gap=0.5
    )

    print("Press 'q' to quit")
    start_time = time.time()

    try:
        while True:
            # Read frame
            ret, frame = cap.read()
            if not ret:
                print("Error: Could not read frame")
                break

            # Get current timestamp
            current_time = time.time() - start_time

            # Detect balls
            frame_uint8 = cast(NDArray[np.uint8], frame)
            balls = ball_tracker.detect_balls(frame_uint8)

            # Update trajectories
            trajectories = trajectory_tracker.update(balls, current_time)

            # Detect potential collisions
            collisions = trajectory_tracker.detect_collisions(trajectories, ball_radius=20.0)

            # Draw visualizations
            for ball in balls:
                x, y = map(int, ball.position)
                # Convert RGB to BGR and ensure tuple type
                bgr_color = cast(Tuple[int, int, int], tuple(reversed(ball.color)))
                draw_ball(
                    frame=frame_uint8,
                    center=(x, y),
                    radius=ball.radius,
                    color=bgr_color,
                    ball_id=ball.id,
                    confidence=ball.confidence,
                )

            # Draw trajectories
            for trajectory in trajectories:
                if trajectory.is_moving:
                    # Get ball color
                    ball = next((b for b in balls if b.id == trajectory.ball_id), None)
                    if ball:
                        bgr_color = cast(Tuple[int, int, int], tuple(reversed(ball.color)))
                        draw_trajectory(frame_uint8, trajectory, bgr_color)

            # Draw collision warnings
            for ball_id1, ball_id2 in collisions:
                traj1 = next(t for t in trajectories if t.ball_id == ball_id1)
                traj2 = next(t for t in trajectories if t.ball_id == ball_id2)
                pos1 = cast(Tuple[int, int], tuple(map(int, traj1.positions[-1])))
                pos2 = cast(Tuple[int, int], tuple(map(int, traj2.positions[-1])))
                draw_collision_warning(frame_uint8, pos1, pos2)

            # Show frame
            cv2.imshow("Ball Tracking", frame)

            # Check for quit
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:
        # Clean up
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
