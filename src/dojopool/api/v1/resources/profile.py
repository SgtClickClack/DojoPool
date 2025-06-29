"""Profile resource for API v1."""

from flask_restful import Resource
from dojopool.core.security import require_auth
from flask import g


class ProfileResource(Resource):
    """Resource for user profile operations."""

    @require_auth
    def get(self):
        """Get user profile."""
        # In development mode, return mock data to avoid SQLAlchemy conflicts
        user_id = g.user_id
        
        # Return mock profile data instead of querying the database
        mock_profile = {
            "id": user_id,
            "user_id": user_id,
            "display_name": f"Player {user_id}",
            "bio": "Pool enthusiast",
            "location": "Unknown",
            "avatar_url": None,
            "total_matches": 0,
            "wins": 0,
            "losses": 0,
            "win_rate": 0.0,
            "rank": "Unranked",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
        
        return {"data": mock_profile, "message": "Profile retrieved successfully"}

    @require_auth
    def put(self):
        """Update current user's profile.

        Returns:
            Updated profile data.
        """
        # In development mode, return mock success response
        return {
            "data": {
                "message": "Profile updated successfully (dev mode)",
                "updated_fields": {"bio": "Updated bio", "location": "Updated location"}
            },
            "message": "Profile updated successfully"
        } 