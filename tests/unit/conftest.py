"""Test configuration and fixtures for unit tests."""
import pytest
from datetime import datetime, timedelta
from sqlalchemy import event
from src.core.database import db, _make_scoped_session
from src.models import User, Role, Token
from tests.conftest import (
    app, _db, db_session, client, runner,
    test_user, test_token
)