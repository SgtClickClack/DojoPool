from datetime import datetime
from typing import List, Optional

from fastapi import WebSocket
from pydantic import BaseModel


class PlayerConnection:
    def __init__(self, websocket: WebSocket, player_id: str):
        self.websocket = websocket
        self.player_id = player_id


class GameState(BaseModel):
    game_id: str
    status: str
    current_player: Optional[str]
    player1_id: str
    player2_id: str
    balls_remaining: List[int]
    last_shot: Optional[dict]
    winner_id: Optional[str]
    updated_at: datetime = datetime.utcnow()


class GameUpdate(BaseModel):
    game_id: str
    update_type: str
    data: dict
    timestamp: datetime = datetime.utcnow()


class PlayerAction(BaseModel):
    game_id: str
    player_id: str
    action_type: str
    data: dict
    timestamp: datetime = datetime.utcnow()


class ChatMessage(BaseModel):
    game_id: str
    player_id: str
    message: str
    timestamp: datetime = datetime.utcnow()


class ConnectionStatus(BaseModel):
    game_id: str
    player_id: str
    status: str  # "connected" or "disconnected"
    timestamp: datetime = datetime.utcnow()
