import json
import logging
import re
import time
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from logging import RotatingFileHandler
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app, g, request
from flask.typing import ResponseReturnValue
from prometheus_client import Counter, Histogram
from werkzeug.wrappers import Response as WerkzeugResponse

from ...utils.monitoring import REGISTRY
from ..security.threat_detection import threat_detector
from ..security.types import SecurityEvent, SecuritySeverity, ThreatEvent
from . import security_config as config

class SecurityEventType(Enum):
    pass

class SecuritySeverity(Enum):
    pass

class SecurityEvent:
    pass

class SecurityMonitor:
    pass

def init_security_monitoring(app) -> None: ...
