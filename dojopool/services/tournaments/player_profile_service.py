"""
Professional player profile service.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Set

from .pro_tournament_config import ProTournamentTier
from .ranking_service import PlayerRanking
from .statistics_service import PlayerStats


class PlayerStatus(Enum):
    """Professional player status."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    RETIRED = "retired"


class PlayingStyle(Enum):
    """Player's predominant playing style."""

    AGGRESSIVE = "aggressive"
    DEFENSIVE = "defensive"
    TACTICAL = "tactical"
    BALANCED = "balanced"
    POWER = "power"
    FINESSE = "finesse"


@dataclass
class Achievement:
    """Professional achievement or milestone."""

    title: str
    description: str
    date_achieved: datetime
    tournament_id: Optional[str] = None
    venue_id: Optional[str] = None
    proof_url: Optional[str] = None


@dataclass
class Certification:
    """Professional certifications and qualifications."""

    name: str
    issuing_body: str
    issue_date: datetime
    expiry_date: Optional[datetime] = None
    level: str = "standard"
    verification_url: Optional[str] = None


@dataclass
class CareerHighlight:
    """Notable career moments and achievements."""

    title: str
    description: str
    date: datetime
    tournament_id: Optional[str] = None
    media_url: Optional[str] = None
    stats: Optional[Dict] = None


@dataclass
class Equipment:
    """Player's professional equipment details."""

    cue_brand: str
    cue_model: str
    shaft_type: str
    tip_size: float
    case_type: str
    accessories: List[str]
    specifications: Dict[str, any]


@dataclass
class Sponsorship:
    """Professional sponsorship details."""

    sponsor_name: str
    start_date: datetime
    end_date: Optional[datetime] = None
    type: str = "equipment"  # equipment, monetary, venue
    details: Dict[str, any] = None
    active: bool = True


@dataclass
class PlayerProfile:
    """Professional player profile."""

    player_id: str
    first_name: str
    last_name: str
    nickname: Optional[str]
    nationality: str
    date_of_birth: datetime
    professional_since: datetime
    status: PlayerStatus
    playing_style: PlayingStyle
    dominant_hand: str
    bio: str
    achievements: List[Achievement]
    certifications: List[Certification]
    career_highlights: List[CareerHighlight]
    equipment: Equipment
    sponsorships: List[Sponsorship]
    social_media: Dict[str, str]
    profile_image_url: Optional[str]
    verified: bool = False
    last_updated: datetime = datetime.now()


class PlayerProfileService:
    """Manages professional player profiles."""

    def __init__(self, statistics_service=None, ranking_service=None):
        """Initialize player profile service."""
        self.profiles: Dict[str, PlayerProfile] = {}
        self.statistics_service = statistics_service
        self.ranking_service = ranking_service
        self.verified_players: Set[str] = set()

    def create_profile(
        self,
        player_id: str,
        first_name: str,
        last_name: str,
        nationality: str,
        date_of_birth: datetime,
        professional_since: datetime,
        playing_style: PlayingStyle,
        dominant_hand: str,
        bio: str,
        equipment: Equipment,
        **optional_fields,
    ) -> PlayerProfile:
        """Create a new professional player profile."""
        if player_id in self.profiles:
            raise ValueError(f"Profile already exists for player {player_id}")

        profile = PlayerProfile(
            player_id=player_id,
            first_name=first_name,
            last_name=last_name,
            nationality=nationality,
            date_of_birth=date_of_birth,
            professional_since=professional_since,
            status=PlayerStatus.ACTIVE,
            playing_style=playing_style,
            dominant_hand=dominant_hand,
            bio=bio,
            equipment=equipment,
            achievements=[],
            certifications=[],
            career_highlights=[],
            sponsorships=[],
            social_media={},
            **optional_fields,
        )

        self.profiles[player_id] = profile
        return profile

    def update_profile(self, player_id: str, updates: Dict) :
        """Update an existing player profile."""
        if player_id not in self.profiles:
            raise ValueError(f"Profile not found for player {player_id}")

        profile = self.profiles[player_id]

        for field, value in updates.items():
            if hasattr(profile, field):
                setattr(profile, field, value)

        profile.last_updated = datetime.now()
        return profile

    def add_achievement(self, player_id: str, achievement: Achievement) :
        """Add a new achievement to player's profile."""
        if player_id not in self.profiles:
            raise ValueError(f"Profile not found for player {player_id}")

        self.profiles[player_id].achievements.append(achievement)
        self.profiles[player_id].last_updated = datetime.now()
        return True

    def add_certification(self, player_id: str, certification: Certification) :
        """Add a new certification to player's profile."""
        if player_id not in self.profiles:
            raise ValueError(f"Profile not found for player {player_id}")

        self.profiles[player_id].certifications.append(certification)
        self.profiles[player_id].last_updated = datetime.now()
        return True

    def add_career_highlight(self, player_id: str, highlight: CareerHighlight) -> bool:
        """Add a new career highlight to player's profile."""
        if player_id not in self.profiles:
            raise ValueError(f"Profile not found for player {player_id}")

        self.profiles[player_id].career_highlights.append(highlight)
        self.profiles[player_id].career_highlights.sort(
            key=lambda x: x.date, reverse=True
        )
        self.profiles[player_id].last_updated = datetime.now()
        return True

    def add_sponsorship(self, player_id: str, sponsorship: Sponsorship) :
        """Add a new sponsorship to player's profile."""
        if player_id not in self.profiles:
            raise ValueError(f"Profile not found for player {player_id}")

        self.profiles[player_id].sponsorships.append(sponsorship)
        self.profiles[player_id].last_updated = datetime.now()
        return True

    def update_status(self, player_id: str, status: PlayerStatus) :
        """Update player's professional status."""
        if player_id not in self.profiles:
            raise ValueError(f"Profile not found for player {player_id}")

        self.profiles[player_id].status = status
        self.profiles[player_id].last_updated = datetime.now()
        return True

    def verify_player(self, player_id: str, verification_proof: Dict) :
        """Verify a professional player's profile."""
        if player_id not in self.profiles:
            raise ValueError(f"Profile not found for player {player_id}")

        # Implement verification logic here
        self.profiles[player_id].verified = True
        self.verified_players.add(player_id)
        self.profiles[player_id].last_updated = datetime.now()
        return True

    def get_profile(
        self, player_id: str, include_stats: bool = False, include_ranking: bool = False
    ) -> Optional[Dict]:
        """Get a player's complete profile with optional stats and ranking."""
        if player_id not in self.profiles:
            return None

        profile = self.profiles[player_id]
        result = {"profile": profile, "stats": None, "ranking": None}

        if include_stats and self.statistics_service:
            result["stats"] = self.statistics_service.get_player_stats(player_id)

        if include_ranking and self.ranking_service:
            result["ranking"] = self.ranking_service.get_player_ranking(player_id)

        return result

    def search_profiles(self, criteria: Dict) :
        """Search player profiles based on criteria."""
        results = []

        for profile in self.profiles.values():
            matches = True
            for field, value in criteria.items():
                if hasattr(profile, field):
                    field_value = getattr(profile, field)
                    if isinstance(value, (list, set)):
                        if field_value not in value:
                            matches = False
                            break
                    elif field_value != value:
                        matches = False
                        break

            if matches:
                results.append(profile)

        return results

    def get_active_players(self) :
        """Get all active professional players."""
        return [
            profile
            for profile in self.profiles.values()
            if profile.status == PlayerStatus.ACTIVE
        ]

    def get_verified_players(self) :
        """Get all verified professional players."""
        return [profile for profile in self.profiles.values() if profile.verified]
