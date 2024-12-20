import pytest
from datetime import datetime, timedelta
from src.models.match import Match
from src.models.location import Location

def test_match_creation(db_session, user_factory, location_factory):
    """Test basic match creation."""
    player1 = user_factory()
    player2 = user_factory()
    location = location_factory()
    
    scheduled_time = datetime.now() + timedelta(days=1)
    match = Match(
        player1=player1,
        player2=player2,
        location=location,
        scheduled_time=scheduled_time,
        game_type="eight_ball"
    )
    db_session.add(match)
    db_session.commit()

    assert match.id is not None
    assert match.player1_id == player1.id
    assert match.player2_id == player2.id
    assert match.location_id == location.id
    assert match.scheduled_time == scheduled_time
    assert match.status == "scheduled"
    assert match.game_type == "eight_ball"

def test_match_status_transitions(db_session, user_factory, location_factory):
    """Test match status transitions."""
    match = Match(
        player1=user_factory(),
        player2=user_factory(),
        location=location_factory(),
        scheduled_time=datetime.now() + timedelta(days=1)
    )
    db_session.add(match)
    db_session.commit()

    # Test valid transitions
    valid_transitions = [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled"
    ]

    for status in valid_transitions:
        match.status = status
        db_session.commit()
        assert match.status == status

    # Test invalid transition
    with pytest.raises(ValueError):
        match.status = "invalid_status"

def test_match_validation(db_session, user_factory, location_factory):
    """Test match validation rules."""
    player1 = user_factory()
    player2 = user_factory()
    location = location_factory()

    # Test past scheduled time
    with pytest.raises(ValueError):
        Match(
            player1=player1,
            player2=player2,
            location=location,
            scheduled_time=datetime.now() - timedelta(days=1)
        )

    # Test same player
    with pytest.raises(ValueError):
        Match(
            player1=player1,
            player2=player1,
            location=location,
            scheduled_time=datetime.now() + timedelta(days=1)
        )

def test_match_confirmation(db_session, user_factory, location_factory):
    """Test match confirmation process."""
    player1 = user_factory()
    player2 = user_factory()
    location = location_factory()
    
    match = Match(
        player1=player1,
        player2=player2,
        location=location,
        scheduled_time=datetime.now() + timedelta(days=1)
    )
    db_session.add(match)
    db_session.commit()

    # Test player confirmations
    match.confirm_player(player1)
    assert match.player1_confirmed is True
    assert match.player2_confirmed is False
    assert match.status == "scheduled"

    match.confirm_player(player2)
    assert match.player1_confirmed is True
    assert match.player2_confirmed is True
    assert match.status == "confirmed"

def test_match_cancellation(db_session, user_factory, location_factory):
    """Test match cancellation."""
    match = Match(
        player1=user_factory(),
        player2=user_factory(),
        location=location_factory(),
        scheduled_time=datetime.now() + timedelta(days=1)
    )
    db_session.add(match)
    db_session.commit()

    reason = "Schedule conflict"
    match.cancel(reason)
    
    assert match.status == "cancelled"
    assert match.cancellation_reason == reason
    assert match.cancelled_at is not None

def test_match_completion(db_session, user_factory, location_factory):
    """Test match completion process."""
    player1 = user_factory()
    player2 = user_factory()
    
    match = Match(
        player1=player1,
        player2=player2,
        location=location_factory(),
        scheduled_time=datetime.now() + timedelta(days=1),
        status="in_progress"
    )
    db_session.add(match)
    db_session.commit()

    # Complete match
    match.complete(winner=player1, player1_score=7, player2_score=5)
    
    assert match.status == "completed"
    assert match.winner_id == player1.id
    assert match.player1_score == 7
    assert match.player2_score == 5
    assert match.completed_at is not None

def test_match_serialization(db_session, user_factory, location_factory):
    """Test match serialization to dict."""
    player1 = user_factory()
    player2 = user_factory()
    location = location_factory()
    scheduled_time = datetime.now() + timedelta(days=1)
    
    match = Match(
        player1=player1,
        player2=player2,
        location=location,
        scheduled_time=scheduled_time,
        game_type="eight_ball",
        status="confirmed"
    )
    db_session.add(match)
    db_session.commit()

    match_dict = match.to_dict()
    
    assert match_dict["id"] == match.id
    assert match_dict["player1"]["id"] == player1.id
    assert match_dict["player2"]["id"] == player2.id
    assert match_dict["location"]["id"] == location.id
    assert match_dict["scheduled_time"] == scheduled_time.isoformat()
    assert match_dict["game_type"] == "eight_ball"
    assert match_dict["status"] == "confirmed"

def test_match_notifications(db_session, user_factory, location_factory):
    """Test match notification triggers."""
    player1 = user_factory()
    player2 = user_factory()
    location = location_factory()
    
    match = Match(
        player1=player1,
        player2=player2,
        location=location,
        scheduled_time=datetime.now() + timedelta(days=1)
    )
    db_session.add(match)
    db_session.commit()

    # Test notification on status change
    notifications = match.get_pending_notifications()
    assert len(notifications) > 0
    assert any(n.user_id == player1.id for n in notifications)
    assert any(n.user_id == player2.id for n in notifications) 