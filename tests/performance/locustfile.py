"""Load testing configuration using Locust."""

from locust import HttpUser, task, between
from random import randint, choice
import json

class DojoPoolUser(HttpUser):
    """Simulated user for load testing."""
    
    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks
    
    def on_start(self):
        """Setup before starting tasks."""
        # Login
        self.client.post("/auth/login", {
            "email": f"test{randint(1, 1000)}@example.com",
            "password": "testpassword"
        })
    
    @task(3)
    def view_dashboard(self):
        """View dashboard page."""
        self.client.get("/dashboard")
    
    @task(2)
    def view_tournaments(self):
        """View active tournaments."""
        self.client.get("/api/tournaments/active")
    
    @task(2)
    def view_recent_games(self):
        """View recent games."""
        self.client.get("/api/games/recent")
    
    @task(2)
    def view_leaderboard(self):
        """View leaderboard."""
        category = choice(['overall', 'monthly', 'tournament', 'weekly'])
        self.client.get(f"/api/leaderboard?category={category}")
    
    @task(1)
    def view_user_rankings(self):
        """View user rankings."""
        user_id = randint(1, 100)
        self.client.get(f"/api/leaderboard/user/{user_id}")
    
    @task(1)
    def create_game(self):
        """Create a new game."""
        payload = {
            "game_type": choice(["8-ball", "9-ball"]),
            "venue_id": randint(1, 5),
            "opponent_id": randint(1, 100)
        }
        self.client.post("/api/games", json=payload)
    
    @task(1)
    def update_game(self):
        """Update game state."""
        game_id = randint(1, 100)
        payload = {
            "score": randint(0, 7),
            "opponent_score": randint(0, 7),
            "status": choice(["active", "completed"])
        }
        self.client.put(f"/api/games/{game_id}", json=payload)
    
    @task(1)
    def view_user_stats(self):
        """View user statistics."""
        user_id = randint(1, 100)
        self.client.get(f"/api/users/{user_id}/stats")

class DojoPoolAdminUser(HttpUser):
    """Simulated admin user for load testing."""
    
    wait_time = between(2, 5)
    
    def on_start(self):
        """Setup before starting tasks."""
        # Login as admin
        self.client.post("/auth/login", {
            "email": "admin@dojopool.com",
            "password": "adminpassword"
        })
    
    @task(2)
    def view_admin_dashboard(self):
        """View admin dashboard."""
        self.client.get("/admin/dashboard")
    
    @task(1)
    def create_tournament(self):
        """Create a new tournament."""
        payload = {
            "name": f"Tournament {randint(1, 1000)}",
            "start_date": "2024-01-01",
            "end_date": "2024-01-07",
            "max_players": 32
        }
        self.client.post("/api/tournaments", json=payload)
    
    @task(1)
    def update_leaderboard(self):
        """Update user scores."""
        payload = {
            "user_id": randint(1, 100),
            "category": choice(['overall', 'monthly', 'tournament']),
            "score_change": randint(1, 50)
        }
        self.client.post("/api/leaderboard/update", json=payload)
    
    @task(1)
    def refresh_rankings(self):
        """Refresh leaderboard rankings."""
        payload = {
            "category": choice(['overall', 'monthly', 'tournament'])
        }
        self.client.post("/api/leaderboard/refresh", json=payload)
    
    @task(1)
    def view_user_stats(self):
        """View user statistics."""
        user_id = randint(1, 100)
        self.client.get(f"/api/users/{user_id}/stats")