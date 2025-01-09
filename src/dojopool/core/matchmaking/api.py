"""REST API endpoints for matchmaking system.

This module provides the REST API endpoints for the matchmaking system,
allowing clients to interact with the matchmaking functionality.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta, time, date
from fastapi import APIRouter, Depends, HTTPException, WebSocket, status, Query, Path, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field, validator
import logging
import json

from ..models.user import User
from ..models.game import Game
from ..models.venue import Venue
from .matchmaker import Matchmaker, QueueEntry
from .database import MatchmakingDB
from ..extensions import socketio
from flask_socketio import emit, join_room, leave_room
from .exceptions import (
    MatchmakingError,
    QueueFullError,
    PlayerNotFoundError,
    InvalidPreferencesError,
    MatchmakingTimeoutError,
    IncompatiblePlayersError,
    BlockedPlayerError,
    RateLimitExceededError,
    VenueUnavailableError,
    SkillMismatchError,
    TimeConflictError
)
from ..middleware import rate_limit, api_rate_limit, csrf_protect, api_csrf_protect

router = APIRouter(
    prefix="/api/v1/matchmaking",
    tags=["matchmaking"],
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Not authorized"},
        429: {"description": "Too many requests"},
        500: {"description": "Internal server error"}
    }
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Configure logging
logger = logging.getLogger(__name__)

# Dependency injection
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get current authenticated user.
    
    Args:
        token: Authentication token
        
    Returns:
        User: Authenticated user
        
    Raises:
        HTTPException: If authentication fails
    """
    try:
        # TODO: Implement actual token verification
        user_id = int(token.split(':')[0])
        user = await User.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

# Request/Response models
class QueueEntryRequest(BaseModel):
    """Request model for queue entry."""
    game_mode: str = Field(..., min_length=1, max_length=50)
    skill_level: int = Field(..., ge=0, le=3000)
    team_size: int = Field(..., ge=1, le=5)
    
    @validator('game_mode')
    def validate_game_mode(cls, v):
        valid_modes = ['casual', 'ranked', 'tournament']
        if v.lower() not in valid_modes:
            raise ValueError(f'game_mode must be one of {valid_modes}')
        return v.lower()

class QueueEntryResponse(BaseModel):
    """Response model for queue entry."""
    queue_id: str = Field(..., min_length=1)
    position: int = Field(..., ge=1)
    estimated_wait_time: int = Field(..., ge=0)  # in seconds
    game_mode: str
    team_size: int
    timestamp: datetime

class MatchHistoryEntry(BaseModel):
    match_id: str = Field(..., min_length=1)
    game_mode: str
    team_size: int
    result: str = Field(..., regex='^(win|loss|draw)$')
    score: str
    duration: int  # in seconds
    timestamp: datetime
    opponents: List[str]

class MatchHistoryResponse(BaseModel):
    """Response model for match history."""
    matches: List[MatchHistoryEntry]
    total_matches: int = Field(..., ge=0)
    win_rate: float = Field(..., ge=0, le=100)

class UserPreferencesResponse(BaseModel):
    """Response model for user preferences."""
    user_id: int
    preferences: Dict

class QueueStatusResponse(BaseModel):
    """Response model for queue status."""
    is_queued: bool
    queue_id: Optional[str] = None
    position: Optional[int] = None
    estimated_wait_time: Optional[int] = None
    active_queues: int = Field(..., ge=0)
    total_players: int = Field(..., ge=0)

class PreferencesUpdate(BaseModel):
    default_game_mode: Optional[str] = Field(None, min_length=1, max_length=50)
    preferred_skill_range: Optional[int] = Field(None, ge=50, le=500)
    preferred_team_size: Optional[int] = Field(None, ge=1, le=5)
    auto_ready: Optional[bool] = None
    
    @validator('default_game_mode')
    def validate_game_mode(cls, v):
        if v is None:
            return v
        valid_modes = ['casual', 'ranked', 'tournament']
        if v.lower() not in valid_modes:
            raise ValueError(f'default_game_mode must be one of {valid_modes}')
        return v.lower()

class BlockPlayerRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=200)
    duration_hours: Optional[int] = Field(None, ge=1, le=720)  # Max 30 days

class PreferencesResponse(BaseModel):
    default_game_mode: str
    preferred_skill_range: int
    preferred_team_size: int
    auto_ready: bool
    blocked_players: List[str]

class BlockPlayerResponse(BaseModel):
    success: bool
    blocked_until: Optional[datetime] = None
    total_blocked: int = Field(..., ge=0)

class MatchmakingError(Exception):
    """Base exception for matchmaking errors."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class QueueFullError(MatchmakingError):
    """Raised when the queue is full."""
    def __init__(self, message: str = "Queue is currently full. Please try again later."):
        super().__init__(message, status_code=503)

class AlreadyInQueueError(MatchmakingError):
    """Raised when user is already in queue."""
    def __init__(self, message: str = "You are already in the queue."):
        super().__init__(message, status_code=409)

class NotInQueueError(MatchmakingError):
    """Raised when user is not in queue."""
    def __init__(self, message: str = "You are not currently in the queue."):
        super().__init__(message, status_code=404)

class UserNotFoundError(MatchmakingError):
    """Raised when user is not found."""
    def __init__(self, message: str = "User not found."):
        super().__init__(message, status_code=404)

class SelfBlockError(MatchmakingError):
    """Raised when user tries to block themselves."""
    def __init__(self, message: str = "You cannot block yourself."):
        super().__init__(message, status_code=400)

class NotBlockedError(MatchmakingError):
    """Raised when trying to unblock a user that is not blocked."""
    def __init__(self, message: str = "This player is not blocked."):
        super().__init__(message, status_code=400)

class MatchReadyRequest(BaseModel):
    """Request model for match ready response."""
    match_id: str = Field(..., min_length=1)
    accept: bool = Field(...)
    
class MatchReadyResponse(BaseModel):
    """Response model for match ready status."""
    match_id: str
    status: str = Field(..., regex='^(accepted|declined|waiting|cancelled)$')
    ready_players: List[str]
    total_players: int
    timeout_at: datetime

class MatchNotFoundError(MatchmakingError):
    """Raised when match is not found."""
    def __init__(self, message: str = "Match not found."):
        super().__init__(message, status_code=404)

class MatchTimeoutError(MatchmakingError):
    """Raised when match ready check has timed out."""
    def __init__(self, message: str = "Match has already timed out."):
        super().__init__(message, status_code=400)

class NotInMatchError(MatchmakingError):
    """Raised when user is not part of the match."""
    def __init__(self, message: str = "You are not part of this match."):
        super().__init__(message, status_code=400)

class MatchCancellationRequest(BaseModel):
    """Request model for match cancellation."""
    reason: Optional[str] = Field(None, max_length=200)

class MatchCancellationResponse(BaseModel):
    """Response model for match cancellation."""
    match_id: str
    status: str = Field(..., regex='^cancelled$')
    reason: Optional[str]
    cancelled_at: datetime
    cancelled_by: str

class MatchResultRequest(BaseModel):
    """Request model for match result submission."""
    score: str = Field(..., regex='^(\d+)-(\d+)$')  # Format: "2-1"
    duration: int = Field(..., ge=0)  # in seconds
    winner_id: Optional[int] = None
    details: Optional[Dict] = None

class MatchResultResponse(BaseModel):
    """Response model for match result submission."""
    match_id: str
    status: str = Field(..., regex='^completed$')
    score: str
    duration: int
    winner_id: int
    timestamp: datetime

# WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection."""
    user = get_current_user()
    if not user:
        return False
    
    # Join user's personal room
    join_room(f'user_{user.id}')
    
    # Join rooms for active games
    active_games = user.get_active_games()
    for game in active_games:
        join_room(f'game_{game.id}')
    
    emit('connected', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection."""
    user = get_current_user()
    if user:
        # Leave all rooms
        active_games = user.get_active_games()
        for game in active_games:
            leave_room(f'game_{game.id}')
        leave_room(f'user_{user.id}')

@socketio.on('join_game')
def handle_join_game(data):
    """Handle game room join request."""
    user = get_current_user()
    if not user:
        return
    
    game_id = data.get('game_id')
    if not game_id:
        return
    
    # Verify user is part of game
    game = user.get_game(game_id)
    if not game:
        emit('error', {'message': 'Not authorized to join game'})
        return
    
    # Join game room
    join_room(f'game_{game_id}')
    emit('joined_game', {'game_id': game_id})
    
    # Notify other players
    emit_to_game(game_id, 'player_joined', {
        'game_id': game_id,
        'user_id': user.id,
        'username': user.username
    }, skip_sid=True)

@socketio.on('leave_game')
def handle_leave_game(data):
    """Handle game room leave request."""
    user = get_current_user()
    if not user:
        return
    
    game_id = data.get('game_id')
    if not game_id:
        return
    
    # Leave game room
    leave_room(f'game_{game_id}')
    emit('left_game', {'game_id': game_id})
    
    # Notify other players
    emit_to_game(game_id, 'player_left', {
        'game_id': game_id,
        'user_id': user.id,
        'username': user.username
    })

@socketio.on('game_action')
def handle_game_action(data):
    """Handle game action."""
    user = get_current_user()
    if not user:
        return
    
    game_id = data.get('game_id')
    action = data.get('action')
    action_data = data.get('data', {})
    
    if not game_id or not action:
        return
    
    # Verify user is part of game
    game = user.get_game(game_id)
    if not game:
        emit('error', {'message': 'Not authorized for game'})
        return
    
    # Process game action
    try:
        result = game.process_action(user.id, action, action_data)
        
        # Emit result to all players
        emit_to_game(game_id, 'game_update', {
            'game_id': game_id,
            'action': action,
            'result': result,
            'user_id': user.id,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        emit('error', {'message': str(e)})

@socketio.on('chat_message')
def handle_chat_message(data):
    """Handle chat message."""
    user = get_current_user()
    if not user:
        return
    
    game_id = data.get('game_id')
    message = data.get('message')
    
    if not game_id or not message:
        return
    
    # Verify user is part of game
    game = user.get_game(game_id)
    if not game:
        emit('error', {'message': 'Not authorized for game chat'})
        return
    
    # Store message in Redis
    message_data = {
        'game_id': game_id,
        'user_id': user.id,
        'username': user.username,
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }
    redis_client.rpush(
        f'chat:game:{game_id}',
        json.dumps(message_data)
    )
    
    # Emit to all players
    emit_to_game(game_id, 'chat_message', message_data)

def emit_to_user(user_id, event, data):
    """Emit event to specific user."""
    socketio.emit(event, data, room=f'user_{user_id}')

def emit_to_game(game_id, event, data, skip_sid=False):
    """Emit event to all users in game."""
    socketio.emit(event, data, room=f'game_{game_id}', skip_sid=skip_sid if skip_sid else None)

def broadcast_event(event, data):
    """Broadcast event to all connected users."""
    socketio.emit(event, data)
