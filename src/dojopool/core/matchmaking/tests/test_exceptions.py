"""Tests for the matchmaking exceptions module."""

import unittest
import pytest
from ..exceptions import (
    MatchmakingError,
    QueueFullError,
    PlayerNotFoundError,
    InvalidPreferencesError,
    MatchmakingTimeoutError,
    IncompatiblePlayersError,
    BlockedPlayerError,
    RateLimitExceededError,
    VenueUnavailableError,
    SkillMismatchError,
    TimeConflictError
)
from .test_config import (
    TEST_ERROR_MESSAGES,
    TEST_USERS,
    TEST_RATE_LIMITS
)

@pytest.mark.unit
@pytest.mark.exceptions
class TestMatchmakingExceptions(unittest.TestCase):
    """Test cases for matchmaking exceptions."""

    @pytest.mark.unit
    def test_queue_full_error(self):
        """Test QueueFullError exception."""
        # Test with default message
        error = QueueFullError()
        self.assertEqual(str(error), "Matchmaking queue is full")
        
        # Test with custom message
        error = QueueFullError(message=TEST_ERROR_MESSAGES['queue_full'])
        self.assertEqual(str(error), TEST_ERROR_MESSAGES['queue_full'])
        self.assertEqual(error.message, TEST_ERROR_MESSAGES['queue_full'])

    @pytest.mark.unit
    def test_player_not_found_error(self):
        """Test PlayerNotFoundError exception."""
        # Test with default message
        user_id = TEST_USERS['user1']['id']
        error = PlayerNotFoundError(user_id)
        self.assertEqual(str(error), f"Player {user_id} not found in queue")
        self.assertEqual(error.user_id, user_id)
        
        # Test with custom message
        error = PlayerNotFoundError(user_id, message=TEST_ERROR_MESSAGES['player_not_found'])
        self.assertEqual(str(error), TEST_ERROR_MESSAGES['player_not_found'])
        self.assertEqual(error.message, TEST_ERROR_MESSAGES['player_not_found'])

    @pytest.mark.unit
    def test_invalid_preferences_error(self):
        """Test InvalidPreferencesError exception."""
        # Test with default message
        error = InvalidPreferencesError()
        self.assertEqual(str(error), "Invalid matchmaking preferences")
        
        # Test with custom message
        error = InvalidPreferencesError(message=TEST_ERROR_MESSAGES['invalid_preferences'])
        self.assertEqual(str(error), TEST_ERROR_MESSAGES['invalid_preferences'])
        self.assertEqual(error.message, TEST_ERROR_MESSAGES['invalid_preferences'])

    @pytest.mark.unit
    def test_matchmaking_timeout_error(self):
        """Test MatchmakingTimeoutError exception."""
        # Test with default message
        wait_time = TEST_RATE_LIMITS['window']
        error = MatchmakingTimeoutError(wait_time)
        self.assertEqual(
            str(error),
            f"Matchmaking timed out after {wait_time} seconds"
        )
        self.assertEqual(error.wait_time, wait_time)
        
        # Test with custom message
        error = MatchmakingTimeoutError(wait_time, message=TEST_ERROR_MESSAGES['matchmaking_timeout'])
        self.assertEqual(str(error), TEST_ERROR_MESSAGES['matchmaking_timeout'])
        self.assertEqual(error.message, TEST_ERROR_MESSAGES['matchmaking_timeout'])

    @pytest.mark.unit
    def test_incompatible_players_error(self):
        """Test IncompatiblePlayersError exception."""
        # Test without reason
        user1_id = TEST_USERS['user1']['id']
        user2_id = TEST_USERS['user2']['id']
        error = IncompatiblePlayersError(user1_id, user2_id)
        self.assertEqual(
            str(error),
            f"Players {user1_id} and {user2_id} are incompatible"
        )
        self.assertEqual(error.user1_id, user1_id)
        self.assertEqual(error.user2_id, user2_id)
        
        # Test with reason
        error = IncompatiblePlayersError(
            user1_id,
            user2_id,
            reason=TEST_ERROR_MESSAGES['incompatible_players']
        )
        self.assertEqual(
            str(error),
            f"Players {user1_id} and {user2_id} are incompatible: {TEST_ERROR_MESSAGES['incompatible_players']}"
        )
        self.assertEqual(error.reason, TEST_ERROR_MESSAGES['incompatible_players'])

    @pytest.mark.unit
    def test_blocked_player_error(self):
        """Test BlockedPlayerError exception."""
        user1_id = TEST_USERS['user1']['id']
        user2_id = TEST_USERS['user2']['id']
        error = BlockedPlayerError(user1_id, user2_id)
        self.assertEqual(
            str(error),
            f"Player {user2_id} is blocked by {user1_id}"
        )
        self.assertEqual(error.blocker_id, user1_id)
        self.assertEqual(error.blocked_id, user2_id)

    @pytest.mark.unit
    def test_rate_limit_exceeded_error(self):
        """Test RateLimitExceededError exception."""
        user_id = TEST_USERS['user1']['id']
        retry_after = TEST_RATE_LIMITS['retry_after']
        error = RateLimitExceededError(user_id, retry_after)
        self.assertEqual(
            str(error),
            f"Rate limit exceeded for player {user_id}. Try again in {retry_after} seconds"
        )
        self.assertEqual(error.user_id, user_id)
        self.assertEqual(error.retry_after, retry_after)

    @pytest.mark.unit
    def test_venue_unavailable_error(self):
        """Test VenueUnavailableError exception."""
        # Test with default message
        error = VenueUnavailableError()
        self.assertEqual(str(error), "No suitable venue available for the match")
        
        # Test with custom message
        error = VenueUnavailableError(message=TEST_ERROR_MESSAGES['venue_unavailable'])
        self.assertEqual(str(error), TEST_ERROR_MESSAGES['venue_unavailable'])
        self.assertEqual(error.message, TEST_ERROR_MESSAGES['venue_unavailable'])

    @pytest.mark.unit
    def test_skill_mismatch_error(self):
        """Test SkillMismatchError exception."""
        user1_id = TEST_USERS['user1']['id']
        user2_id = TEST_USERS['user2']['id']
        rating_diff = abs(
            TEST_USERS['user1']['rating'] - TEST_USERS['user2']['rating']
        )
        error = SkillMismatchError(user1_id, user2_id, rating_diff)
        self.assertEqual(
            str(error),
            f"Skill mismatch between players {user1_id} and {user2_id} (difference: {rating_diff})"
        )
        self.assertEqual(error.user1_id, user1_id)
        self.assertEqual(error.user2_id, user2_id)
        self.assertEqual(error.rating_diff, rating_diff)

    @pytest.mark.unit
    def test_time_conflict_error(self):
        """Test TimeConflictError exception."""
        user1_id = TEST_USERS['user1']['id']
        user2_id = TEST_USERS['user2']['id']
        error = TimeConflictError(user1_id, user2_id)
        self.assertEqual(
            str(error),
            f"Schedule conflict between players {user1_id} and {user2_id}"
        )
        self.assertEqual(error.user1_id, user1_id)
        self.assertEqual(error.user2_id, user2_id)

    @pytest.mark.unit
    def test_exception_inheritance(self):
        """Test exception inheritance hierarchy."""
        # Test that all exceptions inherit from MatchmakingError
        exceptions = [
            QueueFullError(),
            PlayerNotFoundError(TEST_USERS['user1']['id']),
            InvalidPreferencesError(),
            MatchmakingTimeoutError(TEST_RATE_LIMITS['window']),
            IncompatiblePlayersError(
                TEST_USERS['user1']['id'],
                TEST_USERS['user2']['id']
            ),
            BlockedPlayerError(
                TEST_USERS['user1']['id'],
                TEST_USERS['user2']['id']
            ),
            RateLimitExceededError(
                TEST_USERS['user1']['id'],
                TEST_RATE_LIMITS['retry_after']
            ),
            VenueUnavailableError(),
            SkillMismatchError(
                TEST_USERS['user1']['id'],
                TEST_USERS['user2']['id'],
                abs(TEST_USERS['user1']['rating'] - TEST_USERS['user2']['rating'])
            ),
            TimeConflictError(
                TEST_USERS['user1']['id'],
                TEST_USERS['user2']['id']
            )
        ]
        
        for error in exceptions:
            self.assertIsInstance(error, MatchmakingError)
            self.assertIsInstance(error, Exception)

if __name__ == '__main__':
    unittest.main()
