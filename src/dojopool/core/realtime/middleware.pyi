from functools import wraps
from typing import Any, Callable, Dict, Optional, Union

from flask import current_app, request
from flask_socketio import disconnect
from werkzeug.local import LocalProxy

from dojopool.core.auth import get_current_user
from dojopool.core.errors import SecurityError

class WebSocketMiddleware:
    pass
