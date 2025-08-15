import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Game State Types
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  skill?: number;
  isAI?: boolean;
}

export interface Ball {
  id: number;
  type: 'cue' | 'solid' | 'stripe' | '8ball';
  number: number;
  position: { x: number; y: number };
  isPocketed: boolean;
  velocity?: { x: number; y: number };
}

export interface Shot {
  id: string;
  playerId: string;
  ballId: number;
  targetPocket?: string;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  timestamp: Date;
  success: boolean;
  foul?: string;
  analysis?: {
    angle: number;
    power: number;
    spin?: { x: number; y: number };
    difficulty: number;
    aiScore: number;
  };
}

export interface GameState {
  id: string;
  status: 'waiting' | 'starting' | 'in-progress' | 'paused' | 'completed';
  type: '8ball' | '9ball' | 'straight' | 'cutthroat';
  players: Player[];
  currentPlayerId: string;
  balls: Ball[];
  shots: Shot[];
  score: Record<string, number>;
  turnNumber: number;
  startTime?: Date;
  endTime?: Date;
  winner?: string;
  tableId?: string;
  venueId?: string;
  aiTracking: {
    enabled: boolean;
    confidence: number;
    lastUpdate: Date;
  };
  rules: {
    ballInHand: boolean;
    breakRequired: boolean;
    calledPocket: boolean;
    fouls: string[];
  };
}

// Action Types
type GameAction =
  | { type: 'INIT_GAME'; payload: Partial<GameState> }
  | { type: 'START_GAME' }
  | { type: 'UPDATE_PLAYER'; payload: { playerId: string; updates: Partial<Player> } }
  | { type: 'SWITCH_TURN'; payload: { nextPlayerId: string } }
  | { type: 'UPDATE_BALL'; payload: { ballId: number; updates: Partial<Ball> } }
  | { type: 'UPDATE_BALLS'; payload: Ball[] }
  | { type: 'ADD_SHOT'; payload: Shot }
  | { type: 'UPDATE_SCORE'; payload: { playerId: string; score: number } }
  | { type: 'SET_FOUL'; payload: { playerId: string; foul: string } }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'END_GAME'; payload: { winner: string } }
  | { type: 'UPDATE_AI_TRACKING'; payload: Partial<GameState['aiTracking']> }
  | { type: 'SYNC_STATE'; payload: GameState };

// Reducer
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'INIT_GAME':
      return { ...state, ...action.payload };

    case 'START_GAME':
      return {
        ...state,
        status: 'in-progress',
        startTime: new Date(),
      };

    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId
            ? { ...p, ...action.payload.updates }
            : p
        ),
      };

    case 'SWITCH_TURN':
      return {
        ...state,
        currentPlayerId: action.payload.nextPlayerId,
        turnNumber: state.turnNumber + 1,
      };

    case 'UPDATE_BALL':
      return {
        ...state,
        balls: state.balls.map(b =>
          b.id === action.payload.ballId
            ? { ...b, ...action.payload.updates }
            : b
        ),
      };

    case 'UPDATE_BALLS':
      return {
        ...state,
        balls: action.payload,
      };

    case 'ADD_SHOT':
      return {
        ...state,
        shots: [...state.shots, action.payload],
      };

    case 'UPDATE_SCORE':
      return {
        ...state,
        score: {
          ...state.score,
          [action.payload.playerId]: action.payload.score,
        },
      };

    case 'SET_FOUL':
      return {
        ...state,
        rules: {
          ...state.rules,
          fouls: [...state.rules.fouls, action.payload.foul],
          ballInHand: true,
        },
      };

    case 'PAUSE_GAME':
      return {
        ...state,
        status: 'paused',
      };

    case 'RESUME_GAME':
      return {
        ...state,
        status: 'in-progress',
      };

    case 'END_GAME':
      return {
        ...state,
        status: 'completed',
        winner: action.payload.winner,
        endTime: new Date(),
      };

    case 'UPDATE_AI_TRACKING':
      return {
        ...state,
        aiTracking: {
          ...state.aiTracking,
          ...action.payload,
          lastUpdate: new Date(),
        },
      };

    case 'SYNC_STATE':
      return action.payload;

    default:
      return state;
  }
};

// Initial State
const initialGameState: GameState = {
  id: '',
  status: 'waiting',
  type: '8ball',
  players: [],
  currentPlayerId: '',
  balls: [],
  shots: [],
  score: {},
  turnNumber: 0,
  aiTracking: {
    enabled: false,
    confidence: 0,
    lastUpdate: new Date(),
  },
  rules: {
    ballInHand: false,
    breakRequired: true,
    calledPocket: true,
    fouls: [],
  },
};

// Context
interface GameStateContextType {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  socket: Socket | null;
  // Helper functions
  initGame: (config: Partial<GameState>) => void;
  startGame: () => void;
  makeShot: (shot: Omit<Shot, 'id' | 'timestamp'>) => void;
  updateBallPositions: (balls: Ball[]) => void;
  switchTurn: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: (winnerId: string) => void;
  reportFoul: (playerId: string, foulType: string) => void;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

// Provider Component
interface GameStateProviderProps {
  children: React.ReactNode;
  gameId: string;
  socketUrl?: string;
}

export const GameStateProvider: React.FC<GameStateProviderProps> = ({
  children,
  gameId,
  socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001',
}) => {
  const [gameState, dispatch] = useReducer(gameReducer, {
    ...initialGameState,
    id: gameId,
  });
  const [socket, setSocket] = React.useState<Socket | null>(null);

  // Socket.io connection
  useEffect(() => {
    const newSocket = io(socketUrl);

    newSocket.on('connect', () => {
      console.log('Connected to game server');
      // Send gameId after connection
      newSocket.emit('joinGame', gameId);
    });

    newSocket.on('gameStateUpdate', (state: GameState) => {
      dispatch({ type: 'SYNC_STATE', payload: state });
    });

    newSocket.on('ballUpdate', (balls: Ball[]) => {
      dispatch({ type: 'UPDATE_BALLS', payload: balls });
    });

    newSocket.on('shotMade', (shot: Shot) => {
      dispatch({ type: 'ADD_SHOT', payload: shot });
    });

    newSocket.on('turnSwitch', (nextPlayerId: string) => {
      dispatch({ type: 'SWITCH_TURN', payload: { nextPlayerId } });
    });

    newSocket.on('gameEnd', (winner: string) => {
      dispatch({ type: 'END_GAME', payload: { winner } });
    });

    newSocket.on('aiTrackingUpdate', (tracking: Partial<GameState['aiTracking']>) => {
      dispatch({ type: 'UPDATE_AI_TRACKING', payload: tracking });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [gameId, socketUrl]);

  // Helper functions
  const initGame = useCallback((config: Partial<GameState>) => {
    dispatch({ type: 'INIT_GAME', payload: config });
    socket?.emit('initGame', config);
  }, [socket]);

  const startGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
    socket?.emit('startGame');
  }, [socket]);

  const makeShot = useCallback((shot: Omit<Shot, 'id' | 'timestamp'>) => {
    const fullShot: Shot = {
      ...shot,
      id: `shot_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_SHOT', payload: fullShot });
    socket?.emit('makeShot', fullShot);
  }, [socket]);

  const updateBallPositions = useCallback((balls: Ball[]) => {
    dispatch({ type: 'UPDATE_BALLS', payload: balls });
    socket?.emit('updateBalls', balls);
  }, [socket]);

  const switchTurn = useCallback(() => {
    const nextPlayerId = gameState.players.find(p => p.id !== gameState.currentPlayerId)?.id || '';
    dispatch({ type: 'SWITCH_TURN', payload: { nextPlayerId } });
    socket?.emit('switchTurn', nextPlayerId);
  }, [socket, gameState.players, gameState.currentPlayerId]);

  const pauseGame = useCallback(() => {
    dispatch({ type: 'PAUSE_GAME' });
    socket?.emit('pauseGame');
  }, [socket]);

  const resumeGame = useCallback(() => {
    dispatch({ type: 'RESUME_GAME' });
    socket?.emit('resumeGame');
  }, [socket]);

  const endGame = useCallback((winnerId: string) => {
    dispatch({ type: 'END_GAME', payload: { winner: winnerId } });
    socket?.emit('endGame', winnerId);
  }, [socket]);

  const reportFoul = useCallback((playerId: string, foulType: string) => {
    dispatch({ type: 'SET_FOUL', payload: { playerId, foul: foulType } });
    socket?.emit('reportFoul', { playerId, foulType });
  }, [socket]);

  const value: GameStateContextType = {
    gameState,
    dispatch,
    socket,
    initGame,
    startGame,
    makeShot,
    updateBallPositions,
    switchTurn,
    pauseGame,
    resumeGame,
    endGame,
    reportFoul,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
};

// Hook to use game state
export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

// Utility functions
export const getPlayerBallType = (playerId: string, gameState: GameState): 'solid' | 'stripe' | null => {
  if (gameState.type !== '8ball') return null;
  
  const playerShots = gameState.shots.filter(s => s.playerId === playerId && s.success);
  const firstPocketedBall = playerShots.find(s => {
    const ball = gameState.balls.find(b => b.id === s.ballId);
    return ball && ball.type !== 'cue' && ball.type !== '8ball';
  });

  if (!firstPocketedBall) return null;

  const ball = gameState.balls.find(b => b.id === firstPocketedBall.ballId);
  return ball?.type as 'solid' | 'stripe';
};

export const isPlayerTurn = (playerId: string, gameState: GameState): boolean => {
  return gameState.currentPlayerId === playerId && gameState.status === 'in-progress';
};

export const canShoot8Ball = (playerId: string, gameState: GameState): boolean => {
  if (gameState.type !== '8ball') return false;
  
  const ballType = getPlayerBallType(playerId, gameState);
  if (!ballType) return false;

  const remainingBalls = gameState.balls.filter(b => 
    b.type === ballType && !b.isPocketed
  );

  return remainingBalls.length === 0;
};

export const calculateScore = (playerId: string, gameState: GameState): number => {
  return gameState.shots.filter(s => s.playerId === playerId && s.success).length;
};

export default GameStateProvider;