from flask_caching import Cache
from flask_caching import Cache
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import ForeignKey, desc
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..ai.service import AIService
from ..models import db
from .models import Exercise, TrainingProgram, UserProgress


class TrainingService:
    def __init__(self):
        self.ai_service = AIService()

    def recommend_program(self, user_id: int) -> Dict:
        """Recommend a training program based on user's skill level and performance."""
        # Get user's performance predictions
        predictions: Any = self.ai_service.predict_performance(user_id)

        # Get user's current skill level and areas for improvement
        current_level = predictions["potential_peak"]["current_level"]
        improvement_areas: Any = predictions["areas_for_improvement"]

        # Map skill level to program difficulty
        difficulty: Any = self._map_skill_to_difficulty(current_level)

        # Find suitable programs
        programs: Any = TrainingProgram.query.filter_by(difficulty=difficulty).all()

        # Score programs based on improvement areas
        scored_programs: Any = []
        for program in programs:
            score = self._calculate_program_match(program, improvement_areas)
            scored_programs.append(
                {
                    "program": program,
                    "match_score": score,
                    "reasons": self._get_recommendation_reasons(
                        program, improvement_areas
                    ),
                }
            )

        # Sort by match score
        scored_programs.sort(key=lambda x: x["match_score"], reverse=True)
        return scored_programs[0] if scored_programs else None

    def generate_exercise(self, program_id: int, user_id: int):
        """Generate a personalized exercise based on program and user progress."""
        program = TrainingProgram.query.get(program_id)
        if not program:
            raise ValueError("Program not found")

        # Get user's recent performance
        recent_progress: Any = (
            UserProgress.query.filter_by(user_id=user_id, program_id=program_id)
            .order_by(desc(UserProgress.completion_date))
            .first()
        )

        # Generate exercise parameters based on performance
        exercise_params: Any = self._generate_exercise_params(
            program.difficulty,
            recent_progress.performance_metrics if recent_progress else None,
        )

        # Create new exercise
        exercise: Exercise = Exercise(
            program_id=program_id,
            name=exercise_params["name"],
            description=exercise_params["description"],
            type=exercise_params["type"],
            difficulty=exercise_params["difficulty"],
            target_metrics=exercise_params["target_metrics"],
        )

        db.session.add(exercise)
        db.session.commit()
        return exercise

    def track_progress(self, user_id: int, exercise_id: int, metrics: Dict):
        """Track user's progress for an exercise."""
        exercise: Exercise = Exercise.query.get(exercise_id)
        if not exercise:
            raise ValueError("Exercise not found")

        progress: UserProgress = UserProgress(
            user_id=user_id,
            program_id=exercise.program_id,
            exercise_id=exercise_id,
            completion_date=datetime.utcnow(),
            performance_metrics=metrics,
        )

        db.session.add(progress)
        db.session.commit()
        return progress

    def get_user_progress(self, user_id: int, program_id: Optional[int] = None):
        """Get user's training progress."""
        query: Any = UserProgress.query.filter_by(user_id=user_id)
        if program_id:
            query: Any = query.filter_by(program_id=program_id)

        progress_entries: Any = query.order_by(desc(UserProgress.completion_date)).all()

        return [
            {
                "program": entry.program.name,
                "exercise": entry.exercise.name,
                "completion_date": entry.completion_date,
                "performance_metrics": entry.performance_metrics,
                "notes": entry.notes,
            }
            for entry in progress_entries
        ]

    def _map_skill_to_difficulty(self, skill_level: float) -> str:
        """Map numerical skill level to program difficulty."""
        if skill_level < 0.3:
            return "beginner"
        elif skill_level < 0.6:
            return "intermediate"
        elif skill_level < 0.8:
            return "advanced"
        else:
            return "expert"

    def _calculate_program_match(
        self, program: TrainingProgram, improvement_areas: List[Dict]
    ):
        """Calculate how well a program matches user's improvement areas."""
        match_score: int = 0
        for area in improvement_areas:
            # Check if program exercises target the improvement area
            relevant_exercises: Any = [
                e for e in program.exercises if area["aspect"] in e.description.lower()
            ]
            if relevant_exercises:
                match_score += 1 * (
                    1
                    if area["priority"] == "high"
                    else 0.7 if area["priority"] == "medium" else 0.4
                )
        return match_score / len(improvement_areas) if improvement_areas else 0

    def _get_recommendation_reasons(
        self, program: TrainingProgram, improvement_areas: List[Dict]
    ):
        """Generate reasons for program recommendation."""
        reasons: List[Any] = []
        for area in improvement_areas:
            relevant_exercises: Any = [
                e for e in program.exercises if area["aspect"] in e.description.lower()
            ]
            if relevant_exercises:
                reasons.append(
                    f"Addresses {area['aspect']} improvement area with {len(relevant_exercises)} targeted exercises"
                )
        return reasons

    def _generate_exercise_params(
        self, program_difficulty: str, recent_metrics: Optional[Dict]
    ):
        """Generate parameters for a new exercise based on difficulty and recent performance."""
        # This would contain logic to generate exercise parameters
        # For now, return a template
        return {
            "name": "Shot Accuracy Drill",
            "description": "Practice shot accuracy with varying distances and angles",
            "type": "shot_practice",
            "difficulty": 5,
            "target_metrics": {"accuracy": 0.8, "consistency": 0.7},
        }
