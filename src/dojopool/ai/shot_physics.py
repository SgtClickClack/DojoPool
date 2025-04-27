"""Physics calculations for pool shots."""

import numpy as np
from typing import List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class CollisionType(Enum):
    """Types of ball collisions."""

    DIRECT = "direct"
    GLANCING = "glancing"
    RAIL = "rail"
    NONE = "none"


@dataclass
class Vector2D:
    """2D vector for physics calculations."""

    x: float
    y: float

    def __add__(self, other: "Vector2D") -> "Vector2D":
        return Vector2D(self.x + other.x, self.y + other.y)

    def __sub__(self, other: "Vector2D") -> "Vector2D":
        return Vector2D(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar: float) -> "Vector2D":
        return Vector2D(self.x * scalar, self.y * scalar)

    def magnitude(self) -> float:
        return np.sqrt(self.x * self.x + self.y * self.y)

    def normalize(self) -> "Vector2D":
        mag = self.magnitude()
        if mag == 0:
            return Vector2D(0, 0)
        return Vector2D(self.x / mag, self.y / mag)

    def dot(self, other: "Vector2D") -> float:
        return self.x * other.x + self.y * other.y

    def angle(self, other: "Vector2D") -> float:
        """Get angle between vectors in radians."""
        dot = self.dot(other)
        mags = self.magnitude() * other.magnitude()
        if mags == 0:
            return 0
        return np.arccos(np.clip(dot / mags, -1.0, 1.0))


@dataclass
class Ball:
    """Ball physics properties."""

    position: Vector2D
    velocity: Vector2D
    mass: float = 0.17  # kg
    radius: float = 0.028575  # m (2.25 inches)
    friction: float = 0.2
    elasticity: float = 0.95


@dataclass
class Table:
    """Pool table properties."""

    width: float = 2.54  # m (8 feet)
    height: float = 1.27  # m (4 feet)
    pocket_radius: float = 0.057  # m (4.5 inches)
    rail_elasticity: float = 0.7
    surface_friction: float = 0.2

    def get_pocket_positions(self) -> List[Vector2D]:
        """Get positions of all pockets."""
        return [
            Vector2D(0, 0),  # Top left
            Vector2D(self.width / 2, 0),  # Top center
            Vector2D(self.width, 0),  # Top right
            Vector2D(0, self.height),  # Bottom left
            Vector2D(self.width / 2, self.height),  # Bottom center
            Vector2D(self.width, self.height),  # Bottom right
        ]


class ShotPhysics:
    """Calculate shot physics and trajectories."""

    def __init__(self, table: Optional[Table] = None) -> None:
        """Initialize physics calculator."""
        self.table = table or Table()
        self.g = 9.81  # m/s^2

    def predict_collision(
        self, ball1: Ball, ball2: Ball, dt: float = 0.001
    ) -> Tuple[Optional[Vector2D], CollisionType]:
        """Predict collision point and type between two balls."""
        # Get relative position and velocity
        rel_pos = ball2.position - ball1.position
        rel_vel = ball2.velocity - ball1.velocity

        # Check if balls are moving apart
        if rel_pos.dot(rel_vel) >= 0:
            return None, CollisionType.NONE

        # Calculate time to collision
        a = rel_vel.dot(rel_vel)
        b = 2 * rel_pos.dot(rel_vel)
        c = rel_pos.dot(rel_pos) - (ball1.radius + ball2.radius) ** 2

        discriminant = b * b - 4 * a * c
        if discriminant < 0:
            return None, CollisionType.NONE

        # Get earliest collision time
        t = (-b - np.sqrt(discriminant)) / (2 * a)
        if t < 0:
            return None, CollisionType.NONE

        # Calculate collision point
        collision_point = ball1.position + ball1.velocity * t

        # Determine collision type
        # If the relative velocity is nearly parallel to the line joining centers, treat as DIRECT
        n = rel_pos.normalize()
        v_dir = rel_vel.normalize()
        direction_dot = abs(n.dot(v_dir))
        print(f"predict_collision: rel_pos={rel_pos}, rel_vel={rel_vel}")
        print(f"predict_collision: n={n}, v_dir={v_dir}, direction_dot={direction_dot}")

        # Debug output for test diagnosis
        if direction_dot > 0.999:
            print("CollisionType: DIRECT")
            collision_type = CollisionType.DIRECT
        elif abs(rel_pos.angle(rel_vel)) <= np.pi / 2:
            print("CollisionType: GLANCING")
            collision_type = CollisionType.GLANCING
        else:
            print("CollisionType: NONE")
            collision_type = CollisionType.NONE

        print(f"collision_point={collision_point}, collision_type={collision_type}")
        return collision_point, collision_type

    def calculate_post_collision_velocities(
        self, ball1: Ball, ball2: Ball
    ) -> Tuple[Vector2D, Vector2D]:
        """Calculate velocities after collision."""
        m1, m2 = ball1.mass, ball2.mass
        u1, u2 = ball1.velocity, ball2.velocity
        x1, x2 = ball1.position, ball2.position

        n = (x2 - x1).normalize()
        rel_vel = (u1 - u2).dot(n)
        print(f"calculate_post_collision_velocities: u1={u1}, u2={u2}, n={n}, rel_vel={rel_vel}")
        if rel_vel >= 0:
            print("Balls are not moving together, no collision.")
            return u1, u2

        e = min(ball1.elasticity, ball2.elasticity)
        j = -(1 + e) * rel_vel / (1/m1 + 1/m2)
        v1 = u1 + n * (j / m1)
        v2 = u2 - n * (j / m2)
        print(f"calculate_post_collision_velocities: v1={v1}, v2={v2}")
        return v1, v2

    def check_rail_collision(self, ball: Ball, dt: float = 0.001) -> Tuple[Vector2D, bool]:
        """Check for collision with rails."""
        x, y = ball.position.x, ball.position.y
        r = ball.radius
        w, h = self.table.width, self.table.height
        hit = False
        pos = ball.position
        print(f"check_rail_collision: x={x}, y={y}, r={r}, w={w}, h={h}")
        # Check left and right rails
        if x - r <= 2e-3:
            print("Rail collision: LEFT")
            pos = Vector2D(r, y)
            hit = True
        elif x + r >= w - 2e-3:
            print("Rail collision: RIGHT")
            pos = Vector2D(w - r, y)
            hit = True
        # Check top and bottom rails
        if y - r <= 2e-3:
            print("Rail collision: TOP")
            pos = Vector2D(pos.x, r)
            hit = True
        elif y + r >= h - 2e-3:
            print("Rail collision: BOTTOM")
            pos = Vector2D(pos.x, h - r)
            hit = True
        print(f"check_rail_collision: pos={pos}, hit={hit}")
        return pos, hit

    def calculate_rail_bounce(self, ball: Ball, hit_vertical: bool) -> Vector2D:
        """Calculate velocity after rail bounce."""
        e = self.table.rail_elasticity
        if hit_vertical:
            return Vector2D(-ball.velocity.x * e, ball.velocity.y)
        else:
            return Vector2D(ball.velocity.x, -ball.velocity.y * e)

    def check_pocket_collision(self, ball: Ball) -> bool:
        """Check if ball will enter a pocket."""
        for pocket in self.table.get_pocket_positions():
            # Calculate distance to pocket
            distance = (pocket - ball.position).magnitude()

            # Check if ball is within pocket radius
            if distance <= self.table.pocket_radius:
                # Check if ball is moving towards pocket
                to_pocket = (pocket - ball.position).normalize()
                angle = ball.velocity.angle(to_pocket)

                # Ball must be moving roughly towards pocket
                if angle < np.pi / 3:  # 60 degrees
                    return True

        return False

    def calculate_shot_difficulty(
        self, cue_ball: Ball, object_ball: Ball, target_pocket: Vector2D
    ) -> float:
        """Calculate shot difficulty (0-1)."""
        # Factors affecting difficulty:
        # 1. Distance between cue ball and object ball
        distance = (object_ball.position - cue_ball.position).magnitude()
        distance_factor = np.clip(distance / self.table.width, 0, 1)

        # 2. Angle of shot
        to_object = (object_ball.position - cue_ball.position).normalize()
        to_pocket = (target_pocket - object_ball.position).normalize()
        angle = to_object.angle(to_pocket)
        angle_factor = angle / np.pi

        # 3. Distance to pocket
        pocket_distance = (target_pocket - object_ball.position).magnitude()
        pocket_factor = np.clip(pocket_distance / self.table.width, 0, 1)

        # Combine factors (weighted average)
        difficulty = 0.3 * distance_factor + 0.5 * angle_factor + 0.2 * pocket_factor

        return np.clip(difficulty, 0, 1)

    def simulate_shot(
        self,
        cue_ball: Ball,
        object_balls: List[Ball],
        target_pocket: Vector2D,
        max_steps: int = 1000,
    ) -> Tuple[bool, List[Vector2D]]:
        """Simulate shot and return success and trajectory."""
        balls = [cue_ball] + object_balls
        trajectory = [cue_ball.position]
        success = False

        for _ in range(max_steps):
            # Check ball collisions
            for i, ball1 in enumerate(balls):
                for ball2 in balls[i + 1 :]:
                    collision_point, collision_type = self.predict_collision(ball1, ball2)
                    if collision_point:
                        v1, v2 = self.calculate_post_collision_velocities(ball1, ball2)
                        ball1.velocity = v1
                        ball2.velocity = v2

            # Update positions and check rails
            for ball in balls:
                rail_pos, hit_rail = self.check_rail_collision(ball)
                if hit_rail:
                    ball.position = rail_pos
                    ball.velocity = self.calculate_rail_bounce(
                        ball,
                        hit_vertical=rail_pos.x in (ball.radius, self.table.width - ball.radius),
                    )
                else:
                    ball.position = ball.position + ball.velocity * 0.001

                # Apply friction
                speed = ball.velocity.magnitude()
                if speed > 0:
                    friction = self.table.surface_friction * self.g * 0.001
                    new_speed = max(0, speed - friction)
                    ball.velocity = ball.velocity.normalize() * new_speed

            # Check for pocketed balls
            for ball in balls[1:]:  # Skip cue ball
                if self.check_pocket_collision(ball):
                    success = True
                    break

            # Record trajectory
            trajectory.append(cue_ball.position)

            # Stop if all balls are stationary
            if all(ball.velocity.magnitude() < 0.01 for ball in balls):
                break

        return success, trajectory
