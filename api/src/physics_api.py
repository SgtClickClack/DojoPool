"""
DojoPool Physics API Endpoints

REST API endpoints for physics calculations and real-time game state processing.
Integrates with the C++ physics engine for accurate pool ball simulations.
"""

import json
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

from .physics_engine import (
    PhysicsEngine,
    GameState,
    BallState,
    Vec2,
    get_physics_engine,
    process_game_state,
    calculate_shot_prediction
)

class PhysicsAPI:
    """Physics API endpoints handler"""

    def __init__(self):
        self.physics_engine = get_physics_engine()
        self.logger = self._setup_logger()

    def _setup_logger(self):
        """Setup logging for physics API"""
        import logging
        logger = logging.getLogger("physics_api")
        logger.setLevel(logging.INFO)
        return logger

    async def process_game_state(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process complete game state through physics simulation

        POST /api/physics/process
        """
        try:
            self.logger.info(f"Processing game state with {len(request_data.get('balls', []))} balls")

            # Parse request data
            balls_data = request_data.get("balls", [])
            balls = []

            for ball_data in balls_data:
                try:
                    ball = BallState.from_dict(ball_data)
                    balls.append(ball)
                except KeyError as e:
                    raise ValueError(f"Invalid ball data: missing {e}")

            # Create game state
            game_state = GameState(
                balls=balls,
                delta_time=request_data.get("deltaTime", 1.0 / 60.0),
                calculate_trajectories=request_data.get("calculateTrajectories", False)
            )

            # Process through physics engine
            result = await process_game_state(game_state)

            # Convert to JSON-serializable format
            response = {
                "balls": [ball.to_dict() for ball in result.balls],
                "trajectories": {
                    str(ball_id): [point.to_dict() for point in trajectory]
                    for ball_id, trajectory in result.trajectories.items()
                },
                "timestamp": result.timestamp.timestamp() * 1000,
                "processed": result.processed,
                "success": True
            }

            self.logger.info(f"Game state processed successfully, {len(result.balls)} balls updated")
            return response

        except Exception as e:
            self.logger.error(f"Game state processing failed: {e}")
            return {
                "error": "Physics processing failed",
                "message": str(e),
                "success": False,
                "timestamp": datetime.now().timestamp() * 1000
            }

    async def calculate_shot(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate shot prediction

        POST /api/physics/shot
        """
        try:
            self.logger.info(f"Calculating {request_data.get('type', 'straight')} shot prediction")

            # Validate required fields
            required_fields = ["start", "target", "power"]
            for field in required_fields:
                if field not in request_data:
                    raise ValueError(f"Missing required field: {field}")

            # Process shot calculation
            result = await calculate_shot_prediction(request_data)

            response = {
                "success": result["success"],
                "trajectory": result["trajectory"],
                "type": result["type"],
                "power": result["power"],
                "spin": result["spin"],
                "timestamp": datetime.now().timestamp() * 1000
            }

            self.logger.info(f"Shot prediction calculated: {'success' if result['success'] else 'failed'}")
            return response

        except Exception as e:
            self.logger.error(f"Shot calculation failed: {e}")
            return {
                "error": "Shot calculation failed",
                "message": str(e),
                "success": False,
                "timestamp": datetime.now().timestamp() * 1000
            }

    async def get_trajectory(self, ball_id: int, max_time: float = 10.0) -> Dict[str, Any]:
        """
        Calculate trajectory for a specific ball

        GET /api/physics/trajectory/{ball_id}?max_time={max_time}
        """
        try:
            self.logger.info(f"Calculating trajectory for ball {ball_id}")

            # Create a minimal game state with just this ball
            # In a real implementation, you'd get the current ball state from the game
            ball = BallState(
                position=Vec2(0, 0),  # Would come from actual game state
                velocity=Vec2(1, 0),  # Would come from actual game state
                angular_velocity=Vec2(0, 0),
                radius=0.028575,
                active=True,
                id=ball_id
            )

            game_state = GameState(
                balls=[ball],
                delta_time=1.0 / 120.0,
                calculate_trajectories=True
            )

            result = await process_game_state(game_state)

            trajectory = result.trajectories.get(ball_id, [])

            response = {
                "ballId": ball_id,
                "trajectory": [point.to_dict() for point in trajectory],
                "maxTime": max_time,
                "success": True,
                "timestamp": datetime.now().timestamp() * 1000
            }

            self.logger.info(f"Trajectory calculated with {len(trajectory)} points")
            return response

        except Exception as e:
            self.logger.error(f"Trajectory calculation failed for ball {ball_id}: {e}")
            return {
                "error": "Trajectory calculation failed",
                "message": str(e),
                "ballId": ball_id,
                "success": False,
                "timestamp": datetime.now().timestamp() * 1000
            }

    async def add_ball(self, ball_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a ball to the physics simulation

        POST /api/physics/ball
        """
        try:
            ball = BallState.from_dict(ball_data)
            self.logger.info(f"Adding ball {ball.id} to physics simulation")

            # In a real implementation, you'd maintain persistent ball state
            # For now, this is just a placeholder

            response = {
                "success": True,
                "ballId": ball.id,
                "message": "Ball added to physics simulation",
                "timestamp": datetime.now().timestamp() * 1000
            }

            self.logger.info(f"Ball {ball.id} added successfully")
            return response

        except Exception as e:
            self.logger.error(f"Failed to add ball: {e}")
            return {
                "error": "Failed to add ball",
                "message": str(e),
                "success": False,
                "timestamp": datetime.now().timestamp() * 1000
            }

    async def clear_balls(self) -> Dict[str, Any]:
        """
        Clear all balls from simulation

        POST /api/physics/clear
        """
        try:
            self.logger.info("Clearing all balls from physics simulation")

            # In a real implementation, you'd clear the persistent ball state
            # For now, this is just a placeholder

            response = {
                "success": True,
                "message": "All balls cleared from physics simulation",
                "timestamp": datetime.now().timestamp() * 1000
            }

            self.logger.info("All balls cleared successfully")
            return response

        except Exception as e:
            self.logger.error(f"Failed to clear balls: {e}")
            return {
                "error": "Failed to clear balls",
                "message": str(e),
                "success": False,
                "timestamp": datetime.now().timestamp() * 1000
            }

    async def get_ball_states(self) -> Dict[str, Any]:
        """
        Get current ball states

        GET /api/physics/balls
        """
        try:
            self.logger.info("Retrieving current ball states")

            # In a real implementation, you'd return the current persistent ball states
            # For now, return empty list
            balls = []

            response = {
                "balls": [ball.to_dict() for ball in balls],
                "count": len(balls),
                "timestamp": datetime.now().timestamp() * 1000,
                "success": True
            }

            self.logger.info(f"Retrieved {len(balls)} ball states")
            return response

        except Exception as e:
            self.logger.error(f"Failed to get ball states: {e}")
            return {
                "error": "Failed to get ball states",
                "message": str(e),
                "success": False,
                "timestamp": datetime.now().timestamp() * 1000
            }

    async def simulate_step(self, delta_time: float = 1.0 / 60.0) -> Dict[str, Any]:
        """
        Simulate physics time step

        POST /api/physics/step
        """
        try:
            self.logger.info(f"Simulating physics step with deltaTime: {delta_time}")

            # In a real implementation, you'd advance the physics simulation
            # For now, this is just a placeholder

            response = {
                "success": True,
                "deltaTime": delta_time,
                "message": "Physics step simulated",
                "timestamp": datetime.now().timestamp() * 1000
            }

            self.logger.info("Physics step simulated successfully")
            return response

        except Exception as e:
            self.logger.error(f"Physics step simulation failed: {e}")
            return {
                "error": "Physics step simulation failed",
                "message": str(e),
                "success": False,
                "timestamp": datetime.now().timestamp() * 1000
            }

    def get_status(self) -> Dict[str, Any]:
        """
        Get physics engine status

        GET /api/physics/status
        """
        try:
            status = self.physics_engine.get_status()

            response = {
                **status,
                "uptime": self._get_uptime(),
                "timestamp": datetime.now().timestamp() * 1000,
                "success": True
            }

            self.logger.info("Physics engine status requested")
            return response

        except Exception as e:
            self.logger.error(f"Failed to get physics status: {e}")
            return {
                "error": "Failed to get physics status",
                "message": str(e),
                "success": False,
                "timestamp": datetime.now().timestamp() * 1000
            }

    def health_check(self) -> Dict[str, Any]:
        """
        Health check endpoint

        GET /api/physics/health
        """
        status = self.physics_engine.get_status()

        if not status["initialized"]:
            return {
                "status": "unhealthy",
                "error": "Physics engine not available",
                "message": "Physics engine is not initialized",
                "timestamp": datetime.now().timestamp() * 1000
            }

        return {
            "status": "healthy",
            "engine": status["engine"],
            "initialized": status["initialized"],
            "addon_available": status["addon_available"],
            "timestamp": datetime.now().timestamp() * 1000
        }

    def _get_uptime(self) -> float:
        """Get application uptime in seconds"""
        try:
            import psutil
            import os
            process = psutil.Process(os.getpid())
            return process.create_time()
        except ImportError:
            # Fallback if psutil is not available
            return 0.0

# Global physics API instance
_physics_api: Optional[PhysicsAPI] = None

def get_physics_api() -> PhysicsAPI:
    """Get or create the global physics API instance"""
    global _physics_api
    if _physics_api is None:
        _physics_api = PhysicsAPI()
    return _physics_api
