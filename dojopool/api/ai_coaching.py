"""
FastAPI endpoints for the DojoPool AI coaching system.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket
from pydantic import BaseModel

from ..auth.dependencies import get_current_user
from ..models.user import User
from ..services.ai_coaching.drill_recommender import Drill, DrillRecommender
from ..services.ai_coaching.session_manager import (
    CoachingSessionManager,
    PlayerProgress,
    SessionMetrics,
)
from ..services.ai_coaching.shot_analysis import ShotAnalyzer, ShotFeedback, ShotMetrics

router = APIRouter(prefix="/api/coaching", tags=["coaching"])

# Initialize services
shot_analyzer = ShotAnalyzer()
session_manager = CoachingSessionManager()
drill_recommender = DrillRecommender()


# Pydantic models for requests/responses
class StartSessionRequest(BaseModel):
    player_id: str
    table_corners: List[tuple[int, int]]


class StartSessionResponse(BaseModel):
    session_id: str
    start_time: datetime
    calibration_status: bool


class ShotFeedbackResponse(BaseModel):
    timestamp: datetime
    power: float
    accuracy: float
    spin: float
    angle: float
    contact_point: tuple[float, float]
    follow_through: float
    stance_score: float
    strengths: List[str]
    improvements: List[str]
    suggested_drills: List[str]
    confidence_score: float


class DrillRecommendationRequest(BaseModel):
    player_id: str
    skill_level: float
    focus_areas: List[str]
    available_time: int
    completed_drills: Optional[List[str]] = None


class DrillResponse(BaseModel):
    id: str
    name: str
    description: str
    difficulty: float
    focus_areas: List[str]
    estimated_time: int
    required_equipment: List[str]
    video_url: Optional[str]


class PlayerProgressResponse(BaseModel):
    player_id: str
    skill_level: float
    strengths: List[str]
    weaknesses: List[str]
    preferred_drills: List[str]
    recent_sessions: List[SessionMetrics]


@router.post("/sessions/start", response_model=StartSessionResponse)
async def start_coaching_session(
    request: StartSessionRequest, current_user: User = Depends(get_current_user)
):
    """Start a new coaching session."""
    try:
        # Calibrate camera for the table
        calibration_success = shot_analyzer.calibrate_camera(request.table_corners)
        if not calibration_success:
            raise HTTPException(status_code=400, detail="Camera calibration failed")

        # Start the session
        session = session_manager.start_session(request.player_id)

        return StartSessionResponse(
            session_id=request.player_id,
            start_time=session.start_time,
            calibration_status=calibration_success,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/sessions/{player_id}/live")
async def coaching_session_websocket(websocket: WebSocket, player_id: str):
    """WebSocket connection for real-time shot analysis."""
    await websocket.accept()
    try:
        while True:
            # Receive frame data
            frame_data = await websocket.receive_bytes()

            # Process frame
            shot_analyzer.process_frame(frame_data)

            # Check for shot detection
            shot_metrics = shot_analyzer.detect_shot()
            if shot_metrics:
                # Analyze shot and get feedback
                feedback = shot_analyzer.analyze_shot(shot_metrics)

                # Record in session
                session_manager.record_shot(player_id, feedback)

                # Send feedback to client
                await websocket.send_json(
                    ShotFeedbackResponse(
                        timestamp=feedback.metrics.timestamp,
                        power=feedback.metrics.power,
                        accuracy=feedback.metrics.accuracy,
                        spin=feedback.metrics.spin,
                        angle=feedback.metrics.angle,
                        contact_point=feedback.metrics.contact_point,
                        follow_through=feedback.metrics.follow_through,
                        stance_score=feedback.metrics.stance_score,
                        strengths=feedback.strengths,
                        improvements=feedback.improvements,
                        suggested_drills=feedback.suggested_drills,
                        confidence_score=feedback.confidence_score,
                    ).dict()
                )
    except Exception as e:
        await websocket.close(code=1001, reason=str(e))


@router.post("/sessions/{player_id}/end", response_model=SessionMetrics)
async def end_coaching_session(
    player_id: str, current_user: User = Depends(get_current_user)
):
    """End a coaching session."""
    try:
        session = session_manager.end_session(player_id)
        shot_analyzer.clear_buffer()
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/drills/recommend", response_model=List[DrillResponse])
async def recommend_drills(
    request: DrillRecommendationRequest, current_user: User = Depends(get_current_user)
):
    """Get personalized drill recommendations."""
    try:
        drills = drill_recommender.recommend_drills(
            request.skill_level,
            request.focus_areas,
            request.available_time,
            request.completed_drills,
        )
        return [DrillResponse(**drill.__dict__) for drill in drills]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/drills/{drill_id}", response_model=DrillResponse)
async def get_drill(drill_id: str, current_user: User = Depends(get_current_user)):
    """Get details for a specific drill."""
    drill = drill_recommender.get_drill_by_id(drill_id)
    if not drill:
        raise HTTPException(status_code=404, detail="Drill not found")
    return DrillResponse(**drill.__dict__)


@router.get("/progress/{player_id}", response_model=PlayerProgressResponse)
async def get_player_progress(
    player_id: str, current_user: User = Depends(get_current_user)
):
    """Get a player's progress history."""
    progress = session_manager.get_player_progress(player_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Player progress not found")

    return PlayerProgressResponse(
        player_id=progress.player_id,
        skill_level=progress.skill_level,
        strengths=progress.strengths,
        weaknesses=progress.weaknesses,
        preferred_drills=progress.preferred_drills,
        recent_sessions=progress.sessions[-5:],  # Last 5 sessions
    )


@router.post("/routines/generate", response_model=List[DrillResponse])
async def generate_practice_routine(
    request: DrillRecommendationRequest,
    variety_preference: float = 0.5,
    current_user: User = Depends(get_current_user),
):
    """Generate a complete practice routine."""
    try:
        routine = drill_recommender.generate_practice_routine(
            request.skill_level,
            request.focus_areas,
            request.available_time,
            variety_preference,
        )
        return [DrillResponse(**drill.__dict__) for drill in routine]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
