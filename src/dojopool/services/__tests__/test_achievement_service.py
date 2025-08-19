import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from dojopool.extensions import db
from dojopool.models.achievements import Achievement, UserAchievement, AchievementCategory
from dojopool.services.achievement_service import AchievementService

@pytest.fixture(scope="module")
def test_app():
    # Setup in-memory SQLite DB
    engine = create_engine("sqlite:///:memory:")
    session_factory = sessionmaker(bind=engine)
    db.session = scoped_session(session_factory)  # type: ignore
    AchievementCategory.metadata.create_all(engine)
    Achievement.metadata.create_all(engine)
    UserAchievement.metadata.create_all(engine)
    yield
    db.session.remove()

@pytest.fixture
def service(test_app):
    return AchievementService()

@pytest.fixture
def category():
    cat = AchievementCategory()
    cat.name = "General"
    cat.description = "General achievements"
    db.session.add(cat)
    db.session.commit()
    obj = AchievementCategory.query.get(cat.id)
    assert obj is not None, "Category fixture returned None. Check DB setup."
    return obj

@pytest.fixture
def achievement(category):
    ach = Achievement()
    ach.name = "First Win"
    ach.description = "Win your first game"
    ach.category_id = category.id
    ach.points = 10
    ach.has_progress = True
    ach.target_value = 1
    ach.progress_description = "Win 1 game"
    ach.is_secret = False
    ach.conditions = {}
    db.session.add(ach)
    db.session.commit()
    obj = Achievement.query.get(ach.id)
    assert obj is not None, "Achievement fixture returned None. Check DB setup."
    return obj

@pytest.fixture
def user_id():
    # Use a simple int for user_id in this isolated test
    return 1

@pytest.fixture
def user_achievement(user_id, achievement):
    ua = UserAchievement()
    ua.user_id = user_id
    ua.achievement_id = achievement.id
    db.session.add(ua)
    db.session.commit()
    return ua

def test_create_achievement(service, category):
    data = {
        "name": "Test Achievement",
        "description": "Test desc",
        "category_id": category.id,
        "points": 5,
        "has_progress": True,
        "target_value": 2,
        "progress_description": "Do something twice",
        "is_secret": False,
        "conditions": {}
    }
    result = service.create_achievement(data)
    assert "achievement_id" in result
    ach = Achievement.query.get(result["achievement_id"])
    assert ach.name == "Test Achievement"  # type: ignore

def test_update_achievement(service, achievement):
    data = {"description": "Updated desc", "points": 20}
    result = service.update_achievement(achievement.id, data)
    assert result["message"] == "Achievement updated successfully"
    ach = Achievement.query.get(achievement.id)
    assert ach.description == "Updated desc"  # type: ignore
    assert ach.points == 20  # type: ignore

def test_get_achievement_details(service, achievement):
    result = service.get_achievement_details(achievement.id)
    assert result["id"] == achievement.id
    assert result["name"] == achievement.name  # type: ignore

def test_get_user_achievements(service, user_id, achievement, user_achievement):
    result = service.get_user_achievements(user_id)
    assert "achievements" in result
    assert any(a["achievement_id"] == achievement.id for a in result["achievements"])

def test_track_achievement_progress(service, user_id, achievement):
    # Should create UserAchievement if not exists
    result = service.track_achievement_progress(user_id, achievement.id, 1)
    assert result["current_progress"] == 1
    # Should update progress
    result = service.track_achievement_progress(user_id, achievement.id, 1)
    assert result["current_progress"] == 2
    # Should unlock when target_value reached
    assert result["is_unlocked"] is True

def test_get_achievement_stats(service, user_id, achievement):
    result = service.get_achievement_stats(user_id)
    assert "total_achievements" in result
    assert "unlocked_achievements" in result
    assert "total_points" in result

def test_get_achievement_leaderboard(service, user_id, achievement):
    result = service.get_achievement_leaderboard()
    assert "leaderboard" in result
    assert any(entry["user_id"] == user_id for entry in result["leaderboard"])

def test_delete_achievement(service, achievement):
    result = service.delete_achievement(achievement.id)
    assert result["message"] == "Achievement deleted successfully"
    assert Achievement.query.get(achievement.id) is None 