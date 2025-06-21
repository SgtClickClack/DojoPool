"""Video highlight resources module."""

from flask import request
from flask_restful import Resource
from flask_login import current_user
from marshmallow import Schema, fields, ValidationError, validates_schema
from datetime import datetime

from dojopool.extensions import db
from dojopool.core.exceptions import AuthorizationError, NotFoundError
from dojopool.core.security import require_auth
from dojopool.models.video_highlight import VideoHighlight, HighlightStatus
# Import necessary models if relationships are needed (Game, Tournament, User)
from dojopool.models.game import Game
from dojopool.models.tournament import Tournament
from dojopool.models.user import User
# Import ShareService (assuming this is the correct path)
from dojopool.services.social.share import ShareService
from dojopool.models.social import ShareType


class HighlightGenerateSchema(Schema):
    """Schema for highlight generation request data."""
    gameId = fields.Integer(required=True) # Added gameId as required based on logic below
    tournamentId = fields.Integer(required=False, allow_none=True) # Optional if not tournament game
    userId = fields.Integer(required=True)
    gameType = fields.String(required=True)
    highlights = fields.List(fields.Dict(), required=True) # List of highlight moments/events

    @validates_schema
    def validate_ids(self, data, **kwargs):
        """Validate that associated records exist."""
        user_id = data.get("userId")
        tournament_id = data.get("tournamentId")
        game_id = data.get("gameId")

        # Check if game exists
        if game_id and not Game.query.get(game_id):
             raise ValidationError("Game not found", "gameId")

        # Optional: Check if tournamentId exists if provided
        if tournament_id and not Tournament.query.get(tournament_id):
             raise ValidationError("Tournament not found", "tournamentId")

        # Check if user exists
        if user_id and not User.query.get(user_id):
            raise ValidationError("User not found", "userId")

        # Optional: Check if user participated in the game
        # game = Game.query.get(game_id)
        # if game and user_id not in [game.player1_id, game.player2_id]:
        #      raise ValidationError("User did not participate in this game", "userId")


class HighlightResource(Resource):
    """Resource for video highlight operations."""

    # Schema for generating highlights
    generate_schema = HighlightGenerateSchema()

    @require_auth # Ensure user is authenticated
    def post(self, highlight_id=None, action=None):
        """Handle POST requests for highlights, including generation and sharing."""
        if action == 'generate':
            return self.generate_highlight()
        elif highlight_id is not None and action == 'share':
            return self.share_highlight(highlight_id)
        else:
            # Handle other POST actions or return error
            return {"message": "Action not supported"}, 400

    # Add GET, PUT, DELETE methods as needed for other highlight operations (fetch, etc.)
    # Note: GET /highlights/<int:highlight_id> for fetching a single highlight is standard RESTful practice
    # You might add a get method here later for fetching details of a specific highlight

    def generate_highlight(self):
        """Endpoint to trigger video highlight generation."""
        try:
            # Load and validate request data
            data = self.generate_schema.load(request.get_json())
        except ValidationError as err:
            # Ensure errors is a dictionary
            error_messages = err.messages if isinstance(err.messages, dict) else {"validation": err.messages}
            return {"message": "Validation Error", "errors": error_messages}, 400

        user_id = data['userId']
        tournament_id = data.get('tournamentId')
        game_id = data['gameId'] # Game ID is now required by the schema
        game_type = data['gameType']
        highlights_data = data['highlights']

        # Basic authorization check: user can only generate highlights for themselves (or admin)
        if user_id != current_user.id and not current_user.has_role('admin'):
             raise AuthorizationError("You can only generate highlights for your own user ID")

        # Check if the game exists and is completed - now done in validation schema, but double check status
        game = Game.query.get(game_id)
        if not game or game.status != 'completed': # Ensure game status is completed
             return {"message": "Game not found or not completed"}, 404

        # Optional: Check if the highlights data is consistent with the game (e.g., players)
        # This check is now optional in validation schema but can be re-enabled if needed

        # Create a new VideoHighlight entry in the database
        new_highlight = VideoHighlight(
            game_id=game_id,
            tournament_id=tournament_id,
            user_id=user_id,
            status=HighlightStatus.PENDING.value,
            metadata={"highlight_moments": highlights_data} # Store raw highlights data in metadata
        )

        db.session.add(new_highlight)
        db.session.commit()

        # TODO: Trigger asynchronous task to send highlights_data to Wan 2.1 for video generation
        # This task will update the VideoHighlight entry status and video_url upon completion/failure.
        print(f"Triggering highlight generation for highlight ID: {new_highlight.id}")
        # Example: send_to_wan21_queue.put({'highlight_id': new_highlight.id, 'highlight_data': highlights_data})

        return {"message": "Highlight generation initiated", "highlight_id": new_highlight.id}, 202 # 202 Accepted

    @require_auth # Ensure user is authenticated
    def share_highlight(self, highlight_id):
        """Endpoint to share a generated video highlight."""
        # Fetch the video highlight
        highlight = VideoHighlight.query.get(highlight_id)
        if not highlight:
            raise NotFoundError("Video highlight not found")

        # Authorization check: User can only share their own highlights (or admin)
        if highlight.user_id != current_user.id and not current_user.has_role('admin'):
            raise AuthorizationError("You can only share your own video highlights")

        # Ensure the highlight is completed and has a video URL to share
        if highlight.status != HighlightStatus.COMPLETED.value or not highlight.video_url:
            return {"message": "Video highlight is not yet completed or has no video URL to share"}, 400

        # Use the ShareService to create a new share entry
        # Using ShareType enum for content_type
        success, error_message, share = ShareService.create_share(
            user_id=current_user.id,
            content_type=ShareType.VIDEO_HIGHLIGHT, # Use ShareType enum
            content_id=highlight.id,
            title=f"Check out my highlight from Game {highlight.game_id}!", # Example title
            description=highlight.metadata.get("description"), # Use description from metadata if available
            share_metadata={
                "video_highlight_id": highlight.id,
                "game_id": highlight.game_id,
                "tournament_id": highlight.tournament_id,
                "video_url": highlight.video_url,
                "thumbnail_url": highlight.thumbnail_url,
                "duration": highlight.duration,
            } # Include relevant highlight metadata
        )

        if not success:
            return {"message": "Failed to create share", "error": error_message}, 500

        # TODO: Consider integrating with specific social media platforms here or return share data
        # For now, just return confirmation of share creation.

        # Safely access share.id only if share object exists
        share_id = share.id if share else None
        return {"message": "Video highlight shared successfully", "share_id": share_id}, 201 # 201 Created

# Add this resource to your API blueprint/app (example using an api object)
# from . import api # Assuming api is defined in __init__.py
# api.add_resource(HighlightResource, '/api/highlights', '/api/highlights/<string:action>', '/api/highlights/<int:highlight_id>/<string:action>') 