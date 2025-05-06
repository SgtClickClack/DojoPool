import { BallState, GameTable, Pocket } from '../../core/game/GameState';
import { ShotAnalysisData } from '../../core/game/GameState'; // Assuming this type exists or will be defined
import { Vector2D } from '../../types/geometry';
import { skyT1AnalyzeShot } from './skyT1Client'; // Hypothetical import for Sky-T1

/**
 * Helper function to determine ball type.
 * Duplicated here for now, consider moving to a shared utils file.
 */
function getBallType(
  ballNumber: number,
): "solid" | "stripe" | "eight" | "cue" | "invalid" {
  if (ballNumber === 0) return "cue";
  if (ballNumber === 8) return "eight";
  if (ballNumber >= 1 && ballNumber <= 7) return "solid";
  if (ballNumber >= 9 && ballNumber <= 15) return "stripe";
  return "invalid";
}

/**
 * Defines the types of fouls that can occur in pool.
 */
export enum FoulType {
  SCRATCH = 'scratch', // Cue ball pocketed or leaves table
  WRONG_BALL_FIRST = 'wrong_ball_first', // Hit opponent's ball/8-ball first when not allowed
  NO_RAIL_AFTER_CONTACT = 'no_rail_after_contact', // No ball hit a rail after cue ball contacted object ball
  BALLS_OFF_TABLE = 'balls_off_table', // Any ball other than cue ball leaves the table
  TOUCHING_BALL = 'touching_ball', // Touching a ball illegally (e.g., with hand)
  DOUBLE_HIT = 'double_hit', // Hitting the cue ball twice on one stroke
  PUSH_SHOT = 'push_shot', // Pushing the cue ball instead of striking
  ILLEGAL_JUMP = 'illegal_jump', // Jumping ball over an obstacle illegally
  BREAK_FOUL = 'break_foul', // Specific foul during the break shot (e.g., not enough balls to rail)
  NO_CONTACT = 'no_contact', // Cue ball failed to hit any object ball
  // Add more specific 8-ball/9-ball fouls as needed
}

/**
 * Input data required for the AI Referee to analyze a shot outcome.
 */
export interface RefereeInput {
  tableStateBeforeShot: Partial<GameTable>; // Key state elements before the shot
  tableStateAfterShot: GameTable; // Full table state after balls stopped
  shotAnalysis: ShotAnalysisData; // Data collected during the shot simulation
  currentPlayerId: string;
  gameRules: '8-ball' | '9-ball'; // Or a more detailed ruleset object
}

/**
 * Output from the AI Referee after analyzing a shot outcome.
 */
export interface RefereeResult {
  foul: FoulType | null;
  reason: string | null; // Explanation if a foul occurred
  isBallInHand: boolean; // Whether the incoming player gets ball-in-hand
  nextPlayerId: string; // ID of the player whose turn it is next
}

/**
 * AI Referee service responsible for interpreting game rules and detecting fouls.
 */
export class AIRefereeService {
  constructor() {
    // Initialization, load models/rules if necessary
    // Could initialize SkyT1 client here if needed
  }

  /**
   * Analyzes the outcome of a shot based on game state before/after and shot analysis data.
   * THIS NOW DEFERS TO THE SKY-T1 SERVICE.
   * @param input Data required for the analysis.
   * @returns The result of the analysis, including any fouls and the next player.
   */
  async analyzeShot(input: RefereeInput): Promise<RefereeResult> { // Make method async
    console.log('AI Referee Service: Delegating shot analysis to Sky-T1 for player:', input.currentPlayerId);

    try {
      // Call the external Sky-T1 service
      const skyT1Result = await skyT1AnalyzeShot(input);

      console.log('Sky-T1 analysis complete:', skyT1Result);

      // Basic validation/mapping (assuming Sky-T1 returns the exact RefereeResult structure)
      if (!skyT1Result || typeof skyT1Result.foul === 'undefined') {
          console.error('Invalid response received from Sky-T1 service.');
          // Return a default safe state (e.g., no foul, turn changes)
           return {
               foul: null,
               reason: 'Error: Could not get analysis from Sky-T1',
               isBallInHand: false,
               nextPlayerId: Object.keys(input.tableStateAfterShot.players).find(id => id !== input.currentPlayerId) || input.currentPlayerId,
           };
      }

      return skyT1Result;

    } catch (error) {
        console.error('Error calling Sky-T1 service:', error);
        // Return a default safe state on error
        const opponentPlayerId = Object.keys(input.tableStateAfterShot.players).find(id => id !== input.currentPlayerId) || input.currentPlayerId;
        return {
            foul: null, // Or potentially a specific 'error' foul type?
            reason: `Error analyzing shot with Sky-T1: ${error instanceof Error ? error.message : 'Unknown error'}`,
            isBallInHand: false,
            nextPlayerId: opponentPlayerId, // Default to opponent's turn on error
        };
    }


    /* --- PREVIOUS LOCAL FOUL DETECTION LOGIC REMOVED ---

    const { tableStateBeforeShot, tableStateAfterShot, shotAnalysis, currentPlayerId, gameRules } = input;

    // ... [Previous foul detection logic based on input data] ...
    // This entire block (lines ~80 to ~240) is replaced by the Sky-T1 call above.

    // --- Determine Turn Continuation and Ball-in-Hand --- //

    // ... [Previous turn continuation logic] ...

    return {
      foul,
      reason,
      isBallInHand,
      nextPlayerId,
    };

    --- END OF REMOVED LOCAL LOGIC --- */
  }
} 