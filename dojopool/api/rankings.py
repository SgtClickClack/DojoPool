"""
FastAPI endpoints for professional ranking system.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from ..services.tournaments.ranking_service import RankingService, PlayerRanking, RankingPoints
from ..auth.dependencies import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/rankings", tags=["rankings"])

# Initialize services
ranking_service = RankingService()


# Request/Response Models
class RankingPointsResponse(BaseModel):
    """Response model for ranking points."""

    tournament_id: str
    tournament_tier: str
    points: int
    bonus_points: int
    date_earned: datetime
    position: int
    expiry_date: Optional[datetime]


class PlayerRankingResponse(BaseModel):
    """Response model for player ranking details."""

    player_id: str
    current_rank: int
    total_points: int
    ranking_points: List[RankingPointsResponse]
    highest_rank: int
    highest_rank_date: datetime
    last_updated: datetime
    active_streak: Dict[str, any]


class RankingMovementResponse(BaseModel):
    """Response model for ranking movement."""

    start_rank: int
    end_rank: int
    movement: int
    trend: str


# Ranking Endpoints
@router.get("/player/{player_id}", response_model=PlayerRankingResponse)
async def get_player_ranking(
    player_id: str, current_user: User = Depends(get_current_user)
) -> Dict:
    """Get a player's current ranking details."""
    ranking = ranking_service.get_player_ranking(player_id)
    if not ranking:
        raise HTTPException(status_code=404, detail="Player ranking not found")
    return ranking


@router.get("/range", response_model=List[PlayerRankingResponse])
async def get_rankings_range(
    start_rank: int = Query(1, ge=1),
    end_rank: int = Query(10, ge=1),
    current_user: User = Depends(get_current_user),
) -> List[Dict]:
    """Get rankings for a specific range."""
    if end_rank < start_rank:
        raise HTTPException(status_code=400, detail="End rank must be greater than start rank")
    return ranking_service.get_rankings_in_range(start_rank, end_rank)


@router.get("/history/{player_id}")
async def get_ranking_history(
    player_id: str,
    start_date: datetime,
    end_date: datetime = None,
    current_user: User = Depends(get_current_user),
) -> List[Dict]:
    """Get a player's ranking history for a specific period."""
    if not end_date:
        end_date = datetime.now()
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    history = ranking_service.get_ranking_history(player_id, start_date, end_date)
    return [{"date": date, "rank": rank} for date, rank in history]


@router.get("/movement/{player_id}", response_model=RankingMovementResponse)
async def get_ranking_movement(
    player_id: str,
    period_days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Get a player's ranking movement over a period."""
    period = timedelta(days=period_days)
    return ranking_service.get_ranking_movement(player_id, period)


@router.post("/update")
async def trigger_ranking_update(current_user: User = Depends(get_current_user)) -> Dict:
    """Trigger a global ranking update."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Only administrators can trigger ranking updates"
        )

    success = ranking_service.update_global_rankings()
    if success:
        return {"status": "success", "message": "Global rankings updated"}
    return {"status": "skipped", "message": "Update skipped - too soon since last update"}
