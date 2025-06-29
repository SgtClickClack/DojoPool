import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from src.backend.index import app
from src.services.territory.TerritoryGameplayService import TerritoryGameplayService
from src.types.territory import Territory, TerritoryChallenge, ChallengeStatus
from src.types.game import MatchResult

class TestTerritoryIntegration:
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    @pytest.fixture
    def territory_service(self):
        return TerritoryGameplayService()
    
    @pytest.fixture
    def mock_territory(self):
        return Territory(
            id="test-territory-1",
            name="Test Dojo",
            coordinates={"lat": -27.4698, "lng": 153.0251},
            owner="player-1",
            clan="test-clan",
            requiredNFT="trophy-1"
        )
    
    @pytest.fixture
    def mock_challenge(self):
        return TerritoryChallenge(
            id="challenge-1",
            territoryId="test-territory-1",
            challengerId="player-2",
            defenderId="player-1",
            status=ChallengeStatus.PENDING,
            createdAt="2025-01-30T10:00:00Z",
            expiresAt="2025-01-30T11:00:00Z"
        )

    def test_get_territories_endpoint(self, client, territory_service, mock_territory):
        """Test GET /api/territories endpoint"""
        # Add territory to service
        territory_service.add_territory(mock_territory)
        
        # Mock the service in the app
        with patch('src.backend.routes.territory.territory_service', territory_service):
            response = client.get("/api/territories")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["id"] == mock_territory.id
            assert data[0]["name"] == mock_territory.name

    def test_get_territory_by_id_endpoint(self, client, territory_service, mock_territory):
        """Test GET /api/territories/{territory_id} endpoint"""
        territory_service.add_territory(mock_territory)
        
        with patch('src.backend.routes.territory.territory_service', territory_service):
            response = client.get(f"/api/territories/{mock_territory.id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == mock_territory.id
            assert data["name"] == mock_territory.name

    def test_get_territory_by_id_not_found(self, client, territory_service):
        """Test GET /api/territories/{territory_id} with non-existent territory"""
        with patch('src.backend.routes.territory.territory_service', territory_service):
            response = client.get("/api/territories/non-existent")
            
            assert response.status_code == 404
            data = response.json()
            assert "error" in data

    def test_create_challenge_endpoint(self, client, territory_service, mock_territory):
        """Test POST /api/challenges endpoint"""
        territory_service.add_territory(mock_territory)
        
        challenge_data = {
            "territory_id": mock_territory.id,
            "challenger_id": "player-2",
            "defender_id": "player-1"
        }
        
        with patch('src.backend.routes.challenge.territory_service', territory_service):
            response = client.post("/api/challenges", json=challenge_data)
            
            assert response.status_code == 201
            data = response.json()
            assert data["territoryId"] == mock_territory.id
            assert data["challengerId"] == "player-2"
            assert data["defenderId"] == "player-1"
            assert data["status"] == ChallengeStatus.PENDING

    def test_create_challenge_territory_not_found(self, client, territory_service):
        """Test POST /api/challenges with non-existent territory"""
        challenge_data = {
            "territory_id": "non-existent",
            "challenger_id": "player-2",
            "defender_id": "player-1"
        }
        
        with patch('src.backend.routes.challenge.territory_service', territory_service):
            response = client.post("/api/challenges", json=challenge_data)
            
            assert response.status_code == 404
            data = response.json()
            assert "error" in data

    def test_accept_challenge_endpoint(self, client, territory_service, mock_challenge):
        """Test PUT /api/challenges/{challenge_id}/accept endpoint"""
        territory_service.active_challenges[mock_challenge.id] = mock_challenge
        
        with patch('src.backend.routes.challenge.territory_service', territory_service):
            response = client.put(f"/api/challenges/{mock_challenge.id}/accept")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["challenge"]["status"] == ChallengeStatus.ACCEPTED

    def test_accept_challenge_not_found(self, client, territory_service):
        """Test PUT /api/challenges/{challenge_id}/accept with non-existent challenge"""
        with patch('src.backend.routes.challenge.territory_service', territory_service):
            response = client.put("/api/challenges/non-existent/accept")
            
            assert response.status_code == 404
            data = response.json()
            assert "error" in data

    def test_decline_challenge_endpoint(self, client, territory_service, mock_challenge):
        """Test PUT /api/challenges/{challenge_id}/decline endpoint"""
        territory_service.active_challenges[mock_challenge.id] = mock_challenge
        
        with patch('src.backend.routes.challenge.territory_service', territory_service):
            response = client.put(f"/api/challenges/{mock_challenge.id}/decline")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["challenge"]["status"] == ChallengeStatus.DECLINED

    def test_get_challenge_endpoint(self, client, territory_service, mock_challenge):
        """Test GET /api/challenges/{challenge_id} endpoint"""
        territory_service.active_challenges[mock_challenge.id] = mock_challenge
        
        with patch('src.backend.routes.challenge.territory_service', territory_service):
            response = client.get(f"/api/challenges/{mock_challenge.id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == mock_challenge.id
            assert data["territoryId"] == mock_challenge.territoryId

    def test_get_user_challenges_endpoint(self, client, territory_service, mock_challenge):
        """Test GET /api/users/{user_id}/challenges endpoint"""
        territory_service.active_challenges[mock_challenge.id] = mock_challenge
        
        with patch('src.backend.routes.challenge.territory_service', territory_service):
            response = client.get(f"/api/users/{mock_challenge.challengerId}/challenges")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["id"] == mock_challenge.id

    def test_process_match_result_endpoint(self, client, territory_service, mock_territory, mock_challenge):
        """Test POST /api/challenges/{challenge_id}/result endpoint"""
        territory_service.add_territory(mock_territory)
        territory_service.active_challenges[mock_challenge.id] = mock_challenge
        
        match_result_data = {
            "winner_id": "player-2",
            "score": {"player-2": 5, "player-1": 3},
            "timestamp": "2025-01-30T10:30:00Z"
        }
        
        with patch('src.backend.routes.challenge.territory_service', territory_service):
            response = client.post(f"/api/challenges/{mock_challenge.id}/result", json=match_result_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["match_result"]["winnerId"] == "player-2"

    def test_get_territories_by_owner_endpoint(self, client, territory_service, mock_territory):
        """Test GET /api/users/{user_id}/territories endpoint"""
        territory_service.add_territory(mock_territory)
        
        with patch('src.backend.routes.territory.territory_service', territory_service):
            response = client.get(f"/api/users/{mock_territory.owner}/territories")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["id"] == mock_territory.id

    def test_get_territories_by_clan_endpoint(self, client, territory_service, mock_territory):
        """Test GET /api/clans/{clan_name}/territories endpoint"""
        territory_service.add_territory(mock_territory)
        
        with patch('src.backend.routes.territory.territory_service', territory_service):
            response = client.get(f"/api/clans/{mock_territory.clan}/territories")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["id"] == mock_territory.id

    def test_territory_ownership_transfer(self, client, territory_service, mock_territory, mock_challenge):
        """Test territory ownership transfer after match result"""
        territory_service.add_territory(mock_territory)
        territory_service.active_challenges[mock_challenge.id] = mock_challenge
        
        # Process match result with challenger winning
        match_result_data = {
            "winner_id": mock_challenge.challengerId,
            "score": {"player-2": 5, "player-1": 3},
            "timestamp": "2025-01-30T10:30:00Z"
        }
        
        with patch('src.backend.routes.challenge.territory_service', territory_service):
            response = client.post(f"/api/challenges/{mock_challenge.id}/result", json=match_result_data)
            
            assert response.status_code == 200
            
            # Check that territory ownership has changed
            territory_response = client.get(f"/api/territories/{mock_territory.id}")
            territory_data = territory_response.json()
            assert territory_data["owner"] == mock_challenge.challengerId

    def test_challenge_expiration_handling(self, client, territory_service, mock_challenge):
        """Test challenge expiration handling"""
        territory_service.active_challenges[mock_challenge.id] = mock_challenge
        
        # Mock current time to be after challenge expiration
        with patch('src.services.territory.TerritoryGameplayService.datetime') as mock_datetime:
            mock_datetime.now.return_value = "2025-01-30T12:00:00Z"
            mock_datetime.fromisoformat.return_value = "2025-01-30T12:00:00Z"
            
            with patch('src.backend.routes.challenge.territory_service', territory_service):
                # Try to accept expired challenge
                response = client.put(f"/api/challenges/{mock_challenge.id}/accept")
                
                assert response.status_code == 400
                data = response.json()
                assert "expired" in data["error"].lower()

    def test_concurrent_challenge_handling(self, client, territory_service, mock_territory):
        """Test handling of concurrent challenges for same territory"""
        territory_service.add_territory(mock_territory)
        
        # Create first challenge
        challenge1_data = {
            "territory_id": mock_territory.id,
            "challenger_id": "player-2",
            "defender_id": "player-1"
        }
        
        with patch('src.backend.routes.challenge.territory_service', territory_service):
            response1 = client.post("/api/challenges", json=challenge1_data)
            assert response1.status_code == 201
            
            # Try to create second challenge for same territory
            challenge2_data = {
                "territory_id": mock_territory.id,
                "challenger_id": "player-3",
                "defender_id": "player-1"
            }
            
            response2 = client.post("/api/challenges", json=challenge2_data)
            assert response2.status_code == 409  # Conflict
            data = response2.json()
            assert "already challenged" in data["error"].lower()

    def test_territory_validation(self, client, territory_service):
        """Test territory data validation"""
        invalid_territory_data = {
            "name": "",  # Empty name
            "coordinates": {"lat": 1000, "lng": 2000},  # Invalid coordinates
            "owner": "player-1"
        }
        
        with patch('src.backend.routes.territory.territory_service', territory_service):
            response = client.post("/api/territories", json=invalid_territory_data)
            
            assert response.status_code == 422  # Validation error

    def test_challenge_validation(self, client, territory_service):
        """Test challenge data validation"""
        invalid_challenge_data = {
            "territory_id": "test-territory-1",
            "challenger_id": "",  # Empty challenger ID
            "defender_id": "player-1"
        }
        
        with patch('src.backend.routes.challenge.territory_service', territory_service):
            response = client.post("/api/challenges", json=invalid_challenge_data)
            
            assert response.status_code == 422  # Validation error

    def test_territory_search_endpoint(self, client, territory_service, mock_territory):
        """Test GET /api/territories/search endpoint"""
        territory_service.add_territory(mock_territory)
        
        with patch('src.backend.routes.territory.territory_service', territory_service):
            response = client.get("/api/territories/search?q=test")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["id"] == mock_territory.id

    def test_territory_statistics_endpoint(self, client, territory_service, mock_territory):
        """Test GET /api/territories/statistics endpoint"""
        territory_service.add_territory(mock_territory)
        
        with patch('src.backend.routes.territory.territory_service', territory_service):
            response = client.get("/api/territories/statistics")
            
            assert response.status_code == 200
            data = response.json()
            assert "total_territories" in data
            assert "total_challenges" in data
            assert "active_challenges" in data

    def test_territory_health_check(self, client, territory_service):
        """Test GET /api/territories/health endpoint"""
        with patch('src.backend.routes.territory.territory_service', territory_service):
            response = client.get("/api/territories/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert "territory_count" in data
            assert "challenge_count" in data 