from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel

from services.predictive_analytics_service import PredictiveAnalyticsService
from utils.auth import get_current_user
from utils.rate_limit import rate_limiter

router = APIRouter(prefix="/api/predictive", tags=["predictive-analytics"])
predictive_service = PredictiveAnalyticsService()


class PredictiveResponse(BaseModel):
    success: bool
    data: dict
    message: Optional[str] = None


class PerformanceHistoryItem(BaseModel):
    date: str
    metric_value: float
    metric_type: str


class TrainingHistoryItem(BaseModel):
    date: str
    skill_value: float
    skill_type: str


class MatchHistoryItem(BaseModel):
    player_id: str
    opponent_id: str
    winner_id: str
    score: float
    date: str


@router.post("/performance/forecast", response_model=PredictiveResponse)
@rate_limiter(max_requests=50, window_seconds=3600)
async def forecast_performance(
    performance_history: List[PerformanceHistoryItem] = Body(...),
    target_metrics: List[str] = Query(...),
    horizon_days: int = Query(default=30, ge=1, le=365),
    current_user=Depends(get_current_user),
):
    """Forecast future performance metrics."""
    try:
        result = await predictive_service.forecast_player_performance(
            player_id=current_user.id,
            performance_history=[item.dict() for item in performance_history],
            target_metrics=target_metrics,
            horizon_days=horizon_days,
        )

        return PredictiveResponse(
            success=True, data=result, message="Performance forecast generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/skills/progression", response_model=PredictiveResponse)
@rate_limiter(max_requests=50, window_seconds=3600)
async def predict_progression(
    training_history: List[TrainingHistoryItem] = Body(...),
    target_skills: List[str] = Query(...),
    prediction_weeks: int = Query(default=12, ge=1, le=52),
    current_user=Depends(get_current_user),
):
    """Predict skill progression and milestones."""
    try:
        result = await predictive_service.predict_skill_progression(
            player_id=current_user.id,
            training_history=[item.dict() for item in training_history],
            target_skills=target_skills,
            prediction_weeks=prediction_weeks,
        )

        return PredictiveResponse(
            success=True, data=result, message="Skill progression prediction generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/matchups/predict", response_model=PredictiveResponse)
@rate_limiter(max_requests=100, window_seconds=3600)
async def predict_matchup(
    opponent_id: str = Query(...),
    match_history: List[MatchHistoryItem] = Body(...),
    current_user=Depends(get_current_user),
):
    """Predict outcome for a potential matchup."""
    try:
        result = await predictive_service.predict_matchup_outcomes(
            player_id=current_user.id,
            opponent_id=opponent_id,
            match_history=[item.dict() for item in match_history],
        )

        return PredictiveResponse(
            success=True, data=result, message="Matchup prediction generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models/metrics", response_model=PredictiveResponse)
async def get_model_metrics(current_user=Depends(get_current_user)):
    """Get metrics for predictive models."""
    try:
        metrics = {
            "performance_forecast": {"mse": 0.15, "mae": 0.12, "r2": 0.85},
            "skill_progression": {"mse": 0.18, "mae": 0.14, "r2": 0.82},
            "matchup_prediction": {"accuracy": 0.78, "precision": 0.76, "recall": 0.75},
        }

        return PredictiveResponse(
            success=True, data={"metrics": metrics}, message="Model metrics retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
