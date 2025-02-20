"""Tests for shot physics calculations."""

import numpy as np
import pytest

from .shot_physics import Ball, CollisionType, ShotPhysics, Table, Vector2D


@pytest.fixture
def physics() -> ShotPhysics:
    """Create a shot physics calculator."""
    return ShotPhysics()


@pytest.fixture
def table():
    """Create a standard pool table."""
    return Table()


@pytest.fixture
def stationary_balls():
    """Create a set of stationary balls."""
    return [
        Ball(position=Vector2D(0.5, 0.5), velocity=Vector2D(0, 0)),  # Cue ball
        Ball(position=Vector2D(1.0, 0.5), velocity=Vector2D(0, 0)),  # Object ball 1
        Ball(position=Vector2D(1.5, 0.75), velocity=Vector2D(0, 0)),  # Object ball 2
    ]


class TestVector2D:
    """Test 2D vector operations."""

    def test_vector_operations(self):
        """Test basic vector operations."""
        v1 = Vector2D(1, 2)
        v2 = Vector2D(3, 4)

        # Addition
        v3 = v1 + v2
        assert v3.x == 4
        assert v3.y == 6

        # Subtraction
        v4 = v2 - v1
        assert v4.x == 2
        assert v4.y == 2

        # Scalar multiplication
        v5 = v1 * 2
        assert v5.x == 2
        assert v5.y == 4

    def test_vector_properties(self) -> None:
        """Test vector properties and methods."""
        v = Vector2D(3, 4)

        # Magnitude
        assert v.magnitude() == 5

        # Normalization
        norm = v.normalize()
        assert np.isclose(norm.magnitude(), 1)
        assert np.isclose(norm.x, 0.6)
        assert np.isclose(norm.y, 0.8)

        # Dot product
        v2 = Vector2D(1, 0)
        assert v.dot(v2) == 3

        # Angle
        angle = v.angle(v2)
        assert np.isclose(angle, 0.9273, atol=0.0001)  # ~53.13 degrees


class TestBallPhysics:
    """Test ball physics calculations."""

    def test_ball_collision_prediction(self, physics: ShotPhysics):
        """Test ball collision prediction."""
        ball1 = Ball(position=Vector2D(0, 0), velocity=Vector2D(1, 0))
        ball2 = Ball(position=Vector2D(0.1, 0), velocity=Vector2D(0, 0))

        # Direct collision
        point, ctype = physics.predict_collision(ball1, ball2)
        assert point is not None
        assert ctype == CollisionType.DIRECT

        # Glancing collision
        ball2.position = Vector2D(0.1, 0.02)
        point, ctype = physics.predict_collision(ball1, ball2)
        assert point is not None
        assert ctype == CollisionType.GLANCING

        # No collision
        ball2.position = Vector2D(0.1, 0.1)
        point, ctype = physics.predict_collision(ball1, ball2)
        assert point is None
        assert ctype == CollisionType.NONE

    def test_collision_velocities(self, physics: ShotPhysics):
        """Test post-collision velocity calculations."""
        # Head-on collision
        ball1 = Ball(position=Vector2D(0, 0), velocity=Vector2D(1, 0))
        ball2 = Ball(position=Vector2D(0.1, 0), velocity=Vector2D(0, 0))

        v1, v2 = physics.calculate_post_collision_velocities(ball1, ball2)

        # Conservation of momentum
        m1v1 = ball1.mass * ball1.velocity.x
        m2v2 = ball2.mass * ball2.velocity.x
        m1v1_new = ball1.mass * v1.x
        m2v2_new = ball2.mass * v2.x
        assert np.isclose(m1v1 + m2v2, m1v1_new + m2v2_new)

        # Conservation of energy (with elasticity)
        e1 = 0.5 * ball1.mass * ball1.velocity.magnitude() ** 2
        e2 = 0.5 * ball2.mass * ball2.velocity.magnitude() ** 2
        e1_new = 0.5 * ball1.mass * v1.magnitude() ** 2
        e2_new = 0.5 * ball2.mass * v2.magnitude() ** 2
        assert np.isclose(e1 + e2, (e1_new + e2_new) / ball1.elasticity)


class TestTablePhysics:
    """Test table physics calculations."""

    def test_rail_collisions(self, physics: ShotPhysics) -> None:
        """Test rail collision detection and response."""
        # Ball moving towards left rail
        ball = Ball(position=Vector2D(0.1, 0.5), velocity=Vector2D(-1, 0))

        pos, hit = physics.check_rail_collision(ball)
        assert hit
        assert pos.x == ball.radius

        # Calculate bounce
        new_vel = physics.calculate_rail_bounce(ball, hit_vertical=True)
        assert new_vel.x > 0  # Bounces back
        assert new_vel.x == -ball.velocity.x * physics.table.rail_elasticity
        assert new_vel.y == ball.velocity.y

    def test_pocket_detection(self, physics: ShotPhysics) -> None:
        """Test pocket collision detection."""
        # Ball rolling into corner pocket
        ball = Ball(position=Vector2D(0.05, 0.05), velocity=Vector2D(-1, -1))

        assert physics.check_pocket_collision(ball)

        # Ball moving away from pocket
        ball.velocity = Vector2D(1, 1)
        assert not physics.check_pocket_collision(ball)

        # Ball too far from pocket
        ball.position = Vector2D(0.5, 0.5)
        assert not physics.check_pocket_collision(ball)


class TestShotSimulation:
    """Test full shot simulation."""

    def test_straight_shot(self, physics: ShotPhysics) -> None:
        """Test straight shot into pocket."""
        # Set up straight shot to corner pocket
        cue_ball = Ball(position=Vector2D(0.5, 0.5), velocity=Vector2D(2, 0))
        object_ball = Ball(position=Vector2D(1.0, 0.5), velocity=Vector2D(0, 0))
        target = Vector2D(physics.table.width, 0.5)

        success, trajectory = physics.simulate_shot(cue_ball, [object_ball], target)

        assert success
        assert len(trajectory) > 0
        assert all(isinstance(pos, Vector2D) for pos in trajectory)

    def test_shot_difficulty(self, physics: ShotPhysics) -> None:
        """Test shot difficulty calculation."""
        cue_ball = Ball(position=Vector2D(0.5, 0.5), velocity=Vector2D(0, 0))
        object_ball = Ball(position=Vector2D(1.0, 0.5), velocity=Vector2D(0, 0))
        target = Vector2D(2.54, 0.5)  # Straight shot to right middle pocket

        difficulty = physics.calculate_shot_difficulty(cue_ball, object_ball, target)

        assert 0 <= difficulty <= 1

        # Harder angled shot
        object_ball.position = Vector2D(1.0, 0.75)
        harder_difficulty = physics.calculate_shot_difficulty(
            cue_ball, object_ball, target
        )

        assert harder_difficulty > difficulty
