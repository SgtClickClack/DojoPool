

import json
import queue
import threading
from datetime import datetime
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.extensions import redis_client

class EventManager:
    pass
    








        event_key: Any = f"event:{event_type}:{datetime.utcnow().timestamp()}"














