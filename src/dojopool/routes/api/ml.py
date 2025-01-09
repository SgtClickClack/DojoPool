from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from services.ml_service import MLService
from utils.auth import get_current_user
from utils.rate_limit import rate_limiter

router = APIRouter(prefix="/api/ml", tags=["machine-learning"])
ml_service = MLService()

class MLResponse(BaseModel):
    success: bool
    data: dict
    message: Optional[str] = None

class TrainingRequest(BaseModel):
    training_data: List[dict]
    model_type: Optional[str] = "random_forest"
    sequence_length: Optional[int] = 10
    lookback_period: Optional[int] = 5
    target_metric: Optional[str] = None

@router.post("/models/shot-prediction", response_model=MLResponse)
@rate_limiter(max_requests=10, window_seconds=3600)  # Limit model training
async def train_shot_prediction_model(
    request: TrainingRequest,
    current_user = Depends(get_current_user)
):
    """Train a new shot prediction model."""
    try:
        result = await ml_service.train_shot_prediction_model(
            request.training_data,
            request.model_type
        )
        
        return MLResponse(
            success=True,
            data=result,
            message="Shot prediction model trained successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/models/pattern-recognition", response_model=MLResponse)
@rate_limiter(max_requests=10, window_seconds=3600)
async def train_pattern_recognition_model(
    request: TrainingRequest,
    current_user = Depends(get_current_user)
):
    """Train a new pattern recognition model."""
    try:
        result = await ml_service.train_pattern_recognition_model(
            request.training_data,
            request.sequence_length
        )
        
        return MLResponse(
            success=True,
            data=result,
            message="Pattern recognition model trained successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/models/performance-prediction", response_model=MLResponse)
@rate_limiter(max_requests=10, window_seconds=3600)
async def train_performance_prediction_model(
    request: TrainingRequest,
    current_user = Depends(get_current_user)
):
    """Train a new performance prediction model."""
    if not request.target_metric:
        raise HTTPException(
            status_code=400,
            detail="target_metric is required for performance prediction"
        )
        
    try:
        result = await ml_service.train_performance_prediction_model(
            request.training_data,
            request.target_metric,
            request.lookback_period
        )
        
        return MLResponse(
            success=True,
            data=result,
            message="Performance prediction model trained successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/shot-success/{model_id}", response_model=MLResponse)
@rate_limiter(max_requests=100, window_seconds=60)
async def predict_shot_success(
    model_id: str,
    shot_data: dict = Body(...),
    current_user = Depends(get_current_user)
):
    """Predict the success probability of a shot."""
    try:
        prediction = await ml_service.predict_shot_success(model_id, shot_data)
        
        return MLResponse(
            success=True,
            data=prediction,
            message="Shot success prediction generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/next-pattern/{model_id}", response_model=MLResponse)
@rate_limiter(max_requests=100, window_seconds=60)
async def predict_next_pattern(
    model_id: str,
    sequence_data: List[dict] = Body(...),
    current_user = Depends(get_current_user)
):
    """Predict the next likely pattern in a sequence."""
    try:
        prediction = await ml_service.predict_next_pattern(model_id, sequence_data)
        
        return MLResponse(
            success=True,
            data=prediction,
            message="Pattern prediction generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect/anomalies", response_model=MLResponse)
@rate_limiter(max_requests=50, window_seconds=60)
async def detect_anomalies(
    data: List[dict] = Body(...),
    contamination: float = Query(default=0.1, ge=0.0, le=0.5),
    current_user = Depends(get_current_user)
):
    """Detect anomalies in player performance data."""
    try:
        is_anomaly, scores = await ml_service.detect_anomalies(data, contamination)
        
        return MLResponse(
            success=True,
            data={
                "anomalies": is_anomaly,
                "anomaly_scores": scores
            },
            message="Anomaly detection completed successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/{model_id}/metrics", response_model=MLResponse)
async def get_model_metrics(
    model_id: str,
    current_user = Depends(get_current_user)
):
    """Get metrics for a specific model."""
    metrics = ml_service.model_metrics.get(model_id)
    if not metrics:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
        
    feature_importance = ml_service.feature_importance.get(model_id)
    
    return MLResponse(
        success=True,
        data={
            "metrics": metrics,
            "feature_importance": feature_importance
        },
        message="Model metrics retrieved successfully"
    )

@router.delete("/models/{model_id}", response_model=MLResponse)
async def delete_model(
    model_id: str,
    current_user = Depends(get_current_user)
):
    """Delete a trained model."""
    if model_id not in ml_service.models:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
        
    # Remove model and associated data
    ml_service.models.pop(model_id, None)
    ml_service.scalers.pop(model_id, None)
    ml_service.feature_importance.pop(model_id, None)
    ml_service.model_metrics.pop(model_id, None)
    
    return MLResponse(
        success=True,
        data={"model_id": model_id},
        message=f"Model {model_id} deleted successfully"
    ) 