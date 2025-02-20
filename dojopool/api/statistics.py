"""
FastAPI endpoints for tournament statistics and analytics.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..auth.dependencies import get_current_user
from ..models.user import User
from ..services.tournaments.statistics_service import (
    PlayerStats,
    StatisticsService,
    TournamentStats,
)

router = APIRouter(prefix="/api/statistics", tags=["statistics"])

# Initialize services
statistics_service = StatisticsService()


# Request/Response Models
class PlayerStatsResponse(BaseModel):
    """Response model for player statistics."""

    matches_played: int
    matches_won: int
    games_played: int
    games_won: int
    high_run: int
    perfect_games: int
    average_ppg: float
    win_percentage: float
    tournament_wins: int
    tournament_finals: int
    head_to_head: Dict[str, Dict[str, int]]
    performance_by_tier: Dict[str, Dict[str, float]]


class TournamentStatsResponse(BaseModel):
    """Response model for tournament statistics."""

    total_matches: int
    total_games: int
    average_games_per_match: float
    longest_match: timedelta
    shortest_match: timedelta
    average_match_duration: timedelta
    high_run: int
    high_run_player: str
    perfect_games: int
    participants: int
    matches_by_round: Dict[int, int]
    upsets: List[Dict]
    prize_distribution: Dict[str, float]


class HeadToHeadResponse(BaseModel):
    """Response model for head-to-head statistics."""

    player1_wins: int
    player2_wins: int
    total_matches: int


class PerformanceTrendsResponse(BaseModel):
    """Response model for performance trends."""

    win_percentage: float
    tournament_success_rate: float
    average_ppg: float
    high_run: int
    perfect_games: int


# Statistics Endpoints
@router.get("/player/{player_id}", response_model=PlayerStatsResponse)
async def get_player_statistics(
    player_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Get player statistics for a specific period."""
    stats = statistics_service.get_player_stats(player_id, start_date, end_date)
    if not stats:
        raise HTTPException(status_code=404, detail="Player statistics not found")
    return stats


@router.get("/tournament/{tournament_id}", response_model=TournamentStatsResponse)
async def get_tournament_statistics(
    tournament_id: str, current_user: User = Depends(get_current_user)
) -> Dict:
    """Get tournament statistics."""
    stats = statistics_service.get_tournament_stats(tournament_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Tournament statistics not found")
    return stats


@router.get("/venue/{venue_id}")
async def get_venue_statistics(
    venue_id: str, current_user: User = Depends(get_current_user)
) -> Dict:
    """Get venue statistics."""
    return statistics_service.get_venue_stats(venue_id)


@router.get(
    "/head-to-head/{player1_id}/{player2_id}", response_model=HeadToHeadResponse
)
async def get_head_to_head_statistics(
    player1_id: str, player2_id: str, current_user: User = Depends(get_current_user)
) -> Dict:
    """Get head-to-head statistics between two players."""
    stats = statistics_service.get_head_to_head_stats(player1_id, player2_id)
    if not stats:
        raise HTTPException(
            status_code=404,
            detail="Head-to-head statistics not found for these players",
        )
    return stats


@router.get("/trends/{player_id}", response_model=PerformanceTrendsResponse)
async def get_performance_trends(
    player_id: str,
    period_days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Get player performance trends over a period."""
    period = timedelta(days=period_days)
    trends = statistics_service.get_performance_trends(player_id, period)
    if not trends:
        raise HTTPException(status_code=404, detail="Performance trends not found")
    return trends


# Match Recording Endpoint
@router.post("/record-match")
async def record_match_statistics(
    tournament_id: str,
    match_id: str,
    player1_id: str,
    player2_id: str,
    score: tuple[int, int],
    duration: timedelta,
    stats: Optional[Dict] = None,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Record match statistics."""
    try:
        statistics_service.record_match_result(
            tournament_id=tournament_id,
            match_id=match_id,
            player1_id=player1_id,
            player2_id=player2_id,
            score=score,
            duration=duration,
            stats=stats,
        )
        return {"status": "success", "message": "Match statistics recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Tournament Completion Endpoint
@router.post("/record-tournament")
async def record_tournament_completion(
    tournament_id: str,
    winner_id: str,
    runner_up_id: str,
    prize_distribution: Dict[str, float],
    venue_id: str,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Record tournament completion statistics."""
    try:
        statistics_service.record_tournament_completion(
            tournament_id=tournament_id,
            winner_id=winner_id,
            runner_up_id=runner_up_id,
            prize_distribution=prize_distribution,
            venue_id=venue_id,
        )
        return {"status": "success", "message": "Tournament completion recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
