from flask_restful import Resource
from dojopool.core.security import require_auth
from flask import g


class UserMeResource(Resource):
    """Resource for current user operations."""

    @require_auth
    def get(self):
        """Get current user profile."""
        # In development mode, return mock data to avoid SQLAlchemy conflicts
        user_id = g.user_id
        
        # Return mock user data instead of querying the database
        mock_user = {
            "id": user_id,
            "username": f"user_{user_id}",
            "email": f"user{user_id}@example.com",
            "first_name": "Test",
            "last_name": "User",
            "avatar_url": None,
            "is_active": True,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
        
        return {"data": mock_user, "message": "User profile retrieved successfully"}
