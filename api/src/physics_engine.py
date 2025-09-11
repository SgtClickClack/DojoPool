"""
DojoPool Physics Engine Python Integration

Provides Python bindings for the C++ physics engine through a Node.js addon bridge.
This module enables real-time physics calculations in the Python backend.
"""

import os
import sys
import json
import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class Vec2:
    """2D Vector for positions and velocities"""
    x: float
    y: float

    def to_dict(self) -> Dict[str, float]:
        return {"x": self.x, "y": self.y}

    @classmethod
    def from_dict(cls, data: Dict[str, float]) -> 'Vec2':
        return cls(x=data["x"], y=data["y"])

@dataclass
class BallState:
    """Complete state of a pool ball"""
    position: Vec2
    velocity: Vec2
    angular_velocity: Vec2
    radius: float
    active: bool
    id: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "position": self.position.to_dict(),
            "velocity": self.velocity.to_dict(),
            "angularVelocity": self.angular_velocity.to_dict(),
            "radius": self.radius,
            "active": self.active,
            "id": self.id
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BallState':
        return cls(
            position=Vec2.from_dict(data["position"]),
            velocity=Vec2.from_dict(data.get("velocity", {"x": 0, "y": 0})),
            angular_velocity=Vec2.from_dict(data.get("angularVelocity", {"x": 0, "y": 0})),
            radius=data.get("radius", 0.028575),
            active=data.get("active", True),
            id=data["id"]
        )

@dataclass
class TrajectoryPoint:
    """Point in a ball's trajectory"""
    position: Vec2
    velocity: Vec2
    time: float
    valid: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "position": self.position.to_dict(),
            "velocity": self.velocity.to_dict(),
            "time": self.time,
            "valid": self.valid
        }

@dataclass
class PhysicsConfig:
    """Configuration for physics simulation"""
    table_width: float = 9.0
    table_height: float = 4.5
    friction_coefficient: float = 0.02
    time_step: float = 1.0 / 120.0

    def to_dict(self) -> Dict[str, float]:
        return {
            "tableWidth": self.table_width,
            "tableHeight": self.table_height,
            "frictionCoefficient": self.friction_coefficient,
            "timeStep": self.time_step
        }

@dataclass
class GameState:
    """Complete game state for physics processing"""
    balls: List[BallState]
    delta_time: float = 1.0 / 60.0
    calculate_trajectories: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "balls": [ball.to_dict() for ball in self.balls],
            "deltaTime": self.delta_time,
            "calculateTrajectories": self.calculate_trajectories
        }

@dataclass
class ProcessedGameState:
    """Result of physics processing"""
    balls: List[BallState]
    trajectories: Dict[int, List[TrajectoryPoint]]
    timestamp: datetime
    processed: bool

class PhysicsEngine:
    """
    Python wrapper for the C++ physics engine via Node.js addon
    """

    def __init__(self, config: Optional[PhysicsConfig] = None):
        self.config = config or PhysicsConfig()
        self._engine = None
        self._addon_available = False
        self._initialize_engine()

    def _initialize_engine(self) -> None:
        """Initialize the physics engine"""
        try:
            # Try to import the Node.js addon
            # This would typically be handled through a subprocess or native bridge
            self._addon_available = False
            logger.warning("Node.js addon not available - using mock implementation")
            self._engine = MockPhysicsEngine()

        except ImportError as e:
            logger.warning(f"Failed to import physics addon: {e}")
            self._engine = MockPhysicsEngine()

    async def process_game_state(self, game_state: GameState) -> ProcessedGameState:
        """
        Process complete game state through physics simulation

        Args:
            game_state: Current game state

        Returns:
            Updated game state with physics calculations
        """
        if not self._engine:
            raise RuntimeError("Physics engine not initialized")

        try:
            logger.debug(f"Processing game state with {len(game_state.balls)} balls")

            # Convert to dict for processing
            state_dict = game_state.to_dict()

            # Process through engine (would call Node.js addon)
            result_dict = await self._engine.process_game_state(state_dict)

            # Convert back to Python objects
            balls = [BallState.from_dict(ball) for ball in result_dict["balls"]]
            trajectories = {}

            for ball_id, traj_list in result_dict.get("trajectories", {}).items():
                trajectories[int(ball_id)] = [
                    TrajectoryPoint(
                        position=Vec2.from_dict(point["position"]),
                        velocity=Vec2.from_dict(point["velocity"]),
                        time=point["time"],
                        valid=point["valid"]
                    ) for point in traj_list
                ]

            result = ProcessedGameState(
                balls=balls,
                trajectories=trajectories,
                timestamp=datetime.fromtimestamp(result_dict["timestamp"] / 1000),
                processed=result_dict["processed"]
            )

            logger.debug(f"Physics processing completed for {len(result.balls)} balls")
            return result

        except Exception as e:
            logger.error(f"Physics processing failed: {e}")
            raise RuntimeError(f"Physics calculation failed: {str(e)}")

    async def calculate_shot_prediction(self, shot_request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate shot prediction for game assistance

        Args:
            shot_request: Shot calculation parameters

        Returns:
            Shot prediction with trajectory
        """
        if not self._engine:
            raise RuntimeError("Physics engine not initialized")

        try:
            logger.debug(f"Calculating shot prediction: {shot_request.get('type', 'straight')} shot")
            result = await self._engine.calculate_shot_prediction(shot_request)
            logger.debug(f"Shot prediction calculated with {len(result['trajectory'])} trajectory points")
            return result

        except Exception as e:
            logger.error(f"Shot prediction failed: {e}")
            raise RuntimeError(f"Shot calculation failed: {str(e)}")

    def is_addon_available(self) -> bool:
        """Check if the native addon is available"""
        return self._addon_available

    def get_status(self) -> Dict[str, Any]:
        """Get physics engine status"""
        return {
            "initialized": self._engine is not None,
            "addon_available": self._addon_available,
            "engine": "C++ Native Addon" if self._addon_available else "Python Mock",
            "config": self.config.to_dict(),
            "version": "1.0.0"
        }

class MockPhysicsEngine:
    """
    Mock implementation of the physics engine for development/testing
    when the native addon is not available
    """

    async def process_game_state(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
        """Mock game state processing"""
        logger.debug("Mock: Processing game state")

        # Simulate some physics processing delay
        await asyncio.sleep(0.01)

        # Return modified game state
        balls = game_state["balls"]
        trajectories = {}

        # Simple mock physics: reduce velocity of moving balls
        for ball in balls:
            vx = ball["velocity"]["x"] * 0.95  # Apply friction
            vy = ball["velocity"]["y"] * 0.95

            # Stop ball if velocity is very low
            if abs(vx) < 0.01:
                vx = 0
            if abs(vy) < 0.01:
                vy = 0

            ball["velocity"]["x"] = vx
            ball["velocity"]["y"] = vy

        return {
            "balls": balls,
            "trajectories": trajectories,
            "timestamp": datetime.now().timestamp() * 1000,
            "processed": True
        }

    async def calculate_shot_prediction(self, shot_request: Dict[str, Any]) -> Dict[str, Any]:
        """Mock shot prediction"""
        logger.debug("Mock: Calculating shot prediction")

        await asyncio.sleep(0.005)

        return {
            "success": True,
            "trajectory": [{
                "position": shot_request["target"],
                "velocity": {"x": 0, "y": 0},
                "time": 1.0,
                "valid": True
            }],
            "type": shot_request.get("type", "straight"),
            "power": shot_request["power"],
            "spin": shot_request.get("spin", {"x": 0, "y": 0})
        }

# Global physics engine instance
_physics_engine: Optional[PhysicsEngine] = None

def get_physics_engine() -> PhysicsEngine:
    """Get or create the global physics engine instance"""
    global _physics_engine
    if _physics_engine is None:
        _physics_engine = PhysicsEngine()
    return _physics_engine

async def process_game_state(game_state: GameState) -> ProcessedGameState:
    """Convenience function to process game state"""
    engine = get_physics_engine()
    return await engine.process_game_state(game_state)

async def calculate_shot_prediction(shot_request: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function to calculate shot prediction"""
    engine = get_physics_engine()
    return await engine.calculate_shot_prediction(shot_request)
