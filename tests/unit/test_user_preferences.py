"""Test user preferences functionality."""
import pytest
from datetime import datetime, timedelta

from dojopool.core.preferences import preferences_service
from dojopool.models import User, Game, Match

def test_preferences_creation():
    """Test creating user preferences."""
    user = User(username="test_user", email="test@example.com")
    preferences = preferences_service.create_preferences(
        user_id=user.id,
        notification_settings={
            "email": True,
            "push": False,
            "in_app": True
        },
        display_settings={
            "theme": "dark",
            "language": "en"
        }
    )
    
    assert preferences.user_id == user.id
    assert preferences.notification_settings["email"] is True
    assert preferences.display_settings["theme"] == "dark"

def test_preferences_update():
    """Test updating user preferences."""
    user = User(username="test_user", email="test@example.com")
    initial_prefs = preferences_service.create_preferences(
        user_id=user.id,
        notification_settings={"email": True},
        display_settings={"theme": "light"}
    )
    
    updated_prefs = preferences_service.update_preferences(
        user_id=user.id,
        notification_settings={"email": False},
        display_settings={"theme": "dark"}
    )
    
    assert updated_prefs.notification_settings["email"] is False
    assert updated_prefs.display_settings["theme"] == "dark"

def test_preferences_retrieval():
    """Test retrieving user preferences."""
    user = User(username="test_user", email="test@example.com")
    preferences_service.create_preferences(
        user_id=user.id,
        notification_settings={"email": True},
        display_settings={"theme": "light"}
    )
    
    prefs = preferences_service.get_preferences(user.id)
    assert prefs.user_id == user.id
    assert "email" in prefs.notification_settings
    assert "theme" in prefs.display_settings

def test_preferences_validation():
    """Test preferences validation."""
    user = User(username="test_user", email="test@example.com")
    
    # Test invalid notification settings
    with pytest.raises(ValueError):
        preferences_service.create_preferences(
            user_id=user.id,
            notification_settings={"invalid_key": True},
            display_settings={"theme": "light"}
        )
    
    # Test invalid display settings
    with pytest.raises(ValueError):
        preferences_service.create_preferences(
            user_id=user.id,
            notification_settings={"email": True},
            display_settings={"theme": "invalid_theme"}
        )

def test_preferences_defaults():
    """Test default preferences."""
    user = User(username="test_user", email="test@example.com")
    defaults = preferences_service.get_default_preferences(user.id)
    
    assert "notification_settings" in defaults
    assert "display_settings" in defaults
    assert defaults["notification_settings"]["email"] is True
    assert defaults["display_settings"]["theme"] == "light"

def test_preferences_reset():
    """Test resetting preferences to defaults."""
    user = User(username="test_user", email="test@example.com")
    preferences_service.create_preferences(
        user_id=user.id,
        notification_settings={"email": False},
        display_settings={"theme": "dark"}
    )
    
    reset_prefs = preferences_service.reset_preferences(user.id)
    assert reset_prefs.notification_settings["email"] is True
    assert reset_prefs.display_settings["theme"] == "light"

def test_preferences_history():
    """Test preferences history tracking."""
    user = User(username="test_user", email="test@example.com")
    preferences_service.create_preferences(
        user_id=user.id,
        notification_settings={"email": True},
        display_settings={"theme": "light"}
    )
    
    # Make some changes
    for theme in ["dark", "light", "dark"]:
        preferences_service.update_preferences(
            user_id=user.id,
            display_settings={"theme": theme}
        )
    
    history = preferences_service.get_preferences_history(user.id)
    assert len(history) == 4  # Initial + 3 updates
    assert all(h.user_id == user.id for h in history)

def test_preferences_export():
    """Test preferences export."""
    user = User(username="test_user", email="test@example.com")
    preferences_service.create_preferences(
        user_id=user.id,
        notification_settings={"email": True},
        display_settings={"theme": "light"}
    )
    
    export = preferences_service.export_preferences(user.id)
    assert "notification_settings" in export
    assert "display_settings" in export
    assert "last_updated" in export

def test_preferences_import():
    """Test preferences import."""
    user = User(username="test_user", email="test@example.com")
    prefs_data = {
        "notification_settings": {"email": False},
        "display_settings": {"theme": "dark"}
    }
    
    imported_prefs = preferences_service.import_preferences(
        user_id=user.id,
        preferences_data=prefs_data
    )
    
    assert imported_prefs.notification_settings["email"] is False
    assert imported_prefs.display_settings["theme"] == "dark"

def test_preferences_cleanup():
    """Test preferences cleanup."""
    user = User(username="test_user", email="test@example.com")
    preferences_service.create_preferences(
        user_id=user.id,
        notification_settings={"email": True},
        display_settings={"theme": "light"}
    )
    
    # Create some history
    for _ in range(10):
            preferences_service.update_preferences(
            user_id=user.id,
            notification_settings={"email": True}
        )
    
    cleaned = preferences_service.cleanup_preferences_history(
        user_id=user.id,
        older_than=datetime.utcnow() - timedelta(days=7)
    )
    
    assert cleaned.success is True
    assert cleaned.records_removed > 0 