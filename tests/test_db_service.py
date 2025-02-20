"""
Unit tests for the DB Service Module.
"""

from typing import Any, List

import pytest

from dojopool.core.services.db_service import DBService


# Dummy model for testing
class DummyModel:
    def __init__(self, id: int, value: str) -> None:
        self.id = id
        self.value = value

    def __eq__(self, other: Any):
        return (
            isinstance(other, DummyModel)
            and self.id == other.id
            and self.value == other.value
        )


# Dummy Query class to simulate SQLAlchemy's query functionality
class DummyQuery:
    def __init__(self, data: List[Any]):
        self.data = data

    def filter(self, *args: Any, **kwargs: Any):
        # Simply return self for dummy purposes
        return self

    def all(self) -> List[Any]:
        return self.data


# Dummy Session class to simulate SQLAlchemy's Session
class DummySession:
    def __init__(self, data: List[Any]):
        self.data = data

    def query(self, model: Any):
        return DummyQuery(self.data)

    def get(self, model: Any, record_id: int):
        for record in self.data:
            if record.id == record_id:
                return record
        return None

    def rollback(self) -> None:
        # No operation needed for the dummy session
        pass


@pytest.fixture
def dummy_data():
    return [
        DummyModel(1, "test1"),
        DummyModel(2, "test2"),
        DummyModel(3, "test3"),
    ]


@pytest.fixture
def dummy_session(dummy_data: List[DummyModel]):
    return DummySession(dummy_data)


def test_fetch_all(dummy_session: DummySession, dummy_data: List[DummyModel]):
    db_service = DBService(dummy_session)
    results = db_service.fetch_all(DummyModel)
    assert results == dummy_data


def test_fetch_by_id_found(dummy_session: DummySession) -> None:
    db_service = DBService(dummy_session)
    result = db_service.fetch_by_id(DummyModel, 2)
    assert result is not None
    assert result.id == 2


def test_fetch_by_id_not_found(dummy_session: DummySession):
    db_service = DBService(dummy_session)
    result = db_service.fetch_by_id(DummyModel, 99)
    assert result is None
