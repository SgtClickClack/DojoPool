from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from uuid import UUID

from flask import current_app, jsonify
from sqlalchemy import ForeignKey
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.exceptions import HTTPException

from ..logging.utils import log_error
from .exceptions import DojoPoolError

def init_app(app) -> Any: ...
