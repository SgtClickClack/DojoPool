import logging
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..auth.jwt import verify_token
from ..database.models import Game, User
from .handler import websocket_manager
from .models import PlayerAction
