"""Database configuration and initialization."""

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from dojopool.core.extensions import db


class Base(DeclarativeBase):
    pass
