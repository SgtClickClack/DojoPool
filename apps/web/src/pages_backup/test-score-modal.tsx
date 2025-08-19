import ReportScoreModal from '@/components/tournament/ReportScoreModal';
import { Match, TournamentParticipant } from '@/services/ApiService';
import React, { useState } from 'react';

const TestScoreModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mockMatch: Match = {
    id: 'match-123',
    tournamentId: 'tournament-456',
    venueId: 'venue-789',
    playerAId: 'player-a',
    playerBId: 'player-b',
    scoreA: 0,
    scoreB: 0,
    status: 'ACTIVE',
    round: 1,
  };

  const mockParticipants: TournamentParticipant[] = [
    {
      id: 'player-a',
      tournamentId: 'tournament-456',
      userId: 'user-a',
      joinedAt: '2024-01-01T00:00:00Z',
      status: 'ACTIVE',
      user: {
        id: 'user-a',
        username: 'PlayerA',
        email: 'playera@example.com',
      },
    },
    {
      id: 'player-b',
      tournamentId: 'tournament-456',
      userId: 'user-b',
      joinedAt: '2024-01-01T00:00:00Z',
      status: 'ACTIVE',
      user: {
        id: 'user-b',
        username: 'PlayerB',
        email: 'playerb@example.com',
      },
    },
  ];

  const handleScoreSubmitted = () => {
    console.log('Score submitted!');
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>🏆 Report Score Modal Test</h1>
      <p>Click the button below to test the ReportScoreModal component:</p>

      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Open Score Modal
      </button>

      <ReportScoreModal
        match={mockMatch}
        participants={mockParticipants}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onScoreSubmitted={handleScoreSubmitted}
      />
    </div>
  );
};

export default TestScoreModal;
