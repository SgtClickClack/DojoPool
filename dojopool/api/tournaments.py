"""
FastAPI endpoints for professional tournament management.
"""

from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket
from pydantic import BaseModel

from ..auth.dependencies import get_current_user, require_venue_access
from ..models.user import User
from ..services.tournaments.tournament_service import (
    Match,
    Participant,
    PrizeMoney,
    TournamentRules,
    TournamentService,
    TournamentStatus,
    TournamentType,
)

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])

# Initialize services
tournament_service = TournamentService()


# Request/Response Models
class CreateTournamentRequest(BaseModel):
    """Request model for tournament creation."""

    name: str
    venue_id: str
    start_date: datetime
    end_date: datetime
    tournament_type: TournamentType
    rules: TournamentRules
    max_participants: int
    prize_money: Optional[PrizeMoney]
    qualification_criteria: Optional[Dict]


class TournamentResponse(BaseModel):
    """Response model for tournament details."""

    tournament_id: str
    name: str
    venue_id: str
    start_date: datetime
    end_date: datetime
    type: TournamentType
    rules: TournamentRules
    max_participants: int
    prize_money: Optional[PrizeMoney]
    qualification_criteria: Optional[Dict]
    status: TournamentStatus
    current_round: int


class ParticipantResponse(BaseModel):
    """Response model for participant details."""

    player_id: str
    name: str
    rank: Optional[int]
    seed: Optional[int]
    status: str
    matches_played: int
    matches_won: int
    games_won: int
    games_lost: int


class MatchResponse(BaseModel):
    """Response model for match details."""

    match_id: str
    round_number: int
    player1_id: str
    player2_id: str
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    table_id: Optional[str]
    referee_id: Optional[str]
    score: tuple[int, int]
    status: str
    winner_id: Optional[str]
    next_match_id: Optional[str]
    stream_url: Optional[str]


class StandingsResponse(BaseModel):
    """Response model for tournament standings."""

    player_id: str
    name: str
    rank: Optional[int]
    matches_won: int
    matches_played: int
    games_won: int
    games_lost: int
    status: str


# Tournament Management Endpoints
@router.post("/create", response_model=TournamentResponse)
async def create_tournament(
    request: CreateTournamentRequest, current_user: User = Depends(get_current_user)
) -> Dict:
    """Create a new professional tournament."""
    require_venue_access(current_user, request.venue_id)

    try:
        tournament_id = tournament_service.create_tournament(
            name=request.name,
            venue_id=request.venue_id,
            start_date=request.start_date,
            end_date=request.end_date,
            tournament_type=request.tournament_type,
            rules=request.rules,
            max_participants=request.max_participants,
            prize_money=request.prize_money,
            qualification_criteria=request.qualification_criteria,
        )

        return tournament_service.tournaments[tournament_id]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{tournament_id}/registration/open")
async def open_registration(
    tournament_id: str,
    registration_deadline: datetime,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Open registration for a tournament."""
    try:
        success = tournament_service.open_registration(
            tournament_id, registration_deadline
        )
        if success:
            return {"status": "success", "message": "Registration opened"}
        raise HTTPException(status_code=400, detail="Failed to open registration")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{tournament_id}/participants")
async def register_participant(
    tournament_id: str,
    player_id: str,
    player_name: str,
    player_rank: Optional[int] = None,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Register a participant for the tournament."""
    try:
        success = tournament_service.register_participant(
            tournament_id, player_id, player_name, player_rank
        )
        if success:
            return {"status": "success", "message": "Participant registered"}
        raise HTTPException(status_code=400, detail="Failed to register participant")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{tournament_id}/seeding")
async def generate_seeding(
    tournament_id: str,
    method: str = "ranking",
    current_user: User = Depends(get_current_user),
) -> List[ParticipantResponse]:
    """Generate tournament seeding."""
    try:
        participants = tournament_service.generate_seeding(tournament_id, method)
        return [ParticipantResponse(**p.__dict__) for p in participants]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{tournament_id}/start")
async def start_tournament(
    tournament_id: str, current_user: User = Depends(get_current_user)
) -> Dict:
    """Start the tournament."""
    try:
        success = tournament_service.start_tournament(tournament_id)
        if success:
            return {"status": "success", "message": "Tournament started"}
        raise HTTPException(status_code=400, detail="Failed to start tournament")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/matches/{match_id}/result")
async def record_match_result(
    match_id: str,
    score: tuple[int, int],
    stats: Optional[Dict] = None,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Record the result of a match."""
    try:
        success = tournament_service.record_match_result(match_id, score, stats)
        if success:
            return {"status": "success", "message": "Match result recorded"}
        raise HTTPException(status_code=400, detail="Failed to record match result")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{tournament_id}/advance")
async def advance_round(
    tournament_id: str, current_user: User = Depends(get_current_user)
) -> Dict:
    """Advance tournament to next round."""
    try:
        success = tournament_service.advance_round(tournament_id)
        if success:
            return {"status": "success", "message": "Advanced to next round"}
        return {"status": "success", "message": "Tournament completed"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{tournament_id}/standings", response_model=List[StandingsResponse])
async def get_standings(
    tournament_id: str, current_user: User = Depends(get_current_user)
) -> List[Dict]:
    """Get current tournament standings."""
    try:
        return tournament_service.get_standings(tournament_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Live Scoring WebSocket
@router.websocket("/{tournament_id}/live")
async def tournament_live_scoring(websocket: WebSocket, tournament_id: str):
    """WebSocket connection for live tournament scoring updates."""
    await websocket.accept()
    try:
        # Subscribe to tournament updates
        while True:
            # Receive score updates
            data = await websocket.receive_json()

            # Validate and process updates
            if "match_id" in data and "score" in data:
                try:
                    success = tournament_service.record_match_result(
                        data["match_id"], tuple(data["score"]), data.get("stats")
                    )

                    # Send confirmation
                    await websocket.send_json(
                        {
                            "status": "success" if success else "error",
                            "match_id": data["match_id"],
                            "score": data["score"],
                        }
                    )

                except Exception as e:
                    await websocket.send_json({"status": "error", "message": str(e)})

    except Exception as e:
        await websocket.close(code=1001, reason=str(e))


# Tournament Statistics Endpoints
@router.get("/{tournament_id}/statistics")
async def get_tournament_statistics(
    tournament_id: str, current_user: User = Depends(get_current_user)
) -> Dict:
    """Get comprehensive tournament statistics."""
    try:
        tournament = tournament_service.tournaments.get(tournament_id)
        if not tournament:
            raise ValueError(f"Tournament {tournament_id} not found")

        matches = tournament_service._get_matches_for_round(
            tournament_id, tournament["current_round"]
        )

        total_matches = len(matches)
        completed_matches = len([m for m in matches if m.status == "completed"])
        total_games = sum(sum(m.score) for m in matches if m.status == "completed")

        return {
            "total_matches": total_matches,
            "completed_matches": completed_matches,
            "total_games": total_games,
            "average_games_per_match": (
                total_games / completed_matches if completed_matches else 0
            ),
            "current_round": tournament["current_round"],
            "participants": len(tournament_service.participants[tournament_id]),
            "prize_pool": (
                tournament["prize_money"].total_pool if tournament["prize_money"] else 0
            ),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Professional Features
@router.post("/{tournament_id}/stream")
async def set_stream_url(
    tournament_id: str,
    match_id: str,
    stream_url: str,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Set streaming URL for a match."""
    try:
        match = tournament_service.matches.get(match_id)
        if not match:
            raise ValueError(f"Match {match_id} not found")

        match.stream_url = stream_url
        return {"status": "success", "message": "Stream URL updated"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{tournament_id}/referee")
async def assign_referee(
    tournament_id: str,
    match_id: str,
    referee_id: str,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Assign a referee to a match."""
    try:
        match = tournament_service.matches.get(match_id)
        if not match:
            raise ValueError(f"Match {match_id} not found")

        match.referee_id = referee_id
        return {"status": "success", "message": "Referee assigned"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
