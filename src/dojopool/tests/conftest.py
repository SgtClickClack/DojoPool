"Test configuration for DojoPool."

import os
import sys
from pathlib import Path
from typing import AsyncGenerator

import pytest
from flask import Flask
from sqlalchemy.ext.asyncio import AsyncSession

# Add the project root to Python path
project_root: str = str(Path(__file__).parent.parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from dojopool.core.extensions import Base, async_session, init_extensions


@pytest.fixture
async def app() -> Flask:
    """Create and configure a test Flask app."""
    app: Flask = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite+aiosqlite:///:memory:"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_ECHO"] = False

    init_extensions(app)
    return app


@pytest.fixture
async def db_session(app):
    """Create a new database session for a test."""
    async with async_session() as session:
        async with session.begin():
            await session.run_sync(Base.metadata.create_all)
        yield session
        async with session.begin():
            await session.run_sync(Base.metadata.drop_all)


@pytest.fixture
def client(app: Flask):
    """Create a test client."""
    return app.test_client()


@pytest.fixture
def runner(app: Flask):
    """Create a test CLI runner."""
    return app.test_cli_runner()
