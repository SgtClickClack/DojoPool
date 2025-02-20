from flask_caching import Cache
import gc
from flask_caching import Cache
import gc
"""Matchmaking service.

This module provides matchmaking functionality to find suitable opponents.
"""

from datetime import datetime, timedelta

import numpy as np
from src.core.database import cache, db
from src.core.models import Game, User
from src.core.services.ai_recommendations import RecommendationEngine


class MatchmakingService:
    """Service for finding and matching players."""

    def __init__(self):
        """Initialize matchmaking service."""
        self.recommendation_engine = RecommendationEngine()

        # Matchmaking weights
        self.weights = {
            "skill_level": 0.4,
            "play_style": 0.2,
            "availability": 0.2,
            "location": 0.1,
            "social_factors": 0.1,
        }

        # Skill level thresholds
        self.skill_thresholds = {
            "beginner": (0, 1000),
            "intermediate": (1001, 2000),
            "advanced": (2001, 3000),
            "expert": (3001, float("inf")),
        }

    def find_matches(self, user_id, game_type=None, venue_id=None, max_matches=5):
        """Find suitable matches for a player.

        Args:
            user_id: User ID
            game_type: Optional game type filter
            venue_id: Optional venue filter
            max_matches: Maximum number of matches to return

        Returns:
            list: Potential matches
        """
        # Try to get from cache
        cache_key = f"matches:{user_id}:{game_type}:{venue_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        user = User.query.get(user_id)
        if not user:
            return []

        # Get base query for active players
        query = User.query.filter(
            User.id != user_id,
            User.is_active is True,
            User.last_active >= datetime.utcnow() - timedelta(minutes=15),
        )

        # Apply filters
        if game_type:
            query = query.filter(User.preferred_game_types.contains([game_type]))

        if venue_id:
            query = query.filter(User.preferred_venues.contains([venue_id]))

        # Get potential matches
        potential_matches = query.all()
        if not potential_matches:
            return []

        # Calculate match scores
        matches = []
        for match in potential_matches:
            score = self._calculate_match_score(user, match)
            if score > 0:
                matches.append(
                    {
                        "user": match,
                        "score": score,
                        "compatibility": self._get_compatibility_details(user, match),
                    }
                )

        # Sort by score and get top matches
        matches.sort(key=lambda x: x["score"], reverse=True)
        results = matches[:max_matches]

        # Cache results
        cache.set(cache_key, results, timeout=300)  # 5 minutes

        return results

    def create_match(self, user_id, opponent_id, game_type, venue_id=None):
        """Create a match between players.

        Args:
            user_id: User ID
            opponent_id: Opponent ID
            game_type: Game type
            venue_id: Optional venue ID

        Returns:
            Game: Created game instance
        """
        # Verify both players
        user = User.query.get(user_id)
        opponent = User.query.get(opponent_id)

        if not user or not opponent:
            return None

        # Create game
        game = Game(
            type_id=game_type,
            venue_id=venue_id,
            status="pending",
            created_by=user_id,
            start_time=datetime.utcnow(),
        )

        # Add players
        game.add_player(user)
        game.add_player(opponent)

        # Save to database
        db.session.add(game)
        db.session.commit()

        # Send notifications
        from src.core.models import Notification

        Notification.create(
            user_id=opponent_id,
            type="game_invite",
            title="New Game Invitation",
            message=f"{user.username} has invited you to a game!",
            data={"game_id": game.id},
            action_url=f"/games/{game.id}",
        )

        return game

    def get_active_matches(self, user_id):
        """Get active matches for a player.

        Args:
            user_id: User ID

        Returns:
            list: Active matches
        """
        return (
            Game.query.filter(
                Game.players.any(user_id=user_id),
                Game.status.in_(["pending", "active"]),
            )
            .order_by(Game.created_at.desc())
            .all()
        )

    def accept_match(self, game_id, user_id):
        """Accept a match invitation.

        Args:
            game_id: Game ID
            user_id: User ID accepting the match

        Returns:
            bool: True if accepted successfully
        """
        game = Game.query.get(game_id)
        if not game or game.status != "pending":
            return False

        # Verify user is part of game
        if not any(p.user_id == user_id for p in game.players):
            return False

        # Update game status
        game.status = "active"
        game.accepted_at = datetime.utcnow()
        db.session.commit()

        # Notify other player
        other_player = next(p for p in game.players if p.user_id != user_id)
        Notification.create(
            user_id=other_player.user_id,
            type="game_accepted",
            title="Game Accepted",
            message=f"{other_player.user.username} has accepted your game invitation!",
            data={"game_id": game.id},
            action_url=f"/games/{game.id}",
        )

        return True

    def decline_match(self, game_id, user_id, reason=None):
        """Decline a match invitation.

        Args:
            game_id: Game ID
            user_id: User ID declining the match
            reason: Optional reason for declining

        Returns:
            bool: True if declined successfully
        """
        game = Game.query.get(game_id)
        if not game or game.status != "pending":
            return False

        # Verify user is part of game
        if not any(p.user_id == user_id for p in game.players):
            return False

        # Update game status
        game.status = "declined"
        game.ended_at = datetime.utcnow()
        db.session.commit()

        # Notify other player
        other_player = next(p for p in game.players if p.user_id != user_id)
        Notification.create(
            user_id=other_player.user_id,
            type="game_declined",
            title="Game Declined",
            message=f"{other_player.user.username} has declined your game invitation.",
            data={"game_id": game.id, "reason": reason},
        )

        return True

    def _calculate_match_score(self, user, opponent):
        """Calculate match score between players.

        Args:
            user: User instance
            opponent: Opponent instance

        Returns:
            float: Match score (0-1)
        """
        scores = {
            "skill_level": self._calculate_skill_compatibility(user, opponent),
            "play_style": self._calculate_style_compatibility(user, opponent),
            "availability": self._calculate_availability_compatibility(user, opponent),
            "location": self._calculate_location_compatibility(user, opponent),
            "social_factors": self._calculate_social_compatibility(user, opponent),
        }

        # Calculate weighted score
        total_score = sum(
            scores[factor] * weight for factor, weight in self.weights.items()
        )

        return total_score

    def _calculate_skill_compatibility(self, user, opponent):
        """Calculate skill level compatibility.

        Args:
            user: User instance
            opponent: Opponent instance

        Returns:
            float: Compatibility score (0-1)
        """
        # Get skill ratings
        user_rating = user.skill_rating or 0
        opponent_rating = opponent.skill_rating or 0

        # Calculate difference
        rating_diff = abs(user_rating - opponent_rating)
        max_diff = 1000  # Maximum acceptable difference

        # Convert to score (closer = higher score)
        return max(0, 1 - (rating_diff / max_diff))

    def _calculate_style_compatibility(self, user, opponent):
        """Calculate playing style compatibility.

        Args:
            user: User instance
            opponent: Opponent instance

        Returns:
            float: Compatibility score (0-1)
        """
        user_features = self.recommendation_engine.get_player_features(user.id)
        opponent_features = self.recommendation_engine.get_player_features(opponent.id)

        if user_features is None or opponent_features is None:
            return 0.5  # Default to neutral if not enough data

        # Calculate cosine similarity
        similarity = np.dot(user_features, opponent_features) / (
            np.linalg.norm(user_features) * np.linalg.norm(opponent_features)
        )

        return (similarity + 1) / 2  # Convert to 0-1 scale

    def _calculate_availability_compatibility(self, user, opponent):
        """Calculate availability compatibility.

        Args:
            user: User instance
            opponent: Opponent instance

        Returns:
            float: Compatibility score (0-1)
        """
        if not user.is_active or not opponent.is_active:
            return 0

        # Check last active times
        user_active = user.last_active >= datetime.utcnow() - timedelta(minutes=15)
        opponent_active = opponent.last_active >= datetime.utcnow() - timedelta(
            minutes=15
        )

        if user_active and opponent_active:
            return 1.0

        # Calculate based on overlapping play times
        user_schedule = set(user.play_schedule or [])
        opponent_schedule = set(opponent.play_schedule or [])

        if not user_schedule or not opponent_schedule:
            return 0.5  # Default if no schedule data

        overlap = len(user_schedule & opponent_schedule)
        total = len(user_schedule | opponent_schedule)

        return overlap / total if total > 0 else 0

    def _calculate_location_compatibility(self, user, opponent):
        """Calculate location compatibility.

        Args:
            user: User instance
            opponent: Opponent instance

        Returns:
            float: Compatibility score (0-1)
        """
        user_venues = set(user.preferred_venues or [])
        opponent_venues = set(opponent.preferred_venues or [])

        if not user_venues or not opponent_venues:
            return 0.5  # Default if no venue preferences

        # Calculate venue overlap
        overlap = len(user_venues & opponent_venues)
        total = len(user_venues | opponent_venues)

        return overlap / total if total > 0 else 0

    def _calculate_social_compatibility(self, user, opponent):
        """Calculate social compatibility.

        Args:
            user: User instance
            opponent: Opponent instance

        Returns:
            float: Compatibility score (0-1)
        """
        factors = []

        # Check if they're friends
        if user.is_friend(opponent):
            factors.append(1.0)

        # Check previous games together
        games_together = Game.query.filter(Game.status == "completed").count()

        if games_together > 0:
            factors.append(min(games_together / 10, 1.0))  # Cap at 10 games

        # Check mutual friends
        mutual_friends = len(set(user.friends) & set(opponent.friends))
        if mutual_friends > 0:
            factors.append(min(mutual_friends / 5, 1.0))  # Cap at 5 mutual friends

        return sum(factors) / len(factors) if factors else 0.5

    def _get_compatibility_details(self, user, opponent):
        """Get detailed compatibility information.

        Args:
            user: User instance
            opponent: Opponent instance

        Returns:
            dict: Compatibility details
        """
        return {
            "skill_level": {
                "score": self._calculate_skill_compatibility(user, opponent),
                "user_rating": user.skill_rating,
                "opponent_rating": opponent.skill_rating,
            },
            "play_style": {
                "score": self._calculate_style_compatibility(user, opponent),
                "user_style": user.play_style,
                "opponent_style": opponent.play_style,
            },
            "availability": {
                "score": self._calculate_availability_compatibility(user, opponent),
                "user_active": user.is_active,
                "opponent_active": opponent.is_active,
            },
            "location": {
                "score": self._calculate_location_compatibility(user, opponent),
                "common_venues": list(
                    set(user.preferred_venues or [])
                    & set(opponent.preferred_venues or [])
                ),
            },
            "social": {
                "score": self._calculate_social_compatibility(user, opponent),
                "is_friend": user.is_friend(opponent),
                "mutual_friends": len(set(user.friends) & set(opponent.friends)),
            },
        }
