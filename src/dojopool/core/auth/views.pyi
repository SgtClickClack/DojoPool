from typing import Any, Dict, Optional, Union

from flask import (
    Blueprint,
    Response,
    flash,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import generate_password_hash

from ...models.user import User
from ..database import db_session
from ..email import send_password_reset_email, send_verification_email
from ..security import get_token, verify_token
from . import auth_service

def wants_json_response() -> bool: ...
def register() -> Union[str, Response]: ...
def login() -> Union[str, Response]: ...
def logout() -> Response: ...
def reset_password_request() -> Union[str, Response]: ...
def reset_password(token: ...): ...
