import axios from 'axios'; // Assuming axios is available
import { RefereeInput, RefereeResult, FoulType } from './AIRefereeService';
import { logger } from './src/utils/logger';
import { CONFIG } from './src/config/constants';

// --- Sky-T1 API Client ---

// Get the API endpoint from environment variables (ensure this is set in your .env files)
const SKY_T1_API_ENDPOINT = CONFIG.API.SKY_T1_ENDPOINT;

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
  logger.debug(`Sending analysis request to Sky-T1 API`, {
    playerId: input.currentPlayerId,
    endpoint: SKY_T1_API_ENDPOINT,
  });

  try {
    const response = await axios.post<RefereeResult>(
      SKY_T1_API_ENDPOINT,
      input,
      {
        timeout: CONFIG.TIMEOUTS.API_REQUEST,
        headers: {
          'Content-Type': 'application/json',
          // Add any necessary authentication headers here (e.g., API Key)
          // 'Authorization': `Bearer ${process.env.SKY_T1_API_KEY}`
        },
      }
    );

    // Basic validation of the response structure
    if (
      response.data &&
      typeof response.data.foul !== 'undefined' && // Check for null explicitly if needed
      typeof response.data.isBallInHand === 'boolean' &&
      typeof response.data.nextPlayerId === 'string'
    ) {
      logger.info('Sky-T1 API analysis completed successfully', {
        isBallInHand: response.data.isBallInHand,
        nextPlayerId: response.data.nextPlayerId,
        foul: response.data.foul,
      });
      return response.data;
    } else {
      logger.error('Invalid response structure from Sky-T1 API', {
        responseData: response.data,
      });
      throw new Error('Invalid response structure received from Sky-T1 API.');
    }
  } catch (error) {
    logger.error('Sky-T1 API request failed', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: SKY_T1_API_ENDPOINT,
    });

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
