"""
Professional referee management service.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set

from .pro_tournament_config import RefereeLevel


@dataclass
class Certification:
    """Professional referee certification."""

    name: str
    issuing_body: str
    issue_date: datetime
    expiry_date: Optional[datetime]
    level: RefereeLevel
    specializations: List[str]


@dataclass
class RefereeProfile:
    """Professional referee profile."""

    referee_id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    level: RefereeLevel
    certifications: List[Certification]
    years_experience: int
    languages: List[str]
    availability: Dict[str, List[Dict[str, datetime]]]  # day -> list of time slots
    tournament_history: List[Dict]
    rating: float
    reviews: List[Dict]
    active: bool = True


class RefereeService:
    """Manages professional referees."""

    def __init__(self):
        """Initialize referee service."""
        self.referees: Dict[str, RefereeProfile] = {}
        self.tournament_assignments: Dict[str, Dict[str, str]] = (
            {}
        )  # tournament_id -> {match_id -> referee_id}
        self.certifications: Dict[str, Set[str]] = (
            {}
        )  # certification -> set of referee_ids

    def register_referee(
        self,
        first_name: str,
        last_name: str,
        email: str,
        phone: str,
        level: RefereeLevel,
        certifications: List[Certification],
        years_experience: int,
        languages: List[str],
    ) -> RefereeProfile:
        """Register a new professional referee."""
        from uuid import uuid4

        referee = RefereeProfile(
            referee_id=str(uuid4()),
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            level=level,
            certifications=certifications,
            years_experience=years_experience,
            languages=languages,
            availability={},
            tournament_history=[],
            rating=0.0,
            reviews=[],
        )

        self.referees[referee.referee_id] = referee

        # Index certifications
        for cert in certifications:
            if cert.name not in self.certifications:
                self.certifications[cert.name] = set()
            self.certifications[cert.name].add(referee.referee_id)

        return referee

    def update_availability(
        self, referee_id: str, availability: Dict[str, List[Dict[str, datetime]]]
    ) :
        """Update a referee's availability."""
        if referee_id not in self.referees:
            raise ValueError(f"Referee {referee_id} not found")

        self.referees[referee_id].availability = availability
        return True

    def add_certification(self, referee_id: str, certification: Certification) :
        """Add a new certification for a referee."""
        if referee_id not in self.referees:
            raise ValueError(f"Referee {referee_id} not found")

        referee = self.referees[referee_id]
        referee.certifications.append(certification)

        if certification.name not in self.certifications:
            self.certifications[certification.name] = set()
        self.certifications[certification.name].add(referee_id)

        # Update referee level if certification level is higher
        if certification.level.value > referee.level.value:
            referee.level = certification.level

        return True

    def assign_referee(
        self, tournament_id: str, match_id: str, requirements: Dict[str, any]
    ) -> Optional[str]:
        """Assign a referee to a match based on requirements."""
        if tournament_id not in self.tournament_assignments:
            self.tournament_assignments[tournament_id] = {}

        # Get available referees meeting requirements
        available_referees = self._get_available_referees(
            requirements["start_time"],
            requirements["end_time"],
            requirements["level"],
            requirements.get("certifications", []),
        )

        if not available_referees:
            return None

        # Sort by suitability (experience, rating, etc.)
        sorted_referees = sorted(
            available_referees,
            key=lambda r: (r.years_experience, r.rating, len(r.certifications)),
            reverse=True,
        )

        # Assign best matching referee
        best_referee = sorted_referees[0]
        self.tournament_assignments[tournament_id][match_id] = best_referee.referee_id

        return best_referee.referee_id

    def record_tournament_history(self, referee_id: str, tournament_data: Dict) :
        """Record a tournament in a referee's history."""
        if referee_id not in self.referees:
            raise ValueError(f"Referee {referee_id} not found")

        referee = self.referees[referee_id]
        referee.tournament_history.append(
            {**tournament_data, "recorded_at": datetime.now().isoformat()}
        )

        return True

    def add_review(
        self, referee_id: str, reviewer: str, rating: float, comments: str
    ) :
        """Add a review for a referee."""
        if referee_id not in self.referees:
            raise ValueError(f"Referee {referee_id} not found")

        referee = self.referees[referee_id]

        review = {
            "reviewer": reviewer,
            "rating": rating,
            "comments": comments,
            "date": datetime.now().isoformat(),
        }

        referee.reviews.append(review)

        # Update overall rating
        total_rating = sum(r["rating"] for r in referee.reviews)
        referee.rating = total_rating / len(referee.reviews)

        return True

    def get_referee(self, referee_id: str) :
        """Get a referee's profile."""
        return self.referees.get(referee_id)

    def get_referees_by_level(self, level: RefereeLevel) -> List[RefereeProfile]:
        """Get all referees of a specific level."""
        return [
            referee
            for referee in self.referees.values()
            if referee.level == level and referee.active
        ]

    def get_referees_by_certification(self, certification: str) :
        """Get all referees with a specific certification."""
        referee_ids = self.certifications.get(certification, set())
        return [
            self.referees[rid]
            for rid in referee_ids
            if rid in self.referees and self.referees[rid].active
        ]

    def _get_available_referees(
        self,
        start_time: datetime,
        end_time: datetime,
        required_level: RefereeLevel,
        required_certifications: List[str],
    ) :
        """Get referees available for a specific time slot."""
        available = []

        for referee in self.referees.values():
            if not referee.active:
                continue

            if referee.level.value < required_level.value:
                continue

            # Check certifications
            referee_certs = {cert.name for cert in referee.certifications}
            if not all(cert in referee_certs for cert in required_certifications):
                continue

            # Check availability
            day = start_time.strftime("%A").lower()
            if day in referee.availability:
                for slot in referee.availability[day]:
                    slot_start = slot["start"]
                    slot_end = slot["end"]
                    if slot_start <= start_time and slot_end >= end_time:
                        available.append(referee)
                        break

        return available
