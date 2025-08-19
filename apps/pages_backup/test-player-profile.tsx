import MatchHistory from '@/components/player/MatchHistory';
import PlayerHeader from '@/components/player/PlayerHeader';
import TournamentHistory from '@/components/player/TournamentHistory';
import { PlayerProfile } from '@/services/ApiService';
import React, { useState } from 'react';

const TestPlayerProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'header' | 'matches' | 'tournaments'
  >('header');

  const mockPlayer: PlayerProfile = {
    id: 'player-123',
    username: 'PoolMaster2024',
    email: 'poolmaster@example.com',
    role: 'PLAYER',
    profile: {
      displayName: 'Alex "The Shark" Rodriguez',
      avatarUrl: '',
      skillRating: 1850,
      bio: 'Professional pool player with 15+ years of experience. Specializing in 8-ball and 9-ball. Love teaching new players and competing in tournaments.',
      location: 'Brisbane, Australia',
      joinDate: '2020-03-15T00:00:00Z',
    },
    stats: {
      totalMatches: 247,
      wins: 189,
      losses: 58,
      winRate: 0.765,
      totalTournaments: 23,
      tournamentWins: 8,
      highestFinish: 1,
      currentStreak: 12,
      longestStreak: 18,
    },
    recentMatches: [
      {
        id: 'match-001',
        tournamentId: 'tournament-456',
        venueId: 'venue-789',
        playerAId: 'player-123',
        playerBId: 'player-456',
        winnerId: 'player-123',
        loserId: 'player-456',
        scoreA: 7,
        scoreB: 3,
        status: 'COMPLETED',
        round: 2,
        startedAt: '2024-01-15T14:30:00Z',
        endedAt: '2024-01-15T15:45:00Z',
      },
      {
        id: 'match-002',
        tournamentId: 'tournament-456',
        venueId: 'venue-789',
        playerAId: 'player-789',
        playerBId: 'player-123',
        winnerId: 'player-123',
        loserId: 'player-789',
        scoreA: 2,
        scoreB: 7,
        status: 'COMPLETED',
        round: 1,
        startedAt: '2024-01-14T16:00:00Z',
        endedAt: '2024-01-14T17:15:00Z',
      },
      {
        id: 'match-003',
        tournamentId: 'tournament-789',
        venueId: 'venue-123',
        playerAId: 'player-123',
        playerBId: 'player-999',
        winnerId: 'player-999',
        loserId: 'player-123',
        scoreA: 4,
        scoreB: 7,
        status: 'COMPLETED',
        round: 3,
        startedAt: '2024-01-10T19:00:00Z',
        endedAt: '2024-01-10T20:30:00Z',
      },
    ],
    tournamentHistory: [
      {
        tournamentId: 'tournament-456',
        tournamentName: 'Brisbane Winter Championship 2024',
        finish: 1,
        status: 'COMPLETED',
        joinedAt: '2024-01-01T00:00:00Z',
      },
      {
        tournamentId: 'tournament-789',
        tournamentName: 'Queensland Open 2023',
        finish: 3,
        status: 'COMPLETED',
        joinedAt: '2023-12-01T00:00:00Z',
      },
      {
        tournamentId: 'tournament-101',
        tournamentName: 'Gold Coast Masters 2023',
        finish: 2,
        status: 'COMPLETED',
        joinedAt: '2023-11-15T00:00:00Z',
      },
      {
        tournamentId: 'tournament-202',
        tournamentName: 'Australian Nationals 2023',
        finish: 5,
        status: 'COMPLETED',
        joinedAt: '2023-10-01T00:00:00Z',
      },
    ],
    achievements: [
      {
        id: 'ach-001',
        name: 'First Victory',
        description: 'Won your first match',
        unlockedAt: '2020-03-20T00:00:00Z',
        icon: '🏆',
      },
      {
        id: 'ach-002',
        name: 'Tournament Champion',
        description: 'Won your first tournament',
        unlockedAt: '2021-06-15T00:00:00Z',
        icon: '👑',
      },
      {
        id: 'ach-003',
        name: 'Win Streak',
        description: 'Won 10 matches in a row',
        unlockedAt: '2023-08-22T00:00:00Z',
        icon: '🔥',
      },
    ],
  };

  const renderComponent = () => {
    switch (activeTab) {
      case 'header':
        return <PlayerHeader player={mockPlayer} />;
      case 'matches':
        return (
          <MatchHistory
            matches={mockPlayer.recentMatches}
            playerId={mockPlayer.id}
          />
        );
      case 'tournaments':
        return (
          <TournamentHistory tournamentHistory={mockPlayer.tournamentHistory} />
        );
      default:
        return <PlayerHeader player={mockPlayer} />;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1
        style={{ color: '#ffffff', textAlign: 'center', marginBottom: '2rem' }}
      >
        🎱 Player Profile Components Test
      </h1>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('header')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor:
              activeTab === 'header' ? '#00ff9d' : 'rgba(255, 255, 255, 0.1)',
            color: activeTab === 'header' ? '#000' : '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}
        >
          Player Header
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor:
              activeTab === 'matches' ? '#00ff9d' : 'rgba(255, 255, 255, 0.1)',
            color: activeTab === 'matches' ? '#000' : '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}
        >
          Match History
        </button>

        <button
          onClick={() => setActiveTab('tournaments')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor:
              activeTab === 'tournaments'
                ? '#00ff9d'
                : 'rgba(255, 255, 255, 0.1)',
            color: activeTab === 'tournaments' ? '#000' : '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}
        >
          Tournament History
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {renderComponent()}
      </div>
    </div>
  );
};

export default TestPlayerProfile;
