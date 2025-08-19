"""AI Referee Service Module (Backend)."""

import logging
from typing import Dict, Any, Optional
import requests # Assuming requests library is available for HTTP calls
import os # To read environment variables

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Define a basic structure for the input data to the AI Referee service
# This should mirror the RefereeInput used in the frontend client conceptually
# Adapt based on the actual expected input format of the Sky-T1 API
class BackendRefereeInput:
    def __init__(self, game_state: Dict[str, Any], shot_data: Dict[str, Any], game_rules: str, current_player_id: str):
        self.game_state = game_state
        self.shot_data = shot_data
        self.game_rules = game_rules
        self.current_player_id = current_player_id

    def to_dict(self) -> Dict[str, Any]:
        """Convert input object to a dictionary suitable for API request."""
        return {
            "tableStateBeforeShot": self.game_state.get("table_state_before", {}), # Assuming state includes before/after
            "tableStateAfterShot": self.game_state.get("table_state_after", {}),
            "shotAnalysis": self.shot_data.get("analysis", {}),
            "currentPlayerId": self.current_player_id,
            "gameRules": self.game_rules,
            # Add other necessary fields based on Sky-T1 API requirements
        }

# Define a basic structure for the output data from the AI Referee service
# This should mirror the RefereeResult used in the frontend client conceptually
# Adapt based on the actual expected output format of the Sky-T1 API
class BackendRefereeResult:
    def __init__(self, foul: Optional[str], reason: Optional[str], is_ball_in_hand: bool, next_player_id: Optional[str]):
        self.foul = foul
        self.reason = reason
        self.is_ball_in_hand = is_ball_in_hand
        self.next_player_id = next_player_id

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BackendRefereeResult':
        """Create a BackendRefereeResult object from a dictionary (API response)."""
        # Basic validation and data extraction - adapt based on actual API response structure
        foul = data.get("foul")
        reason = data.get("reason")
        is_ball_in_hand = data.get("isBallInHand", False) # Default to False if not present
        next_player_id = data.get("nextPlayerId")

        if next_player_id is None:
             logger.warning("Sky-T1 API response missing nextPlayerId. Defaulting logic may be needed.")
             # Depending on API contract, might need stricter validation or default logic here

        return cls(foul, reason, is_ball_in_hand, next_player_id)

class AIRefereeService:
    """Service for interacting with the Sky-T1 AI Referee API."""

    def __init__(self):
        # Get API endpoint from environment variables
        self.api_endpoint = os.environ.get('SKY_T1_API_ENDPOINT', 'http://localhost:5001/analyze') # Default endpoint
        self.api_key = os.environ.get('SKY_T1_API_KEY')
        logger.info(f"AI Referee Service initialized with API endpoint: {self.api_endpoint}")

    async def analyze_shot(self, input_data: BackendRefereeInput) -> Optional[BackendRefereeResult]:
        """
        Send shot data to the Sky-T1 API for analysis.

        Args:
            input_data: BackendRefereeInput object containing shot and game state data.

        Returns:
            BackendRefereeResult object or None if analysis fails.
        """
        logger.info(f"Sending shot analysis request to Sky-T1 API: {self.api_endpoint}")
        try:
            headers = {'Content-Type': 'application/json'}
            if self.api_key:
                headers['Authorization'] = f'Bearer {self.api_key}'

            # Make HTTP POST request to the Sky-T1 API
            # Use a dedicated async HTTP library (like aiohttp) in production for non-blocking calls
            response = requests.post(self.api_endpoint, json=input_data.to_dict(), headers=headers, timeout=10) # 10 sec timeout

            response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)

            # Parse the JSON response
            api_response_data = response.json()

            logger.info(f"Received response from Sky-T1 API: {api_response_data}")

            # Create BackendRefereeResult from the API response
            referee_result = BackendRefereeResult.from_dict(api_response_data)
            return referee_result

        except requests.exceptions.Timeout:
            logger.error("Sky-T1 API request timed out.")
            return None # Or return a default error result
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Sky-T1 API: {e}")
            return None # Or return a default error result
        except Exception as e:
            logger.error(f"Unexpected error processing Sky-T1 API response: {e}")
            return None # Or return a default error result

# Instantiate the service (consider dependency injection in a larger app)
# Note: Synchronous requests.post() is used here. For a truly async application
# with FastAPI/asyncio, you should use an async HTTP client like aiohttp.
# This will likely need to be updated when integrating with the async WebSocket handler.

ai_referee_service = AIRefereeService() 