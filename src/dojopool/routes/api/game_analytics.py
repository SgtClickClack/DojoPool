from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from models.game_analytics import GameAnalytics
from services.game_analytics_service import GameAnalyticsService
from utils.auth import get_current_user
from utils.rate_limit import rate_limiter

router = APIRouter(prefix="/api/game-analytics", tags=["game-analytics"])
analytics_service = GameAnalyticsService()

class AnalyticsResponse(BaseModel):
    success: bool
    data: dict
    message: Optional[str] = None

@router.get("/match/{match_id}", response_model=AnalyticsResponse)
@rate_limiter(max_requests=100, window_seconds=60)
async def get_match_analytics(
    match_id: str,
    current_user = Depends(get_current_user)
):
    """Get comprehensive analytics for a specific match."""
    try:
        # Fetch match data
        match_data = await get_match_data(match_id)
        if not match_data:
            raise HTTPException(status_code=404, detail="Match not found")
            
        # Generate analytics
        analytics = await analytics_service.analyze_match(match_data)
        
        return AnalyticsResponse(
            success=True,
            data=analytics.dict(),
            message="Match analytics generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/player/{player_id}/progression", response_model=AnalyticsResponse)
@rate_limiter(max_requests=50, window_seconds=60)
async def get_player_progression(
    player_id: str,
    start_date: datetime = Query(default=None),
    end_date: datetime = Query(default=None),
    current_user = Depends(get_current_user)
):
    """Get player's progression analytics over time."""
    try:
        # Set default date range if not provided
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
            
        # Generate progression analytics
        analytics = await analytics_service.analyze_player_progression(
            player_id,
            start_date,
            end_date
        )
        
        return AnalyticsResponse(
            success=True,
            data={"progression": [a.dict() for a in analytics]},
            message="Player progression analytics generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/player/{player_id}/insights", response_model=AnalyticsResponse)
@rate_limiter(max_requests=50, window_seconds=60)
async def get_player_insights(
    player_id: str,
    time_period: str = Query(default="last_30_days", regex="^(last_7_days|last_30_days|last_90_days|all_time)$"),
    current_user = Depends(get_current_user)
):
    """Get detailed performance insights for a player."""
    try:
        # Calculate date range based on time period
        end_date = datetime.utcnow()
        if time_period == "last_7_days":
            start_date = end_date - timedelta(days=7)
        elif time_period == "last_30_days":
            start_date = end_date - timedelta(days=30)
        elif time_period == "last_90_days":
            start_date = end_date - timedelta(days=90)
        else:  # all_time
            start_date = datetime.min
            
        # Get analytics for the time period
        analytics = await analytics_service.analyze_player_progression(
            player_id,
            start_date,
            end_date
        )
        
        # Generate insights
        insights = await analytics_service.generate_performance_insights(analytics)
        
        return AnalyticsResponse(
            success=True,
            data=insights,
            message="Player insights generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/compare", response_model=AnalyticsResponse)
@rate_limiter(max_requests=50, window_seconds=60)
async def compare_players(
    player_ids: List[str] = Query(..., min_items=2, max_items=5),
    metric_types: List[str] = Query(
        default=["shots", "position", "strategy", "pressure"],
        regex="^(shots|position|strategy|pressure)$"
    ),
    time_period: str = Query(default="last_30_days", regex="^(last_7_days|last_30_days|last_90_days|all_time)$"),
    current_user = Depends(get_current_user)
):
    """Compare analytics between multiple players."""
    try:
        # Calculate date range
        end_date = datetime.utcnow()
        if time_period == "last_7_days":
            start_date = end_date - timedelta(days=7)
        elif time_period == "last_30_days":
            start_date = end_date - timedelta(days=30)
        elif time_period == "last_90_days":
            start_date = end_date - timedelta(days=90)
        else:  # all_time
            start_date = datetime.min
            
        # Get analytics for each player
        player_analytics = {}
        for player_id in player_ids:
            analytics = await analytics_service.analyze_player_progression(
                player_id,
                start_date,
                end_date
            )
            player_analytics[player_id] = analytics
            
        # Generate comparison data
        comparison = {}
        for metric_type in metric_types:
            comparison[metric_type] = await generate_metric_comparison(
                player_analytics,
                metric_type
            )
            
        return AnalyticsResponse(
            success=True,
            data={"comparison": comparison},
            message="Player comparison generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_match_data(match_id: str) -> dict:
    """Fetch match data from the database."""
    # TODO: Implement database query
    return {}

async def generate_metric_comparison(player_analytics: dict, metric_type: str) -> dict:
    """Generate comparison data for a specific metric type."""
    comparison = {}
    for player_id, analytics in player_analytics.items():
        metrics = []
        for analysis in analytics:
            if metric_type == "shots":
                metrics.append(analysis.shot_metrics)
            elif metric_type == "position":
                metrics.append(analysis.positional_metrics)
            elif metric_type == "strategy":
                metrics.append(analysis.strategy_metrics)
            elif metric_type == "pressure":
                metrics.append(analysis.pressure_metrics)
                
        comparison[player_id] = {
            "average": calculate_metric_average(metrics),
            "trend": calculate_metric_trend(metrics),
            "highlights": identify_metric_highlights(metrics)
        }
        
    return comparison

def calculate_metric_average(metrics: List[dict]) -> dict:
    """Calculate average values for a list of metrics."""
    # TODO: Implement metric averaging
    return {}

def calculate_metric_trend(metrics: List[dict]) -> dict:
    """Calculate trend data for a list of metrics."""
    # TODO: Implement trend calculation
    return {}

def identify_metric_highlights(metrics: List[dict]) -> List[dict]:
    """Identify notable highlights from a list of metrics."""
    # TODO: Implement highlight identification
    return [] 