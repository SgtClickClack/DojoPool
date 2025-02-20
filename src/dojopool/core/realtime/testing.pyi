from contextlib import contextmanager
from typing import Any, Callable, Dict, List, Optional
from unittest.mock import patch

from flask_socketio import SocketIO

from .errors import WebSocketError

class MockWebSocketClient:
    pass

class GameTestClient(MockWebSocketClient):
    pass

class TournamentTestClient(MockWebSocketClient):
    pass
