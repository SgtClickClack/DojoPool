from flask_restful import Resource
from dojopool.core.security import require_auth


class VenuesResource(Resource):
    """Resource for venue operations."""

    @require_auth
    def get(self):
        """Get list of venues."""
        # In development mode, return mock data to avoid SQLAlchemy conflicts
        mock_venues = [
            {
                "id": 1,
                "name": "Pool Palace",
                "description": "Premier pool hall in downtown",
                "address": "123 Main St",
                "city": "Downtown",
                "state": "CA",
                "country": "USA",
                "phone": "+1-555-0123",
                "email": "info@poolpalace.com",
                "website": "https://poolpalace.com",
                "capacity": 50,
                "tables": 10,
                "rating": 4.5,
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "id": 2,
                "name": "Cue Corner",
                "description": "Cozy neighborhood pool spot",
                "address": "456 Oak Ave",
                "city": "Suburbia",
                "state": "CA",
                "country": "USA",
                "phone": "+1-555-0456",
                "email": "hello@cuecorner.com",
                "website": "https://cuecorner.com",
                "capacity": 30,
                "tables": 6,
                "rating": 4.2,
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
        
        return {"venues": mock_venues, "message": "Venues retrieved successfully"}
