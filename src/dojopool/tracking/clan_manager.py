"""Clan management system for DojoPool."""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Set


class ClanRole(Enum):
    """Roles within a clan."""

    LEADER = "leader"
    OFFICER = "officer"
    MEMBER = "member"


class ClanRank(Enum):
    """Clan ranks based on achievements and activity."""

    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"
    DIAMOND = "diamond"


@dataclass
class ClanMember:
    """Clan member details."""

    player_id: str
    role: ClanRole
    joined_at: datetime
    contribution_points: int = 0
    last_active: datetime = field(default_factory=datetime.now)


@dataclass
class ClanStats:
    """Clan statistics."""

    total_matches: int = 0
    matches_won: int = 0
    tournaments_won: int = 0
    total_contribution: int = 0
    active_members: int = 0
    weekly_points: int = 0
    monthly_points: int = 0


@dataclass
class Clan:
    """Clan details."""

    clan_id: str
    name: str
    tag: str
    description: str
    created_at: datetime
    leader_id: str
    rank: ClanRank = ClanRank.BRONZE
    members: Dict[str, ClanMember] = field(default_factory=dict)
    stats: ClanStats = field(default_factory=ClanStats)
    achievements: Set[str] = field(default_factory=set)
    home_venue_id: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None


class ClanManager:
    """Manage clans and clan-related functionality."""

    def __init__(self) -> None:
        """Initialize clan manager."""
        self._clans: Dict[str, Clan] = {}
        self._player_clans: Dict[str, str] = {}  # player_id : str,
        tag: str,
        description: str,
        leader_id: str,
        home_venue_id: Optional[str] = None,
    ) :
        """Create a new clan."""
        if leader_id in self._player_clans:
            raise ValueError("Player is already in a clan")

        clan_id = str(uuid.uuid4())

        clan = Clan(
            clan_id=clan_id,
            name=name,
            tag=tag,
            description=description,
            created_at=datetime.now(),
            leader_id=leader_id,
            home_venue_id=home_venue_id,
        )

        # Add leader as first member
        clan.members[leader_id] = ClanMember(
            player_id=leader_id, role=ClanRole.LEADER, joined_at=datetime.now()
        )

        self._clans[clan_id] = clan
        self._player_clans[leader_id] = clan_id

        return clan

    def get_clan(self, clan_id: str) -> Optional[Clan]:
        """Get clan details."""
        return self._clans.get(clan_id)

    def get_player_clan(self, player_id: str) :
        """Get a player's clan."""
        clan_id = self._player_clans.get(player_id)
        return self._clans.get(clan_id) if clan_id else None

    def add_member(
        self, clan_id: str, player_id: str, role: ClanRole = ClanRole.MEMBER
    ) :
        """Add a member to a clan."""
        if player_id in self._player_clans:
            return False

        clan = self._clans.get(clan_id)
        if not clan:
            return False

        clan.members[player_id] = ClanMember(
            player_id=player_id, role=role, joined_at=datetime.now()
        )

        self._player_clans[player_id] = clan_id
        clan.stats.active_members = len(clan.members)

        return True

    def remove_member(self, clan_id: str, player_id: str, by_player_id: str) :
        """Remove a member from a clan."""
        clan = self._clans.get(clan_id)
        if not clan:
            return False

        # Check permissions
        remover = clan.members.get(by_player_id)
        target = clan.members.get(player_id)
        if not remover or not target:
            return False

        if remover.role != ClanRole.LEADER and (
            remover.role != ClanRole.OFFICER or target.role != ClanRole.MEMBER
        ):
            return False

        # Can't remove leader
        if target.role == ClanRole.LEADER:
            return False

        del clan.members[player_id]
        del self._player_clans[player_id]
        clan.stats.active_members = len(clan.members)

        return True

    def update_role(
        self, clan_id: str, player_id: str, new_role: ClanRole, by_player_id: str
    ) -> bool:
        """Update a member's role."""
        clan = self._clans.get(clan_id)
        if not clan:
            return False

        # Check permissions
        updater = clan.members.get(by_player_id)
        target = clan.members.get(player_id)
        if not updater or not target:
            return False

        # Only leader can change roles
        if updater.role != ClanRole.LEADER:
            return False

        # Can't change leader's role
        if target.role == ClanRole.LEADER:
            return False

        target.role = new_role
        return True

    def record_activity(
        self,
        clan_id: str,
        player_id: str,
        points: int,
        match_won: bool = False,
        tournament_won: bool = False,
    ) :
        """Record clan member activity."""
        clan = self._clans.get(clan_id)
        if not clan:
            return

        member = clan.members.get(player_id)
        if not member:
            return

        # Update member stats
        member.contribution_points += points
        member.last_active = datetime.now()

        # Update clan stats
        clan.stats.total_contribution += points
        clan.stats.weekly_points += points
        clan.stats.monthly_points += points

        if match_won:
            clan.stats.matches_won += 1
        clan.stats.total_matches += 1

        if tournament_won:
            clan.stats.tournaments_won += 1

        # Update clan rank based on activity
        self._update_clan_rank(clan)

    def _update_clan_rank(self, clan: Clan) :
        """Update clan rank based on stats."""
        if clan.stats.tournaments_won >= 50 and clan.stats.total_contribution >= 100000:
            clan.rank = ClanRank.DIAMOND
        elif (
            clan.stats.tournaments_won >= 25 and clan.stats.total_contribution >= 50000
        ):
            clan.rank = ClanRank.PLATINUM
        elif (
            clan.stats.tournaments_won >= 10 and clan.stats.total_contribution >= 25000
        ):
            clan.rank = ClanRank.GOLD
        elif clan.stats.tournaments_won >= 5 and clan.stats.total_contribution >= 10000:
            clan.rank = ClanRank.SILVER

    def get_top_clans(
        self, limit: int = 10, sort_by: str = "contribution"
    ) -> List[Clan]:
        """Get top ranked clans."""
        clans = list(self._clans.values())

        if sort_by == "contribution":
            clans.sort(key=lambda c: c.stats.total_contribution, reverse=True)
        elif sort_by == "tournaments":
            clans.sort(key=lambda c: c.stats.tournaments_won, reverse=True)
        elif sort_by == "weekly":
            clans.sort(key=lambda c: c.stats.weekly_points, reverse=True)
        elif sort_by == "monthly":
            clans.sort(key=lambda c: c.stats.monthly_points, reverse=True)

        return clans[:limit]

    def get_inactive_members(self, clan_id: str) :
        """Get list of members who haven't been active in the last 30 days."""
        clan = self.get_clan(clan_id)
        if not clan:
            return []

        cutoff_date = datetime.now() - timedelta(days=30)
        return [
            member
            for member in clan.members.values()
            if member.last_active < cutoff_date
        ]

    def remove_inactive_members(self, clan_id: str, days: int = 30) -> List[str]:
        """Remove members who haven't been active for specified number of days."""
        clan = self.get_clan(clan_id)
        if not clan:
            return []

        cutoff_date = datetime.now() - timedelta(days=days)
        inactive_ids = [
            member_id
            for member_id, member in clan.members.items()
            if member.last_active < cutoff_date and member.role != ClanRole.LEADER
        ]

        # Remove inactive members
        for member_id in inactive_ids:
            del clan.members[member_id]
            del self._player_clans[member_id]

        clan.stats.active_members = len(clan.members)
        return inactive_ids

    def reset_weekly_points(self) -> None:
        """Reset weekly points for all clans."""
        for clan in self._clans.values():
            clan.stats.weekly_points = 0

    def reset_monthly_points(self) :
        """Reset monthly points for all clans."""
        for clan in self._clans.values():
            clan.stats.monthly_points = 0

    def merge_clans(
        self, clan_id1: str, clan_id2: str, new_name: str, new_tag: str
    ) :
        """Merge two clans into a new clan."""
        clan1 = self.get_clan(clan_id1)
        clan2 = self.get_clan(clan_id2)
        if not clan1 or not clan2:
            return None

        # Create new clan with leader from clan1
        new_clan = self.create_clan(
            name=new_name,
            tag=new_tag,
            description=f"Merged clan from {clan1.name} and {clan2.name}",
            leader_id=clan1.leader_id,
        )

        # Merge members (except leaders, since one is already added)
        for clan in [clan1, clan2]:
            for member_id, member in clan.members.items():
                if member_id != new_clan.leader_id:
                    self.add_member(
                        new_clan.clan_id,
                        member_id,
                        role=(
                            member.role
                            if member.role != ClanRole.LEADER
                            else ClanRole.OFFICER
                        ),
                    )

        # Combine stats
        new_clan.stats.total_matches = (
            clan1.stats.total_matches + clan2.stats.total_matches
        )
        new_clan.stats.matches_won = clan1.stats.matches_won + clan2.stats.matches_won
        new_clan.stats.tournaments_won = (
            clan1.stats.tournaments_won + clan2.stats.tournaments_won
        )
        new_clan.stats.total_contribution = (
            clan1.stats.total_contribution + clan2.stats.total_contribution
        )
        new_clan.stats.weekly_points = (
            clan1.stats.weekly_points + clan2.stats.weekly_points
        )
        new_clan.stats.monthly_points = (
            clan1.stats.monthly_points + clan2.stats.monthly_points
        )

        # Combine achievements
        new_clan.achievements = clan1.achievements.union(clan2.achievements)

        # Delete old clans
        del self._clans[clan_id1]
        del self._clans[clan_id2]

        return new_clan
