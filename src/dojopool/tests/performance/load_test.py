"""Load testing script for DojoPool API and frontend."""

import json
import random
from typing import Any, Dict, NoReturn, Optional

from locust import HttpUser, between, task


class DojoPoolUser(HttpUser):
    """Simulated DojoPool user for load testing."""

    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    token: Optional[str] = None

    def on_start(self) -> None:
        """Log in before starting tasks."""
        response = self.client.post(
            "/api/auth/login",
            json={
                "username": f"test_user_{random.randint(1, 1000)}",
                "password": "test_password",
            },
        )
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.client.headers = {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def view_rankings(self):
        """View global rankings."""
        self.client.get("/api/rankings/global")

    @task(2)
    def view_game_stats(self):
        """View game statistics."""
        self.client.get("/api/v1/games/stats")

    @task(2)
    def view_player_profile(self):
        """View player profile."""
        player_id = random.randint(1, 100)
        self.client.get(f"/api/rankings/player/{player_id}")

    @task(1)
    def create_game(self) -> None:
        """Create a new game."""
        game_data = {
            "type": "EIGHT_BALL",
            "player1": {"user_id": random.randint(1, 100), "score": 0},
            "player2": {"user_id": random.randint(1, 100), "score": 0},
        }
        self.client.post("/api/v1/games", json=game_data)

    @task(1)
    def update_game(self):
        """Update game score."""
        game_id = random.randint(1, 100)
        update_data = {
            "status": "IN_PROGRESS",
            "player1_score": random.randint(0, 7),
            "player2_score": random.randint(0, 7),
        }
        self.client.put(f"/api/v1/games/{game_id}", json=update_data)


class DojoPoolMobileUser(DojoPoolUser):
    """Simulated mobile user with different behavior patterns."""

    wait_time = between(5, 15)  # Mobile users tend to take longer between actions

    @task(5)
    def view_personal_stats(self):
        """View personal statistics (more common on mobile)."""
        if self.token:
            self.client.get("/api/v1/games/stats?personal=true")

    @task(3)
    def check_notifications(self):
        """Check notifications (mobile-specific)."""
        if self.token:
            self.client.get("/api/notifications")


class DojoPoolAdminUser(DojoPoolUser):
    """Simulated admin user for testing admin functions."""

    wait_time = between(2, 5)

    def on_start(self) -> None:
        """Log in as admin."""
        response = self.client.post(
            "/api/auth/login", json={"username": "admin", "password": "admin_password"}
        )
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.client.headers = {"Authorization": f"Bearer {self.token}"}

    @task(1)
    def update_rankings(self):
        """Trigger rankings update."""
        self.client.post("/api/rankings/update")

    @task(2)
    def view_system_stats(self):
        """View system statistics."""
        self.client.get("/api/admin/stats")


def run():
    """Run load test with command line interface."""
    import logging
    import os
    import time

    import gevent
    from locust.env import Environment
    from locust.log import setup_logging
    from locust.stats import stats_history, stats_printer

    # Setup logging
    setup_logging("INFO", None)

    # Create environment
    env = Environment(
        user_classes=[DojoPoolUser, DojoPoolMobileUser, DojoPoolAdminUser],
        host="http://localhost:8000",
    )

    # Start web interface
    env.create_web_ui("localhost", 8089)

    # Start the test
    env.create_local_runner()

    # Start a greenlet that periodically outputs the current stats
    gevent.spawn(stats_printer(env.stats))

    # Start a greenlet that saves current stats to history
    gevent.spawn(stats_history, env.runner)

    # Start the test
    env.runner.start(100, spawn_rate=10)

    # Wait for 30 seconds
    time.sleep(30)

    # Stop the runner
    env.runner.quit()


if __name__ == "__main__":
    run()
