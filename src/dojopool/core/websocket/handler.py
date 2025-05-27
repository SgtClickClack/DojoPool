import asyncio
import json
import logging
from typing import Dict, List, Optional, Set, Any

from fastapi import WebSocket, WebSocketDisconnect

from ..database.models import Game
from ..utils.redis import get_redis_client
from .models import (
    ChatMessage,
    ConnectionStatus,
    GameState,
    GameUpdate,
    PlayerAction,
    PlayerConnection,
)

logger = logging.getLogger(__name__)

# Import AI services
from dojopool.ai.commentary_service import ai_commentary_service
from dojopool.ai.referee_service import ai_referee_service, BackendRefereeInput # Import referee service and input type


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[PlayerConnection]] = {}
        self.spectators: Dict[str, Set[PlayerConnection]] = {}
        self.redis_client = get_redis_client()

    async def connect(
        self, websocket: WebSocket, game_id: str, player_id: str, is_spectator: bool = False
    ):
        await websocket.accept()

        connection = PlayerConnection(websocket=websocket, player_id=player_id)

        if is_spectator:
            if game_id not in self.spectators:
                self.spectators[game_id] = set()
            self.spectators[game_id].add(connection)
        else:
            if game_id not in self.active_connections:
                self.active_connections[game_id] = set()
            self.active_connections[game_id].add(connection)

            # Broadcast connection status to players and spectators
            status = ConnectionStatus(game_id=game_id, player_id=player_id, status="connected")
            await self._broadcast_all(game_id, status.dict())

        # Load and send initial game state
        game_state = await self._get_game_state(game_id)
        if game_state:
            await self.send_personal_message(game_state.dict(), websocket)

    def disconnect(self, websocket: WebSocket, game_id: str, player_id: str):
        # Remove from active players
        if game_id in self.active_connections:
            self.active_connections[game_id] = {
                conn for conn in self.active_connections[game_id] if conn.websocket != websocket
            }
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]

            # Broadcast disconnection status
            status = ConnectionStatus(game_id=game_id, player_id=player_id, status="disconnected")
            asyncio.create_task(self._broadcast_all(game_id, status.dict()))

        # Remove from spectators
        if game_id in self.spectators:
            self.spectators[game_id] = {
                conn for conn in self.spectators[game_id] if conn.websocket != websocket
            }
            if not self.spectators[game_id]:
                del self.spectators[game_id]

    async def _broadcast_all(self, game_id: str, message: dict):
        """Broadcast to both players and spectators"""
        tasks = []

        # Broadcast to players
        if game_id in self.active_connections:
            tasks.append(self.broadcast_to_game(game_id, message))

        # Broadcast to spectators
        if game_id in self.spectators:
            tasks.append(self.broadcast_to_spectators(game_id, message))

        await asyncio.gather(*tasks)

    async def broadcast_to_game(self, game_id: str, message: dict):
        """Broadcast to active players only"""
        if game_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[game_id]:
                try:
                    await connection.websocket.send_json(message)
                except WebSocketDisconnect:
                    disconnected.add(connection)
                except Exception as e:
                    logger.error(f"Error broadcasting to {connection.player_id}: {str(e)}")
                    disconnected.add(connection)

            # Clean up disconnected connections
            for connection in disconnected:
                self.disconnect(connection.websocket, game_id, connection.player_id)

    async def broadcast_to_spectators(self, game_id: str, message: dict):
        """Broadcast to spectators only"""
        if game_id in self.spectators:
            disconnected = set()
            for connection in self.spectators[game_id]:
                try:
                    await connection.websocket.send_json(message)
                except WebSocketDisconnect:
                    disconnected.add(connection)
                except Exception as e:
                    logger.error(
                        f"Error broadcasting to spectator {connection.player_id}: {str(e)}"
                    )
                    disconnected.add(connection)

            # Clean up disconnected connections
            for connection in disconnected:
                self.disconnect(connection.websocket, game_id, connection.player_id)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {str(e)}")

    async def handle_player_action(self, action: PlayerAction):
        try:
            game_state = await self._get_game_state(action.game_id)
            if not game_state:
                return

            # Validate action (except for chat messages)
            if action.action_type != "chat" and game_state.current_player != action.player_id:
                await self.send_error(action.game_id, action.player_id, "Not your turn")
                return

            # Process action based on type
            if action.action_type == "shot":
                await self._handle_shot(game_state, action)
            elif action.action_type == "position":
                await self._handle_position_update(game_state, action)
            elif action.action_type == "chat":
                await self._handle_chat(action)

        except Exception as e:
            logger.error(f"Error handling player action: {str(e)}")
            await self.send_error(action.game_id, action.player_id, str(e))

    async def _get_game_state(self, game_id: str) -> Optional[GameState]:
        try:
            # Try to get state from Redis first
            cached_state = await self.redis_client.get(f"game_state:{game_id}")
            if cached_state:
                return GameState(**json.loads(cached_state))

            # If not in Redis, get from database
            game = await Game.get(game_id)
            if game:
                game_state = GameState(
                    game_id=game_id,
                    status=game.status,
                    current_player=game.current_player,
                    player1_id=str(game.player1_id),
                    player2_id=str(game.player2_id),
                    balls_remaining=game.balls_remaining,
                    last_shot=game.last_shot,
                    winner_id=str(game.winner_id) if game.winner_id else None,
                )

                # Cache in Redis
                await self.redis_client.setex(
                    f"game_state:{game_id}", 300, game_state.json()  # 5 minutes TTL
                )
                return game_state

        except Exception as e:
            logger.error(f"Error getting game state for {game_id}: {str(e)}")

        return None

    async def update_game_state(self, game_id: str, update: GameUpdate):
        try:
            # Update database
            game = await Game.get(game_id)
            if game:
                if update.update_type == "shot":
                    game.last_shot = update.data.get("shot")
                    game.balls_remaining = update.data.get("balls_remaining")
                    game.current_player = update.data.get("next_player")
                elif update.update_type == "game_over":
                    game.status = "completed"
                    game.winner_id = update.data.get("winner_id")

                await game.save()

                # Update Redis cache
                game_state = await self._get_game_state(game_id)
                if game_state:
                    # Broadcast update to all connected clients
                    await self._broadcast_all(game_id, game_state.dict())

        except Exception as e:
            logger.error(f"Error updating game state for {game_id}: {str(e)}")
            raise

    async def send_error(self, game_id: str, player_id: str, error_message: str):
        error_data = {"type": "error", "message": error_message}
        # Send error to specific player
        for connection in self.active_connections.get(game_id, set()):
            if connection.player_id == player_id:
                await self.send_personal_message(error_data, connection.websocket)

    async def _handle_shot(self, game_state: GameState, action: PlayerAction):
        # Validate shot
        shot_data = action.data.get("shot", {})
        if not self._validate_shot(game_state, shot_data):
            await self.send_error(action.game_id, action.player_id, "Invalid shot")
            return

        # Process shot and update game state
        update = GameUpdate(
            game_id=action.game_id,
            update_type="shot",
            data={
                "shot": shot_data,
                "balls_remaining": self._calculate_remaining_balls(game_state, shot_data),
                "next_player": self._determine_next_player(game_state, shot_data), # This will be potentially overridden by referee result
            },
        )
        # await self.update_game_state(action.game_id, update) # Defer state update until after referee analysis

        # --- AI Referee Integration (for shot event) ---
        referee_result = None
        try:
            # Prepare input for AI Referee service
            referee_input = BackendRefereeInput(
                game_state=game_state.dict(), # Pass current game state as dictionary
                shot_data=shot_data,
                game_rules="standard_8ball", # TODO: Get actual game rules from game state
                current_player_id=action.player_id
            )

            # Call the AI Referee service for analysis
            referee_result = await ai_referee_service.analyze_shot(referee_input)

            if referee_result:
                logger.info(f"AI Referee analysis result for game {action.game_id}: Foul: {referee_result.foul}, Next Player: {referee_result.next_player_id}")
                
                # Update game state based on referee result
                update.data['foul'] = referee_result.foul # Add foul info to update
                update.data['foul_reason'] = referee_result.reason # Add foul reason
                update.data['is_ball_in_hand'] = referee_result.is_ball_in_hand # Add ball in hand status
                update.data['next_player'] = referee_result.next_player_id # Use referee's determined next player

                # TODO: Handle specific foul types and their consequences (e.g., point deductions, re-racks)
                # This might involve more complex game state modifications based on rules and the referee result.

            else:
                logger.warning(f"AI Referee analysis failed or returned no result for game {action.game_id}.")
                # TODO: Implement fallback logic if referee analysis fails

        except Exception as e:
            logger.error(f"Error during AI Referee analysis for game {action.game_id}: {str(e)}")
            # TODO: Implement error handling and potential fallback (e.g., default to no foul)

        # --- End AI Referee Integration ---

        # Update game state after potential modifications by referee result
        await self.update_game_state(action.game_id, update)

        # --- AI Commentary Integration (for shot event) ---
        # This block remains the same as before, ensuring commentary is generated after state update (including referee results)
        try:
            # Prepare data for commentary service (include relevant shot and game state info)
            # Pass the potentially updated game state to the commentary service
            updated_game_state = await self._get_game_state(action.game_id) # Fetch latest state after update
            if updated_game_state:
                event_data_for_commentary = {
                    'type': 'shot',
                    'game_id': action.game_id,
                    'player_id': action.player_id,
                    'shot': shot_data,
                    'game_state': updated_game_state.dict() # Pass updated game state
                    # Add other relevant data like fouls, score, etc. if available in updated_game_state
                }
                commentary = await ai_commentary_service.generate_commentary(event_data_for_commentary)

                if commentary:
                    # Emit commentary event to the game room
                    # The frontend LiveCommentary component is listening for 'commentary' event
                    await self._broadcast_all(action.game_id, {'type': 'commentary', 'data': commentary})
                    logger.info(f"Emitted commentary for game {action.game_id} after shot.")

        except Exception as e:
            logger.error(f"Error generating/emitting commentary after shot for game {action.game_id}: {str(e)}")
        # --- End AI Commentary Integration ---

    async def _handle_position_update(self, game_state: GameState, action: PlayerAction):
        update = GameUpdate(game_id=action.game_id, update_type="position", data=action.data)
        await self._broadcast_all(action.game_id, update.dict())

    async def _handle_chat(self, action: PlayerAction):
        chat_message = ChatMessage(
            game_id=action.game_id,
            player_id=action.player_id,
            message=action.data.get("message", ""),
        )
        await self._broadcast_all(action.game_id, chat_message.dict())

    def _validate_shot(self, game_state: GameState, shot_data: dict) -> bool:
        # Implement shot validation logic
        return True

    def _calculate_remaining_balls(self, game_state: GameState, shot_data: dict) -> List[int]:
        # Implement remaining balls calculation
        return game_state.balls_remaining

    def _determine_next_player(self, game_state: GameState, shot_data: dict) -> str:
        # Implement next player determination logic
        return (
            game_state.player2_id
            if game_state.current_player == game_state.player1_id
            else game_state.player1_id
        )


websocket_manager = WebSocketManager()
