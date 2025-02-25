import { useState, useEffect, useCallback } from 'react';
import { GameState, BallStatus, GameStatus } from '../types/game';
import { useWebSocket } from './useWebSocket';

export const useGameState = (gameId: string) => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const { socket, connected } = useWebSocket();

    useEffect(() => {
        if (connected && socket) {
            socket.emit('join_game', { gameId });

            socket.on('game_state_update', (newState: GameState) => {
                setGameState(newState);
            });

            // Initial game state fetch
            socket.emit('get_game_state', { gameId });

            return () => {
                socket.emit('leave_game', { gameId });
                socket.off('game_state_update');
            };
        }
    }, [gameId, connected, socket]);

    const updateBallStatus = useCallback((ballNumber: number, status: BallStatus) => {
        if (connected && socket) {
            socket.emit('update_ball_status', {
                gameId,
                ballNumber,
                status
            });
        }
    }, [gameId, connected, socket]);

    const endTurn = useCallback(() => {
        if (connected && socket) {
            socket.emit('end_turn', { gameId });
        }
    }, [gameId, connected, socket]);

    const endGame = useCallback(() => {
        if (connected && socket) {
            socket.emit('end_game', {
                gameId,
                status: GameStatus.COMPLETED
            });
        }
    }, [gameId, connected, socket]);

    const declareWinner = useCallback((playerId: string) => {
        if (connected && socket) {
            socket.emit('declare_winner', {
                gameId,
                winnerId: playerId
            });
        }
    }, [gameId, connected, socket]);

    const reportFoul = useCallback((playerId: string, foulType: string) => {
        if (connected && socket) {
            socket.emit('report_foul', {
                gameId,
                playerId,
                foulType
            });
        }
    }, [gameId, connected, socket]);

    return {
        gameState,
        updateBallStatus,
        endTurn,
        endGame,
        declareWinner,
        reportFoul,
        connected
    };
}; 