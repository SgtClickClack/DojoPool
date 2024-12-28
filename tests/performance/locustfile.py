"""Load testing configuration using Locust."""

from locust import HttpUser, task, between, events
from locust.contrib.fasthttp import FastHttpUser
from random import randint, choice
import json
import websocket
import time
import gevent

class WebSocketClient:
    def __init__(self, host):
        self.host = host
        self.ws = None
        
    def connect(self, token):
        """Connect to WebSocket server."""
        try:
            self.ws = websocket.create_connection(
                f"ws://{self.host}/ws",
                header={"Authorization": f"Bearer {token}"}
            )
            return True
        except Exception as e:
            print(f"WebSocket connection failed: {e}")
            return False
            
    def send(self, message):
        """Send message through WebSocket."""
        try:
            self.ws.send(json.dumps(message))
            return True
        except Exception as e:
            print(f"WebSocket send failed: {e}")
            return False
            
    def receive(self):
        """Receive message from WebSocket."""
        try:
            return json.loads(self.ws.recv())
        except Exception as e:
            print(f"WebSocket receive failed: {e}")
            return None
            
    def close(self):
        """Close WebSocket connection."""
        if self.ws:
            self.ws.close()

class DojoPoolUser(FastHttpUser):
    """Simulated user for load testing."""
    
    wait_time = between(1, 3)  # More realistic wait time
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.ws_client = None
        self.token = None
        self.current_game = None
        
    def on_start(self):
        """Setup before starting tasks."""
        # Login and get token
        response = self.client.post("/auth/login", json={
            "email": f"test{randint(1, 1000)}@example.com",
            "password": "testpassword"
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            # Initialize WebSocket connection
            self.ws_client = WebSocketClient(self.host)
            self.ws_client.connect(self.token)
    
    def on_stop(self):
        """Cleanup after tasks."""
        if self.ws_client:
            self.ws_client.close()
    
    @task(10)
    def view_dashboard(self):
        """View dashboard page with high frequency."""
        with self.client.get("/dashboard", catch_response=True) as response:
            if response.status_code != 200:
                response.failure("Dashboard failed to load")
    
    @task(5)
    def view_tournaments(self):
        """View active tournaments."""
        self.client.get("/api/tournaments/active")
        # Subscribe to tournament updates via WebSocket
        if self.ws_client:
            self.ws_client.send({"type": "subscribe", "channel": "tournaments"})
    
    @task(5)
    def view_recent_games(self):
        """View recent games with WebSocket updates."""
        self.client.get("/api/games/recent")
        if self.ws_client:
            self.ws_client.send({"type": "subscribe", "channel": "games"})
    
    @task(5)
    def view_leaderboard(self):
        """View leaderboard with different categories."""
        category = choice(['overall', 'monthly', 'tournament', 'weekly'])
        self.client.get(f"/api/leaderboard?category={category}")
    
    @task(3)
    def play_game(self):
        """Simulate playing a game with WebSocket updates."""
        if not self.current_game:
            # Create new game
            payload = {
                "game_type": choice(["8-ball", "9-ball"]),
                "venue_id": randint(1, 5),
                "opponent_id": randint(1, 100)
            }
            response = self.client.post("/api/games", json=payload)
            if response.status_code == 201:
                self.current_game = response.json()["game_id"]
                # Subscribe to game updates
                if self.ws_client:
                    self.ws_client.send({
                        "type": "subscribe",
                        "channel": f"game_{self.current_game}"
                    })
        
        if self.current_game:
            # Simulate game progress
            payload = {
                "score": randint(0, 7),
                "opponent_score": randint(0, 7),
                "status": choice(["active", "completed"])
            }
            self.client.put(f"/api/games/{self.current_game}", json=payload)
            # Send game update via WebSocket
            if self.ws_client:
                self.ws_client.send({
                    "type": "game_update",
                    "game_id": self.current_game,
                    "data": payload
                })
            
            if payload["status"] == "completed":
                self.current_game = None
    
    @task(2)
    def chat_message(self):
        """Send chat messages in game."""
        if self.current_game and self.ws_client:
            message = {
                "type": "chat",
                "game_id": self.current_game,
                "message": f"Message {randint(1, 1000)}"
            }
            self.ws_client.send(message)
    
    @task(1)
    def view_user_stats(self):
        """View user statistics."""
        user_id = randint(1, 100)
        self.client.get(f"/api/users/{user_id}/stats")

class DojoPoolAdminUser(FastHttpUser):
    """Simulated admin user for load testing."""
    
    wait_time = between(2, 5)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.ws_client = None
        self.token = None
    
    def on_start(self):
        """Setup before starting tasks."""
        # Login as admin and get token
        response = self.client.post("/auth/login", json={
            "email": "admin@dojopool.com",
            "password": "adminpassword"
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            # Initialize WebSocket connection
            self.ws_client = WebSocketClient(self.host)
            self.ws_client.connect(self.token)
    
    def on_stop(self):
        """Cleanup after tasks."""
        if self.ws_client:
            self.ws_client.close()
    
    @task(3)
    def monitor_system(self):
        """Monitor system status."""
        self.client.get("/admin/dashboard")
        self.client.get("/admin/metrics")
        if self.ws_client:
            self.ws_client.send({"type": "subscribe", "channel": "system_metrics"})
    
    @task(2)
    def manage_tournaments(self):
        """Manage tournaments."""
        # Create tournament
        payload = {
            "name": f"Tournament {randint(1, 1000)}",
            "start_date": "2024-01-01",
            "end_date": "2024-01-07",
            "max_players": 32,
            "game_type": choice(["8-ball", "9-ball"])
        }
        response = self.client.post("/api/tournaments", json=payload)
        if response.status_code == 201:
            tournament_id = response.json()["tournament_id"]
            # Update tournament
            update_payload = {
                "status": choice(["registration", "active", "completed"]),
                "current_round": randint(1, 4)
            }
            self.client.put(f"/api/tournaments/{tournament_id}", json=update_payload)
    
    @task(2)
    def manage_users(self):
        """Manage user accounts."""
        # View user list
        self.client.get("/admin/users")
        # Update user status
        user_id = randint(1, 100)
        payload = {
            "status": choice(["active", "suspended", "inactive"]),
            "role": choice(["user", "moderator"])
        }
        self.client.put(f"/admin/users/{user_id}", json=payload)
    
    @task(1)
    def system_maintenance(self):
        """Perform system maintenance tasks."""
        self.client.post("/admin/maintenance/cleanup")
        self.client.post("/admin/maintenance/optimize")
        self.client.get("/admin/logs")