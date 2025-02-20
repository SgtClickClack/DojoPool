import logging
import os
from typing import Any, Dict, List, Optional, Tuple

import psutil
from flask import Blueprint, current_app, jsonify
from werkzeug.wrappers import Response

from dojopool.core.extensions import cache, db

def health_check() -> Response: ...
def metrics() -> Response: ...
