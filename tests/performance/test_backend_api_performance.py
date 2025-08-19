import pytest
import asyncio
import time
import statistics
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import Mock, patch
import requests
from fastapi.testclient import TestClient
from src.backend.index import app
from src.services.territory.TerritoryGameplayService import TerritoryGameplayService
from src.services.economy.DojoCoinEconomyService import DojoCoinEconomyService
from src.services.blockchain.EnhancedBlockchainService import EnhancedBlockchainService

class TestBackendAPIPerformance:
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    @pytest.fixture
    def territory_service(self):
        return TerritoryGameplayService()
    
    @pytest.fixture
    def economy_service(self):
        return DojoCoinEconomyService()
    
    @pytest.fixture
    def blockchain_service(self):
        return EnhancedBlockchainService()

    def test_territory_api_response_time(self, client, territory_service):
        """Test territory API response time under normal load"""
        # Add test territories
        for i in range(100):
            territory_service.add_territory({
                "id": f"territory-{i}",
                "name": f"Test Dojo {i}",
                "coordinates": {"lat": -27.4698 + i*0.01, "lng": 153.0251 + i*0.01},
                "owner": f"player-{i % 10}",
                "clan": f"clan-{i % 5}",
                "requiredNFT": f"trophy-{i}"
            })
        
        with patch('src.backend.routes.territory.territory_service', territory_service):
            start_time = time.time()
            response = client.get("/api/territories")
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000  # Convert to milliseconds
            
            assert response.status_code == 200
            assert response_time < 100  # Should respond within 100ms
            assert len(response.json()) == 100

    def test_territory_api_concurrent_requests(self, client, territory_service):
        """Test territory API under concurrent load"""
        # Add test territories
        for i in range(50):
            territory_service.add_territory({
                "id": f"territory-{i}",
                "name": f"Test Dojo {i}",
                "coordinates": {"lat": -27.4698 + i*0.01, "lng": 153.0251 + i*0.01},
                "owner": f"player-{i % 10}",
                "clan": f"clan-{i % 5}",
                "requiredNFT": f"trophy-{i}"
            })
        
        def make_request():
            with patch('src.backend.routes.territory.territory_service', territory_service):
                start_time = time.time()
                response = client.get("/api/territories")
                end_time = time.time()
                return {
                    "status_code": response.status_code,
                    "response_time": (end_time - start_time) * 1000,
                    "data_length": len(response.json()) if response.status_code == 200 else 0
                }
        
        # Make 50 concurrent requests
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(50)]
            results = [future.result() for future in futures]
        
        # Analyze results
        response_times = [r["response_time"] for r in results]
        status_codes = [r["status_code"] for r in results]
        
        assert all(code == 200 for code in status_codes)
        assert statistics.mean(response_times) < 200  # Average response time < 200ms
        assert max(response_times) < 500  # Max response time < 500ms
        assert all(r["data_length"] == 50 for r in results)

    def test_challenge_api_performance(self, client, territory_service):
        """Test challenge API performance"""
        # Add test territory
        territory_service.add_territory({
            "id": "territory-1",
            "name": "Test Dojo",
            "coordinates": {"lat": -27.4698, "lng": 153.0251},
            "owner": "player-1",
            "clan": "test-clan",
            "requiredNFT": "trophy-1"
        })
        
        challenge_data = {
            "territory_id": "territory-1",
            "challenger_id": "player-2",
            "defender_id": "player-1"
        }
        
        with patch('src.backend.routes.challenge.territory_service', territory_service):
            start_time = time.time()
            response = client.post("/api/challenges", json=challenge_data)
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 201
            assert response_time < 150  # Should respond within 150ms

    def test_economy_api_performance(self, client, economy_service):
        """Test economy API performance"""
        # Create test user balance
        economy_service.create_user_balance("user-1")
        
        with patch('src.backend.routes.economy.economy_service', economy_service):
            # Test balance retrieval
            start_time = time.time()
            response = client.get("/api/economy/users/user-1/balance")
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 200
            assert response_time < 100  # Should respond within 100ms

    def test_blockchain_api_performance(self, client, blockchain_service):
        """Test blockchain API performance"""
        # Connect test wallet
        blockchain_service.connect_wallet("0x1234567890123456789012345678901234567890", "ethereum")
        
        with patch('src.backend.routes.blockchain.blockchain_service', blockchain_service):
            # Test wallet balance
            start_time = time.time()
            response = client.get("/api/blockchain/wallets/0x1234567890123456789012345678901234567890/balance")
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 200
            assert response_time < 200  # Should respond within 200ms

    def test_social_api_performance(self, client):
        """Test social API performance"""
        # Mock social service
        with patch('src.backend.routes.social.social_service') as mock_social:
            mock_social.get_friends.return_value = [{"id": "user-2"}, {"id": "user-3"}]
            
            start_time = time.time()
            response = client.get("/api/social/users/user-1/friends")
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 200
            assert response_time < 100  # Should respond within 100ms

    def test_clan_api_performance(self, client):
        """Test clan API performance"""
        # Mock clan service
        with patch('src.backend.routes.clan.clan_service') as mock_clan:
            mock_clan.get_clan.return_value = {
                "id": "clan-1",
                "name": "Test Clan",
                "memberCount": 10
            }
            
            start_time = time.time()
            response = client.get("/api/clans/clan-1")
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 200
            assert response_time < 100  # Should respond within 100ms

    def test_venue_api_performance(self, client):
        """Test venue API performance"""
        # Mock venue service
        with patch('src.backend.routes.venue.venue_service') as mock_venue:
            mock_venue.get_venue.return_value = {
                "id": "venue-1",
                "name": "Test Dojo",
                "status": "active"
            }
            
            start_time = time.time()
            response = client.get("/api/venues/venue-1")
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 200
            assert response_time < 100  # Should respond within 100ms

    def test_memory_usage_under_load(self, client, territory_service):
        """Test memory usage under sustained load"""
        import psutil
        import os
        
        # Add large number of territories
        for i in range(1000):
            territory_service.add_territory({
                "id": f"territory-{i}",
                "name": f"Test Dojo {i}",
                "coordinates": {"lat": -27.4698 + i*0.001, "lng": 153.0251 + i*0.001},
                "owner": f"player-{i % 100}",
                "clan": f"clan-{i % 20}",
                "requiredNFT": f"trophy-{i % 50}"
            })
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        with patch('src.backend.routes.territory.territory_service', territory_service):
            # Make multiple requests
            for _ in range(100):
                response = client.get("/api/territories")
                assert response.status_code == 200
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (< 50MB)
        assert memory_increase < 50

    def test_database_query_performance(self, client):
        """Test database query performance"""
        # Mock database queries
        with patch('src.backend.database.get_territories') as mock_db:
            mock_db.return_value = [
                {
                    "id": f"territory-{i}",
                    "name": f"Test Dojo {i}",
                    "owner": f"player-{i % 10}",
                    "clan": f"clan-{i % 5}"
                }
                for i in range(100)
            ]
            
            start_time = time.time()
            response = client.get("/api/territories")
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 200
            assert response_time < 200  # Database queries should be fast
            assert len(response.json()) == 100

    def test_error_handling_performance(self, client):
        """Test error handling performance"""
        # Mock service that raises exception
        with patch('src.backend.routes.territory.territory_service') as mock_service:
            mock_service.get_all_territories.side_effect = Exception("Database error")
            
            start_time = time.time()
            response = client.get("/api/territories")
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 500
            assert response_time < 100  # Error handling should be fast

    def test_authentication_performance(self, client):
        """Test authentication performance"""
        # Mock authentication
        with patch('src.backend.auth.verify_token') as mock_auth:
            mock_auth.return_value = {"user_id": "test-user"}
            
            start_time = time.time()
            response = client.get("/api/territories", headers={"Authorization": "Bearer test-token"})
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 200
            assert response_time < 150  # Authentication should be fast

    def test_websocket_performance(self, client):
        """Test WebSocket performance"""
        # Mock WebSocket connection
        with patch('src.backend.websocket.manager') as mock_ws:
            mock_ws.broadcast.return_value = None
            
            start_time = time.time()
            # Simulate WebSocket message
            response = client.post("/api/websocket/broadcast", json={
                "event": "territory_update",
                "data": {"id": "territory-1", "owner": "player-2"}
            })
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 200
            assert response_time < 100  # WebSocket operations should be fast

    def test_file_upload_performance(self, client):
        """Test file upload performance"""
        # Mock file upload
        with patch('src.backend.routes.upload.save_file') as mock_upload:
            mock_upload.return_value = {"filename": "test.jpg", "size": 1024}
            
            test_file = b"test file content" * 1000  # 16KB file
            
            start_time = time.time()
            response = client.post(
                "/api/upload/avatar",
                files={"file": ("test.jpg", test_file, "image/jpeg")}
            )
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 200
            assert response_time < 500  # File upload should be reasonable

    def test_search_performance(self, client, territory_service):
        """Test search functionality performance"""
        # Add test territories
        for i in range(500):
            territory_service.add_territory({
                "id": f"territory-{i}",
                "name": f"Test Dojo {i}",
                "coordinates": {"lat": -27.4698 + i*0.001, "lng": 153.0251 + i*0.001},
                "owner": f"player-{i % 50}",
                "clan": f"clan-{i % 10}",
                "requiredNFT": f"trophy-{i % 25}"
            })
        
        with patch('src.backend.routes.territory.territory_service', territory_service):
            start_time = time.time()
            response = client.get("/api/territories/search?q=test")
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 200
            assert response_time < 300  # Search should be reasonably fast

    def test_pagination_performance(self, client, territory_service):
        """Test pagination performance"""
        # Add large number of territories
        for i in range(1000):
            territory_service.add_territory({
                "id": f"territory-{i}",
                "name": f"Test Dojo {i}",
                "coordinates": {"lat": -27.4698 + i*0.001, "lng": 153.0251 + i*0.001},
                "owner": f"player-{i % 100}",
                "clan": f"clan-{i % 20}",
                "requiredNFT": f"trophy-{i % 50}"
            })
        
        with patch('src.backend.routes.territory.territory_service', territory_service):
            start_time = time.time()
            response = client.get("/api/territories?page=1&limit=50")
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            assert response.status_code == 200
            assert response_time < 200  # Pagination should be fast
            assert len(response.json()) == 50  # Should return exactly 50 items 