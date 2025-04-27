import React from 'react';
import { useGameState } from '../../hooks/useGameState';
import { GameStatus } from '../../types/game';

interface GameViewProps {
  gameId: string;
  playerId: string;
}

export const GameView: React.FC<GameViewProps> = ({ gameId, playerId }) => {
  const {
    gameState,
    loading,
    error,
    takeShot,
    reportFoul,
    pauseGame,
    resumeGame,
    cancelGame,
    isMyTurn,
    canTakeShot
  } = useGameState({ gameId, playerId });

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading game...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Error: {error}
      </div>
    );
  }

  if (!gameState) {
    return <div>No game state available</div>;
  }

  const handlePauseResume = async () => {
    if (gameState.gameStatus === GameStatus.ACTIVE) {
      await pauseGame();
    } else if (gameState.gameStatus === GameStatus.PAUSED) {
      await resumeGame();
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Game #{gameId}</h2>
        <div className="space-x-2">
          <button
            onClick={handlePauseResume}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={!isMyTurn}
          >
            {gameState.gameStatus === GameStatus.ACTIVE ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={cancelGame}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Cancel Game
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {gameState.players.map((player) => (
          <div
            key={player.id}
            className={`p-4 rounded ${
              player.id === gameState.currentPlayer
                ? 'bg-green-100 border-green-500'
                : 'bg-gray-100 border-gray-300'
            } border`}
          >
            <div className="font-bold">{player.name}</div>
            <div>Score: {gameState.scores[player.id] || 0}</div>
            <div>
              Shots: {gameState.shots[player.id]?.successful || 0}/
              {gameState.shots[player.id]?.total || 0}
            </div>
            <div>
              Type: {gameState.playerTypes[player.id] || 'Not assigned'}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">Game Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Current Status:</strong> {gameState.gameStatus}
          </div>
          <div>
            <strong>Current Turn:</strong>{' '}
            {gameState.players.find(p => p.id === gameState.currentPlayer)?.name || 'Unknown'}
          </div>
          {gameState.winner && (
            <div className="col-span-2">
              <strong>Winner:</strong>{' '}
              {gameState.players.find(p => p.id === gameState.winner)?.name || 'Unknown'}
            </div>
          )}
        </div>
      </div>

      {/* Placeholder for the pool table visualization */}
      <div className="h-96 bg-gray-200 rounded flex items-center justify-center">
        Pool Table Visualization Coming Soon
      </div>

      {/* Game controls - these will be replaced with actual shot controls later */}
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">Controls</h3>
        <div className="space-x-2">
          <button
            onClick={() => takeShot({ ballNumber: 0, pocketed: false })}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            disabled={!canTakeShot}
          >
            Take Shot
          </button>
          <button
            onClick={() => reportFoul({ type: 'scratch' })}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
            disabled={!isMyTurn}
          >
            Report Foul
          </button>
        </div>
      </div>
    </div>
  );
}; 