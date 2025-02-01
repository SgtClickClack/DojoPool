"""Pool game physics engine.

This module handles all physics calculations for the pool game including:
- Ball movement and velocity
- Collision detection and resolution
- Shot mechanics (power, angle, spin)
- Table physics (friction, cushion rebounds)
"""

import math
from dataclasses import dataclass
from typing import Tuple


@dataclass
class Vector2D:
    x: float
    y: float

    def __add__(self, other):
        return Vector2D(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        return Vector2D(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar):
        return Vector2D(self.x * scalar, self.y * scalar)

    def magnitude(self):
        return math.sqrt(self.x * self.x + self.y * self.y)

    def normalize(self):
        mag = self.magnitude()
        if mag == 0:
            return Vector2D(0, 0)
        return Vector2D(self.x / mag, self.y / mag)


@dataclass
class Ball:
    position: Vector2D
    velocity: Vector2D
    acceleration: Vector2D
    mass: float = 0.17  # kg
    radius: float = 0.028575  # m
    number: int = 0
    is_active: bool = True
    spin: float = 0.0


class PhysicsEngine:
    FRICTION_COEFFICIENT = 0.2
    CUSHION_ELASTICITY = 0.6
    BALL_ELASTICITY = 0.95
    GRAVITY = 9.81

    def __init__(self, table_width=2.7432, table_height=1.3716):
        self.table_width = table_width
        self.table_height = table_height
        self.balls = []
        self.time_step = 1 / 60

    def apply_shot(self, ball, power, angle, spin=0.0):
        max_force = 200
        force = power * max_force
        angle_rad = math.radians(angle)
        velocity_x = force * math.cos(angle_rad) / ball.mass
        velocity_y = force * math.sin(angle_rad) / ball.mass
        ball.velocity = Vector2D(velocity_x, velocity_y)
        ball.spin = spin * 50

    def detect_collision(self, ball1, ball2):
        distance = (ball1.position - ball2.position).magnitude()
        return distance <= (ball1.radius + ball2.radius)

    def resolve_collision(self, ball1, ball2):
        normal = (ball2.position - ball1.position).normalize()
        relative_velocity = ball1.velocity - ball2.velocity
        impulse = (
            -(1 + self.BALL_ELASTICITY)
            * (relative_velocity.x * normal.x + relative_velocity.y * normal.y)
            / (1 / ball1.mass + 1 / ball2.mass)
        )
        ball1.velocity = ball1.velocity + normal * (impulse / ball1.mass)
        ball2.velocity = ball2.velocity - normal * (impulse / ball2.mass)
        spin_transfer = (ball1.spin - ball2.spin) * 0.5
        ball1.spin -= spin_transfer
        ball2.spin += spin_transfer

    def handle_cushion_collision(self, ball):
        if ball.position.x - ball.radius <= 0:
            ball.position.x = ball.radius
            ball.velocity.x = -ball.velocity.x * self.CUSHION_ELASTICITY
        elif ball.position.x + ball.radius >= self.table_width:
            ball.position.x = self.table_width - ball.radius
            ball.velocity.x = -ball.velocity.x * self.CUSHION_ELASTICITY
        if ball.position.y - ball.radius <= 0:
            ball.position.y = ball.radius
            ball.velocity.y = -ball.velocity.y * self.CUSHION_ELASTICITY
        elif ball.position.y + ball.radius >= self.table_height:
            ball.position.y = self.table_height - ball.radius
            ball.velocity.y = -ball.velocity.y * self.CUSHION_ELASTICITY

    def apply_friction(self, ball):
        if ball.velocity.magnitude() > 0:
            friction_force = self.FRICTION_COEFFICIENT * ball.mass * self.GRAVITY
            friction_decel = friction_force / ball.mass
            current_speed = ball.velocity.magnitude()
            new_speed = max(0, current_speed - friction_decel * self.time_step)
            if new_speed == 0:
                ball.velocity = Vector2D(0, 0)
            else:
                ball.velocity = ball.velocity.normalize() * new_speed
            ball.spin *= 0.98

    def update(self):
        for ball in self.balls:
            if not ball.is_active:
                continue
            ball.position = ball.position + ball.velocity * self.time_step
            self.apply_friction(ball)
            self.handle_cushion_collision(ball)

        for i in range(len(self.balls)):
            for j in range(i + 1, len(self.balls)):
                ball1, ball2 = self.balls[i], self.balls[j]
                if ball1.is_active and ball2.is_active and self.detect_collision(ball1, ball2):
                    self.resolve_collision(ball1, ball2)

    def is_simulation_active(self):
        return any(
            ball.is_active and (ball.velocity.magnitude() > 0.01 or abs(ball.spin) > 0.01)
            for ball in self.balls
        )

    def get_state(self):
        return [
            {
                "number": ball.number,
                "position": {"x": ball.position.x, "y": ball.position.y},
                "velocity": {"x": ball.velocity.x, "y": ball.velocity.y},
                "spin": ball.spin,
                "is_active": ball.is_active,
            }
            for ball in self.balls
        ]


def calculate_shot(
    cue_ball: Ball, target_ball: Ball, power: float, angle: float
) -> Tuple[Vector2D, Vector2D]:
    """Calculate the resulting velocities after a shot.

    Args:
        cue_ball: The cue ball object
        target_ball: The target ball object
        power: Shot power (0-1)
        angle: Shot angle in radians

    Returns:
        Tuple[Vector2D, Vector2D]: New velocities for cue ball and target ball
    """
    # Convert angle and power to initial velocity vector
    initial_velocity = Vector2D(
        power * 500 * math.cos(angle), power * 500 * math.sin(angle)  # Max speed of 500 cm/s
    )

    # Calculate collision normal
    collision_normal = Vector2D(
        target_ball.position.x - cue_ball.position.x, target_ball.position.y - cue_ball.position.y
    ).normalize()

    # Calculate relative velocity
    relative_velocity = Vector2D(
        initial_velocity.x - target_ball.velocity.x, initial_velocity.y - target_ball.velocity.y
    )

    # Calculate impulse
    j = (
        -(1 + 0.95)
        * (  # 0.95 is coefficient of restitution
            relative_velocity.x * collision_normal.x + relative_velocity.y * collision_normal.y
        )
        / (1 / cue_ball.mass + 1 / target_ball.mass)
    )

    # Calculate new velocities
    cue_ball_new_velocity = Vector2D(
        initial_velocity.x + (j * collision_normal.x) / cue_ball.mass,
        initial_velocity.y + (j * collision_normal.y) / cue_ball.mass,
    )

    target_ball_new_velocity = Vector2D(
        target_ball.velocity.x - (j * collision_normal.x) / target_ball.mass,
        target_ball.velocity.y - (j * collision_normal.y) / target_ball.mass,
    )

    return cue_ball_new_velocity, target_ball_new_velocity
