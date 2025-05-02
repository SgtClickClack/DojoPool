import { AIRefereeService, FoulType, RefereeInput, RefereeResult } from './AIRefereeService';
import { GameTable, BallState, ShotAnalysisData } from '../../core/game/GameState'; // Adjust path as needed

// Mock data generation helpers
const createMockBall = (overrides: Partial<BallState>): BallState => ({
  number: 0,
  position: { x: 0.5, y: 0.5 },
  velocity: { x: 0, y: 0 },
  mass: 0.17,
  radius: 0.0285,
  pocketed: false,
  ...overrides,
});

// Base default GameTable with all required fields
const defaultGameTable: GameTable = {
    id: 'test-table-default',
    name: 'Default Table',
    players: { 
        'p1': { id: 'p1', name: 'Player 1', score: 0, isActive: true, lastAction: 0, team: "", position: "" },
        'p2': { id: 'p2', name: 'Player 2', score: 0, isActive: true, lastAction: 0, team: "", position: "" }
    },
    status: 'active',
    currentTurn: 'p1',
    gameStarted: true,
    gameEnded: false,
    winner: null,
    balls: [createMockBall({ number: 0 }), createMockBall({ number: 1, position: { x: 1, y: 1 } })],
    pocketedBalls: [],
    fouls: {},
    tableWidth: 2.24,
    tableHeight: 1.12,
    pockets: [
        { position: { x: 0, y: 0 }, radius: 0.06 }, { position: { x: 1.12, y: 0 }, radius: 0.055 }, { position: { x: 2.24, y: 0 }, radius: 0.06 },
        { position: { x: 0, y: 1.12 }, radius: 0.06 }, { position: { x: 1.12, y: 1.12 }, radius: 0.055 }, { position: { x: 2.24, y: 1.12 }, radius: 0.06 },
    ],
    physicsActive: false,
    lastUpdatedLocally: Date.now(),
    pocketedBallsBeforeShot: [],
    playerBallTypes: { 'p1': 'open', 'p2': 'open' },
    ballInHand: false,
    ballInHandFromBreakScratch: false,
};

// Base default ShotAnalysisData with all required fields
const defaultShotAnalysis: ShotAnalysisData = {
    firstObjectBallHit: null,
    cueBallHitRail: false,
    objectBallHitRailAfterContact: false,
    isBreakShot: false,
};

// Updated mock creators using defaults
const createMockGameTable = (overrides: Partial<GameTable>): GameTable => ({
  ...defaultGameTable,
  ...overrides, // Apply overrides to the default object
  // Deep merge sensitive properties if necessary (e.g., players, balls)
  players: { ...defaultGameTable.players, ...(overrides.players || {}) },
  balls: overrides.balls ? overrides.balls : [...defaultGameTable.balls.map(b => ({...b}))], // Ensure deep copy of default balls if not overridden
  playerBallTypes: { ...defaultGameTable.playerBallTypes, ...(overrides.playerBallTypes || {}) },
});

const createMockShotAnalysis = (overrides: Partial<ShotAnalysisData>): ShotAnalysisData => ({
  ...defaultShotAnalysis,
  ...overrides, // Apply overrides to the default object
});

// Updated main input mock creator
const createMockRefereeInput = (overrides: {
    tableStateBeforeShot?: Partial<GameTable>;
    tableStateAfterShot?: Partial<GameTable>;
    shotAnalysis?: Partial<ShotAnalysisData>;
    currentPlayerId?: string;
    gameRules?: '8-ball' | '9-ball';
}): RefereeInput => {
    // Create complete objects by merging defaults with overrides
    const tableAfter = { 
        ...defaultGameTable, 
        ...(overrides.tableStateAfterShot || {}),
        // Deep merge players/balls if provided in overrides
        players: { ...defaultGameTable.players, ...(overrides.tableStateAfterShot?.players || {}) },
        balls: overrides.tableStateAfterShot?.balls ? overrides.tableStateAfterShot.balls.map(b => ({...defaultGameTable.balls[0], ...b})) : defaultGameTable.balls.map(b => ({...b})),
        playerBallTypes: { ...defaultGameTable.playerBallTypes, ...(overrides.tableStateAfterShot?.playerBallTypes || {}) },
    };
    const tableBefore = { 
        ...defaultGameTable, 
        ...(overrides.tableStateBeforeShot || {}),
        // Deep merge players/balls if provided in overrides
        players: { ...defaultGameTable.players, ...(overrides.tableStateBeforeShot?.players || {}) },
        balls: overrides.tableStateBeforeShot?.balls ? overrides.tableStateBeforeShot.balls.map(b => ({...defaultGameTable.balls[0], ...b})) : defaultGameTable.balls.map(b => ({...b})),
        playerBallTypes: { ...defaultGameTable.playerBallTypes, ...(overrides.tableStateBeforeShot?.playerBallTypes || {}) },
    };
    const shotAnalysis = { 
        ...defaultShotAnalysis, 
        ...(overrides.shotAnalysis || {}) 
    };

    // Determine currentPlayerId safely
    const currentPlayerId = overrides.currentPlayerId ?? tableAfter.currentTurn ?? 'p1';

    return {
        tableStateBeforeShot: tableBefore, // Now guaranteed to be GameTable
        tableStateAfterShot: tableAfter, // Now guaranteed to be GameTable
        shotAnalysis: shotAnalysis, // Now guaranteed to be ShotAnalysisData
        currentPlayerId: currentPlayerId,
        gameRules: overrides.gameRules ?? '8-ball',
    };
};

describe('AIRefereeService', () => {
  let referee: AIRefereeService;

  beforeEach(() => {
    referee = new AIRefereeService();
  });

  // --- Test Cases --- //

  it('should detect Scratch foul when cue ball is pocketed', () => {
    const input = createMockRefereeInput({
      tableStateAfterShot: {
        balls: [createMockBall({ number: 0, pocketed: true })],
        pocketedBalls: [0],
      },
    });
    const result = referee.analyzeShot(input);
    expect(result.foul).toBe(FoulType.SCRATCH);
    expect(result.reason).toContain('pocketed');
    expect(result.isBallInHand).toBe(true);
    expect(result.nextPlayerId).toBe('p2'); // Assuming p1 shot
  });

  it('should detect Scratch foul when cue ball is off table', () => {
    const input = createMockRefereeInput({
      tableStateAfterShot: {
        balls: [createMockBall({ number: 0, position: { x: -1, y: -1 } })],
      },
    });
    const result = referee.analyzeShot(input);
    expect(result.foul).toBe(FoulType.SCRATCH);
    expect(result.reason).toContain('left the table');
    expect(result.isBallInHand).toBe(true);
    expect(result.nextPlayerId).toBe('p2');
  });

  it('should detect No Contact foul when cue hits nothing', () => {
    const input = createMockRefereeInput({
      shotAnalysis: { firstObjectBallHit: null },
      tableStateAfterShot: { 
          balls: [createMockBall({number: 0, pocketed: false})], // Ensure cue not pocketed
          pocketedBalls: [] 
        },
    });
    const result = referee.analyzeShot(input);
    expect(result.foul).toBe(FoulType.NO_CONTACT);
    expect(result.isBallInHand).toBe(true);
    expect(result.nextPlayerId).toBe('p2');
  });

  it('should detect Wrong Ball First when hitting opponent ball (solids vs stripe)', () => {
    const input = createMockRefereeInput({
        currentPlayerId: 'p1',
        tableStateBeforeShot: {
            playerBallTypes: { 'p1': 'solids', 'p2': 'stripes' },
        },
        // tableStateAfterShot will inherit defaultGameTable state if not overridden
        shotAnalysis: { firstObjectBallHit: 9 }, // p1 (solids) hits a stripe
    });
    const result = referee.analyzeShot(input);
    expect(result.foul).toBe(FoulType.WRONG_BALL_FIRST);
    expect(result.isBallInHand).toBe(true);
    expect(result.nextPlayerId).toBe('p2');
  });

  it('should detect Wrong Ball First when hitting 8-ball before group cleared', () => {
    const input = createMockRefereeInput({
        currentPlayerId: 'p1',
        tableStateBeforeShot: {
            playerBallTypes: { 'p1': 'solids', 'p2': 'stripes' },
            pocketedBalls: [1, 2], // Solids not cleared
        },
        // tableStateAfterShot inherits and keeps pocketedBalls [1, 2]
        shotAnalysis: { firstObjectBallHit: 8 },
    });
    const result = referee.analyzeShot(input);
    expect(result.foul).toBe(FoulType.WRONG_BALL_FIRST);
    expect(result.reason).toContain('8-ball before player group was cleared');
    expect(result.isBallInHand).toBe(true);
    expect(result.nextPlayerId).toBe('p2');
  });

  it('should detect No Rail After Contact foul', () => {
    const input = createMockRefereeInput({
        currentPlayerId: 'p1',
        tableStateBeforeShot: {
            playerBallTypes: { 'p1': 'solids', 'p2': 'stripes' },
            pocketedBalls: [],
        },
        tableStateAfterShot: {
            pocketedBalls: [], // No legal ball pocketed
        },
        shotAnalysis: {
            firstObjectBallHit: 1,
            cueBallHitRail: false,
            objectBallHitRailAfterContact: false,
        },
    });
    const result = referee.analyzeShot(input);
    expect(result.foul).toBe(FoulType.NO_RAIL_AFTER_CONTACT);
    expect(result.isBallInHand).toBe(true);
    expect(result.nextPlayerId).toBe('p2');
  });

  it('should NOT call No Rail foul if a legal ball was pocketed', () => {
    const input = createMockRefereeInput({
        currentPlayerId: 'p1',
        tableStateBeforeShot: {
            playerBallTypes: { 'p1': 'solids', 'p2': 'stripes' },
            pocketedBalls: [],
        },
        tableStateAfterShot: {
            pocketedBalls: [1], // p1 (solids) pocketed ball 1
        },
        shotAnalysis: {
            firstObjectBallHit: 1,
            cueBallHitRail: false,
            objectBallHitRailAfterContact: false, // No rail, but legal pot
        },
    });
    const result = referee.analyzeShot(input);
    expect(result.foul).toBeNull();
    expect(result.isBallInHand).toBe(false);
    expect(result.nextPlayerId).toBe('p1'); // Turn should continue
  });

  it('should detect Balls Off Table foul', () => {
    const input = createMockRefereeInput({
      tableStateAfterShot: {
        balls: [
            createMockBall({ number: 0 }),
            createMockBall({ number: 1, position: { x: -1, y: 1 } }) // Ball 1 off table
        ],
      },
    });
    const result = referee.analyzeShot(input);
    expect(result.foul).toBe(FoulType.BALLS_OFF_TABLE);
    expect(result.reason).toContain('left the table: 1');
    expect(result.isBallInHand).toBe(true);
    expect(result.nextPlayerId).toBe('p2');
  });

  it('should allow turn continuation if a legal ball is pocketed and no foul occurs', () => {
    const input = createMockRefereeInput({
        currentPlayerId: 'p1',
        tableStateBeforeShot: {
            playerBallTypes: { 'p1': 'solids', 'p2': 'stripes' },
            pocketedBalls: [],
        },
        tableStateAfterShot: {
            pocketedBalls: [1], // p1 (solids) pocketed ball 1
        },
        shotAnalysis: {
            firstObjectBallHit: 1,
            cueBallHitRail: true, // Rail hit, so no rail foul
            objectBallHitRailAfterContact: false,
        },
    });
    const result = referee.analyzeShot(input);
    expect(result.foul).toBeNull();
    expect(result.isBallInHand).toBe(false);
    expect(result.nextPlayerId).toBe('p1'); // p1 continues
  });

  it('should change turn if no legal ball is pocketed and no foul occurs', () => {
    const input = createMockRefereeInput({
        currentPlayerId: 'p1',
        tableStateBeforeShot: {
            playerBallTypes: { 'p1': 'solids', 'p2': 'stripes' },
            pocketedBalls: [],
        },
        tableStateAfterShot: {
            pocketedBalls: [], // No balls pocketed
        },
        shotAnalysis: {
            firstObjectBallHit: 1,
            cueBallHitRail: true, // Rail hit, so no rail foul
            objectBallHitRailAfterContact: false,
        },
    });
    const result = referee.analyzeShot(input);
    expect(result.foul).toBeNull();
    expect(result.isBallInHand).toBe(false);
    expect(result.nextPlayerId).toBe('p2'); // Turn changes to p2
  });

  // --- Add new describe block for Break Foul scenarios --- 
  describe('Break Shot Foul Analysis', () => {
    let baseInput: RefereeInput;

    beforeEach(() => {
      // Create a base input that represents state AFTER a break shot
      // Modify specific parts in each test case
      baseInput = {
        tableStateBeforeShot: { // State before the break
          pocketedBalls: [],
          playerBallTypes: { p1: 'open', p2: 'open' },
          // ... other minimal required fields ...
        },
        tableStateAfterShot: { // State AFTER balls stopped moving
          id: 't1',
          name: 'Test Table',
          players: { p1: { id: 'p1', name: 'P1', score: 0, isActive: true, lastAction: 0, team:'A', position:'GK' }, p2: { id: 'p2', name: 'P2', score: 0, isActive: true, lastAction: 0, team:'B', position:'GK'} },
          status: 'active',
          currentTurn: 'p1', // Turn hasn't changed yet
          gameStarted: true,
          gameEnded: false,
          winner: null,
          balls: [ // Simplified ball state after break
              { number: 0, position: { x: 50, y: 50 }, velocity: { x: 0, y: 0 }, pocketed: false, mass:1, radius:1 },
              { number: 1, position: { x: 100, y: 100 }, velocity: { x: 0, y: 0 }, pocketed: false, mass:1, radius:1 },
              { number: 8, position: { x: 150, y: 150 }, velocity: { x: 0, y: 0 }, pocketed: false, mass:1, radius:1 },
              // Add more balls if needed for specific tests
          ],
          pocketedBalls: [],
          fouls: { p1: 0, p2: 0 },
          tableWidth: 200,
          tableHeight: 100,
          pockets: [{ position: { x: 0, y: 0 }, radius: 5 }], // Example pocket
          playerBallTypes: { p1: 'open', p2: 'open' },
          ballInHand: false,
          ballInHandFromBreakScratch: false,
          lastUpdatedLocally: Date.now(),
          pocketedBallsBeforeShot: [],
        },
        shotAnalysis: {
          firstObjectBallHit: 1,
          cueBallHitRail: false,
          objectBallHitRailAfterContact: true,
          isBreakShot: true, 
          ballsPocketedOnBreak: [], 
          numberOfBallsHittingRailOnBreak: 5, // Default to legal number
        },
        currentPlayerId: 'p1',
        gameRules: '8-ball',
      };
    });

    it('should return BREAK_FOUL if cue ball is pocketed on break', () => {
      // Modify state for scratch
      baseInput.tableStateAfterShot.balls.find(b => b.number === 0)!.pocketed = true;
      baseInput.tableStateAfterShot.pocketedBalls.push(0);
      baseInput.shotAnalysis.ballsPocketedOnBreak.push(0);

      const result = referee.analyzeShot(baseInput);

      expect(result.foul).toBe(FoulType.BREAK_FOUL);
      expect(result.reason).toContain('Break Foul: Cue ball was pocketed');
      expect(result.isBallInHand).toBe(true);
      expect(result.nextPlayerId).toBe('p2');
    });

    it('should return BREAK_FOUL if 8-ball is pocketed on break', () => {
      // Modify state for 8-ball pocket
      baseInput.tableStateAfterShot.balls.find(b => b.number === 8)!.pocketed = true;
      baseInput.tableStateAfterShot.pocketedBalls.push(8);
      baseInput.shotAnalysis.ballsPocketedOnBreak.push(8);

      const result = referee.analyzeShot(baseInput);

      expect(result.foul).toBe(FoulType.BREAK_FOUL);
      expect(result.reason).toContain('8-ball pocketed on break');
      // GameState handles the actual loss based on this foul
      expect(result.isBallInHand).toBe(true); 
      expect(result.nextPlayerId).toBe('p2');
    });

    it('should return BREAK_FOUL if insufficient balls hit rail', () => {
      // Modify analysis data
      baseInput.shotAnalysis.numberOfBallsHittingRailOnBreak = 3; // Less than 4

      const result = referee.analyzeShot(baseInput);

      expect(result.foul).toBe(FoulType.BREAK_FOUL);
      expect(result.reason).toContain('Only 3 balls hit a rail');
      expect(result.isBallInHand).toBe(true);
      expect(result.nextPlayerId).toBe('p2');
    });

    it('should NOT return foul for a legal break', () => {
       // Use baseInput as is (assuming it represents a legal break outcome initially)
       // Example: Pocket ball 1 on break
       baseInput.tableStateAfterShot.balls.find(b => b.number === 1)!.pocketed = true;
       baseInput.tableStateAfterShot.pocketedBalls.push(1);
       baseInput.shotAnalysis.ballsPocketedOnBreak.push(1);
       baseInput.shotAnalysis.numberOfBallsHittingRailOnBreak = 4; // Ensure legal rail count

      const result = referee.analyzeShot(baseInput);

      expect(result.foul).toBeNull();
      expect(result.reason).toBeNull();
      expect(result.isBallInHand).toBe(false);
      // Turn might continue or change based on pocketing, handled by standard logic
      // Assuming pocketing a non-8 ball on break continues turn for simplicity here
      // The service's continuation logic might need adjustment for break rules
      expect(result.nextPlayerId).toBe('p1'); 
    });

     it('should return BREAK_FOUL if object ball leaves table on break', () => {
        // Simulate ball 1 leaving table
        const ball1 = baseInput.tableStateAfterShot.balls.find(b => b.number === 1)!;
        ball1.position = { x: -10, y: -10 }; // Mark as off table
        ball1.pocketed = false; // Not pocketed

        const result = referee.analyzeShot(baseInput);

        expect(result.foul).toBe(FoulType.BALLS_OFF_TABLE); // Foul type might be BALLS_OFF_TABLE initially
        expect(result.reason).toContain('Break Foul: Object ball(s) left the table'); // Reason should indicate break context
        expect(result.isBallInHand).toBe(true);
        expect(result.nextPlayerId).toBe('p2');
    });

  });
}); 