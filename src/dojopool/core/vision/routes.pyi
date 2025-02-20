from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Request, Response, current_app, g, jsonify, request
from flask.typing import ResponseReturnValue
from flask_login import login_required
from werkzeug.wrappers import Response as WerkzeugResponse

from ..auth.utils import admin_required
from .ball_tracker import BallTracker
from .bridge import VisionGameBridge
from .camera import CameraConfig, PoolCamera
from .game_tracker import GameTracker
from .monitor import GameMonitor

def init_vision_system() -> bool: ...
def setup_vision_system() -> None: ...
def calibrate_table(admin_user) -> ResponseReturnValue: ...
def track_game() -> ResponseReturnValue: ...
def stop_tracking() -> ResponseReturnValue: ...
def get_vision_status(admin_user) -> ResponseReturnValue: ...
