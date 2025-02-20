from flask_login import current_user
from flask_socketio import emit, join_room, leave_room

from ..extensions import db
from ..models.match import Match as Game  # Use Match as Game for compatibility
from . import socketio
