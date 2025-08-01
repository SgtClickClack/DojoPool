import axios from 'axios'; // Assuming axios is available
import { RefereeInput, RefereeResult, FoulType } from '.js';

// --- Sky-T1 API Client ---

// Get the API endpoint from environment variables (ensure this is set in your .env files)
const SKY_T1_API_ENDPOINT = process.env.REACT_APP_SKY_T1_API_ENDPOINT || '/api/mock/sky-t1/analyze'; // Fallback to a mock endpoint if not set
const DEEPINFRA_TOKEN = process.env.DEEPINFRA_TOKEN; // Assuming token is stored in env variable

/**
 * Transforms game state and shot analysis into a natural language prompt for the AI.
 * @param input Referee input data.
 * @returns A string prompt for the AI.
 */
const buildRefereePrompt = (input: RefereeInput): string => {
  const { tableStateBeforeShot, tableStateAfterShot, shotAnalysis, currentPlayerId, gameRules } = input;

  let prompt = `Analyze the following pool shot based on ${gameRules} rules:\n\n`;

  // Describe table state before the shot (simplified)
  prompt += `Table State Before Shot (partial):\n`;
  prompt += `- Current Player: ${currentPlayerId}\n`;
  if (tableStateBeforeShot?.balls) {
    prompt += `- Ball positions and statuses (before shot): ${JSON.stringify(tableStateBeforeShot.balls.map(b => ({ number: b.number, position: b.position, pocketed: b.pocketed })))}.\n`;
  }
   if (tableStateBeforeShot?.pocketedBalls) {
       prompt += `- Pocketed balls (before shot): ${JSON.stringify(tableStateBeforeShot.pocketedBalls)}.\n`;
   }
    if (tableStateBeforeShot?.playerBallTypes) {
        const playerTypes = Object.entries(tableStateBeforeShot.playerBallTypes).map(([player, type]) => `${player}: ${type}`).join(', ');
         prompt += `- Player ball types: ${playerTypes}.\n`;
    }


  // Describe the shot analysis
  prompt += `\nShot Analysis:\n`;
  prompt += `- Is Break Shot: ${shotAnalysis.isBreakShot}\n`;
  if (shotAnalysis.firstObjectBallHit !== null) {
    prompt += `- First object ball hit: ${shotAnalysis.firstObjectBallHit}\n`;
  } else {
      prompt += `- No object ball was hit first.\n`;
  }
  prompt += `- Cue ball hit rail: ${shotAnalysis.cueBallHitRail}\n`;
  prompt += `- Object ball hit rail after contact: ${shotAnalysis.objectBallHitRailAfterContact}\n`;
  if (shotAnalysis.isBreakShot) {
    prompt += `- Balls pocketed on break: ${JSON.stringify(shotAnalysis.ballsPocketedOnBreak)}\n`;
    prompt += `- Number of balls hitting rail on break: ${shotAnalysis.numberOfBallsHittingRailOnBreak}\n`;
  }


  // Describe table state after the shot (more detailed)
  prompt += `\nTable State After Shot (full):\n`;
  prompt += `- Ball positions and statuses (after shot): ${JSON.stringify(tableStateAfterShot.balls.map(b => ({ number: b.number, position: b.position, pocketed: b.pocketed })))}.\n`;
  prompt += `- Pocketed balls (after shot): ${JSON.stringify(tableStateAfterShot.pocketedBalls)}.\n`;
  prompt += `- Player ball types: ${Object.entries(tableStateAfterShot.playerBallTypes).map(([player, type]) => `${player}: ${type}`).join(', ')}.\n`;
   prompt += `- Player fouls: ${JSON.stringify(tableStateAfterShot.fouls)}.\n`;
    prompt += `- Ball in hand: ${tableStateAfterShot.ballInHand}\n`; // Note: This might be the result of the *previous* shot, clarify for AI?


  prompt += `\nDetermine if a foul occurred and who the next player should be. Respond ONLY with a JSON object containing 'foul' (string or null, using values like "scratch", "wrong_ball_first", "no_rail_after_contact", "balls_off_table", "no_contact", "break_foul"), 'reason' (string explanation), 'isBallInHand' (boolean), and 'nextPlayerId' (string). If no foul, 'foul' should be null.`


  return prompt;
};

/**
 * Parses the AI's chat completion response to extract RefereeResult.
 * @param responseContent The content string from the AI's message.
 * @returns A RefereeResult object.
 * @throws Error if parsing fails.
 */
const parseRefereeResult = (responseContent: string): RefereeResult => {
  try {
    // Attempt to parse the content as JSON
    const result = JSON.parse(responseContent);

    // Validate the parsed object structure
    if (
      typeof result.foul === 'string' || result.foul === null &&
      typeof result.reason === 'string' || result.reason === null &&
      typeof result.isBallInHand === 'boolean' &&
      typeof result.nextPlayerId === 'string'
    ) {
      // Map string foul type back to FoulType enum if necessary, or ensure FoulType accepts string
      // Assuming FoulType enum values match the expected strings from AI for now.
      // If not, add mapping logic here.
      return result as RefereeResult;
    } else {
      console.error('Parsed JSON does not match RefereeResult structure:', result);
      throw new Error('Invalid structure in AI response.');
    }
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', responseContent, error);
    throw new Error('Failed to parse AI response.');
  }
};

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
  if (!SKY_T1_API_ENDPOINT) {
       console.error('[skyT1Client] SKY_T1_API_ENDPOINT is not configured.');
       // Fallback to a default error result or mock? Or throw? Throwing for now.
       throw new Error('Sky-T1 API endpoint not configured.');
  }
   if (!DEEPINFRA_TOKEN) {
        console.warn('[skyT1Client] DEEPINFRA_TOKEN is not configured. API calls may fail.');
        // Decide how to handle missing token - proceed anyway? Throw?
        // Proceeding without auth header for now, but API will likely reject.
   }


  console.log(`[skyT1Client] Sending analysis request to ${SKY_T1_API_ENDPOINT} for player: ${input.currentPlayerId}`);

  const prompt = buildRefereePrompt(input);

  const apiPayload = {
      model: "NovaSky-AI/Sky-T1-32B-Preview", // Specify the model based on documentation
      messages: [
          {
              role: "system",
              content: `You are an AI referee for a pool game. Analyze the provided game state and shot analysis to determine if a foul occurred and who the next player should be according to standard ${input.gameRules} rules. Respond ONLY with a JSON object like {'foul': null | string, 'reason': null | string, 'isBallInHand': boolean, 'nextPlayerId': string}. Use the foul types: "scratch", "wrong_ball_first", "no_rail_after_contact", "balls_off_table", "no_contact", "break_foul".`
          },
          {
              role: "user",
              content: prompt
          }
      ],
      // Optional: Configure temperature, max_tokens, etc. based on API docs if needed
       temperature: 0.7,
       max_tokens: 500, // Set a reasonable limit for the response
       response_format: { type: "json_object" }, // Request JSON object output (if supported)
  };


  try {
    const response = await axios.post(SKY_T1_API_ENDPOINT, apiPayload, {
      timeout: 10000, // Set a reasonable timeout (e.g., 10 seconds)
      headers: {
        'Content-Type': 'application/json',
        'Authorization': DEEPINFRA_TOKEN ? `Bearer ${DEEPINFRA_TOKEN}` : undefined, // Include auth header if token exists
      },
    });

    // The API response structure is { choices: [{ message: { content: "..." } }] }
    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        const aiResponseContent = response.data.choices[0].message.content;
         console.log('[skyT1Client] Received AI response content:', aiResponseContent);
        // Parse the AI's text response (which should be a JSON string)
        const refereeResult = parseRefereeResult(aiResponseContent);
         console.log('[skyT1Client] Parsed RefereeResult:', refereeResult);
         return refereeResult;

    } else {
      console.error('[skyT1Client] Received unexpected response structure from API:', response.data);
      throw new Error('Unexpected response structure from Sky-T1 API.');
    }

  } catch (error) {
    console.error('[skyT1Client] Error calling Sky-T1 API:', error);

    let errorMessage = 'Failed to analyze shot via Sky-T1 API.';
    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage = `Sky-T1 API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorMessage = 'Sky-T1 API Error: No response received from server.';
      } else {
        errorMessage = `Sky-T1 API Error: ${error.message}`;
      }
    } else if (error instanceof Error) {
        errorMessage = `Sky-T1 Client Error: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
}; 
