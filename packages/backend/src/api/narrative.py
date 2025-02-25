from rest_framework.response import Response
from rest_framework import status
from backend.ai_narrative import NarrativeEngine, NarrativeGenerationError
from .base import PublicAPIView

class NarrativeAPIView(PublicAPIView):
    """
    API endpoint for generating match narratives.
    
    post:
    Generate a narrative for a match based on venue context and match data.
    """
    
    def post(self, request, *args, **kwargs):
        """
        Generate a narrative for a match.
        
        Parameters:
            venue_context (str): Context about the venue
            match_data (dict): Data about the match
            
        Returns:
            narrative (str): Generated narrative for the match
        """
        venue_context = request.data.get("venue_context", "")
        match_data = request.data.get("match_data", {})
        
        try:
            engine = NarrativeEngine(venue_context, match_data)
            narrative = engine.generate_narrative()
            return Response({"narrative": narrative}, status=status.HTTP_200_OK)
        except NarrativeGenerationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    def get(self, request, *args, **kwargs):
        """
        Get information about the narrative generation endpoint.
        """
        return Response({
            "description": "Generate match narratives",
            "methods": ["POST"],
            "required_fields": {
                "venue_context": "string",
                "match_data": "object"
            }
        }) 