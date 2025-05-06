# Integration tests for achievement API endpoints.
#
# To run these tests and resolve imports correctly:
#   1. Run pytest from the project root (where manage.py or setup.py is located).
#   2. Ensure PYTHONPATH includes the project root directory.
#      Example: PYTHONPATH=$(pwd) pytest tests/integration/test_achievements_api.py
#
# This ensures that 'from dojopool...' imports resolve properly.

import pytest
from flask import g
from dojopool.app import create_app
from dojopool.core.extensions import db
from dojopool.models.achievements import Achievement, UserAchievement, AchievementCategory

@pytest.fixture(scope="module")
def test_client():
    app = create_app(testing=True)
    with app.app_context():
        db.create_all()
        # Create a sample category, achievement, and user achievement
        cat = AchievementCategory(name="General", description="General achievements")
        db.session.add(cat)
        db.session.commit()
        ach = Achievement(
            name="Test Achievement",
            description="Test desc",
            category_id=cat.id,
            points=5,
            has_progress=True,
            target_value=2,
            progress_description="Do something twice",
            is_secret=False,
            conditions={}
        )
        db.session.add(ach)
        db.session.commit()
        ua = UserAchievement(user_id=1, achievement_id=ach.id)
        db.session.add(ua)
        db.session.commit()
        yield app.test_client()
        db.drop_all()

# Helper to mock authentication and g.user_id
def login_context(client, user_id=1):
    # Flask's test_request_context can be used to set g.user_id
    from flask import _request_ctx_stack
    ctx = client.application.test_request_context()
    ctx.push()
    g.user_id = user_id
    return ctx

def test_get_achievements(test_client):
    client = test_client
    with login_context(client, user_id=1):
        response = client.get("/achievements/")
        assert response.status_code == 200
        data = response.get_json()
        assert "achievements" in data
        assert isinstance(data["achievements"], list)

def test_get_achievement_progress(test_client):
    client = test_client
    with login_context(client, user_id=1):
        response = client.get("/achievements/progress")
        assert response.status_code == 200
        data = response.get_json()
        assert "total_achievements" in data
        assert "unlocked_achievements" in data
        assert "total_points" in data

def test_claim_achievement(test_client):
    client = test_client
    with login_context(client, user_id=1):
        response = client.post("/achievements/claim")
        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True 