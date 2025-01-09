import pytest
from datetime import datetime
from flask import json
from dojopool.models.user import User
from dojopool.models.game import Game
from dojopool.models.tournament import Tournament
from dojopool.extensions import db
from dojopool.exceptions import APIError

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(auth_service, sample_user):
    tokens = auth_service.generate_tokens(sample_user)
    return {
        "Authorization": f"Bearer {tokens['access_token']}",
        "Content-Type": "application/json"
    }

class TestAPI:
    def test_user_endpoints(self, client, auth_headers, sample_user):
        """Test user-related API endpoints"""
        # Test user registration
        register_data = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "test_password"
        }
        response = client.post(
            "/api/v1/users/register",
            json=register_data
        )
        assert response.status_code == 201
        assert "id" in response.json
        
        # Test user profile
        response = client.get(
            f"/api/v1/users/{sample_user.id}/profile",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json["username"] == sample_user.username
        
        # Test profile update
        update_data = {"bio": "Updated bio"}
        response = client.patch(
            f"/api/v1/users/{sample_user.id}/profile",
            headers=auth_headers,
            json=update_data
        )
        assert response.status_code == 200
        assert response.json["bio"] == "Updated bio"

    def test_game_endpoints(self, client, auth_headers, sample_game):
        """Test game-related API endpoints"""
        # Test game creation
        game_data = {
            "game_type": "8ball",
            "players": [{"user_id": 1, "role": "player"}]
        }
        response = client.post(
            "/api/v1/games",
            headers=auth_headers,
            json=game_data
        )
        assert response.status_code == 201
        game_id = response.json["id"]
        
        # Test game retrieval
        response = client.get(
            f"/api/v1/games/{game_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json["game_type"] == "8ball"
        
        # Test game update
        update_data = {"status": "in_progress"}
        response = client.patch(
            f"/api/v1/games/{game_id}",
            headers=auth_headers,
            json=update_data
        )
        assert response.status_code == 200
        assert response.json["status"] == "in_progress"
        
        # Test game list with filters
        response = client.get(
            "/api/v1/games?status=in_progress&game_type=8ball",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json["games"]) > 0

    def test_tournament_endpoints(self, client, auth_headers):
        """Test tournament-related API endpoints"""
        # Test tournament creation
        tournament_data = {
            "name": "Spring Championship",
            "tournament_type": "single_elimination",
            "start_date": datetime.utcnow().isoformat(),
            "max_players": 16
        }
        response = client.post(
            "/api/v1/tournaments",
            headers=auth_headers,
            json=tournament_data
        )
        assert response.status_code == 201
        tournament_id = response.json["id"]
        
        # Test tournament registration
        response = client.post(
            f"/api/v1/tournaments/{tournament_id}/register",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json["registered"] is True
        
        # Test bracket generation
        response = client.post(
            f"/api/v1/tournaments/{tournament_id}/brackets",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert "brackets" in response.json
        
        # Test tournament status update
        update_data = {"status": "in_progress"}
        response = client.patch(
            f"/api/v1/tournaments/{tournament_id}",
            headers=auth_headers,
            json=update_data
        )
        assert response.status_code == 200
        assert response.json["status"] == "in_progress"

    def test_venue_endpoints(self, client, auth_headers):
        """Test venue-related API endpoints"""
        # Test venue creation
        venue_data = {
            "name": "Downtown Pool Hall",
            "address": "123 Main St",
            "contact_info": "555-0123"
        }
        response = client.post(
            "/api/v1/venues",
            headers=auth_headers,
            json=venue_data
        )
        assert response.status_code == 201
        venue_id = response.json["id"]
        
        # Test venue details
        response = client.get(
            f"/api/v1/venues/{venue_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json["name"] == venue_data["name"]
        
        # Test venue search
        response = client.get(
            "/api/v1/venues/search?query=Downtown",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json["venues"]) > 0

    def test_error_handling(self, client, auth_headers):
        """Test API error handling"""
        # Test 404 Not Found
        response = client.get(
            "/api/v1/nonexistent",
            headers=auth_headers
        )
        assert response.status_code == 404
        assert "error" in response.json
        
        # Test 400 Bad Request
        response = client.post(
            "/api/v1/games",
            headers=auth_headers,
            json={}  # Empty payload
        )
        assert response.status_code == 400
        assert "error" in response.json
        
        # Test 401 Unauthorized
        response = client.get(
            "/api/v1/protected",
            headers={"Content-Type": "application/json"}  # No auth token
        )
        assert response.status_code == 401
        assert "error" in response.json

    def test_pagination(self, client, auth_headers):
        """Test API pagination"""
        # Create test data
        for i in range(25):  # Create more than one page
            game = Game(
                game_type="8ball",
                status="completed",
                created_at=datetime.utcnow()
            )
            db.session.add(game)
        db.session.commit()
        
        # Test first page
        response = client.get(
            "/api/v1/games?page=1&per_page=10",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json["games"]) == 10
        assert "pagination" in response.json
        assert response.json["pagination"]["total"] > 20
        
        # Test last page
        response = client.get(
            "/api/v1/games?page=3&per_page=10",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json["games"]) > 0
        assert len(response.json["games"]) <= 10

    def test_filtering_and_sorting(self, client, auth_headers):
        """Test API filtering and sorting"""
        # Test filtering
        response = client.get(
            "/api/v1/games?status=completed&game_type=8ball",
            headers=auth_headers
        )
        assert response.status_code == 200
        for game in response.json["games"]:
            assert game["status"] == "completed"
            assert game["game_type"] == "8ball"
        
        # Test sorting
        response = client.get(
            "/api/v1/games?sort=created_at&order=desc",
            headers=auth_headers
        )
        assert response.status_code == 200
        dates = [game["created_at"] for game in response.json["games"]]
        assert dates == sorted(dates, reverse=True)

    def test_bulk_operations(self, client, auth_headers):
        """Test bulk API operations"""
        # Test bulk game creation
        games_data = [
            {"game_type": "8ball", "status": "pending"},
            {"game_type": "9ball", "status": "pending"}
        ]
        response = client.post(
            "/api/v1/games/bulk",
            headers=auth_headers,
            json={"games": games_data}
        )
        assert response.status_code == 201
        assert len(response.json["created"]) == 2
        
        # Test bulk status update
        game_ids = [g["id"] for g in response.json["created"]]
        update_data = {
            "game_ids": game_ids,
            "status": "active"
        }
        response = client.patch(
            "/api/v1/games/bulk",
            headers=auth_headers,
            json=update_data
        )
        assert response.status_code == 200
        assert len(response.json["updated"]) == 2 