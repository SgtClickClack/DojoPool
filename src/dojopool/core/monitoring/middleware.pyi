import threading
import time
import uuid
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Set, Union

import structlog
from flask import Flask, Response, current_app, g, request
from flask.typing import ResponseReturnValue
from prometheus_client import Histogram, make_wsgi_app, start_http_server
from werkzeug.middleware.dispatcher import DispatcherMiddleware

from ...utils.monitoring import REGISTRY, REQUEST_COUNT, REQUEST_LATENCY
from .error_logger import ErrorSeverity, error_logger
from .monitoring_config import MetricsConfig, MetricsRegistry
from .security_monitor import security_monitor

def get_metrics() -> MetricsRegistry: ...

class MonitoringMiddleware:
    pass

def track_method_metrics(metrics: ...): ...
def setup_monitoring(app: ...): ...
def monitoring_middleware() -> Callable: ...
def init_monitoring(app: ...): ...
