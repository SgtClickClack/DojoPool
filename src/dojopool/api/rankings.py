from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..core.auth import get_current_user
from ..core.cache.fastapi_cache import cache_response_fastapi, invalidate_endpoint_cache
from ..core.config.cache_config import CACHE_REGIONS, CACHED_ENDPOINTS
from ..core.ranking.global_ranking import GlobalRankingService
from ..models.user import User

router = APIRouter(prefix="/rankings", tags=["rankings"])
ranking_service = GlobalRankingService()


class TournamentPlacement(BaseModel):
    tournament_id: int
    name: str
    date: str
    placement: int


class PlayerRankingResponse(BaseModel):
    user_id: int
    username: str
    rating: float
    rank: int
    tier: str
    tier_color: str
    total_games: int
    games_won: int
    win_rate: float
    tournament_wins: int
    tournament_placements: List[TournamentPlacement]
    rank_movement: int
    rank_streak: int
    rank_streak_type: str
    highest_rating: float
    highest_rating_date: Optional[str]
    highest_rank: int
    highest_rank_date: Optional[str]
    ranking_history: List[Dict[str, any]]


class RankingMovementResponse(BaseModel):
    start_rank: int
    end_rank: int
    movement: int
    trend: str


@router.get("/global", response_model=List[PlayerRankingResponse])
@cache_response_fastapi(
    timeout=CACHE_REGIONS["short"]["timeout"],
    key_prefix=CACHED_ENDPOINTS["leaderboard"]["key_pattern"],
)
async def get_global_rankings(
    start_rank: int = Query(1, ge=1),
    end_rank: int = Query(10, ge=1),
    current_user: User = Depends(get_current_user),
) -> List[Dict]:
    """Get global rankings for a specific range."""
    if end_rank < start_rank:
        raise HTTPException(
            status_code=400, detail="End rank must be greater than start rank"
        )

    rankings = ranking_service.get_rankings_in_range(start_rank, end_rank)

    # Enrich rankings with user data
    for ranking in rankings:
        user = User.query.get(ranking["user_id"])
        if user:
            ranking.update(
                {
                    "username": user.username,
                    "rank_movement": user.rank_movement,
                    "rank_streak": user.rank_streak,
                    "rank_streak_type": user.rank_streak_type,
                    "highest_rating": user.highest_rating,
                    "highest_rating_date": (
                        user.highest_rating_date.isoformat()
                        if user.highest_rating_date
                        else None
                    ),
                    "highest_rank": user.highest_rank,
                    "highest_rank_date": (
                        user.highest_rank_date.isoformat()
                        if user.highest_rank_date
                        else None
                    ),
                    "ranking_history": user.ranking_history or [],
                }
            )

    return rankings


@router.get("/player/{user_id}", response_model=PlayerRankingResponse)
@cache_response_fastapi(
    timeout=CACHE_REGIONS["medium"]["timeout"], key_prefix="player_ranking"
)
async def get_player_ranking(
    user_id: int, current_user: User = Depends(get_current_user)
) -> Dict:
    """Get detailed ranking information for a specific player."""
    details = ranking_service.get_player_ranking_details(user_id)
    if not details:
        raise HTTPException(status_code=404, detail="Player not found")

    user = User.query.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Player not found")

    details.update(
        {
            "username": user.username,
            "rank_movement": user.rank_movement,
            "rank_streak": user.rank_streak,
            "rank_streak_type": user.rank_streak_type,
            "highest_rating": user.highest_rating,
            "highest_rating_date": (
                user.highest_rating_date.isoformat()
                if user.highest_rating_date
                else None
            ),
            "highest_rank": user.highest_rank,
            "highest_rank_date": (
                user.highest_rank_date.isoformat() if user.highest_rank_date else None
            ),
            "ranking_history": user.ranking_history or [],
        }
    )

    return details


@router.post("/update", response_model=bool)
async def trigger_ranking_update(
    current_user: User = Depends(get_current_user),
) -> bool:
    """Trigger a global rankings update. Admin only."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Invalidate all ranking-related caches
    invalidate_endpoint_cache("leaderboard:*")
    invalidate_endpoint_cache("player_ranking:*")

    return ranking_service.update_global_rankings()
