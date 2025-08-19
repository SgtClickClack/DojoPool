"""Player profile management for DojoPool."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Set
from enum import Enum
import uuid


class PlayerRank(Enum):
    """Player ranks in the dojo system."""

    NOVICE = "novice"
    APPRENTICE = "apprentice"
    ADEPT = "adept"
    EXPERT = "expert"
    MASTER = "master"
    GRANDMASTER = "grandmaster"


class AchievementType(Enum):
    """Types of achievements players can earn."""

    TOURNAMENT_WIN = "tournament_win"
    TRICK_SHOT = "trick_shot"
    WINNING_STREAK = "winning_streak"
    PERFECT_GAME = "perfect_game"
    VENUE_MASTERY = "venue_mastery"
    SOCIAL_ENGAGEMENT = "social_engagement"


@dataclass
class Achievement:
    """Achievement details."""

    achievement_id: str
    type: AchievementType
    name: str
    description: str
    requirements: Dict[str, int]  # e.g., {"wins": 10, "streak": 5}
    reward_coins: int
    icon_url: str
    unlocked_at: Optional[datetime] = None


@dataclass
class PlayerStats:
    """Extended player statistics."""

    total_matches: int = 0
    matches_won: int = 0
    matches_lost: int = 0
    tournaments_played: int = 0
    tournaments_won: int = 0
    highest_streak: int = 0
    current_streak: int = 0
    favorite_venue_id: Optional[str] = None
    total_playtime: int = 0  # in minutes
    average_shot_time: float = 0.0
    trick_shots_made: int = 0
    perfect_games: int = 0


@dataclass
class PlayerProfile:
    """Player profile information."""

    player_id: str
    username: str
    display_name: str
    email: str
    created_at: datetime
    rank: PlayerRank = PlayerRank.NOVICE
    level: int = 1
    experience: int = 0
    dojo_coins: int = 0
    stats: PlayerStats = field(default_factory=PlayerStats)
    achievements: Dict[str, Achievement] = field(default_factory=dict)
    friends: Set[str] = field(default_factory=set)
    rivals: Set[str] = field(default_factory=set)
    clan_id: Optional[str] = None
    avatar_url: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    favorite_venues: List[str] = field(default_factory=list)
    active_effects: Dict[str, datetime] = field(default_factory=dict)


class PlayerProfileManager:
    """Manage player profiles and related functionality."""

    def __init__(self) -> None:
        """Initialize player profile manager."""
        self._profiles: Dict[str, PlayerProfile] = {}
        self._achievements: Dict[str, Achievement] = {}
        self._initialize_achievements()

    def _initialize_achievements(self) -> None:
        """Initialize available achievements."""
        # Tournament achievements
        self._achievements["first_tournament_win"] = Achievement(
            achievement_id="first_tournament_win",
            type=AchievementType.TOURNAMENT_WIN,
            name="First Victory",
            description="Win your first tournament",
            requirements={"tournament_wins": 1},
            reward_coins=100,
            icon_url="/assets/achievements/first_win.png",
        )

        self._achievements["tournament_master"] = Achievement(
            achievement_id="tournament_master",
            type=AchievementType.TOURNAMENT_WIN,
            name="Tournament Master",
            description="Win 10 tournaments",
            requirements={"tournament_wins": 10},
            reward_coins=1000,
            icon_url="/assets/achievements/tournament_master.png",
        )

        # Trick shot achievements
        self._achievements["trick_shot_novice"] = Achievement(
            achievement_id="trick_shot_novice",
            type=AchievementType.TRICK_SHOT,
            name="Trick Shot Novice",
            description="Successfully execute 10 trick shots",
            requirements={"trick_shots": 10},
            reward_coins=50,
            icon_url="/assets/achievements/trick_shot_novice.png",
        )

        # Streak achievements
        self._achievements["winning_streak_5"] = Achievement(
            achievement_id="winning_streak_5",
            type=AchievementType.WINNING_STREAK,
            name="Hot Streak",
            description="Win 5 matches in a row",
            requirements={"streak": 5},
            reward_coins=50,
            icon_url="/assets/achievements/hot_streak.png",
        )

    def create_profile(self, username: str, display_name: str, email: str) -> PlayerProfile:
        """Create a new player profile."""
        player_id = str(uuid.uuid4())

        profile = PlayerProfile(
            player_id=player_id,
            username=username,
            display_name=display_name,
            email=email,
            created_at=datetime.now(),
        )

        self._profiles[player_id] = profile
        return profile

    def get_profile(self, player_id: str) -> Optional[PlayerProfile]:
        """Get a player's profile."""
        return self._profiles.get(player_id)

    def update_stats(
        self,
        player_id: str,
        match_won: bool,
        playtime: int,
        venue_id: str,
        trick_shots: int = 0,
        perfect_game: bool = False,
    ) -> None:
        """Update player statistics after a match."""
        profile = self._profiles.get(player_id)
        if not profile:
            return

        # Update basic stats
        profile.stats.total_matches += 1
        if match_won:
            profile.stats.matches_won += 1
            profile.stats.current_streak += 1
            profile.stats.highest_streak = max(
                profile.stats.highest_streak, profile.stats.current_streak
            )
        else:
            profile.stats.matches_lost += 1
            profile.stats.current_streak = 0

        # Update other stats
        profile.stats.total_playtime += playtime
        profile.stats.trick_shots_made += trick_shots
        if perfect_game:
            profile.stats.perfect_games += 1

        # Update favorite venue
        if venue_id not in profile.favorite_venues:
            profile.favorite_venues.append(venue_id)
            if len(profile.favorite_venues) > 5:
                profile.favorite_venues.pop(0)

        # Check for achievements
        self._check_achievements(profile)

    def _check_achievements(self, profile: PlayerProfile) -> None:
        """Check and award any newly completed achievements."""
        for achievement in self._achievements.values():
            if achievement.achievement_id not in profile.achievements:
                requirements_met = True

                for req_key, req_value in achievement.requirements.items():
                    if req_key == "tournament_wins":
                        if profile.stats.tournaments_won < req_value:
                            requirements_met = False
                            break
                    elif req_key == "trick_shots":
                        if profile.stats.trick_shots_made < req_value:
                            requirements_met = False
                            break
                    elif req_key == "streak":
                        if profile.stats.highest_streak < req_value:
                            requirements_met = False
                            break

                if requirements_met:
                    # Award achievement
                    achievement_copy = Achievement(**achievement.__dict__)
                    achievement_copy.unlocked_at = datetime.now()
                    profile.achievements[achievement.achievement_id] = achievement_copy

                    # Award coins
                    profile.dojo_coins += achievement.reward_coins

    def update_rank(self, player_id: str) -> None:
        """Update player rank based on level and achievements."""
        profile = self._profiles.get(player_id)
        if not profile:
            return

        # Calculate rank based on level and achievements
        if profile.level >= 50 and len(profile.achievements) >= 20:
            profile.rank = PlayerRank.GRANDMASTER
        elif profile.level >= 40 and len(profile.achievements) >= 15:
            profile.rank = PlayerRank.MASTER
        elif profile.level >= 30 and len(profile.achievements) >= 10:
            profile.rank = PlayerRank.EXPERT
        elif profile.level >= 20 and len(profile.achievements) >= 5:
            profile.rank = PlayerRank.ADEPT
        elif profile.level >= 10:
            profile.rank = PlayerRank.APPRENTICE

    def add_friend(self, player_id: str, friend_id: str) -> bool:
        """Add a friend to player's profile."""
        profile = self._profiles.get(player_id)
        friend_profile = self._profiles.get(friend_id)

        if not profile or not friend_profile:
            return False

        profile.friends.add(friend_id)
        friend_profile.friends.add(player_id)
        return True

    def add_rival(self, player_id: str, rival_id: str) -> bool:
        """Add a rival to player's profile."""
        profile = self._profiles.get(player_id)
        rival_profile = self._profiles.get(rival_id)

        if not profile or not rival_profile:
            return False

        profile.rivals.add(rival_id)
        rival_profile.rivals.add(player_id)
        return True

    def join_clan(self, player_id: str, clan_id: str) -> bool:
        """Add player to a clan."""
        profile = self._profiles.get(player_id)
        if not profile:
            return False

        profile.clan_id = clan_id
        return True
