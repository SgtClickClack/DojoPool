import { AIRefereeService, FoulType, RefereeInput, RefereeResult } from './AIRefereeService';
import { GameTable, BallState, ShotAnalysisData } from '../../core/game/GameState'; // Adjust path as needed
import * as SkyT1Client from './skyT1Client'; // Import the module to mock

// Mock the skyT1Client module
jest.mock('./skyT1Client');

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
    ballsPocketedOnBreak: [],
    numberOfBallsHittingRailOnBreak: 0,
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
  let mockSkyT1AnalyzeShot: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Get a reference to the mocked function
    mockSkyT1AnalyzeShot = jest.spyOn(SkyT1Client, 'skyT1AnalyzeShot');

    referee = new AIRefereeService();
  });

  // --- Test Cases --- //

  it('should call skyT1AnalyzeShot and return its result when a valid input is provided', async () => {
    const input = createMockRefereeInput({}); // Use default valid input
    const expectedResult: RefereeResult = {
      foul: null,
      reason: 'SkyT1: OK',
      isBallInHand: false,
      nextPlayerId: 'p2',
    };

    // Configure the mock to return the expected result
    mockSkyT1AnalyzeShot.mockResolvedValue(expectedResult);

    // Call the method under test
    const result = await referee.analyzeShot(input);

    // Assertions
    expect(mockSkyT1AnalyzeShot).toHaveBeenCalledTimes(1);
    expect(mockSkyT1AnalyzeShot).toHaveBeenCalledWith(input); // Ensure it was called with the correct input
    expect(result).toEqual(expectedResult); // Ensure the service returned the mock's result
  });

  it('should handle foul detection result from SkyT1 (e.g., Scratch)', async () => {
    const input = createMockRefereeInput({});
    const expectedResult: RefereeResult = {
      foul: FoulType.SCRATCH,
      reason: 'SkyT1: Cue ball pocketed',
      isBallInHand: true,
      nextPlayerId: 'p2',
    };

    mockSkyT1AnalyzeShot.mockResolvedValue(expectedResult);

    const result = await referee.analyzeShot(input);

    expect(mockSkyT1AnalyzeShot).toHaveBeenCalledWith(input);
    expect(result.foul).toBe(FoulType.SCRATCH);
    expect(result.isBallInHand).toBe(true);
    expect(result.nextPlayerId).toBe('p2');
    expect(result).toEqual(expectedResult);
  });

  it('should handle turn continuation result from SkyT1', async () => {
    const input = createMockRefereeInput({ currentPlayerId: 'p1' });
    const expectedResult: RefereeResult = {
      foul: null,
      reason: 'SkyT1: Legal pot, turn continues',
      isBallInHand: false,
      nextPlayerId: 'p1', // SkyT1 indicates p1 continues
    };

    mockSkyT1AnalyzeShot.mockResolvedValue(expectedResult);

    const result = await referee.analyzeShot(input);

    expect(mockSkyT1AnalyzeShot).toHaveBeenCalledWith(input);
    expect(result.foul).toBeNull();
    expect(result.nextPlayerId).toBe('p1');
    expect(result).toEqual(expectedResult);
  });

 it('should handle SkyT1 API errors gracefully', async () => {
    const input = createMockRefereeInput({ currentPlayerId: 'p1' });
    const apiError = new Error('SkyT1 Timeout');

    // Configure the mock to reject with an error
    mockSkyT1AnalyzeShot.mockRejectedValue(apiError);

    // Call the method under test
    const result = await referee.analyzeShot(input);

    // Assertions for error handling
    expect(mockSkyT1AnalyzeShot).toHaveBeenCalledWith(input);
    expect(result.foul).toBeNull(); // Default safe state on error
    expect(result.reason).toContain('Error analyzing shot with Sky-T1: SkyT1 Timeout');
    expect(result.isBallInHand).toBe(false);
    expect(result.nextPlayerId).toBe('p2'); // Default to opponent's turn on error
  });

  it('should handle invalid responses from SkyT1 gracefully', async () => {
     const input = createMockRefereeInput({ currentPlayerId: 'p1' });
     const invalidResponse = { some: 'unexpected data' }; // Doesn't match RefereeResult

     // Configure the mock to return an invalid structure
     mockSkyT1AnalyzeShot.mockResolvedValue(invalidResponse as any);

     const result = await referee.analyzeShot(input);

     expect(mockSkyT1AnalyzeShot).toHaveBeenCalledWith(input);
     expect(result.foul).toBeNull();
     expect(result.reason).toContain('Error: Could not get analysis from Sky-T1');
     expect(result.isBallInHand).toBe(false);
     expect(result.nextPlayerId).toBe('p2');
   });

  // --- Remove or comment out tests for internal logic ---
  /*
  it('should detect Scratch foul when cue ball is pocketed', () => { ... });
  it('should detect Scratch foul when cue ball is off table', () => { ... });
  it('should detect No Contact foul when cue hits nothing', () => { ... });
  it('should detect Wrong Ball First when hitting opponent ball (solids vs stripe)', () => { ... });
  it('should detect Wrong Ball First when hitting 8-ball before group cleared', () => { ... });
  it('should detect No Rail After Contact foul', () => { ... });
  it('should NOT call No Rail foul if a legal ball was pocketed', () => { ... });
  it('should detect Balls Off Table foul', () => { ... });
  it('should allow turn continuation if a legal ball is pocketed and no foul occurs', () => { ... });
  it('should change turn if no legal ball is pocketed and no foul occurs', () => { ... });

  describe('Break Shot Foul Analysis', () => {
    it('should return BREAK_FOUL if cue ball is pocketed on break', () => { ... });
    it('should return BREAK_FOUL if 8-ball is pocketed on break', () => { ... });
    it('should return BREAK_FOUL if insufficient balls hit rail', () => { ... });
    it('should NOT return foul for a legal break', () => { ... });
    it('should return BREAK_FOUL if object ball leaves table on break', () => { ... });
  });
  */
}); 