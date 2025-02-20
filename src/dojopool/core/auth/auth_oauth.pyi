from typing import Any, Dict, Optional

from authlib.integrations.flask_client import OAuth
from flask import current_app, g, url_for
from werkzeug.wrappers import Response as WerkzeugResponse

from ..extensions import db
from .models import User

def init_oauth(app: ...): ...

class OAuthService:
    pass
