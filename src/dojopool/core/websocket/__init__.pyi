from datetime import datetime
from typing import Any, Dict, List, Optional, Set

from flask_socketio import SocketIO, emit, join_room, leave_room

from dojopool.core.exceptions import WebSocketError
from dojopool.models import User

class WebSocketService:
    pass
