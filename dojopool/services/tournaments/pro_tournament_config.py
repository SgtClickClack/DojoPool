"""
Professional tournament configuration and settings.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum


class ProTournamentTier(Enum):
    """Professional tournament tier levels."""

    MAJOR = "major"  # Major championships
    PREMIER = "premier"  # Premier events
    OPEN = "open"  # Open tournaments
    QUALIFIER = "qualifier"  # Qualifying events
    CHALLENGE = "challenge"  # Challenge series


class RefereeLevel(Enum):
    """Professional referee certification levels."""

    INTERNATIONAL = "international"
    NATIONAL = "national"
    REGIONAL = "regional"
    CERTIFIED = "certified"
    TRAINEE = "trainee"


@dataclass
class BroadcastRequirements:
    """Requirements for tournament broadcasting."""

    minimum_cameras: int
    required_angles: List[str]
    streaming_quality: str  # e.g., "1080p60", "4K30"
    replay_system: bool
    commentary_booth: bool
    graphics_package: bool
    required_bandwidth: int  # Mbps


@dataclass
class PrizeStructure:
    """Professional prize money structure."""

    total_pool: float
    currency: str
    distribution: Dict[int, float]  # position -> percentage
    bonus_prizes: Dict[str, float]  # achievement -> amount
    tax_withholding: float  # percentage
    payment_schedule: List[Dict[str, any]]


@dataclass
class RefereeRequirements:
    """Requirements for tournament referees."""

    head_referee_level: RefereeLevel
    match_referee_level: RefereeLevel
    minimum_referees: int
    backup_referees: int
    required_certifications: List[str]


@dataclass
class VenueRequirements:
    """Professional venue requirements."""

    minimum_tables: int
    table_quality: str
    lighting_standards: Dict[str, float]
    climate_control: Dict[str, float]
    spectator_capacity: int
    practice_tables: int
    media_facilities: List[str]


@dataclass
class ProTournamentConfig:
    """Configuration for professional tournaments."""

    tier: ProTournamentTier
    ranking_points: int
    qualification_criteria: Dict[str, any]
    broadcast: BroadcastRequirements
    prize_structure: PrizeStructure
    referee_requirements: RefereeRequirements
    venue_requirements: VenueRequirements

    @classmethod
    def get_major_config(cls) -> "ProTournamentConfig":
        """Get configuration for major tournaments."""
        return cls(
            tier=ProTournamentTier.MAJOR,
            ranking_points=10000,
            qualification_criteria={
                "minimum_ranking": 100,
                "qualification_spots": 16,
                "direct_entry_spots": 48,
                "wildcard_spots": 4,
            },
            broadcast=BroadcastRequirements(
                minimum_cameras=8,
                required_angles=["overhead", "player-side", "end-to-end", "crowd", "close-up"],
                streaming_quality="4K60",
                replay_system=True,
                commentary_booth=True,
                graphics_package=True,
                required_bandwidth=50,
            ),
            prize_structure=PrizeStructure(
                total_pool=500000.00,
                currency="USD",
                distribution={
                    1: 30.0,  # 30% for winner
                    2: 15.0,  # 15% for runner-up
                    3: 10.0,  # 10% for semi-finalists
                    4: 10.0,
                    5: 5.0,  # 5% for quarter-finalists
                    6: 5.0,
                    7: 5.0,
                    8: 5.0,
                    9: 2.5,  # 2.5% for last 16
                    10: 2.5,
                    11: 2.5,
                    12: 2.5,
                    13: 1.25,  # 1.25% for last 32
                    14: 1.25,
                    15: 1.25,
                    16: 1.25,
                },
                bonus_prizes={
                    "perfect_game": 10000.00,
                    "tournament_high_run": 5000.00,
                    "fastest_victory": 2500.00,
                },
                tax_withholding=20.0,
                payment_schedule=[
                    {"milestone": "registration", "percentage": 0},
                    {"milestone": "event_start", "percentage": 0},
                    {"milestone": "event_completion", "percentage": 80},
                    {"milestone": "30_days_after", "percentage": 20},
                ],
            ),
            referee_requirements=RefereeRequirements(
                head_referee_level=RefereeLevel.INTERNATIONAL,
                match_referee_level=RefereeLevel.NATIONAL,
                minimum_referees=12,
                backup_referees=3,
                required_certifications=[
                    "pro_rules",
                    "shot_clock",
                    "dispute_resolution",
                    "tournament_management",
                ],
            ),
            venue_requirements=VenueRequirements(
                minimum_tables=8,
                table_quality="tournament_grade",
                lighting_standards={
                    "table_surface_lux": 1000,
                    "surrounding_area_lux": 500,
                    "color_temperature": 5600,
                },
                climate_control={
                    "temperature": 21.0,  # Celsius
                    "humidity": 45.0,  # Percentage
                    "air_flow": 0.1,  # m/s
                },
                spectator_capacity=500,
                practice_tables=4,
                media_facilities=[
                    "press_room",
                    "interview_area",
                    "media_center",
                    "broadcast_booth",
                    "photographer_positions",
                ],
            ),
        )

    @classmethod
    def get_premier_config(cls) -> "ProTournamentConfig":
        """Get configuration for premier tournaments."""
        major_config = cls.get_major_config()

        # Modify for premier level
        return cls(
            tier=ProTournamentTier.PREMIER,
            ranking_points=5000,
            qualification_criteria={
                "minimum_ranking": 200,
                "qualification_spots": 32,
                "direct_entry_spots": 32,
                "wildcard_spots": 8,
            },
            broadcast=BroadcastRequirements(
                minimum_cameras=6,
                required_angles=["overhead", "player-side", "end-to-end", "crowd"],
                streaming_quality="1080p60",
                replay_system=True,
                commentary_booth=True,
                graphics_package=True,
                required_bandwidth=30,
            ),
            prize_structure=PrizeStructure(
                total_pool=250000.00,
                currency="USD",
                distribution=major_config.prize_structure.distribution,
                bonus_prizes={"perfect_game": 5000.00, "tournament_high_run": 2500.00},
                tax_withholding=20.0,
                payment_schedule=major_config.prize_structure.payment_schedule,
            ),
            referee_requirements=RefereeRequirements(
                head_referee_level=RefereeLevel.NATIONAL,
                match_referee_level=RefereeLevel.REGIONAL,
                minimum_referees=8,
                backup_referees=2,
                required_certifications=["pro_rules", "shot_clock", "dispute_resolution"],
            ),
            venue_requirements=VenueRequirements(
                minimum_tables=6,
                table_quality="tournament_grade",
                lighting_standards={
                    "table_surface_lux": 800,
                    "surrounding_area_lux": 400,
                    "color_temperature": 5600,
                },
                climate_control=major_config.venue_requirements.climate_control,
                spectator_capacity=300,
                practice_tables=3,
                media_facilities=[
                    "press_room",
                    "interview_area",
                    "media_center",
                    "broadcast_booth",
                ],
            ),
        )

    @classmethod
    def get_open_config(cls) -> "ProTournamentConfig":
        """Get configuration for open tournaments."""
        premier_config = cls.get_premier_config()

        # Modify for open level
        return cls(
            tier=ProTournamentTier.OPEN,
            ranking_points=2500,
            qualification_criteria={
                "minimum_ranking": 500,
                "qualification_spots": 64,
                "direct_entry_spots": 16,
                "wildcard_spots": 16,
            },
            broadcast=BroadcastRequirements(
                minimum_cameras=4,
                required_angles=["overhead", "player-side", "end-to-end"],
                streaming_quality="1080p30",
                replay_system=True,
                commentary_booth=True,
                graphics_package=True,
                required_bandwidth=20,
            ),
            prize_structure=PrizeStructure(
                total_pool=100000.00,
                currency="USD",
                distribution=premier_config.prize_structure.distribution,
                bonus_prizes={"perfect_game": 2500.00, "tournament_high_run": 1000.00},
                tax_withholding=20.0,
                payment_schedule=premier_config.prize_structure.payment_schedule,
            ),
            referee_requirements=RefereeRequirements(
                head_referee_level=RefereeLevel.REGIONAL,
                match_referee_level=RefereeLevel.CERTIFIED,
                minimum_referees=6,
                backup_referees=2,
                required_certifications=["pro_rules", "shot_clock"],
            ),
            venue_requirements=VenueRequirements(
                minimum_tables=4,
                table_quality="tournament_grade",
                lighting_standards={
                    "table_surface_lux": 600,
                    "surrounding_area_lux": 300,
                    "color_temperature": 5600,
                },
                climate_control=premier_config.venue_requirements.climate_control,
                spectator_capacity=200,
                practice_tables=2,
                media_facilities=["press_room", "interview_area", "broadcast_position"],
            ),
        )
