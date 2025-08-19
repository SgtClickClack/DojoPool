from flask_restful import Resource
from dojopool.core.security import require_auth


class FeedResource(Resource):
    """Resource for social feed operations."""
    
    @require_auth
    def get(self):
        """Get social feed entries."""
        # For now, return an empty list for dev
        return {"entries": [], "message": "No feed entries available (dev mode)"}
    
    @require_auth
    def post(self):
        """Create a new feed entry."""
        # For now, return success message for dev
        return {"message": "Feed entry creation endpoint (dev mode)", "status": "success"} 