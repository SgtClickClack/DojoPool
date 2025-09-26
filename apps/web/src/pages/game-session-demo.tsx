import React, { useState } from 'react';
import GameSessionView from '@/components/GameSession/GameSessionView';

// Mock data for demo
const mockMatch = {
  id: 'demo-match-1',
  player1Id: 'player1',
  player2Id: 'player2',
  status: 'ACTIVE' as const,
  score1: 0,
  score2: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCurrentUser = {
  id: 'demo-user-1',
  email: 'demo@example.com',
  username: 'DemoUser',
  profile: {
    displayName: 'Demo Player',
    avatarUrl: '/demo-avatar.jpg',
  },
};

const handleShot = (shotData: any) => {
  console.log('Shot taken:', shotData);
};

const handleEndGame = (winnerId: string) => {
  console.log('Game ended, winner:', winnerId);
};

const handleLeave = () => {
  console.log('Game session left');
};

export default function GameSessionDemo() {
  const [sessionId] = useState('demo-session-1');

  return (
    <div>
      <h1>Game Session Demo</h1>
      <GameSessionView
        sessionId={sessionId}
        match={mockMatch}
        currentUser={mockCurrentUser}
        onShot={handleShot}
        onEndGame={handleEndGame}
        onLeave={handleLeave}
      />
    </div>
  );
}
