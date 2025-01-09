from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from ..models import db, Base

class TrainingProgram(Base):
    __tablename__ = 'training_programs'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    difficulty = Column(String(20), nullable=False)  # beginner, intermediate, advanced, expert
    duration_weeks = Column(Integer, nullable=False)
    exercises = relationship('Exercise', back_populates='program')
    user_progress = relationship('UserProgress', back_populates='program')
    
class Exercise(Base):
    __tablename__ = 'exercises'
    
    id = Column(Integer, primary_key=True)
    program_id = Column(Integer, ForeignKey('training_programs.id'), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    type = Column(String(50), nullable=False)  # shot_practice, drill, challenge
    difficulty = Column(Integer, nullable=False)  # 1-10
    target_metrics = Column(JSON)  # Expected performance metrics
    program = relationship('TrainingProgram', back_populates='exercises')
    user_progress = relationship('UserProgress', back_populates='exercise')
    
class UserProgress(Base):
    __tablename__ = 'user_progress'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    program_id = Column(Integer, ForeignKey('training_programs.id'), nullable=False)
    exercise_id = Column(Integer, ForeignKey('exercises.id'), nullable=False)
    completion_date = Column(DateTime)
    performance_metrics = Column(JSON)  # Actual performance metrics
    notes = Column(String(500))
    
    program = relationship('TrainingProgram', back_populates='user_progress')
    exercise = relationship('Exercise', back_populates='user_progress')
    user = relationship('User', back_populates='training_progress') 