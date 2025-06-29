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
from dojopool.extensions import db
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
        category_id_for_tests = cat.id # Store category ID

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
        achievement_id_for_tests = ach.id # Store achievement ID

        ua = UserAchievement(user_id=1, achievement_id=ach.id)
        db.session.add(ua)
        db.session.commit()
        # Yield the client, category_id, and achievement_id
        yield app.test_client(), category_id_for_tests, achievement_id_for_tests
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
    client, _, _ = test_client # Unpack client
    with login_context(client, user_id=1):
        response = client.get("/achievements/")
        assert response.status_code == 200
        data = response.get_json()
        assert "achievements" in data
        assert isinstance(data["achievements"], list)

def test_get_achievement_progress(test_client):
    client, _, _ = test_client # Unpack client
    with login_context(client, user_id=1):
        response = client.get("/achievements/progress")
        assert response.status_code == 200
        data = response.get_json()
        assert "total_achievements" in data
        assert "unlocked_achievements" in data
        assert "total_points" in data

def test_claim_achievement(test_client):
    client, _, _ = test_client # Unpack client
    with login_context(client, user_id=1):
        response = client.post("/achievements/claim")
        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True

def test_get_achievement_leaderboard(test_client):
    client, _, _ = test_client # Unpack client
    with login_context(client, user_id=1):
        response = client.get("/achievements/leaderboard")
        assert response.status_code == 200
        data = response.get_json()
        assert "leaderboard" in data
        assert isinstance(data["leaderboard"], list)
        # Further assertions can be made based on expected leaderboard structure 
        # and data from the test_client fixture setup if necessary. 

def test_admin_create_achievement(test_client):
    client, category_id, _ = test_client
    with login_context(client, user_id=1): # Assuming user_id=1 is an admin for this test
        payload = {
            "name": "Super Admin Achievement",
            "description": "Created via admin API.",
            "category_id": category_id,
            "points": 100,
            "has_progress": False,
            "target_value": 1,
            "progress_description": "N/A",
            "is_secret": False,
            "conditions": {}
        }
        response = client.post("/achievements/admin", json=payload)
        assert response.status_code == 201
        data = response.get_json()
        assert "achievement_id" in data
        assert data["name"] == "Super Admin Achievement"

        # Test with missing required fields
        bad_payload = {
            "name": "Incomplete Achievement"
            # Missing description, category_id, points
        }
        response = client.post("/achievements/admin", json=bad_payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "Missing required fields" in data["error"]

def test_admin_get_achievement(test_client):
    client, _, achievement_id = test_client # Use achievement_id from fixture
    with login_context(client, user_id=1): # Assuming admin
        response = client.get(f"/achievements/admin/{achievement_id}")
        assert response.status_code == 200
        data = response.get_json()
        assert data["id"] == achievement_id
        assert data["name"] == "Test Achievement" # Name from fixture

        # Test with a non-existent ID
        non_existent_id = "somerandomid123"
        response = client.get(f"/achievements/admin/{non_existent_id}")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
        assert "Achievement not found" in data["error"]

def test_admin_update_achievement(test_client):
    client, _, achievement_id = test_client # Use achievement_id from fixture
    with login_context(client, user_id=1): # Assuming admin
        update_payload = {
            "name": "Updated Test Achievement Name",
            "description": "Updated description via API.",
            "points": 150
        }
        response = client.put(f"/achievements/admin/{achievement_id}", json=update_payload)
        assert response.status_code == 200 # Assuming service returns 200 on successful update
        data = response.get_json()
        assert data.get("message") == "Achievement updated successfully" # Based on AchievementService

        # Optionally, verify by GETting the achievement again
        get_response = client.get(f"/achievements/admin/{achievement_id}")
        assert get_response.status_code == 200
        updated_data = get_response.get_json()
        assert updated_data["name"] == "Updated Test Achievement Name"
        assert updated_data["description"] == "Updated description via API."
        assert updated_data["points"] == 150

        # Test update with a non-existent ID
        non_existent_id = "somerandomid123"
        response = client.put(f"/achievements/admin/{non_existent_id}", json=update_payload)
        # The service's update_achievement might return a specific message for not found,
        # or the route might return 404 if it checks existence first.
        # For now, check for non-200. AchievementService.update_achievement returns {'error': 'Achievement not found'}
        assert response.status_code == 404 
        data = response.get_json()
        assert "error" in data
        assert "Achievement not found" in data["error"].lower() 

def test_admin_delete_achievement(test_client):
    client, category_id, _ = test_client
    with login_context(client, user_id=1): # Assuming admin
        # 1. Create an achievement to delete
        payload_to_create = {
            "name": "ToDelete Achievement",
            "description": "This will be deleted.",
            "category_id": category_id,
            "points": 5,
            "has_progress": False
        }
        create_response = client.post("/achievements/admin", json=payload_to_create)
        assert create_response.status_code == 201
        created_data = create_response.get_json()
        achievement_to_delete_id = created_data["achievement_id"]

        # 2. Delete the achievement
        delete_response = client.delete(f"/achievements/admin/{achievement_to_delete_id}")
        assert delete_response.status_code == 200
        delete_data = delete_response.get_json()
        assert delete_data.get("message") == "Achievement deleted successfully"

        # 3. Verify it's gone by trying to GET it
        get_response = client.get(f"/achievements/admin/{achievement_to_delete_id}")
        assert get_response.status_code == 404

        # Test delete with a non-existent ID
        non_existent_id = "somerandomid123ที่ไม่เคยมีอยู่"
        response = client.delete(f"/achievements/admin/{non_existent_id}")
        assert response.status_code == 404 # Service delete_achievement returns error for not found
        data = response.get_json()
        assert "error" in data
        assert "not found" in data["error"].lower() 