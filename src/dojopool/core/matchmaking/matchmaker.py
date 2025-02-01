"""Matchmaker module for handling player matchmaking.

This module provides the core matchmaking functionality for pairing players
based on various factors like skill level, play style, and availability.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple

from ...models.game import Game
from ...models.user import User
from ..config.matchmaking import (
    LOCATION_SETTINGS,
    MATCHMAKING_WEIGHTS,
    PLAY_STYLES,
    QUEUE_SETTINGS,
    SKILL_LEVELS,
    SOCIAL_SETTINGS,
)
from .exceptions import (
    IncompatiblePlayersError,
    InvalidPreferencesError,
    PlayerNotFoundError,
    QueueFullError,
    RateLimitExceededError,
    SkillMismatchError,
    TimeConflictError,
    VenueUnavailableError,
)
from .utils import (
    calculate_time_overlap,
    check_rate_limit,
    check_scheduling_conflicts,
    find_common_venues,
    get_mutual_friends,
    validate_preferences,
)


@dataclass
class QueueEntry:
    """Data class for queue entries."""

    user: User
    preferences: Dict
    join_time: datetime
    priority: int
    last_check: datetime = None


class Matchmaker:
    """Handles player matchmaking logic."""

    def __init__(self):
        """Initialize the matchmaker."""
        self.queue: List[QueueEntry] = []
        self.last_update = datetime.now()
        self.blocked_pairs: Set[Tuple[int, int]] = set()

    def add_to_queue(self, user: User, preferences: Dict) -> bool:
        """Add a player to the matchmaking queue.

        Args:
            user: The user to add to the queue
            preferences: Matchmaking preferences for this queue entry

        Returns:
            bool: True if successfully added, False if queue is full

        Raises:
            QueueFullError: If queue is at maximum capacity
            InvalidPreferencesError: If preferences are invalid
            RateLimitExceededError: If user has exceeded rate limit
        """
        # Validate queue size
        if len(self.queue) >= QUEUE_SETTINGS["max_queue_size"]:
            raise QueueFullError()

        # Validate preferences
        if not validate_preferences(preferences):
            raise InvalidPreferencesError()

        # Check rate limit
        exceeded, retry_after = check_rate_limit(user, "matchmaking")
        if exceeded:
            raise RateLimitExceededError(user.id, retry_after)

        # Create queue entry
        entry = QueueEntry(
            user=user,
            preferences=preferences,
            join_time=datetime.now(),
            priority=QUEUE_SETTINGS["priority_levels"].get(
                user.subscription_type, QUEUE_SETTINGS["priority_levels"]["standard"]
            ),
        )

        self.queue.append(entry)
        return True

    def remove_from_queue(self, user: User) -> bool:
        """Remove a player from the matchmaking queue.

        Args:
            user: The user to remove from the queue

        Returns:
            bool: True if successfully removed, False if not found

        Raises:
            PlayerNotFoundError: If player is not in queue
        """
        for i, entry in enumerate(self.queue):
            if entry.user.id == user.id:
                self.queue.pop(i)
                return True
        raise PlayerNotFoundError(user.id)

    def find_match(self, user: User, preferences: Dict) -> Optional[User]:
        """Find a suitable match for a player.

        Args:
            user: The user to find a match for
            preferences: Matchmaking preferences

        Returns:
            Optional[User]: Matched user if found, None otherwise

        Raises:
            InvalidPreferencesError: If preferences are invalid
            MatchmakingTimeoutError: If matching takes too long
        """
        if not validate_preferences(preferences):
            raise InvalidPreferencesError()

        best_match = None
        best_score = 0

        # Sort queue by priority and wait time
        sorted_queue = sorted(
            self.queue,
            key=lambda x: (x.priority, (datetime.now() - x.join_time).total_seconds()),
            reverse=True,
        )

        for entry in sorted_queue:
            if entry.user.id == user.id:
                continue

            try:
                # Check for blocks
                if self._is_blocked(user.id, entry.user.id):
                    continue

                # Calculate match score
                match_score = self._calculate_match_score(
                    user, entry.user, preferences, entry.preferences
                )

                if match_score > best_score:
                    # Verify venue availability
                    venues = find_common_venues(user, entry.user)
                    if not venues:
                        continue

                    # Check scheduling
                    times = calculate_time_overlap(
                        preferences["available_times"], entry.preferences["available_times"]
                    )
                    if not times:
                        continue

                    # Check for conflicts
                    if any(check_scheduling_conflicts(user, entry.user, time) for time in times):
                        continue

                    best_score = match_score
                    best_match = entry.user

            except Exception as e:
                # Log error but continue matching
                print(f"Error matching with user {entry.user.id}: {str(e)}")
                continue

        return best_match if best_score >= QUEUE_SETTINGS["min_match_score"] else None

    def _calculate_match_score(self, user1: User, user2: User, prefs1: Dict, prefs2: Dict) -> float:
        """Calculate a match score between two players.

        Args:
            user1: First user to compare
            user2: Second user to compare
            prefs1: First user's preferences
            prefs2: Second user's preferences

        Returns:
            float: Match score between 0 and 1

        Raises:
            SkillMismatchError: If skill difference is too large
            IncompatiblePlayersError: If players are incompatible
        """
        # Calculate skill compatibility
        skill_score = self._calculate_skill_compatibility(user1, user2)
        if skill_score == 0:
            rating_diff = abs(user1.rating - user2.rating)
            raise SkillMismatchError(user1.id, user2.id, rating_diff)

        # Calculate play style compatibility
        style_score = self._calculate_style_compatibility(user1, user2)
        if style_score < 0.3:  # Minimum style compatibility
            raise IncompatiblePlayersError(user1.id, user2.id, "Incompatible play styles")

        # Calculate time availability
        time_score = self._calculate_time_compatibility(prefs1, prefs2)
        if time_score == 0:
            raise TimeConflictError(user1.id, user2.id)

        # Calculate location compatibility
        location_score = self._calculate_location_compatibility(user1, user2)
        if location_score == 0:
            raise VenueUnavailableError()

        # Calculate social compatibility
        social_score = self._calculate_social_compatibility(user1, user2)

        # Combine scores using weights
        scores = {
            "skill_level": skill_score,
            "play_style": style_score,
            "availability": time_score,
            "location": location_score,
            "social_factors": social_score,
        }

        return sum(scores[factor] * MATCHMAKING_WEIGHTS[factor] for factor in MATCHMAKING_WEIGHTS)

    def _calculate_skill_compatibility(self, user1: User, user2: User) -> float:
        """Calculate skill level compatibility between two players.

        Args:
            user1: First user to compare
            user2: Second user to compare

        Returns:
            float: Compatibility score between 0 and 1
        """
        rating_diff = abs(user1.rating - user2.rating)

        # Find appropriate skill level bracket
        for level in SKILL_LEVELS.values():
            if level["range"][0] <= user1.rating <= level["range"][1]:
                max_diff = level["max_diff"]
                break
        else:
            max_diff = SKILL_LEVELS["expert"]["max_diff"]

        if rating_diff > max_diff:
            return 0

        return 1 - (rating_diff / max_diff)

    def _calculate_style_compatibility(self, user1: User, user2: User) -> float:
        """Calculate play style compatibility between two players.

        Args:
            user1: First user to compare
            user2: Second user to compare

        Returns:
            float: Compatibility score between 0 and 1
        """
        style1 = user1.play_style
        style2 = user2.play_style

        if style1 not in PLAY_STYLES or style2 not in PLAY_STYLES:
            return 0.5  # Default to neutral if styles not specified

        return PLAY_STYLES[style1]["compatibility"][style2]

    def _calculate_time_compatibility(self, prefs1: Dict, prefs2: Dict) -> float:
        """Calculate time availability compatibility between preferences.

        Args:
            prefs1: First user's preferences
            prefs2: Second user's preferences

        Returns:
            float: Compatibility score between 0 and 1
        """
        if "available_times" not in prefs1 or "available_times" not in prefs2:
            return 0.5  # Default to neutral if times not specified

        # Compare available time slots
        overlapping_slots = calculate_time_overlap(
            prefs1["available_times"], prefs2["available_times"]
        )
        total_slots = set(prefs1["available_times"]) | set(prefs2["available_times"])

        if not total_slots:
            return 0

        return len(overlapping_slots) / len(total_slots)

    def _calculate_location_compatibility(self, user1: User, user2: User) -> float:
        """Calculate venue location compatibility between two players.

        Args:
            user1: First user to compare
            user2: Second user to compare

        Returns:
            float: Compatibility score between 0 and 1
        """
        # Get shared venues
        venues = find_common_venues(user1, user2, max_distance=LOCATION_SETTINGS["max_distance"])

        if not venues:
            return 0

        if len(venues) >= LOCATION_SETTINGS["minimum_venues"]:
            return 1

        return len(venues) / LOCATION_SETTINGS["minimum_venues"]

    def _calculate_social_compatibility(self, user1: User, user2: User) -> float:
        """Calculate social compatibility between two players.

        Args:
            user1: First user to compare
            user2: Second user to compare

        Returns:
            float: Compatibility score between 0 and 1
        """
        score = 0

        # Check if users are friends
        if user2.id in user1.friends:
            score += SOCIAL_SETTINGS["friend_weight"]

        # Check mutual friends
        mutual_friends = get_mutual_friends(user1, user2)
        if mutual_friends:
            score += SOCIAL_SETTINGS["mutual_friend_weight"]

        # Check previous matches
        previous_matches = Game.get_previous_matches(user1.id, user2.id)
        if previous_matches:
            if len(previous_matches) <= SOCIAL_SETTINGS["maximum_games"]:
                score += SOCIAL_SETTINGS["previous_match_weight"]

        return min(score, 1.0)  # Cap at 1.0

    def process_queue(self) -> List[Tuple[User, User]]:
        """Process the matchmaking queue to create matches.

        Returns:
            List[Tuple[User, User]]: List of matched player pairs

        Raises:
            MatchmakingTimeoutError: If queue processing times out
        """
        if not self._should_process_queue():
            return []

        self.last_update = datetime.now()
        matches = []

        # Sort queue by priority and wait time
        self.queue.sort(
            key=lambda x: (x.priority, (datetime.now() - x.join_time).total_seconds()), reverse=True
        )

        # Process queue in batches
        batch = self.queue[: QUEUE_SETTINGS["batch_size"]]
        for entry in batch:
            if entry.user not in [u1 for u1, _ in matches] + [u2 for _, u2 in matches]:
                try:
                    match = self.find_match(entry.user, entry.preferences)
                    if match:
                        matches.append((entry.user, match))
                        self.remove_from_queue(entry.user)
                        self.remove_from_queue(match)
                except Exception as e:
                    # Log error but continue processing
                    print(f"Error processing queue entry for user {entry.user.id}: {str(e)}")
                    continue

        return matches

    def _should_process_queue(self) -> bool:
        """Determine if the queue should be processed.

        Returns:
            bool: True if queue should be processed, False otherwise
        """
        time_since_update = (datetime.now() - self.last_update).total_seconds()
        return time_since_update >= QUEUE_SETTINGS["update_interval"]

    def get_queue_position(self, user: User) -> Optional[int]:
        """Get a player's position in the queue.

        Args:
            user: The user to find in the queue

        Returns:
            Optional[int]: Queue position if found, None if not in queue

        Raises:
            PlayerNotFoundError: If player is not in queue
        """
        for i, entry in enumerate(self.queue):
            if entry.user.id == user.id:
                return i + 1
        raise PlayerNotFoundError(user.id)

    def get_estimated_wait_time(self, position: int) -> int:
        """Estimate wait time for a queue position.

        Args:
            position: Queue position to estimate for

        Returns:
            int: Estimated wait time in seconds
        """
        batch_position = (position - 1) // QUEUE_SETTINGS["batch_size"]
        return batch_position * QUEUE_SETTINGS["update_interval"]

    def block_player(self, blocker: User, blocked: User) -> None:
        """Block a player from being matched.

        Args:
            blocker: User initiating the block
            blocked: User being blocked
        """
        self.blocked_pairs.add((blocker.id, blocked.id))

        # Remove any existing queue entries if users are in queue
        try:
            self.remove_from_queue(blocked)
        except PlayerNotFoundError:
            pass

    def unblock_player(self, blocker: User, blocked: User) -> None:
        """Unblock a previously blocked player.

        Args:
            blocker: User who initiated the block
            blocked: User who was blocked
        """
        self.blocked_pairs.discard((blocker.id, blocked.id))

    def _is_blocked(self, user1_id: int, user2_id: int) -> bool:
        """Check if either user has blocked the other.

        Args:
            user1_id: First user's ID
            user2_id: Second user's ID

        Returns:
            bool: True if either user has blocked the other
        """
        return (user1_id, user2_id) in self.blocked_pairs or (
            user2_id,
            user1_id,
        ) in self.blocked_pairs
