"""
Drill recommender system for the DojoPool AI coaching system.
Suggests personalized practice drills based on player performance and skill level.
"""

import random
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional


@dataclass
class Drill:
    """Represents a practice drill."""

    id: str
    name: str
    description: str
    difficulty: float  # 0-1 scale
    focus_areas: List[str]
    estimated_time: int  # minutes
    required_equipment: List[str]
    video_url: Optional[str] = None


class DrillRecommender:
    """Recommends personalized practice drills."""

    def __init__(self):
        """Initialize the drill recommender with predefined drills."""
        self.drills: Dict[str, Drill] = {
            "power_control_1": Drill(
                id="power_control_1",
                name="Progressive Power Control",
                description="Practice shots with increasing power, focusing on consistency",
                difficulty=0.3,
                focus_areas=["Power control", "Consistency"],
                estimated_time=15,
                required_equipment=["Cue ball", "Object ball"],
            ),
            "accuracy_1": Drill(
                id="accuracy_1",
                name="Corner Pocket Precision",
                description="Practice cutting balls to corner pockets from various angles",
                difficulty=0.4,
                focus_areas=["Accuracy", "Cut shots"],
                estimated_time=20,
                required_equipment=["Full rack"],
            ),
            "english_1": Drill(
                id="english_1",
                name="English Mastery",
                description="Practice applying different types of English for position play",
                difficulty=0.7,
                focus_areas=["English", "Position play"],
                estimated_time=25,
                required_equipment=["Cue ball", "3 object balls"],
            ),
            "stance_1": Drill(
                id="stance_1",
                name="Stance Stability",
                description="Focus on maintaining a stable stance during shots",
                difficulty=0.2,
                focus_areas=["Stance", "Form"],
                estimated_time=15,
                required_equipment=["Cue ball", "Object ball"],
            ),
            "follow_through_1": Drill(
                id="follow_through_1",
                name="Follow Through Development",
                description="Practice proper follow through technique",
                difficulty=0.3,
                focus_areas=["Follow through", "Form"],
                estimated_time=20,
                required_equipment=["Cue ball", "Object ball"],
            ),
            "position_1": Drill(
                id="position_1",
                name="Position Play Patterns",
                description="Practice common position play patterns",
                difficulty=0.6,
                focus_areas=["Position play", "Planning"],
                estimated_time=30,
                required_equipment=["Full rack"],
            ),
            "break_1": Drill(
                id="break_1",
                name="Break Shot Power",
                description="Develop consistent and powerful break shots",
                difficulty=0.5,
                focus_areas=["Power control", "Break technique"],
                estimated_time=20,
                required_equipment=["Full rack"],
            ),
            "safety_1": Drill(
                id="safety_1",
                name="Safety Play Basics",
                description="Learn and practice basic safety shots",
                difficulty=0.6,
                focus_areas=["Safety play", "Strategy"],
                estimated_time=25,
                required_equipment=["4 object balls"],
            ),
        }

    def recommend_drills(
        self,
        skill_level: float,
        focus_areas: List[str],
        available_time: int,
        completed_drills: Optional[List[str]] = None,
    ) -> List[Drill]:
        """
        Recommend drills based on player's skill level and needs.

        Args:
            skill_level: Player's skill level (0-1)
            focus_areas: Areas needing improvement
            available_time: Time available for practice (minutes)
            completed_drills: IDs of previously completed drills

        Returns:
            List of recommended drills
        """
        completed_drills = completed_drills or []
        recommended: List[Drill] = []
        remaining_time = available_time

        # Filter drills by difficulty range
        difficulty_range = 0.3  # Allow drills within this range of skill level
        suitable_drills = [
            drill
            for drill in self.drills.values()
            if abs(drill.difficulty - skill_level) <= difficulty_range
            and drill.id not in completed_drills
        ]

        # Sort drills by relevance to focus areas
        sorted_drills = sorted(
            suitable_drills,
            key=lambda d: sum(area in focus_areas for area in d.focus_areas),
            reverse=True,
        )

        # Select drills that fit within available time
        for drill in sorted_drills:
            if remaining_time >= drill.estimated_time:
                recommended.append(drill)
                remaining_time -= drill.estimated_time

            if remaining_time < 15:  # Stop if less than 15 minutes remaining
                break

        return recommended

    def get_drill_by_id(self, drill_id: str) -> Optional[Drill]:
        """Get a specific drill by ID."""
        return self.drills.get(drill_id)

    def get_drills_by_focus(self, focus_area: str) :
        """Get all drills for a specific focus area."""
        return [
            drill for drill in self.drills.values() if focus_area in drill.focus_areas
        ]

    def get_progressive_sequence(
        self, focus_area: str, start_difficulty: float
    ) :
        """
        Get a progressive sequence of drills for a focus area.
        Starts at given difficulty and progressively gets harder.
        """
        area_drills = self.get_drills_by_focus(focus_area)

        # Sort by difficulty
        sorted_drills = sorted(
            area_drills, key=lambda d: abs(d.difficulty - start_difficulty)
        )

        return sorted_drills[:5]  # Return top 5 progressive drills

    def generate_practice_routine(
        self,
        skill_level: float,
        focus_areas: List[str],
        session_length: int,
        variety_preference: float = 0.5,
    ) -> List[Drill]:
        """
        Generate a complete practice routine.

        Args:
            skill_level: Player's skill level (0-1)
            focus_areas: Areas to focus on
            session_length: Total session time in minutes
            variety_preference: How much variety to include (0-1)

        Returns:
            List of drills forming a complete routine
        """
        base_drills = self.recommend_drills(skill_level, focus_areas, session_length)

        if variety_preference > 0.7:
            # Add some drills from non-focus areas for variety
            other_areas = list(
                set(
                    area for drill in self.drills.values() for area in drill.focus_areas
                )
                - set(focus_areas)
            )

            if other_areas:
                variety_drills = self.recommend_drills(
                    skill_level,
                    random.sample(other_areas, min(2, len(other_areas))),
                    session_length // 4,
                )
                base_drills.extend(variety_drills)

        return sorted(base_drills, key=lambda d: d.difficulty)
