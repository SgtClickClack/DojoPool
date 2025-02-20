from functools import wraps
from typing import Any, Callable, Dict, List, Optional, TypeVar, cast

from flask import Response, current_app, flash, redirect, request, url_for
from flask_login import current_user
from werkzeug.wrappers import Response as WerkzeugResponse

def login_required(f: ...): ...
def admin_required(f: ...): ...
def session_required(f: ...): ...
