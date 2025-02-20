import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from src.app import create_app
from src.core.extensions import db
from src.core.models import Game, Tournament, User, Venue

from dojopool.core.database import get_db_session

def seed_database() -> None: ...
