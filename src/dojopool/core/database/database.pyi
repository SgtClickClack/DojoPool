import logging
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from uuid import UUID

from flask_sqlalchemy import SQLAlchemy  # type: ignore
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import DeclarativeMeta, Mapped, mapped_column, relationship

def init_db(app) -> None: ...

class Database:
    pass
