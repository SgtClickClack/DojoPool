"""Tests for clan management system."""

import pytest
from datetime import datetime, timedelta
from .clan_manager import ClanManager, Clan, ClanRole, ClanRank, ClanMember, ClanStats


@pytest.fixture
def clan_manager() -> ClanManager:
    """Create a clan manager for testing."""
    return ClanManager()


@pytest.fixture
def sample_clan(clan_manager: ClanManager) -> Clan:
    """Create a sample clan."""
    return clan_manager.create_clan(
        name="Test Clan",
        tag="TEST",
        description="A test clan",
        leader_id="leader1",
        home_venue_id="venue1",
    )


@pytest.fixture
def populated_clan(clan_manager: ClanManager, sample_clan: Clan) -> Clan:
    """Create a clan with multiple members and some activity."""
    # Add members with different roles
    clan_manager.add_member(sample_clan.clan_id, "member1")
    clan_manager.add_member(sample_clan.clan_id, "member2", role=ClanRole.OFFICER)
    clan_manager.add_member(sample_clan.clan_id, "member3")

    # Record some activity
    clan_manager.record_activity(sample_clan.clan_id, "member1", points=100, match_won=True)
    clan_manager.record_activity(sample_clan.clan_id, "member2", points=200, tournament_won=True)

    return sample_clan


class TestClanManager:
    """Test clan management functionality."""

    def test_create_clan(self, clan_manager: ClanManager) -> None:
        """Test creating a new clan."""
        clan = clan_manager.create_clan(
            name="Test Clan",
            tag="TEST",
            description="A test clan",
            leader_id="leader1",
            home_venue_id="venue1",
        )

        # Test basic properties
        assert clan.name == "Test Clan"
        assert clan.tag == "TEST"
        assert clan.description == "A test clan"
        assert clan.leader_id == "leader1"
        assert clan.home_venue_id == "venue1"
        assert clan.rank == ClanRank.BRONZE

        # Test initial member state
        assert len(clan.members) == 1
        leader = clan.members["leader1"]
        assert leader.role == ClanRole.LEADER
        assert leader.contribution_points == 0
        assert isinstance(leader.joined_at, datetime)

        # Test initial stats
        assert clan.stats.total_matches == 0
        assert clan.stats.matches_won == 0
        assert clan.stats.tournaments_won == 0
        assert clan.stats.total_contribution == 0
        assert clan.stats.active_members == 1

        # Test duplicate leader prevention
        with pytest.raises(ValueError):
            clan_manager.create_clan(
                name="Another Clan",
                tag="TEST2",
                description="Another test clan",
                leader_id="leader1",
            )

        # Test validation of clan creation parameters
        with pytest.raises(ValueError, match="Name cannot be empty"):
            clan_manager.create_clan(
                name="", tag="TEST", description="Test clan", leader_id="leader2"
            )

        with pytest.raises(ValueError, match="Tag must be 2-5 characters"):
            clan_manager.create_clan(
                name="Test Clan", tag="T", description="Test clan", leader_id="leader2"  # Too short
            )

        with pytest.raises(ValueError, match="Tag must be 2-5 characters"):
            clan_manager.create_clan(
                name="Test Clan",
                tag="TOOLONG",  # Too long
                description="Test clan",
                leader_id="leader2",
            )

    def test_clan_membership(self, clan_manager: ClanManager, sample_clan: Clan) -> None:
        """Test clan membership operations."""
        # Test adding members with different roles
        assert clan_manager.add_member(sample_clan.clan_id, "member1")
        assert clan_manager.add_member(sample_clan.clan_id, "member2", role=ClanRole.OFFICER)

        # Test adding member to nonexistent clan
        assert not clan_manager.add_member("nonexistent_clan", "member3")

        # Test adding member who's already in a clan
        assert not clan_manager.add_member(sample_clan.clan_id, "member1")

        # Verify members and roles
        clan = clan_manager.get_clan(sample_clan.clan_id)
        assert clan is not None
        assert len(clan.members) == 3
        assert clan.members["member1"].role == ClanRole.MEMBER
        assert clan.members["member2"].role == ClanRole.OFFICER
        assert clan.stats.active_members == 3

        # Test getting player's clan
        player_clan = clan_manager.get_player_clan("member1")
        assert player_clan is not None
        assert player_clan.clan_id == clan.clan_id

        # Test member removal permissions
        # Leader can remove anyone
        assert clan_manager.remove_member(sample_clan.clan_id, "member1", by_player_id="leader1")

        # Officer can remove regular member
        clan_manager.add_member(sample_clan.clan_id, "member3")
        assert clan_manager.remove_member(
            sample_clan.clan_id, "member3", by_player_id="member2"  # member2 is officer
        )

        # Member can't remove anyone
        clan_manager.add_member(sample_clan.clan_id, "member4")
        assert not clan_manager.remove_member(
            sample_clan.clan_id, "member4", by_player_id="member4"
        )

        # Can't remove leader
        assert not clan_manager.remove_member(
            sample_clan.clan_id, "leader1", by_player_id="member2"
        )

        # Test removing from nonexistent clan
        assert not clan_manager.remove_member("nonexistent_clan", "member1", by_player_id="leader1")

    def test_role_management(self, clan_manager: ClanManager, sample_clan: Clan) -> None:
        """Test role management."""
        # Add members
        clan_manager.add_member(sample_clan.clan_id, "member1")
        clan_manager.add_member(sample_clan.clan_id, "member2")
        clan_manager.add_member(sample_clan.clan_id, "member3")

        # Test role update permissions
        # Leader can promote to officer
        assert clan_manager.update_role(
            sample_clan.clan_id, "member1", ClanRole.OFFICER, by_player_id="leader1"
        )

        # Leader can demote officer to member
        assert clan_manager.update_role(
            sample_clan.clan_id, "member1", ClanRole.MEMBER, by_player_id="leader1"
        )

        # Officer can't change roles
        assert (
            clan_manager.update_role(
                sample_clan.clan_id, "member2", ClanRole.OFFICER, by_player_id="member1"
            )
            is False
        )

        # Member can't change roles
        assert (
            clan_manager.update_role(
                sample_clan.clan_id, "member3", ClanRole.OFFICER, by_player_id="member2"
            )
            is False
        )

        # Can't change leader's role
        assert not clan_manager.update_role(
            sample_clan.clan_id, "leader1", ClanRole.MEMBER, by_player_id="member1"
        )

        # Test role updates in nonexistent clan
        assert not clan_manager.update_role(
            "nonexistent_clan", "member1", ClanRole.OFFICER, by_player_id="leader1"
        )

    def test_clan_activity(self, clan_manager: ClanManager, sample_clan: Clan) -> None:
        """Test clan activity tracking."""
        # Add members
        clan_manager.add_member(sample_clan.clan_id, "member1")
        clan_manager.add_member(sample_clan.clan_id, "member2")

        # Test match activity
        clan_manager.record_activity(sample_clan.clan_id, "member1", points=100, match_won=True)

        clan = clan_manager.get_clan(sample_clan.clan_id)
        assert clan is not None
        member1 = clan.members["member1"]

        assert member1.contribution_points == 100
        assert clan.stats.total_contribution == 100
        assert clan.stats.matches_won == 1
        assert clan.stats.total_matches == 1

        # Test tournament activity
        clan_manager.record_activity(
            sample_clan.clan_id, "member2", points=500, tournament_won=True
        )

        clan = clan_manager.get_clan(sample_clan.clan_id)
        assert clan is not None
        member2 = clan.members["member2"]

        assert member2.contribution_points == 500
        assert clan.stats.tournaments_won == 1
        assert clan.stats.total_contribution == 600

        # Test activity for nonexistent clan/member
        clan_manager.record_activity(
            "nonexistent_clan", "member1", points=100
        )  # Should not raise error

        clan_manager.record_activity(
            sample_clan.clan_id, "nonexistent_member", points=100
        )  # Should not raise error

    def test_clan_ranking(self, clan_manager: ClanManager, sample_clan: Clan) -> None:
        """Test clan ranking system."""
        # Test progression through all ranks
        ranks_data = [
            (ClanRank.BRONZE, 0, 0),  # Initial rank
            (ClanRank.SILVER, 10000, 5),  # Progress to Silver
            (ClanRank.GOLD, 25000, 10),  # Progress to Gold
            (ClanRank.PLATINUM, 50000, 25),  # Progress to Platinum
            (ClanRank.DIAMOND, 100000, 50),  # Progress to Diamond
        ]

        for target_rank, points, tournaments in ranks_data:
            if points > 0:  # Skip initial state
                # Add points
                clan_manager.record_activity(sample_clan.clan_id, "leader1", points=points)

                # Win tournaments
                for _ in range(tournaments):
                    clan_manager.record_activity(
                        sample_clan.clan_id, "leader1", points=0, tournament_won=True
                    )

            assert sample_clan.rank == target_rank

    def test_clan_rankings(self, clan_manager: ClanManager, sample_clan: Clan) -> None:
        """Test clan ranking lists."""
        # Create multiple clans with different activities
        clans_data = [
            ("Clan2", "leader2", 2000, 0, True),  # 2nd in contribution
            ("Clan3", "leader3", 3000, 1, False),  # 1st in contribution
            ("Clan4", "leader4", 1500, 2, False),  # 1st in tournaments
            ("Clan5", "leader5", 500, 0, False),  # Last place
        ]

        created_clans = []
        for name, leader, points, tournaments, matches in clans_data:
            clan = clan_manager.create_clan(
                name=name, tag=name.upper(), description=f"Test {name}", leader_id=leader
            )
            created_clans.append(clan)

            # Record activities
            clan_manager.record_activity(clan.clan_id, leader, points=points, match_won=matches)

            for _ in range(tournaments):
                clan_manager.record_activity(clan.clan_id, leader, points=0, tournament_won=True)

        # Test contribution ranking
        contribution_ranks = clan_manager.get_top_clans(sort_by="contribution")
        assert len(contribution_ranks) == 5  # Including sample_clan
        assert contribution_ranks[0].clan_id == created_clans[1].clan_id  # Clan3
        assert contribution_ranks[1].clan_id == created_clans[0].clan_id  # Clan2

        # Test tournament ranking
        tournament_ranks = clan_manager.get_top_clans(sort_by="tournaments")
        assert tournament_ranks[0].clan_id == created_clans[2].clan_id  # Clan4

        # Test weekly/monthly rankings
        weekly_ranks = clan_manager.get_top_clans(sort_by="weekly")
        monthly_ranks = clan_manager.get_top_clans(sort_by="monthly")
        assert len(weekly_ranks) == 5
        assert len(monthly_ranks) == 5

        # Test ranking limit
        limited_ranks = clan_manager.get_top_clans(limit=3)
        assert len(limited_ranks) == 3

    def test_member_inactivity(self, clan_manager: ClanManager, populated_clan: Clan) -> None:
        """Test handling of inactive members."""
        clan = clan_manager.get_clan(populated_clan.clan_id)
        assert clan is not None

        # Set member1's last activity to 31 days ago
        member1 = clan.members["member1"]
        member1.last_active = datetime.now() - timedelta(days=31)

        # Check inactive members list
        inactive_members = clan_manager.get_inactive_members(populated_clan.clan_id)
        assert len(inactive_members) == 1
        assert inactive_members[0].player_id == "member1"

        # Test auto-removal of inactive members
        removed = clan_manager.remove_inactive_members(populated_clan.clan_id, days=30)
        assert len(removed) == 1
        assert removed[0] == "member1"
        assert "member1" not in clan.members

    def test_clan_achievements(self, clan_manager: ClanManager, populated_clan: Clan) -> None:
        """Test clan achievement system."""
        clan = clan_manager.get_clan(populated_clan.clan_id)
        assert clan is not None

        # Test tournament milestone achievement
        for _ in range(10):
            clan_manager.record_activity(
                populated_clan.clan_id, "member1", points=100, tournament_won=True
            )

        assert "tournament_masters" in clan.achievements

        # Test contribution milestone achievement
        clan_manager.record_activity(populated_clan.clan_id, "member2", points=10000)

        assert "high_contributors" in clan.achievements

        # Test active members achievement
        for i in range(5):
            clan_manager.add_member(populated_clan.clan_id, f"new_member_{i}")

        assert "growing_community" in clan.achievements

    def test_weekly_reset(self, clan_manager: ClanManager, populated_clan: Clan) -> None:
        """Test weekly points reset."""
        clan = clan_manager.get_clan(populated_clan.clan_id)
        assert clan is not None

        # Record some weekly points
        clan_manager.record_activity(populated_clan.clan_id, "member1", points=1000)

        assert clan.stats.weekly_points == 1000

        # Simulate weekly reset
        clan_manager.reset_weekly_points()
        assert clan.stats.weekly_points == 0

        # Weekly points should not affect total contribution
        assert clan.stats.total_contribution == 1300  # 100 + 200 + 1000 from previous activities

    def test_monthly_reset(self, clan_manager: ClanManager, populated_clan: Clan) -> None:
        """Test monthly points reset."""
        clan = clan_manager.get_clan(populated_clan.clan_id)
        assert clan is not None

        # Record some monthly points
        clan_manager.record_activity(populated_clan.clan_id, "member1", points=2000)

        assert clan.stats.monthly_points == 2000

        # Simulate monthly reset
        clan_manager.reset_monthly_points()
        assert clan.stats.monthly_points == 0

        # Monthly points should not affect total contribution
        assert clan.stats.total_contribution == 2300  # Previous total + 2000

    def test_clan_merging(self, clan_manager: ClanManager, populated_clan: Clan) -> None:
        """Test merging two clans."""
        # Create second clan
        clan2 = clan_manager.create_clan(
            name="Clan 2", tag="TWO", description="Second clan", leader_id="leader2"
        )

        # Add members and activity to second clan
        clan_manager.add_member(clan2.clan_id, "member4")
        clan_manager.add_member(clan2.clan_id, "member5")
        clan_manager.record_activity(clan2.clan_id, "leader2", points=500)

        # Merge clans
        merged = clan_manager.merge_clans(
            populated_clan.clan_id, clan2.clan_id, new_name="Merged Clan", new_tag="MERGE"
        )

        assert merged is not None
        assert merged.name == "Merged Clan"
        assert merged.tag == "MERGE"
        assert len(merged.members) == 7  # All members from both clans
        assert merged.stats.total_contribution == 800  # Combined points

        # Original clans should be deleted
        assert clan_manager.get_clan(populated_clan.clan_id) is None
        assert clan_manager.get_clan(clan2.clan_id) is None

        # Members should be in new clan
        for member_id in [
            "leader1",
            "member1",
            "member2",
            "member3",
            "leader2",
            "member4",
            "member5",
        ]:
            player_clan = clan_manager.get_player_clan(member_id)
            assert player_clan is not None
            assert player_clan.clan_id == merged.clan_id
