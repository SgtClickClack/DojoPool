from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..models import Base


class TrainingProgram(Base):
    __tablename__: str = "training_programs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(500))
    difficulty: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # beginner, intermediate, advanced, expert
    duration_weeks: Mapped[int] = mapped_column(Integer, nullable=False)
    exercises: Mapped[List[Exercise]] = relationship(
        "Exercise", back_populates="program"
    )
    user_progress: Mapped[List[UserProgress]] = relationship(
        "UserProgress", back_populates="program"
    )


class Exercise(Base):
    __tablename__: str = "exercises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    program_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("training_programs.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(500))
    type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # shot_practice, drill, challenge
    difficulty: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-10
    target_metrics: Mapped[Dict[str, Any]] = mapped_column(
        JSON
    )  # Expected performance metrics
    program: Mapped[List[TrainingProgram]] = relationship(
        "TrainingProgram", back_populates="exercises"
    )
    user_progress: Mapped[List[UserProgress]] = relationship(
        "UserProgress", back_populates="exercise"
    )


class UserProgress(Base):
    __tablename__: str = "user_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    program_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("training_programs.id"), nullable=False
    )
    exercise_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("exercises.id"), nullable=False
    )
    completion_date: Mapped[datetime] = mapped_column(DateTime)
    performance_metrics: Mapped[Dict[str, Any]] = mapped_column(
        JSON
    )  # Actual performance metrics
    notes: Mapped[str] = mapped_column(String(500))

    program: Mapped[List[TrainingProgram]] = relationship(
        "TrainingProgram", back_populates="user_progress"
    )
    exercise: Mapped[List[Exercise]] = relationship(
        "Exercise", back_populates="user_progress"
    )
    user: Mapped[List[User]] = relationship("User", back_populates="training_progress")
