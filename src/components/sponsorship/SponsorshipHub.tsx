import React, { useState, useEffect } from 'react';
import { SponsorshipBracket, PlayerSponsorshipProgress, SponsorshipStats } from '../../types/sponsorship';
import { BracketCard } from './BracketCard';
import { SponsorshipStats as StatsComponent } from './SponsorshipStats';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import './SponsorshipHub.css';

interface SponsorshipHubProps {
  playerId: string;
  playerLevel: number;
}

export const SponsorshipHub: React.FC<SponsorshipHubProps> = ({ playerId, playerLevel }) => {
  const [brackets, setBrackets] = useState<SponsorshipBracket[]>([]);
  const [playerProgress, setPlayerProgress] = useState<PlayerSponsorshipProgress[]>([]);
  const [stats, setStats] = useState<SponsorshipStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadData();
  }, [playerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load brackets, progress, and stats in parallel
      const [bracketsResponse, progressResponse, statsResponse] = await Promise.all([
        fetch('/api/sponsorship/brackets'),
        fetch('/api/sponsorship/player/progress', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch('/api/sponsorship/player/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ]);

      if (!bracketsResponse.ok || !progressResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to load sponsorship data');
      }

      const bracketsData = await bracketsResponse.json();
      const progressData = await progressResponse.json();
      const statsData = await statsResponse.json();

      setBrackets(bracketsData.data || []);
      setPlayerProgress(progressData.data || []);
      setStats(statsData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBrackets = () => {
    const progressMap = new Map(playerProgress.map(p => [p.bracketId, p]));

    return brackets.filter(bracket => {
      const progress = progressMap.get(bracket.bracketId);
      
      switch (selectedFilter) {
        case 'available':
          return !progress && playerLevel >= bracket.requiredLevel;
        case 'active':
          return progress && (progress.status === 'unlocked' || progress.status === 'in_progress');
        case 'completed':
          return progress && (progress.status === 'completed' || progress.status === 'redeemed');
        default:
          return true;
      }
    });
  };

  const getBracketStatus = (bracket: SponsorshipBracket): 'locked' | 'available' | 'unlocked' | 'in_progress' | 'completed' | 'redeemed' => {
    const progress = playerProgress.find(p => p.bracketId === bracket.bracketId);
    
    if (progress) {
      return progress.status as any;
    }
    
    return playerLevel >= bracket.requiredLevel ? 'available' : 'locked';
  };

  const handleUnlockBracket = async (bracketId: string) => {
    try {
      const response = await fetch(`/api/sponsorship/player/unlock/${bracketId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unlock bracket');
      }

      // Reload data to reflect changes
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock bracket');
    }
  };

  if (loading) {
    return (
      <div className="sponsorship-hub">
        <LoadingSpinner message="Loading sponsorship brackets..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="sponsorship-hub">
        <ErrorMessage message={error} onRetry={loadData} />
      </div>
    );
  }

  const filteredBrackets = getFilteredBrackets();

  return (
    <div className="sponsorship-hub">
      <div className="sponsorship-header">
        <h1 className="sponsorship-title">The Path of the Patron</h1>
        <p className="sponsorship-subtitle">
          Embark on legendary quests sponsored by master craftsmen and earn exclusive rewards
        </p>
      </div>

      {stats && <StatsComponent stats={stats} />}

      <div className="sponsorship-controls">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            All Paths ({brackets.length})
          </button>
          <button
            className={`filter-tab ${selectedFilter === 'available' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('available')}
          >
            Available ({brackets.filter(b => getBracketStatus(b) === 'available').length})
          </button>
          <button
            className={`filter-tab ${selectedFilter === 'active' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('active')}
          >
            Active ({brackets.filter(b => ['unlocked', 'in_progress'].includes(getBracketStatus(b))).length})
          </button>
          <button
            className={`filter-tab ${selectedFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('completed')}
          >
            Completed ({brackets.filter(b => ['completed', 'redeemed'].includes(getBracketStatus(b))).length})
          </button>
        </div>
      </div>

      <div className="brackets-grid">
        {filteredBrackets.length === 0 ? (
          <div className="no-brackets">
            <div className="no-brackets-icon">🎯</div>
            <h3>No brackets found</h3>
            <p>
              {selectedFilter === 'available' 
                ? 'Keep playing and leveling up to unlock more sponsorship brackets!'
                : 'Try adjusting your filter to see more brackets.'}
            </p>
          </div>
        ) : (
          filteredBrackets.map(bracket => (
            <BracketCard
              key={bracket.bracketId}
              bracket={bracket}
              status={getBracketStatus(bracket)}
              progress={playerProgress.find(p => p.bracketId === bracket.bracketId)}
              playerLevel={playerLevel}
              onUnlock={() => handleUnlockBracket(bracket.bracketId)}
            />
          ))
        )}
      </div>
    </div>
  );
};