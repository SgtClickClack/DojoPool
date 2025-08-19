"""Tests for player profile management system."""

import pytest
from datetime import datetime, timedelta
from .player_profile import (
    PlayerProfileManager,
    PlayerProfile,
    PlayerRank,
    AchievementType,
    Achievement,
    PlayerStats,
)


@pytest.fixture
def profile_manager() -> PlayerProfileManager:
    """Create a player profile manager for testing."""
    return PlayerProfileManager()


@pytest.fixture
def sample_profile(profile_manager: PlayerProfileManager) -> PlayerProfile:
    """Create a sample player profile."""
    return profile_manager.create_profile(
        username="test_player", display_name="Test Player", email="test@example.com"
    )


class TestPlayerProfile:
    """Test player profile functionality."""

    def test_create_profile(self, profile_manager: PlayerProfileManager) -> None:
        """Test creating a new player profile."""
        profile = profile_manager.create_profile(
            username="test_user", display_name="Test User", email="test@example.com"
        )

        assert profile.username == "test_user"
        assert profile.display_name == "Test User"
        assert profile.email == "test@example.com"
        assert profile.rank == PlayerRank.NOVICE
        assert profile.level == 1
        assert profile.experience == 0
        assert profile.dojo_coins == 0
        assert len(profile.achievements) == 0
        assert len(profile.friends) == 0
        assert len(profile.rivals) == 0
        assert profile.clan_id is None

    def test_update_stats(
        self, profile_manager: PlayerProfileManager, sample_profile: PlayerProfile
    ) -> None:
        """Test updating player statistics."""
        # Test winning match
        profile_manager.update_stats(
            player_id=sample_profile.player_id,
            match_won=True,
            playtime=30,
            venue_id="venue1",
            trick_shots=2,
            perfect_game=True,
        )

        assert sample_profile.stats.total_matches == 1
        assert sample_profile.stats.matches_won == 1
        assert sample_profile.stats.matches_lost == 0
        assert sample_profile.stats.current_streak == 1
        assert sample_profile.stats.highest_streak == 1
        assert sample_profile.stats.total_playtime == 30
        assert sample_profile.stats.trick_shots_made == 2
        assert sample_profile.stats.perfect_games == 1
        assert "venue1" in sample_profile.favorite_venues

        # Test losing match
        profile_manager.update_stats(
            player_id=sample_profile.player_id, match_won=False, playtime=25, venue_id="venue2"
        )

        assert sample_profile.stats.total_matches == 2
        assert sample_profile.stats.matches_won == 1
        assert sample_profile.stats.matches_lost == 1
        assert sample_profile.stats.current_streak == 0
        assert sample_profile.stats.highest_streak == 1
        assert sample_profile.stats.total_playtime == 55

    def test_achievements(
        self, profile_manager: PlayerProfileManager, sample_profile: PlayerProfile
    ) -> None:
        """Test achievement system."""
        # Test winning streak achievement
        for _ in range(5):
            profile_manager.update_stats(
                player_id=sample_profile.player_id, match_won=True, playtime=30, venue_id="venue1"
            )

        assert "winning_streak_5" in sample_profile.achievements
        assert sample_profile.achievements["winning_streak_5"].unlocked_at is not None
        initial_coins = sample_profile.dojo_coins

        # Test trick shot achievement
        profile_manager.update_stats(
            player_id=sample_profile.player_id,
            match_won=True,
            playtime=30,
            venue_id="venue1",
            trick_shots=10,
        )

        assert "trick_shot_novice" in sample_profile.achievements
        assert sample_profile.dojo_coins > initial_coins

    def test_social_features(
        self, profile_manager: PlayerProfileManager, sample_profile: PlayerProfile
    ) -> None:
        """Test social features."""
        # Create another profile
        other_profile = profile_manager.create_profile(
            username="other_player", display_name="Other Player", email="other@example.com"
        )

        # Test adding friend
        assert profile_manager.add_friend(sample_profile.player_id, other_profile.player_id)
        assert other_profile.player_id in sample_profile.friends
        assert sample_profile.player_id in other_profile.friends

        # Test adding rival
        assert profile_manager.add_rival(sample_profile.player_id, other_profile.player_id)
        assert other_profile.player_id in sample_profile.rivals
        assert sample_profile.player_id in other_profile.rivals

        # Test joining clan
        assert profile_manager.join_clan(sample_profile.player_id, "test_clan")
        assert sample_profile.clan_id == "test_clan"

    def test_rank_progression(
        self, profile_manager: PlayerProfileManager, sample_profile: PlayerProfile
    ) -> None:
        """Test player rank progression."""
        # Set up profile for rank testing
        sample_profile.level = 20

        # Add some achievements
        for _ in range(5):
            profile_manager.update_stats(
                player_id=sample_profile.player_id, match_won=True, playtime=30, venue_id="venue1"
            )

        profile_manager.update_rank(sample_profile.player_id)
        assert sample_profile.rank is PlayerRank.ADEPT

        # Progress to expert
        sample_profile.level = 30
        for _ in range(5):
            profile_manager.update_stats(
                player_id=sample_profile.player_id,
                match_won=True,
                playtime=30,
                venue_id="venue1",
                trick_shots=2,
            )

        profile_manager.update_rank(sample_profile.player_id)
        assert sample_profile.rank is PlayerRank.EXPERT

    def test_favorite_venues(
        self, profile_manager: PlayerProfileManager, sample_profile: PlayerProfile
    ) -> None:
        """Test favorite venues management."""
        # Add more than 5 venues
        for i in range(6):
            profile_manager.update_stats(
                player_id=sample_profile.player_id,
                match_won=True,
                playtime=30,
                venue_id=f"venue{i}",
            )

        # Should only keep last 5
        assert len(sample_profile.favorite_venues) == 5
        assert "venue0" not in sample_profile.favorite_venues
        assert "venue5" in sample_profile.favorite_venues

    def test_nonexistent_profile(self, profile_manager: PlayerProfileManager) -> None:
        """Test operations with nonexistent profile."""
        assert profile_manager.get_profile("nonexistent") is None

        # Test update stats
        profile_manager.update_stats(
            player_id="nonexistent", match_won=True, playtime=30, venue_id="venue1"
        )  # Should not raise error

        # Test social features
        assert not profile_manager.add_friend("nonexistent", "other")
        assert not profile_manager.add_rival("nonexistent", "other")
        assert not profile_manager.join_clan("nonexistent", "clan")

    def test_achievement_requirements(
        self, profile_manager: PlayerProfileManager, sample_profile: PlayerProfile
    ) -> None:
        """Test achievement requirements checking."""
        # Test tournament win achievement
        sample_profile.stats.tournaments_won = 1
        profile_manager._check_achievements(sample_profile)
        assert "first_tournament_win" in sample_profile.achievements

        # Test tournament master (should not unlock yet)
        assert "tournament_master" not in sample_profile.achievements

        # Progress to tournament master
        sample_profile.stats.tournaments_won = 10
        profile_manager._check_achievements(sample_profile)
        assert "tournament_master" in sample_profile.achievements
