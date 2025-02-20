import json
import logging
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, Optional, Set

import socketio
from aiohttp import web

class ConnectionState(Enum):
    pass

class SocketManagerOptions:
    pass

class SocketManager:
    pass
