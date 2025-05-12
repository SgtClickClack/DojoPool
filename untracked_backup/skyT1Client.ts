import axios from 'axios'; // Assuming axios is available
import { RefereeInput, RefereeResult, FoulType } from './AIRefereeService';

// --- Sky-T1 API Client ---

// Get the API endpoint from environment variables (ensure this is set in your .env files)
const SKY_T1_API_ENDPOINT = process.env.REACT_APP_SKY_T1_API_ENDPOINT || '/api/mock/sky-t1/analyze'; // Fallback to a mock endpoint if not set

/**
 * Calls the Sky-T1 AI Referee service endpoint to analyze a shot.
 * 
 * @param input The referee input data.
 * @returns A promise resolving to the RefereeResult.
 * @throws Throws an error if the API call fails or returns an invalid response.
 */
export const skyT1AnalyzeShot = async (
  input: RefereeInput
): Promise<RefereeResult> => {
  console.log(`[skyT1Client] Sending analysis request to ${SKY_T1_API_ENDPOINT} for player: ${input.currentPlayerId}`);

  try {
    const response = await axios.post<RefereeResult>(SKY_T1_API_ENDPOINT, input, {
      timeout: 10000, // Set a reasonable timeout (e.g., 10 seconds)
      headers: {
        'Content-Type': 'application/json',
        // Add any necessary authentication headers here (e.g., API Key)
        // 'Authorization': `Bearer ${process.env.SKY_T1_API_KEY}`
      },
    });

    // Basic validation of the response structure
    if (
      response.data &&
      typeof response.data.foul !== 'undefined' && // Check for null explicitly if needed
      typeof response.data.isBallInHand === 'boolean' &&
      typeof response.data.nextPlayerId === 'string'
    ) {
      console.log('[skyT1Client] Received valid response:', response.data);
      return response.data;
    } else {
      console.error('[skyT1Client] Received invalid response structure:', response.data);
      throw new Error('Invalid response structure received from Sky-T1 API.');
    }
  } catch (error) {
    console.error('[skyT1Client] Error calling Sky-T1 API:', error);

    let errorMessage = 'Failed to analyze shot via Sky-T1 API.';
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = `Sky-T1 API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'Sky-T1 API Error: No response received from server.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = `Sky-T1 API Error: ${error.message}`;
      }
    } else if (error instanceof Error) {
        errorMessage = `Sky-T1 Client Error: ${error.message}`;
    }

    // Rethrow a more specific error or return a default state?
    // Rethrowing for now to let the caller handle it.
    throw new Error(errorMessage);

    /* Alternatively, return a default error state:
    const opponentPlayerId = Object.keys(input.tableStateAfterShot.players).find(id => id !== input.currentPlayerId) || input.currentPlayerId;
    return {
        foul: null,
        reason: `Error: ${errorMessage}`,
        isBallInHand: true, // Award ball-in-hand on error?
        nextPlayerId: opponentPlayerId, 
    };
    */
  }
}; 