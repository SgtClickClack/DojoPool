from fastapi import APIRouter, WebSocket, Depends, HTTPException
from ..core.auth import get_current_user, require_admin
from ..core.ranking.realtime_service import realtime_ranking_service
from ..models.user import User

router = APIRouter(prefix="/ws", tags=["websockets"])


@router.get("/stats")
async def get_websocket_stats(current_user: User = Depends(require_admin)):
    """Get WebSocket connection statistics. Admin only."""
    return await realtime_ranking_service.get_stats()


@router.websocket("/rankings/{user_id}")
async def rankings_websocket(
    websocket: WebSocket, user_id: int, current_user: User = Depends(get_current_user)
):
    """WebSocket endpoint for real-time ranking updates."""
    # Verify user has access
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Not authorized to subscribe to this user's updates"
        )

    try:
        # Connect to WebSocket
        await realtime_ranking_service.connect(websocket, user_id)

        # Keep connection alive and handle messages
        while True:
            try:
                # Wait for any messages (ping/pong for keepalive)
                data = await websocket.receive_text()

                # Echo back to confirm connection
                await websocket.send_text(f"Connected to ranking updates for user {user_id}")
            except Exception:
                break
    finally:
        # Clean up connection
        await realtime_ranking_service.disconnect(websocket, user_id)


@router.websocket("/rankings/global")
async def global_rankings_websocket(
    websocket: WebSocket, current_user: User = Depends(get_current_user)
):
    """WebSocket endpoint for global ranking updates."""
    try:
        # Connect to WebSocket using admin channel (user_id = 0)
        await realtime_ranking_service.connect(websocket, 0)

        # Keep connection alive and handle messages
        while True:
            try:
                # Wait for any messages (ping/pong for keepalive)
                data = await websocket.receive_text()

                # Echo back to confirm connection
                await websocket.send_text("Connected to global ranking updates")
            except Exception:
                break
    finally:
        # Clean up connection
        await realtime_ranking_service.disconnect(websocket, 0)
