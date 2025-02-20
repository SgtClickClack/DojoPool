from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Request, Response, current_app, jsonify, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from ..auth import is_admin, require_auth
from .manager import Experiment, ExperimentManager
from .metrics import MetricEvent, MetricsCollector

def admin_required(
    f: Callable[..., ResponseReturnValue],
) -> Callable[..., ResponseReturnValue]: ...
def list_experiments() -> ResponseReturnValue: ...
def create_experiment() -> ResponseReturnValue: ...
def get_experiment_metrics(experiment_id: str) -> ResponseReturnValue: ...
def track_event(experiment_id: str) -> ResponseReturnValue: ...
def get_assignment(experiment_id: str) -> ResponseReturnValue: ...
