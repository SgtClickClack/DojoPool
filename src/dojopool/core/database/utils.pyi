import os
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from uuid import UUID

from flask import Response, current_app
from flask.typing import ResponseReturnValue
from sqlalchemy import ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.wrappers import Response as WerkzeugResponse

from . import db
from .session import db_session

def backup_database(backup_path: ...): ...
def restore_database(backup_path: ...): ...
def check_connection() -> bool: ...
def get_table_sizes() -> List[Dict[str, Any]]: ...
