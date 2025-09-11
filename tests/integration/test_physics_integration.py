"""
DojoPool Physics Integration Tests

End-to-end tests for the complete physics pipeline:
Frontend -> API -> C++ Physics Engine -> API -> Frontend
"""

import asyncio
import json
import pytest
import aiohttp
from typing import Dict, List, Any
from unittest.mock import Mock, AsyncMock

# Import physics components
from api.src.physics_engine import (
    PhysicsEngine,
    GameState,
    BallState,
    Vec2,
    PhysicsConfig
)
from api.src.physics_api import PhysicsAPI


class TestPhysicsIntegration:
    """Integration tests for physics pipeline"""

    @pytest.fixture
    async def physics_api(self):
        """Create physics API instance"""
        api = PhysicsAPI()
        yield api

    @pytest.fixture
    async def physics_engine(self):
        """Create physics engine instance"""
        config = PhysicsConfig()
        engine = PhysicsEngine(config)
        yield engine

    @pytest.fixture
    def sample_game_state(self):
        """Create sample game state for testing"""
        balls = [
            BallState(
                position=Vec2(0, 0),
                velocity=Vec2(1, 0),
                angular_velocity=Vec2(0, 0),
                radius=0.028575,
                active=True,
                id=0
            ),
            BallState(
                position=Vec2(1, 0),
                velocity=Vec2(0, 0),
                angular_velocity=Vec2(0, 0),
                radius=0.028575,
                active=True,
                id=1
            )
        ]

        return GameState(
            balls=balls,
            delta_time=1.0 / 60.0,
            calculate_trajectories=True
        )

    @pytest.fixture
    def mock_http_client(self):
        """Mock HTTP client for frontend simulation"""
        class MockClient:
            def __init__(self):
                self.responses = {}
                self.requests = []

            async def post(self, url: str, json_data: Dict[str, Any]) -> Dict[str, Any]:
                self.requests.append(('POST', url, json_data))

                if url == '/api/physics/process':
                    return await self._mock_process_game_state(json_data)
                elif url == '/api/physics/shot':
                    return await self._mock_calculate_shot(json_data)
                elif url == '/api/physics/clear':
                    return {'success': True, 'message': 'Cleared'}
                elif url == '/api/physics/ball':
                    return {'success': True, 'ballId': json_data['id']}

                return {'success': False, 'error': 'Unknown endpoint'}

            async def get(self, url: str) -> Dict[str, Any]:
                self.requests.append(('GET', url, None))

                if url == '/api/physics/status':
                    return await self._mock_get_status()
                elif url == '/api/physics/health':
                    return {'status': 'healthy'}
                elif url.startswith('/api/physics/trajectory/'):
                    ball_id = int(url.split('/')[-1])
                    return await self._mock_get_trajectory(ball_id)

                return {'success': False, 'error': 'Unknown endpoint'}

            async def _mock_process_game_state(self, data: Dict[str, Any]) -> Dict[str, Any]:
                # Simulate physics processing
                balls = data['balls']
                processed_balls = []

                for ball in balls:
                    # Apply simple physics: reduce velocity
                    vx = ball['velocity']['x'] * 0.95
                    vy = ball['velocity']['y'] * 0.95

                    if abs(vx) < 0.01: vx = 0
                    if abs(vy) < 0.01: vy = 0

                    processed_ball = ball.copy()
                    processed_ball['velocity'] = {'x': vx, 'y': vy}
                    processed_balls.append(processed_ball)

                return {
                    'success': True,
                    'balls': processed_balls,
                    'trajectories': {},
                    'timestamp': 1234567890,
                    'processed': True
                }

            async def _mock_calculate_shot(self, data: Dict[str, Any]) -> Dict[str, Any]:
                return {
                    'success': True,
                    'trajectory': [{
                        'position': data['target'],
                        'velocity': {'x': 0, 'y': 0},
                        'time': 1.0,
                        'valid': True
                    }],
                    'type': data.get('type', 'straight'),
                    'power': data['power'],
                    'spin': data.get('spin', {'x': 0, 'y': 0})
                }

            async def _mock_get_status(self) -> Dict[str, Any]:
                return {
                    'initialized': True,
                    'addon_available': False,
                    'engine': 'Python Mock',
                    'config': {'tableWidth': 9.0, 'tableHeight': 4.5},
                    'version': '1.0.0'
                }

            async def _mock_get_trajectory(self, ball_id: int) -> Dict[str, Any]:
                return {
                    'success': True,
                    'ballId': ball_id,
                    'trajectory': [{
                        'position': {'x': 0, 'y': 0},
                        'velocity': {'x': 1, 'y': 0},
                        'time': 0.0,
                        'valid': True
                    }],
                    'maxTime': 10.0
                }

        return MockClient()

    async def test_complete_physics_pipeline(self, physics_api, sample_game_state, mock_http_client):
        """Test complete physics pipeline from frontend to backend and back"""

        # Step 1: Frontend prepares game state
        frontend_game_state = {
            'balls': [
                ball.to_dict() for ball in sample_game_state.balls
            ],
            'deltaTime': sample_game_state.delta_time,
            'calculateTrajectories': sample_game_state.calculate_trajectories
        }

        # Step 2: Frontend sends to API (simulate HTTP request)
        response = await mock_http_client.post('/api/physics/process', frontend_game_state)
        assert response['success'] == True
        assert 'balls' in response
        assert len(response['balls']) == 2

        # Step 3: API processes through physics engine
        api_result = await physics_api.process_game_state(frontend_game_state)
        assert api_result['success'] == True
        assert len(api_result['balls']) == 2

        # Step 4: Frontend receives and processes response
        updated_balls = []
        for ball_data in api_result['balls']:
            ball = BallState.from_dict(ball_data)
            updated_balls.append(ball)

        # Verify physics simulation worked
        assert len(updated_balls) == 2

        # First ball should have reduced velocity due to friction
        first_ball = updated_balls[0]
        assert first_ball.velocity.x < 1.0  # Velocity reduced
        assert first_ball.active == True

    async def test_shot_calculation_pipeline(self, physics_api, mock_http_client):
        """Test shot calculation pipeline"""

        # Step 1: Frontend prepares shot request
        shot_request = {
            'start': {'x': 0, 'y': 0},
            'target': {'x': 2, 'y': 1},
            'power': 0.8,
            'spin': {'x': 0.1, 'y': 0.05},
            'type': 'straight'
        }

        # Step 2: Frontend sends to API
        response = await mock_http_client.post('/api/physics/shot', shot_request)
        assert response['success'] == True
        assert 'trajectory' in response
        assert len(response['trajectory']) > 0

        # Step 3: API processes shot calculation
        api_result = await physics_api.calculate_shot(shot_request)
        assert api_result['success'] == True
        assert api_result['type'] == 'straight'
        assert api_result['power'] == 0.8

        # Step 4: Frontend receives trajectory data
        trajectory = api_result['trajectory']
        assert len(trajectory) > 0

        # Verify trajectory structure
        first_point = trajectory[0]
        assert 'position' in first_point
        assert 'velocity' in first_point
        assert 'time' in first_point
        assert 'valid' in first_point

    async def test_status_and_health_checks(self, physics_api, mock_http_client):
        """Test status and health check endpoints"""

        # Test status endpoint
        status_response = await mock_http_client.get('/api/physics/status')
        assert status_response['initialized'] == True
        assert 'engine' in status_response
        assert 'config' in status_response

        # Test health endpoint
        health_response = await mock_http_client.get('/api/physics/health')
        assert health_response['status'] == 'healthy'

        # Test API status
        api_status = physics_api.get_status()
        assert api_status['initialized'] == True
        assert 'engine' in api_status

    async def test_ball_management_pipeline(self, physics_api, mock_http_client):
        """Test ball management operations"""

        # Test adding ball
        ball_data = {
            'position': {'x': 1, 'y': 1},
            'velocity': {'x': 0.5, 'y': 0.3},
            'angularVelocity': {'x': 0, 'y': 0},
            'radius': 0.028575,
            'active': True,
            'id': 5
        }

        add_response = await mock_http_client.post('/api/physics/ball', ball_data)
        assert add_response['success'] == True
        assert add_response['ballId'] == 5

        # Test clearing balls
        clear_response = await mock_http_client.post('/api/physics/clear', {})
        assert clear_response['success'] == True

        # Test getting ball states
        balls_response = await mock_http_client.get('/api/physics/balls')
        assert balls_response['success'] == True
        assert 'balls' in balls_response
        assert 'count' in balls_response

    async def test_trajectory_calculation(self, physics_api, mock_http_client):
        """Test trajectory calculation for specific balls"""

        # Test trajectory endpoint
        trajectory_response = await mock_http_client.get('/api/physics/trajectory/1?max_time=5.0')
        assert trajectory_response['success'] == True
        assert trajectory_response['ballId'] == 1
        assert 'trajectory' in trajectory_response
        assert len(trajectory_response['trajectory']) > 0

        # Test API trajectory calculation
        api_trajectory = await physics_api.get_trajectory(1, 5.0)
        assert api_trajectory['success'] == True
        assert len(api_trajectory['trajectory']) > 0

    async def test_error_handling(self, physics_api, mock_http_client):
        """Test error handling in the pipeline"""

        # Test invalid game state
        invalid_game_state = {
            'balls': [
                {
                    'position': {'x': 0, 'y': 0},
                    # Missing required fields
                    'id': 0
                }
            ]
        }

        # This should handle the error gracefully
        error_response = await physics_api.process_game_state(invalid_game_state)
        # The API should return an error response, not crash
        assert error_response['success'] == False
        assert 'error' in error_response

    async def test_concurrent_requests(self, physics_api, sample_game_state):
        """Test handling multiple concurrent physics requests"""

        async def make_request(request_id: int):
            game_state_copy = GameState(
                balls=sample_game_state.balls.copy(),
                delta_time=sample_game_state.delta_time,
                calculate_trajectories=False
            )
            result = await physics_api.process_game_state(game_state_copy.to_dict())
            return request_id, result

        # Make multiple concurrent requests
        tasks = [make_request(i) for i in range(5)]
        results = await asyncio.gather(*tasks)

        # All requests should succeed
        for request_id, result in results:
            assert result['success'] == True, f"Request {request_id} failed"
            assert len(result['balls']) == 2, f"Request {request_id} returned wrong ball count"

    async def test_physics_step_simulation(self, physics_api, mock_http_client):
        """Test physics step simulation"""

        # Test step endpoint
        step_data = {'deltaTime': 1.0 / 120.0}
        step_response = await mock_http_client.post('/api/physics/step', step_data)
        assert step_response['success'] == True
        assert step_response['deltaTime'] == 1.0 / 120.0

        # Test API step simulation
        api_step = await physics_api.simulate_step(1.0 / 120.0)
        assert api_step['success'] == True

    def test_physics_engine_initialization(self, physics_engine):
        """Test physics engine initialization"""

        # Check that engine is initialized
        assert physics_engine is not None

        # Check status
        status = physics_engine.get_status()
        assert status['initialized'] == True
        assert 'engine' in status
        assert 'config' in status

        # Check if addon is available (will be False in test environment)
        assert 'addon_available' in status

    def test_ball_state_conversion(self, sample_game_state):
        """Test conversion between different ball state formats"""

        # Convert to dict and back
        for ball in sample_game_state.balls:
            ball_dict = ball.to_dict()
            reconstructed_ball = BallState.from_dict(ball_dict)

            assert reconstructed_ball.position.x == ball.position.x
            assert reconstructed_ball.position.y == ball.position.y
            assert reconstructed_ball.velocity.x == ball.velocity.x
            assert reconstructed_ball.velocity.y == ball.velocity.y
            assert reconstructed_ball.id == ball.id
            assert reconstructed_ball.active == ball.active
            assert reconstructed_ball.radius == ball.radius

    def test_vec2_operations(self):
        """Test Vec2 mathematical operations"""

        v1 = Vec2(1, 2)
        v2 = Vec2(3, 4)

        # Addition
        result = v1 + v2
        assert result.x == 4
        assert result.y == 6

        # Subtraction
        result = v2 - v1
        assert result.x == 2
        assert result.y == 2

        # Scalar multiplication
        result = v1 * 2
        assert result.x == 2
        assert result.y == 4

        # Length
        assert v1.length() == pytest.approx(2.236, rel=1e-3)

        # Normalization
        normalized = v1.normalized()
        assert normalized.length() == pytest.approx(1.0, rel=1e-3)

        # Dot product
        assert v1.dot(v2) == 11


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
