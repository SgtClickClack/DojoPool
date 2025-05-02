import { BallState, GameTable, Pocket } from '../../core/game/GameState';
import { ShotAnalysisData } from '../../core/game/GameState'; // Assuming this type exists or will be defined
import { Vector2D } from '../../types/geometry';

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
  }

  /**
   * Analyzes the outcome of a shot based on game state before/after and shot analysis data.
   * @param input Data required for the analysis.
   * @returns The result of the analysis, including any fouls and the next player.
   */
  analyzeShot(input: RefereeInput): RefereeResult {
    console.log('AI Referee analyzing shot for player:', input.currentPlayerId);

    const { tableStateBeforeShot, tableStateAfterShot, shotAnalysis, currentPlayerId, gameRules } = input;

    let foul: FoulType | null = null;
    let reason: string | null = null;
    let isBallInHand = false;
    let nextPlayerId = currentPlayerId; // Assume turn continues by default
    let turnContinues = false; // Does the current player shoot again?

    const playerIds = Object.keys(tableStateAfterShot.players);
    const opponentPlayerId = playerIds.find(id => id !== currentPlayerId) || currentPlayerId;

    const cueBallAfter = tableStateAfterShot.balls.find(b => b.number === 0);
    const newlyPocketed = tableStateAfterShot.pocketedBalls.filter(
      (num) => !tableStateBeforeShot.pocketedBalls?.includes(num)
    );

    const currentPlayerBallTypeBefore = tableStateBeforeShot.playerBallTypes?.[currentPlayerId] || 'open';
    const opponentBallTypeBefore = tableStateBeforeShot.playerBallTypes?.[opponentPlayerId] || 'open';

    // --- Foul Detection Logic --- //

    // 1. Scratch (Cue ball pocketed or off table)
    if (cueBallAfter?.pocketed) {
      foul = FoulType.SCRATCH;
      reason = 'Cue ball was pocketed.';
    } else {
      // Check if cue ball went off table (simplified check)
      const cueBallPos = cueBallAfter?.position;
      if (cueBallPos && (cueBallPos.x < 0 || cueBallPos.x > tableStateAfterShot.tableWidth || cueBallPos.y < 0 || cueBallPos.y > tableStateAfterShot.tableHeight)) {
         foul = FoulType.SCRATCH;
         reason = 'Cue ball left the table.';
      }
    }

    // 2. No Contact
    if (!foul && shotAnalysis.firstObjectBallHit === null && !newlyPocketed.includes(0)) {
        foul = FoulType.NO_CONTACT;
        reason = 'Cue ball did not contact any object ball.';
    }

    // 3. Wrong Ball First (Only check if no preceding foul)
    if (!foul && shotAnalysis.firstObjectBallHit !== null) {
      const firstHitBallNum = shotAnalysis.firstObjectBallHit;
      const firstHitType = getBallType(firstHitBallNum);

      if (currentPlayerBallTypeBefore === 'solids' && firstHitType === 'stripe') {
        foul = FoulType.WRONG_BALL_FIRST;
        reason = `Illegal first contact: Hit opponent's Stripe ball (${firstHitBallNum}).`;
      } else if (currentPlayerBallTypeBefore === 'stripes' && firstHitType === 'solid') {
        foul = FoulType.WRONG_BALL_FIRST;
        reason = `Illegal first contact: Hit opponent's Solid ball (${firstHitBallNum}).`;
      } else if (currentPlayerBallTypeBefore !== 'open') {
        // Check if 8-ball hit first illegally
        const legalTargets = currentPlayerBallTypeBefore === 'solids'
          ? [1, 2, 3, 4, 5, 6, 7]
          : [9, 10, 11, 12, 13, 14, 15];
        const playerGroupCleared = legalTargets.every(num => tableStateAfterShot.pocketedBalls.includes(num));

        if (firstHitType === 'eight' && !playerGroupCleared) {
          foul = FoulType.WRONG_BALL_FIRST;
          reason = 'Illegal first contact: Hit 8-ball before player group was cleared.';
        }
      } else if (currentPlayerBallTypeBefore === 'open' && firstHitType === 'eight') {
        // Cannot hit 8-ball first when table is open (unless it's the only ball left? Rules vary)
        foul = FoulType.WRONG_BALL_FIRST;
        reason = 'Illegal first contact: Hit 8-ball when table was open.';
      }
    }

    // 4. No Rail After Contact (Only check if no preceding foul)
    if (!foul && shotAnalysis.firstObjectBallHit !== null) {
        // Check if any ball was legally pocketed on the shot
        const pocketedOwnBallLegally = newlyPocketed.some(num => {
            const pocketedType = getBallType(num);
            return (currentPlayerBallTypeBefore === 'open' && (pocketedType === 'solid' || pocketedType === 'stripe')) ||
                   (currentPlayerBallTypeBefore === 'solids' && pocketedType === 'solid') ||
                   (currentPlayerBallTypeBefore === 'stripes' && pocketedType === 'stripe');
        });

        // If no legal ball was pocketed, a ball MUST hit a rail after contact
        if (!pocketedOwnBallLegally && !shotAnalysis.cueBallHitRail && !shotAnalysis.objectBallHitRailAfterContact) {
            foul = FoulType.NO_RAIL_AFTER_CONTACT;
            reason = 'No ball hit a rail after the cue ball contacted the object ball (and no legal ball pocketed).';
        }
    }

    // 5. Break Shot Specific Fouls
    if (shotAnalysis.isBreakShot) {
         console.log('Analyzing break shot fouls...');
         // Check scratch specifically on break (already covered by general scratch check above)
         if (foul === FoulType.SCRATCH) {
              foul = FoulType.BREAK_FOUL; // Reclassify as BREAK_FOUL
              reason = `Break Foul: ${reason}`; 
              console.log(`Break Foul Detected: Scratch`);
         } 
         
         // Check illegal 8-ball pocket on break
         if (!foul && shotAnalysis.ballsPocketedOnBreak?.includes(8)) {
             foul = FoulType.BREAK_FOUL;
             // Treat as loss for now, could be re-rack depending on specific rules
             reason = 'Break Foul: 8-ball pocketed on break (results in loss).'; 
             console.log(`Break Foul Detected: 8-ball pocketed`);
             // GameState.analyzeShotOutcome should handle loss logic based on foul
         }

         // Check insufficient balls to rail (Example: requires 4 object balls)
         const MIN_BALLS_TO_RAIL_ON_BREAK = 4;
         if (!foul && shotAnalysis.numberOfBallsHittingRailOnBreak < MIN_BALLS_TO_RAIL_ON_BREAK) {
             foul = FoulType.BREAK_FOUL;
             reason = `Break Foul: Only ${shotAnalysis.numberOfBallsHittingRailOnBreak} balls hit a rail (minimum ${MIN_BALLS_TO_RAIL_ON_BREAK} required).`;
             console.log(`Break Foul Detected: Insufficient balls to rail (${shotAnalysis.numberOfBallsHittingRailOnBreak})`);
         }
         
         // TODO: Add other break rules (e.g., ball driven off table other than cue)
         // Note: BALLS_OFF_TABLE check below might cover object balls off table on break too.
    }

    // 6. Balls Off Table (Object balls)
    if (!foul) {
        const objectBallsOffTable = tableStateAfterShot.balls.filter(ball => 
            ball.number !== 0 && 
            !ball.pocketed && 
            (ball.position.x < 0 || ball.position.x > tableStateAfterShot.tableWidth || 
             ball.position.y < 0 || ball.position.y > tableStateAfterShot.tableHeight)
        );

        if (objectBallsOffTable.length > 0) {
            foul = FoulType.BALLS_OFF_TABLE;
            reason = `Object ball(s) left the table: ${objectBallsOffTable.map(b => b.number).join(', ')}`;
            // Pocketed balls that went off table are typically just considered pocketed.
            // Balls that go off table and come back on are fouls.
            // The spotted ball logic happens in GameState.
            if (foul === FoulType.BALLS_OFF_TABLE && shotAnalysis.isBreakShot) {
                reason = `Break Foul: ${reason}`; // Prepend indication
            }
        }
    }

    // TODO: Implement other foul checks: DOUBLE_HIT, PUSH_SHOT etc.

    // --- Determine Turn Continuation and Ball-in-Hand --- //

    if (foul) {
      isBallInHand = true; // Generally, any foul gives ball-in-hand
      turnContinues = false;
      // Special case: Scratch on break might have different ball-in-hand rules (e.g., behind head string)
      // This service currently just flags ballInHand = true.
    } else {
      // Check if player pocketed one of their own balls legally
      const pocketedOwnBallLegally = newlyPocketed.some(num => {
          const pocketedType = getBallType(num);
          const currentType = tableStateAfterShot.playerBallTypes[currentPlayerId]; // Use potentially updated type
          // Note: Ball type assignment happens in GameState after this service runs.
          // Need to consider the state *before* type assignment for continuation logic? Or pass assigned type back?
          // Using type *before* the shot for now:
          return (currentPlayerBallTypeBefore === 'open' && (pocketedType === 'solid' || pocketedType === 'stripe')) ||
                 (currentPlayerBallTypeBefore === 'solids' && pocketedType === 'solid') ||
                 (currentPlayerBallTypeBefore === 'stripes' && pocketedType === 'stripe');
      });

      if (pocketedOwnBallLegally) {
        turnContinues = true;
      } else {
        turnContinues = false;
      }
      isBallInHand = false;
    }

    // Determine final nextPlayerId
    if (!turnContinues) {
      nextPlayerId = opponentPlayerId;
    }

    // TODO: Add logic for game end conditions (e.g., 8-ball pocketed legally/illegally)

    return {
      foul,
      reason,
      isBallInHand,
      nextPlayerId,
    };
  }
} 