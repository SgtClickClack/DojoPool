import pytest
import json
from datetime import datetime, timedelta
from flask import Flask
import os

# Assume fixtures like test_client, db_session, players, venue exist
# Need to adapt fixtures for API testing, especially authentication

from dojopool.app import create_app
from dojopool.core.extensions import db
from dojopool.models.user import User
from dojopool.models.venue import Venue
from dojopool.models.tournament import (
    Tournament, TournamentParticipant, TournamentMatch,
    TournamentStatus, TournamentFormat
)
from dojopool.services.tournament_service import TournamentService # May not be directly needed, but good for setup
from dojopool.routes.tournaments import tournament_bp

# --- Reusable Fixtures (Adapted for API tests) ---

@pytest.fixture
def app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SECRET_KEY'] = 'test-secret-key'
    
    db.init_app(app)
    app.register_blueprint(tournament_bp)
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def _create_test_user(username, email="test@example.com", password=None, is_admin=False):
    """Create a test user with secure password handling"""
    if password is None:
        password = os.getenv("TEST_USER_PASSWORD", "test_password_123")
    
    user = User(
        username=username,
        email=email,
        password_hash=password,  # In real tests, this should be hashed
        is_admin=is_admin
    )
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture(scope="module")
def test_app():
    """Create and configure a new app instance for each test module."""
    app = create_app(config_name="testing")
    app.config.update({"LOGIN_DISABLED": False}) # Ensure login is enabled for testing routes
    with app.app_context():
        db.create_all()
        yield app # provide the app for context
        db.drop_all()

@pytest.fixture(scope="module")
def test_client_module(test_app):
     """A test client for the app, scoped per module."""
     return test_app.test_client()


@pytest.fixture(scope="function", autouse=True)
def session_clear(test_app):
    """Clear database tables before each test function."""
    with test_app.app_context():
        # Use delete() for faster clearing if cascading isn't needed, or specific table clearing
        db.session.execute(db.text("DELETE FROM tournament_match"))
        db.session.execute(db.text("DELETE FROM tournament_participant"))
        db.session.execute(db.text("DELETE FROM tournament"))
        db.session.execute(db.text("DELETE FROM venue"))
        # Be careful clearing users if login state depends on it across requests
        # db.session.execute(db.text("DELETE FROM " + User.__tablename__))
        db.session.commit()
    yield

@pytest.fixture(scope="function")
def db_session(test_app):
     """Provides the application context and db session for function scope."""
     with test_app.app_context():
        yield db.session

# --- Authentication Helper ---
def login(client, username, password):
    """Logs in a user and returns the response."""
    return client.post('/auth/login', data=dict(
        username=username,
        password=password
    ), follow_redirects=True)

def logout(client):
    """Logs out the current user."""
    return client.get('/auth/logout', follow_redirects=True)


@pytest.fixture(scope="function")
def regular_user(db_session):
    """Create a regular, non-admin user."""
    return _create_test_user("testuser", "test@example.com", is_admin=False)

@pytest.fixture(scope="function")
def admin_user(db_session):
     """Create an admin user."""
     return _create_test_user("adminuser", "admin@example.com", is_admin=True)

@pytest.fixture
def players_api(db_session): # Rename to avoid conflict if used in same module later
    """Create some test players (for ID references)."""
    users = [
        _create_test_user(f"player{i}", f"player{i}@test.com") for i in range(1, 5)
    ]
    return users

@pytest.fixture
def venue_api(db_session): # Rename to avoid conflict
    """Create a test venue."""
    venue = Venue(name="Test Dojo API", address="456 Test Ave", city="Testburg", country="Testland")
    db.session.add(venue)
    db.session.commit()
    return venue

@pytest.fixture
def base_tournament_api_data(venue_api):
     """Base data for creating a tournament via API (uses strings)."""
     now = datetime.utcnow()
     return {
        "name": "API Test Tournament",
        "venue_id": venue_api.id,
        # Organizer ID often comes from logged-in user, not needed in POST data
        "start_date": (now + timedelta(days=1)).isoformat(),
        "end_date": (now + timedelta(days=2)).isoformat(),
        "registration_deadline": (now + timedelta(hours=12)).isoformat(),
        "max_participants": 8,
        "entry_fee": 10.0,
        "prize_pool": 100.0,
        "rules": "API Test Rules",
        "format": TournamentFormat.SINGLE_ELIMINATION.value
     }


# --- API Test Cases ---

# --- POST /api/tournaments/ ---

def test_create_tournament_api_success(test_client_module, regular_user, base_tournament_api_data):
    """Test successfully creating a tournament via API as a logged-in user."""
    login(test_client_module, regular_user.username, "password123")

    response = test_client_module.post("/api/tournaments/",
                                 data=json.dumps(base_tournament_api_data),
                                 content_type="application/json")

    assert response.status_code == 201
    data = response.get_json()
    assert data is not None
    assert data["name"] == base_tournament_api_data["name"]
    assert data["format"] == base_tournament_api_data["format"]
    assert data["id"] is not None

    # Verify in DB
    tournament = db.session.get(Tournament, data["id"])
    assert tournament is not None
    assert tournament.name == base_tournament_api_data["name"]

    logout(test_client_module)

def test_create_tournament_api_unauthorized(test_client_module, base_tournament_api_data):
    """Test creating a tournament when not logged in."""
    response = test_client_module.post("/api/tournaments/",
                                 data=json.dumps(base_tournament_api_data),
                                 content_type="application/json")
    # Expect redirect to login or 401 depending on Flask-Login config
    assert response.status_code in [302, 401]

def test_create_tournament_api_validation_error(test_client_module, regular_user, base_tournament_api_data):
    """Test creating a tournament with invalid data."""
    login(test_client_module, regular_user.username, "password123")

    invalid_data = base_tournament_api_data.copy()
    del invalid_data["name"] # Missing required field
    invalid_data["start_date"] = "not-a-date"

    response = test_client_module.post("/api/tournaments/",
                                 data=json.dumps(invalid_data),
                                 content_type="application/json")

    assert response.status_code == 400
    data = response.get_json()
    assert "errors" in data
    assert "name" in data["errors"] # Check for specific field errors
    # Add check for date format error if validator returns it

    logout(test_client_module)

# --- GET /api/tournaments/ --- #

def test_get_tournaments_api_list(test_client_module, db_session, base_tournament_api_data):
    """Test listing all tournaments."""
    # Create some tournaments with different statuses
    t1_data = {**base_tournament_api_data, "name": "T1", "status": TournamentStatus.PENDING.value}
    t2_data = {**base_tournament_api_data, "name": "T2", "status": TournamentStatus.IN_PROGRESS.value}
    t3_data = {**base_tournament_api_data, "name": "T3", "status": TournamentStatus.COMPLETED.value}

    # Need to convert dates back for model creation if helper not used
    for t_data in [t1_data, t2_data, t3_data]:
        t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
        t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
        t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
        db.session.add(Tournament(**t_data))
    db.session.commit()

    response = test_client_module.get("/api/tournaments/")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 3
    assert {t["name"] for t in data} == {"T1", "T2", "T3"}

def test_get_tournaments_api_filter_active(test_client_module, db_session, base_tournament_api_data):
    """Test listing only active tournaments using status filter."""
     # Create some tournaments with different statuses
    t1_data = {**base_tournament_api_data, "name": "T1 Pending", "status": TournamentStatus.PENDING.value}
    t2_data = {**base_tournament_api_data, "name": "T2 InProgress", "status": TournamentStatus.IN_PROGRESS.value}
    t3_data = {**base_tournament_api_data, "name": "T3 Completed", "status": TournamentStatus.COMPLETED.value}
    t4_data = {**base_tournament_api_data, "name": "T4 Registration", "status": TournamentStatus.REGISTRATION.value}

    for t_data in [t1_data, t2_data, t3_data, t4_data]:
        t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
        t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
        t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
        db.session.add(Tournament(**t_data))
    db.session.commit()

    response = test_client_module.get("/api/tournaments/?status=active") # Query param
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 2 # Should be InProgress and Registration
    active_names = {t["name"] for t in data}
    assert "T1 Pending" not in active_names
    assert "T2 InProgress" in active_names
    assert "T3 Completed" not in active_names
    assert "T4 Registration" in active_names

# Add tests for other endpoints: GET /<id>, POST /<id>/register, POST /<id>/start, etc.

# --- GET /api/tournaments/<id> --- #

def test_get_tournament_api_success(test_client_module, db_session, base_tournament_api_data):
    """Test getting specific tournament details."""
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()

    response = test_client_module.get(f"/api/tournaments/{tournament.id}")
    assert response.status_code == 200
    data = response.get_json()
    assert data is not None
    assert data["id"] == tournament.id
    assert data["name"] == tournament.name
    assert data["format"] == tournament.format.value

def test_get_tournament_api_not_found(test_client_module):
    """Test getting a non-existent tournament."""
    response = test_client_module.get("/api/tournaments/99999")
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data
    assert "not found" in data["error"].lower()

# --- POST /api/tournaments/<id>/register --- #

def test_register_player_api_success(test_client_module, db_session, regular_user, base_tournament_api_data):
    """Test registering the logged-in user for a tournament via API."""
    # Create tournament
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()

    login(test_client_module, regular_user.username, "password123")

    response = test_client_module.post(f"/api/tournaments/{tournament.id}/register")

    assert response.status_code == 200 # Changed from 201 based on route code
    data = response.get_json()
    assert "message" in data
    assert "Successfully registered" in data["message"]

    # Verify in DB
    participant = db_session.query(TournamentParticipant).filter_by(
        tournament_id=tournament.id,
        user_id=regular_user.id
    ).first()
    assert participant is not None
    assert participant.status == 'registered'

    logout(test_client_module)

def test_register_player_api_unauthorized(test_client_module, db_session, base_tournament_api_data):
    """Test registering when not logged in."""
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()

    response = test_client_module.post(f"/api/tournaments/{tournament.id}/register")
    assert response.status_code in [302, 401]

def test_register_player_api_already_registered(test_client_module, db_session, regular_user, base_tournament_api_data, tournament_service):
    """Test registering via API when already registered."""
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()

    # Register once via service
    tournament_service.register_player(tournament.id, regular_user.id)

    login(test_client_module, regular_user.username, "password123")
    response = test_client_module.post(f"/api/tournaments/{tournament.id}/register")

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "already registered" in data["error"].lower()

    logout(test_client_module)

def test_register_player_api_tournament_full(test_client_module, db_session, regular_user, players_api, base_tournament_api_data, tournament_service):
    """Test registering via API for a full tournament."""
    t_data = base_tournament_api_data.copy()
    t_data["max_participants"] = 2
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()

    # Fill the tournament using other players
    tournament_service.register_player(tournament.id, players_api[0].id)
    tournament_service.register_player(tournament.id, players_api[1].id)

    login(test_client_module, regular_user.username, "password123")
    response = test_client_module.post(f"/api/tournaments/{tournament.id}/register")

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "full" in data["error"].lower()

    logout(test_client_module)

def test_register_player_api_wrong_status(test_client_module, db_session, regular_user, base_tournament_api_data):
    """Test registering via API for a tournament not open for registration."""
    t_data = base_tournament_api_data.copy()
    t_data["status"] = TournamentStatus.IN_PROGRESS.value
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()

    login(test_client_module, regular_user.username, "password123")
    response = test_client_module.post(f"/api/tournaments/{tournament.id}/register")

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "not open for registration" in data["error"].lower()

    logout(test_client_module)

def test_register_player_api_deadline_passed(test_client_module, db_session, regular_user, base_tournament_api_data):
    """Test registering via API after the deadline."""
    t_data = base_tournament_api_data.copy()
    t_data["registration_deadline"] = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()

    login(test_client_module, regular_user.username, "password123")
    response = test_client_module.post(f"/api/tournaments/{tournament.id}/register")

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "deadline has passed" in data["error"].lower()

    logout(test_client_module)

# Add tests for POST /<id>/start, POST /<id>/matches/<match_id>/complete, etc.

# --- POST /api/tournaments/<id>/start --- #

def test_start_tournament_api_success(test_client_module, db_session, admin_user, players_api, base_tournament_api_data, tournament_service):
    """Test starting a tournament via API as admin."""
    # Create tournament
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()

    # Register players
    tournament_service.register_player(tournament.id, players_api[0].id)
    tournament_service.register_player(tournament.id, players_api[1].id)

    login(test_client_module, admin_user.username, "password123")
    response = test_client_module.post(f"/api/tournaments/{tournament.id}/start")

    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == TournamentStatus.IN_PROGRESS.value

    # Verify in DB
    db_session.refresh(tournament)
    assert tournament.status == TournamentStatus.IN_PROGRESS.value
    # Verify matches were created
    matches = db_session.query(TournamentMatch).filter_by(tournament_id=tournament.id).count()
    assert matches > 0

    logout(test_client_module)

def test_start_tournament_api_forbidden(test_client_module, db_session, regular_user, players_api, base_tournament_api_data, tournament_service):
    """Test starting a tournament as a non-admin user."""
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()
    tournament_service.register_player(tournament.id, players_api[0].id)
    tournament_service.register_player(tournament.id, players_api[1].id)

    login(test_client_module, regular_user.username, "password123")
    response = test_client_module.post(f"/api/tournaments/{tournament.id}/start")

    assert response.status_code == 403 # Expect Forbidden

    logout(test_client_module)

def test_start_tournament_api_wrong_status(test_client_module, db_session, admin_user, players_api, base_tournament_api_data, tournament_service):
    """Test starting a tournament that is already in progress."""
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()
    tournament_service.register_player(tournament.id, players_api[0].id)
    tournament_service.register_player(tournament.id, players_api[1].id)
    # Start it once via service
    tournament_service.start_tournament(tournament.id)
    db_session.refresh(tournament)
    assert tournament.status == TournamentStatus.IN_PROGRESS.value

    login(test_client_module, admin_user.username, "password123")
    response = test_client_module.post(f"/api/tournaments/{tournament.id}/start")

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "cannot be started" in data["error"].lower()

    logout(test_client_module)

# --- POST /api/tournaments/<id>/matches/<match_id>/complete --- #

def test_complete_match_api_success(test_client_module, db_session, admin_user, players_api, base_tournament_api_data, tournament_service):
    """Test completing a match via API as admin."""
    # Setup started tournament
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()
    tournament_service.register_player(tournament.id, players_api[0].id)
    tournament_service.register_player(tournament.id, players_api[1].id)
    tournament_service.start_tournament(tournament.id)
    match = db_session.query(TournamentMatch).filter_by(tournament_id=tournament.id).first()
    assert match is not None
    assert match.status == TournamentStatus.PENDING.value # Should be pending/scheduled after start

    winner_id = players_api[0].id
    score = "7-5"
    payload = {"winner_id": winner_id, "score": score}

    login(test_client_module, admin_user.username, "password123")
    response = test_client_module.post(f"/api/tournaments/{tournament.id}/matches/{match.id}/complete",
                                     data=json.dumps(payload),
                                     content_type="application/json")

    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == TournamentStatus.COMPLETED.value
    assert data["winner_id"] == winner_id
    assert data["score"] == score

    # Verify in DB
    db_session.refresh(match)
    assert match.status == TournamentStatus.COMPLETED.value
    assert match.winner_id == winner_id
    assert match.score == score

    logout(test_client_module)

def test_complete_match_api_forbidden(test_client_module, db_session, regular_user, players_api, base_tournament_api_data, tournament_service):
    """Test completing a match as a non-admin user."""
    tournament = Tournament(**base_tournament_api_data)
    db_session.add(tournament)
    db_session.commit()
    tournament_service.register_player(tournament.id, players_api[0].id)
    tournament_service.register_player(tournament.id, players_api[1].id)
    tournament_service.start_tournament(tournament.id)
    match = db_session.query(TournamentMatch).filter_by(tournament_id=tournament.id).first()

    payload = {"winner_id": players_api[0].id, "score": "1-0"}

    login(test_client_module, regular_user.username, "password123")
    response = test_client_module.post(f"/api/tournaments/{tournament.id}/matches/{match.id}/complete",
                                     data=json.dumps(payload),
                                     content_type="application/json")

    assert response.status_code == 403

    logout(test_client_module)

def test_complete_match_api_missing_data(test_client_module, db_session, admin_user, players_api, base_tournament_api_data, tournament_service):
    """Test completing a match with missing winner_id or score."""
    tournament = Tournament(**base_tournament_api_data)
    db_session.add(tournament)
    db_session.commit()
    tournament_service.register_player(tournament.id, players_api[0].id)
    tournament_service.register_player(tournament.id, players_api[1].id)
    tournament_service.start_tournament(tournament.id)
    match = db_session.query(TournamentMatch).filter_by(tournament_id=tournament.id).first()

    login(test_client_module, admin_user.username, "password123")

    # Missing score
    payload1 = {"winner_id": players_api[0].id}
    response1 = test_client_module.post(f"/api/tournaments/{tournament.id}/matches/{match.id}/complete",
                                      data=json.dumps(payload1),
                                      content_type="application/json")
    assert response1.status_code == 400
    assert "score are required" in response1.get_json()["error"]

    # Missing winner_id
    payload2 = {"score": "1-0"}
    response2 = test_client_module.post(f"/api/tournaments/{tournament.id}/matches/{match.id}/complete",
                                      data=json.dumps(payload2),
                                      content_type="application/json")
    assert response2.status_code == 400
    assert "Winner ID and score are required" in response2.get_json()["error"]

    logout(test_client_module)

def test_complete_match_api_invalid_winner(test_client_module, db_session, admin_user, players_api, base_tournament_api_data, tournament_service):
    """Test completing a match with a winner_id not in the match."""
    tournament = Tournament(**base_tournament_api_data)
    db_session.add(tournament)
    db_session.commit()
    tournament_service.register_player(tournament.id, players_api[0].id) # P1
    tournament_service.register_player(tournament.id, players_api[1].id) # P2
    tournament_service.start_tournament(tournament.id)
    match = db_session.query(TournamentMatch).filter_by(tournament_id=tournament.id).first()
    # Match should be P1 vs P2
    assert {match.player1_id, match.player2_id} == {players_api[0].id, players_api[1].id}

    invalid_winner_id = players_api[2].id # P3 is not in this match
    payload = {"winner_id": invalid_winner_id, "score": "1-0"}

    login(test_client_module, admin_user.username, "password123")
    response = test_client_module.post(f"/api/tournaments/{tournament.id}/matches/{match.id}/complete",
                                     data=json.dumps(payload),
                                     content_type="application/json")

    assert response.status_code == 400
    assert "Winner ID is not one of the players" in response.get_json()["error"]

    logout(test_client_module)

# Add tests for GET /<id>/standings, GET /player/<id>, PUT /<id>, POST /<id>/cancel

# --- GET /api/tournaments/<id>/standings --- #

def test_get_standings_api_completed(test_client_module, db_session, players_api, base_tournament_api_data, tournament_service):
    """Test getting standings for a completed tournament."""
    # Setup completed tournament
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()
    tournament_service.register_player(tournament.id, players_api[0].id) # P1
    tournament_service.register_player(tournament.id, players_api[1].id) # P2
    tournament_service.start_tournament(tournament.id)
    match = db_session.query(TournamentMatch).filter_by(tournament_id=tournament.id).first()
    tournament_service.complete_match(tournament.id, match.id, players_api[0].id, "1-0") # P1 wins

    response = test_client_module.get(f"/api/tournaments/{tournament.id}/standings")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 2
    # Based on placeholder implementation, check rank/order
    assert data[0]["rank"] == 1
    assert data[0]["player_id"] == players_api[0].id
    assert data[1]["rank"] == 2
    assert data[1]["player_id"] == players_api[1].id

def test_get_standings_api_in_progress(test_client_module, db_session, players_api, base_tournament_api_data, tournament_service):
    """Test getting standings for an in-progress tournament."""
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()
    tournament_service.register_player(tournament.id, players_api[0].id) # P1
    tournament_service.register_player(tournament.id, players_api[1].id) # P2
    tournament_service.start_tournament(tournament.id)

    response = test_client_module.get(f"/api/tournaments/{tournament.id}/standings")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 2
    # Placeholder returns basic info with no rank for in-progress
    assert data[0]["rank"] is None
    assert data[0]["player_id"] in [players_api[0].id, players_api[1].id]
    assert data[1]["rank"] is None

def test_get_standings_api_not_found(test_client_module):
    """Test getting standings for non-existent tournament."""
    response = test_client_module.get("/api/tournaments/99999/standings")
    assert response.status_code == 404 # Service uses get_or_404

# --- GET /api/tournaments/player/<player_id> --- #

def test_get_player_tournaments_api(test_client_module, db_session, players_api, base_tournament_api_data, tournament_service):
    """Test retrieving tournaments for a specific player via API."""
    # Player 1 participates in T1 and T3
    # Player 2 participates in T2
    t1_data = {**base_tournament_api_data, "name": "T1"}
    t2_data = {**base_tournament_api_data, "name": "T2"}
    t3_data = {**base_tournament_api_data, "name": "T3"}

    for t_data in [t1_data, t2_data, t3_data]:
        t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
        t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
        t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
        db.session.add(Tournament(**t_data))
    db.session.commit()

    t1 = db.session.query(Tournament).filter_by(name="T1").first()
    t2 = db.session.query(Tournament).filter_by(name="T2").first()
    t3 = db.session.query(Tournament).filter_by(name="T3").first()

    tournament_service.register_player(t1.id, players_api[0].id)
    tournament_service.register_player(t2.id, players_api[1].id)
    tournament_service.register_player(t3.id, players_api[0].id)

    # Test for Player 1
    response1 = test_client_module.get(f"/api/tournaments/player/{players_api[0].id}")
    assert response1.status_code == 200
    data1 = response1.get_json()
    assert isinstance(data1, list)
    assert len(data1) == 2
    assert {t["id"] for t in data1} == {t1.id, t3.id}

    # Test for Player 2
    response2 = test_client_module.get(f"/api/tournaments/player/{players_api[1].id}")
    assert response2.status_code == 200
    data2 = response2.get_json()
    assert isinstance(data2, list)
    assert len(data2) == 1
    assert data2[0]["id"] == t2.id

    # Test for Player 3 (no tournaments)
    response3 = test_client_module.get(f"/api/tournaments/player/{players_api[2].id}")
    assert response3.status_code == 200
    data3 = response3.get_json()
    assert isinstance(data3, list)
    assert len(data3) == 0

    # Test for non-existent player ID (should return empty list)
    response4 = test_client_module.get("/api/tournaments/player/99999")
    assert response4.status_code == 200
    data4 = response4.get_json()
    assert isinstance(data4, list)
    assert len(data4) == 0

# --- PUT /api/tournaments/<id> --- #

def test_update_tournament_api_success(test_client_module, db_session, regular_user, base_tournament_api_data):
    """Test updating a tournament via API (as logged-in user)."""
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()

    login(test_client_module, regular_user.username, "password123")

    update_payload = {"name": "Updated via API", "entry_fee": 50.0}
    response = test_client_module.put(f"/api/tournaments/{tournament.id}",
                                    data=json.dumps(update_payload),
                                    content_type="application/json")

    assert response.status_code == 200
    assert "Tournament updated successfully" in response.get_json()["message"]

    # Verify in DB
    db_session.refresh(tournament)
    assert tournament.name == "Updated via API"
    assert tournament.entry_fee == 50.0

    logout(test_client_module)

def test_update_tournament_api_unauthorized(test_client_module, db_session, base_tournament_api_data):
    """Test updating tournament when not logged in."""
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()

    update_payload = {"name": "Update Fail"}
    response = test_client_module.put(f"/api/tournaments/{tournament.id}",
                                    data=json.dumps(update_payload),
                                    content_type="application/json")
    assert response.status_code in [302, 401]

def test_update_tournament_api_wrong_status(test_client_module, db_session, regular_user, players_api, base_tournament_api_data, tournament_service):
    """Test updating tournament that is IN_PROGRESS."""
    # Setup started tournament
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()
    tournament_service.register_player(tournament.id, players_api[0].id)
    tournament_service.register_player(tournament.id, players_api[1].id)
    tournament_service.start_tournament(tournament.id)

    login(test_client_module, regular_user.username, "password123")
    update_payload = {"name": "Update Fail"}
    response = test_client_module.put(f"/api/tournaments/{tournament.id}",
                                    data=json.dumps(update_payload),
                                    content_type="application/json")

    assert response.status_code == 400
    assert "Cannot update tournament in status" in response.get_json()["error"]
    logout(test_client_module)

# --- POST /api/tournaments/<id>/cancel --- #

def test_cancel_tournament_api_success(test_client_module, db_session, regular_user, base_tournament_api_data):
    """Test cancelling a PENDING tournament via API."""
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()

    login(test_client_module, regular_user.username, "password123")
    response = test_client_module.post(f"/api/tournaments/{tournament.id}/cancel")

    assert response.status_code == 200
    assert "Tournament cancelled successfully" in response.get_json()["message"]

    # Verify in DB
    db_session.refresh(tournament)
    assert tournament.status == TournamentStatus.CANCELLED.value
    logout(test_client_module)

def test_cancel_tournament_api_unauthorized(test_client_module, db_session, base_tournament_api_data):
    """Test cancelling tournament when not logged in."""
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()

    response = test_client_module.post(f"/api/tournaments/{tournament.id}/cancel")
    assert response.status_code in [302, 401]

def test_cancel_tournament_api_wrong_status(test_client_module, db_session, regular_user, players_api, base_tournament_api_data, tournament_service):
    """Test cancelling tournament that is IN_PROGRESS."""
    t_data = base_tournament_api_data.copy()
    t_data["start_date"] = datetime.fromisoformat(t_data["start_date"])
    t_data["end_date"] = datetime.fromisoformat(t_data["end_date"])
    t_data["registration_deadline"] = datetime.fromisoformat(t_data["registration_deadline"])
    tournament = Tournament(**t_data)
    db_session.add(tournament)
    db_session.commit()
    tournament_service.register_player(tournament.id, players_api[0].id)
    tournament_service.register_player(tournament.id, players_api[1].id)
    tournament_service.start_tournament(tournament.id)

    login(test_client_module, regular_user.username, "password123")
    response = test_client_module.post(f"/api/tournaments/{tournament.id}/cancel")

    assert response.status_code == 400
    assert "Cannot cancel tournament in status" in response.get_json()["error"]
    logout(test_client_module) 