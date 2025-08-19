"""Staff member model for DojoPool."""

from datetime import datetime
from typing import Dict, List, Optional

from dojopool.models.base import BaseModel


class StaffMember(BaseModel):
    """Represents a venue staff member."""

    def __init__(
        self,
        first_name: str,
        last_name: str,
        email: str,
        phone: str,
        role: str,
        venue_id: str,
        hire_date: Optional[datetime] = None,
        is_active: bool = True,
    ):
        super().__init__()
        self.first_name = first_name
        self.last_name = last_name
        self.email = email
        self.phone = phone
        self.role = role
        self.venue_id = venue_id
        self.hire_date = hire_date or datetime.utcnow()
        self.is_active = is_active

        # Training and certification
        self.training_completed: bool = False
        self.training_date: Optional[datetime] = None
        self.certifications: List[Dict] = []
        self.training_modules_completed: List[str] = []

        # Schedule and availability
        self.schedule: Dict[str, List[Dict]] = {}  # Day -> list of shifts
        self.availability: Dict[str, List[Dict]] = {}  # Day -> list of available times
        self.time_off_requests: List[Dict] = []

        # Performance metrics
        self.games_overseen: int = 0
        self.tournaments_managed: int = 0
        self.customer_rating: float = 0.0
        self.performance_reviews: List[Dict] = []

    @property
    def full_name(self) -> str:
        """Get staff member's full name."""
        return f"{self.first_name} {self.last_name}"

    @classmethod
    def get(cls, staff_id: str) -> Optional["StaffMember"]:
        """Get a staff member by ID."""
        # Implement database retrieval
        return None

    @classmethod
    def get_by_venue(cls, venue_id: str) -> List["StaffMember"]:
        """Get all staff members for a venue."""
        # Implement database retrieval
        return []

    def save(self) -> bool:
        """Save staff member to database."""
        try:
            # Implement database save
            return True
        except Exception:
            return False

    def add_certification(
        self,
        name: str,
        issuer: str,
        date_earned: datetime,
        expiration_date: Optional[datetime] = None,
    ) -> bool:
        """Add a certification for the staff member."""
        try:
            self.certifications.append(
                {
                    "name": name,
                    "issuer": issuer,
                    "date_earned": date_earned,
                    "expiration_date": expiration_date,
                }
            )
            return True
        except Exception:
            return False

    def complete_training_module(self, module_name: str) -> bool:
        """Mark a training module as completed."""
        try:
            if module_name not in self.training_modules_completed:
                self.training_modules_completed.append(module_name)
            return True
        except Exception:
            return False

    def add_shift(
        self, day: str, start_time: datetime, end_time: datetime, role: Optional[str] = None
    ) -> bool:
        """Add a work shift for the staff member."""
        try:
            if day not in self.schedule:
                self.schedule[day] = []

            self.schedule[day].append(
                {"start_time": start_time, "end_time": end_time, "role": role or self.role}
            )
            return True
        except Exception:
            return False

    def update_availability(self, day: str, available_times: List[Dict[str, datetime]]) -> bool:
        """Update availability for a given day."""
        try:
            self.availability[day] = available_times
            return True
        except Exception:
            return False

    def request_time_off(self, start_date: datetime, end_date: datetime, reason: str) -> bool:
        """Submit a time off request."""
        try:
            self.time_off_requests.append(
                {
                    "start_date": start_date,
                    "end_date": end_date,
                    "reason": reason,
                    "status": "pending",
                    "submitted_at": datetime.utcnow(),
                }
            )
            return True
        except Exception:
            return False

    def add_performance_review(
        self, reviewer: str, rating: float, comments: str, review_date: Optional[datetime] = None
    ) -> bool:
        """Add a performance review."""
        try:
            self.performance_reviews.append(
                {
                    "reviewer": reviewer,
                    "rating": rating,
                    "comments": comments,
                    "date": review_date or datetime.utcnow(),
                }
            )

            # Update overall rating
            total_rating = sum(r["rating"] for r in self.performance_reviews)
            self.customer_rating = total_rating / len(self.performance_reviews)

            return True
        except Exception:
            return False

    def get_schedule(self, start_date: datetime, end_date: datetime) -> Dict:
        """Get staff member's schedule for a date range."""
        schedule = {}
        for day, shifts in self.schedule.items():
            schedule[day] = [
                shift for shift in shifts if start_date <= shift["start_time"] <= end_date
            ]
        return schedule

    def get_metrics(self) -> Dict:
        """Get staff member's performance metrics."""
        return {
            "games_overseen": self.games_overseen,
            "tournaments_managed": self.tournaments_managed,
            "customer_rating": self.customer_rating,
            "training_completion": len(self.training_modules_completed),
            "certifications": len(self.certifications),
            "reviews": len(self.performance_reviews),
        }
