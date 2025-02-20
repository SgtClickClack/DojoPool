"""
Unit tests for the Match Module.
"""

from datetime import datetime

import pytest

from dojopool.models.match import Match


# Dummy user class for testing purposes.
class DummyUser:
    def __init__(self, username: str) -> None:
        self.username = username


@pytest.fixture
def dummy_users():
    user1 = DummyUser("Alice")
    user2 = DummyUser("Bob")
    return user1, user2


@pytest.fixture
def dummy_match(dummy_users):
    user1, user2 = dummy_users
    match = Match()
    # Simulate a Match instance with dummy user objects.
    # Note: In a real test with Flask-SQLAlchemy, these would be actual model instances.
    match.id = 1
    match.player1 = user1
    match.player2 = user2
    match.player1_score = 5
    match.player2_score = 3
    match.played_at = datetime(2023, 1, 1)
    return match


def test_match_repr(dummy_match):
    rep = repr(dummy_match)
    assert "Alice" in rep
    assert "Bob" in rep
    assert "Match" in rep
