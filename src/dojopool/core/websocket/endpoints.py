import logging
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..auth.jwt import verify_token
from ..database.models import Game, User
from .handler import websocket_manager
from .models import PlayerAction

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_current_user(token: str) -> Optional[User]:
    try:
        payload = verify_token(token)
        user = await User.get(payload.get("sub"))
        return user
    except Exception:
        return None


@router.websocket("/ws/game/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, token: Optional[str] = None):
    try:
        # Authenticate user
        if not token:
            await websocket.close(code=1008)  # Policy Violation
            return

        user = await get_current_user(token)
        if not user:
            await websocket.close(code=1008)
            return

        # Verify game access
        game = await Game.get(game_id)
        if not game or (str(user.id) not in [str(game.player1_id), str(game.player2_id)]):
            await websocket.close(code=1003)  # Unsupported Data
            return

        # Connect to WebSocket
        await websocket_manager.connect(websocket, game_id, str(user.id))

        try:
            while True:
                # Receive and process messages
                data = await websocket.receive_json()

                # Validate message format
                try:
                    action = PlayerAction(game_id=game_id, player_id=str(user.id), **data)
                except ValueError:
                    await websocket_manager.send_error(
                        game_id, str(user.id), "Invalid message format"
                    )
                    continue

                # Handle the action
                await websocket_manager.handle_player_action(action)

        except WebSocketDisconnect:
            await websocket_manager.disconnect(websocket, game_id, str(user.id))
        except Exception as e:
            logger.error(f"Error in game {game_id} websocket: {str(e)}")
            await websocket_manager.disconnect(websocket, game_id, str(user.id))

    except Exception as e:
        logger.error(f"Error establishing websocket connection: {str(e)}")
        await websocket.close(code=1011)  # Internal Error


@router.websocket("/ws/spectate/{game_id}")
async def spectate_endpoint(websocket: WebSocket, game_id: str, token: Optional[str] = None):
    try:
        # Optional authentication for spectators
        user_id = None
        if token:
            user = await get_current_user(token)
            if user:
                user_id = str(user.id)

        # Verify game exists and is public
        game = await Game.get(game_id)
        if not game or not game.is_public:
            await websocket.close(code=1003)  # Unsupported Data
            return

        # Connect as spectator
        spectator_id = user_id or f"spectator_{id(websocket)}"
        await websocket_manager.connect(websocket, game_id, spectator_id, is_spectator=True)

        try:
            while True:
                # Spectators can only receive updates
                data = await websocket.receive_json()
                if data.get("type") == "chat" and user_id:
                    # Authenticated spectators can chat
                    message = data.get("message", "").strip()
                    if message:
                        action = PlayerAction(
                            game_id=game_id,
                            player_id=user_id,
                            action_type="chat",
                            data={"message": message},
                        )
                        await websocket_manager.handle_player_action(action)

        except WebSocketDisconnect:
            await websocket_manager.disconnect(websocket, game_id, spectator_id)
        except Exception as e:
            logger.error(f"Error in spectator websocket: {str(e)}")
            await websocket_manager.disconnect(websocket, game_id, spectator_id)

    except Exception as e:
        logger.error(f"Error establishing spectator connection: {str(e)}")
        await websocket.close(code=1011)  # Internal Error
