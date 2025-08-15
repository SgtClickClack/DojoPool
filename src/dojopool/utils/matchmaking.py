"""Matchmaking system module."""

from datetime import datetime, timedelta

from dojopool.models.game import Game
from dojopool.extensions import cache


class MatchmakingSystem:
    """Matchmaking system for finding suitable game opponents."""

    def __init__(self):
        """Initialize matchmaking system."""
        self.queue_timeout = 300  # 5 minutes
        self.skill_range = 0.2  # ±20% skill range for matching

    def find_match(self, player_id: int, venue_id: int = None) -> dict:
        """
        Find a match for a player.

        Args:
            player_id: Player ID looking for match
            venue_id: Optional venue ID to restrict matching

        Returns:
            dict: Match details if found, None otherwise
        """
        # Check if player is already in queue
        if self._is_in_queue(player_id):
            return None

        # Find suitable match from queue
        match = self._find_suitable_match(player_id, venue_id)
        if match:
            return match

        # Add player to queue
        self._add_to_queue(player_id, venue_id)
        return None

    def _is_in_queue(self, player_id: int) -> bool:
        """Check if player is already in matchmaking queue."""
        queue = self._get_queue()
        return any(entry["player_id"] == player_id for entry in queue)

    def _get_queue(self) -> list:
        """Get current matchmaking queue."""
        return cache.get("matchmaking_queue") or []

    def _add_to_queue(self, player_id: int, venue_id: int = None):
        """Add player to matchmaking queue."""
        queue = self._get_queue()

        # Remove expired entries
        now = datetime.utcnow()
        queue = [
            entry
            for entry in queue
            if (now - datetime.fromisoformat(entry["timestamp"])).total_seconds()
            < self.queue_timeout
        ]

        # Add new entry
        queue.append(
            {
                "player_id": player_id,
                "venue_id": venue_id,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

        cache.set("matchmaking_queue", queue, timeout=self.queue_timeout)

    def _find_suitable_match(self, player_id: int, venue_id: int = None) -> dict:
        """Find suitable match from queue."""
        queue = self._get_queue()
        now = datetime.utcnow()

        # Get player's skill level
        player_skill = self._get_player_skill(player_id)

        # Find suitable match
        for entry in queue:
            # Skip expired entries
            if (
                now - datetime.fromisoformat(entry["timestamp"])
            ).total_seconds() >= self.queue_timeout:
                continue

            # Skip if venue doesn't match (when specified)
            if venue_id and entry["venue_id"] and venue_id != entry["venue_id"]:
                continue

            # Check skill compatibility
            opponent_skill = self._get_player_skill(entry["player_id"])
            if abs(player_skill - opponent_skill) <= self.skill_range:
                # Remove matched player from queue
                queue.remove(entry)
                cache.set("matchmaking_queue", queue, timeout=self.queue_timeout)

                return {
                    "player1_id": player_id,
                    "player2_id": entry["player_id"],
                    "venue_id": venue_id or entry["venue_id"],
                    "timestamp": now.isoformat(),
                }

        return None

    def _get_player_skill(self, player_id: int) -> float:
        """Get player's skill level."""
        # Try to get cached skill
        cache_key = f"player_skill:{player_id}"
        skill = cache.get(cache_key)
        if skill is not None:
            return skill

        # Calculate skill from recent games
        recent_games = self._get_recent_games(player_id)
        if not recent_games:
            skill = 0.5  # Default skill level
        else:
            wins = sum(1 for game in recent_games if game.winner_id == player_id)
            skill = wins / len(recent_games)

        # Cache skill level
        cache.set(cache_key, skill, timeout=3600)  # Cache for 1 hour

        return skill

    def _get_recent_games(self, player_id: int, days: int = 30) -> list:
        """Get player's recent games."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        return Game.query.filter(
            ((Game.player1_id == player_id) | (Game.player2_id == player_id))
            & (Game.created_at >= cutoff_date)
        ).all()

    def cancel_matchmaking(self, player_id: int):
        """Cancel matchmaking for a player."""
        queue = self._get_queue()
        queue = [entry for entry in queue if entry["player_id"] != player_id]
        cache.set("matchmaking_queue", queue, timeout=self.queue_timeout)

    def get_queue_position(self, player_id: int) -> int:
        """Get player's position in queue."""
        queue = self._get_queue()
        for i, entry in enumerate(queue):
            if entry["player_id"] == player_id:
                return i + 1
        return 0

    def get_estimated_wait_time(self, player_id: int) -> int:
        """Get estimated wait time in seconds."""
        position = self.get_queue_position(player_id)
        if position == 0:
            return 0

        # Estimate based on queue position and recent match times
        base_time = 30  # Base time in seconds
        return min(position * base_time, self.queue_timeout)
