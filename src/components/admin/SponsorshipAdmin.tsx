import React, { useState, useEffect } from 'react';
import { SponsorshipBracket, PlayerSponsorshipProgress } from '../../types/sponsorship';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import './SponsorshipAdmin.css';

export const SponsorshipAdmin: React.FC = () => {
  const [brackets, setBrackets] = useState<SponsorshipBracket[]>([]);
  const [players, setPlayers] = useState<PlayerSponsorshipProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'brackets' | 'players' | 'analytics'>('brackets');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load brackets and player progress
      const [bracketsResponse, playersResponse] = await Promise.all([
        fetch('/api/sponsorship/admin/brackets', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        }),
        fetch('/api/sponsorship/admin/players', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        })
      ]);

      if (!bracketsResponse.ok || !playersResponse.ok) {
        throw new Error('Failed to load admin data');
      }

      const bracketsData = await bracketsResponse.json();
      const playersData = await playersResponse.json();

      setBrackets(bracketsData.data || []);
      setPlayers(playersData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleBracketStatus = async (bracketId: string, newStatus: 'active' | 'paused' | 'ended') => {
    try {
      const response = await fetch(`/api/sponsorship/admin/brackets/${bracketId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update bracket status');
      }

      // Refresh data
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bracket');
    }
  };

  const resetPlayerProgress = async (playerId: string, bracketId: string) => {
    try {
      const response = await fetch(`/api/sponsorship/admin/reset-progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerId, bracketId })
      });

      if (!response.ok) {
        throw new Error('Failed to reset player progress');
      }

      // Refresh data
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset progress');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} type="error" />;
  }

  return (
    <div className="sponsorship-admin">
      <div className="admin-header">
        <h1>Sponsorship Administration</h1>
        <p>Manage sponsorship brackets and player progress</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'brackets' ? 'active' : ''}`}
          onClick={() => setActiveTab('brackets')}
        >
          📋 Brackets ({brackets.length})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          👥 Players ({players.length})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'brackets' && (
          <div className="brackets-admin">
            <div className="brackets-header">
              <h2>Sponsorship Brackets</h2>
              <button className="add-bracket-button">
                ➕ Add New Bracket
              </button>
            </div>
            
            <div className="brackets-table">
              <table>
                <thead>
                  <tr>
                    <th>Bracket</th>
                    <th>Sponsor</th>
                    <th>Level Req.</th>
                    <th>Participants</th>
                    <th>Status</th>
                    <th>End Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brackets.map(bracket => (
                    <tr key={bracket.bracketId}>
                      <td>
                        <div className="bracket-info">
                          <strong>{bracket.inGameTitle}</strong>
                          <div className="bracket-id">{bracket.bracketId}</div>
                        </div>
                      </td>
                      <td>
                        <div className="sponsor-info">
                          <img src={bracket.sponsorLogo} alt="" className="sponsor-logo-small" />
                          {bracket.sponsorName}
                        </div>
                      </td>
                      <td>Level {bracket.levelRequirement}</td>
                      <td>{bracket.participantCount}</td>
                      <td>
                        <span className={`status-badge ${bracket.status}`}>
                          {bracket.status}
                        </span>
                      </td>
                      <td>{new Date(bracket.endDate).toLocaleDateString()}</td>
                      <td>
                        <div className="bracket-actions">
                          <select 
                            value={bracket.status}
                            onChange={(e) => toggleBracketStatus(bracket.bracketId, e.target.value as any)}
                          >
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="ended">Ended</option>
                          </select>
                          <button className="edit-button">✏️</button>
                          <button className="view-button">👁️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="players-admin">
            <h2>Player Progress</h2>
            
            <div className="players-table">
              <table>
                <thead>
                  <tr>
                    <th>Player ID</th>
                    <th>Bracket</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Digital Claimed</th>
                    <th>Physical Redeemed</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(player => {
                    const bracket = brackets.find(b => b.bracketId === player.bracketId);
                    const completedChallenges = Object.values(player.challengeProgress).filter(p => p.isCompleted).length;
                    const totalChallenges = bracket?.challenges.length || 0;
                    
                    return (
                      <tr key={`${player.playerId}-${player.bracketId}`}>
                        <td>{player.playerId}</td>
                        <td>{bracket?.inGameTitle || 'Unknown'}</td>
                        <td>
                          <span className={`status-badge ${player.status}`}>
                            {player.status}
                          </span>
                        </td>
                        <td>
                          <div className="progress-cell">
                            {completedChallenges} / {totalChallenges}
                            <div className="progress-bar-mini">
                              <div 
                                className="progress-fill-mini"
                                style={{ width: `${totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>{player.digitalRewardClaimed ? '✅' : '❌'}</td>
                        <td>{player.physicalRewardRedeemed ? '✅' : '❌'}</td>
                        <td>
                          <div className="player-actions">
                            <button 
                              className="reset-button"
                              onClick={() => resetPlayerProgress(player.playerId, player.bracketId)}
                            >
                              🔄 Reset
                            </button>
                            <button className="view-button">👁️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-admin">
            <h2>Sponsorship Analytics</h2>
            
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>📊 Total Brackets</h3>
                <div className="analytics-value">{brackets.length}</div>
              </div>
              
              <div className="analytics-card">
                <h3>👥 Active Players</h3>
                <div className="analytics-value">
                  {players.filter(p => p.status === 'in_progress').length}
                </div>
              </div>
              
              <div className="analytics-card">
                <h3>🏆 Completed Quests</h3>
                <div className="analytics-value">
                  {players.filter(p => p.status === 'completed').length}
                </div>
              </div>
              
              <div className="analytics-card">
                <h3>💎 Digital Claims</h3>
                <div className="analytics-value">
                  {players.filter(p => p.digitalRewardClaimed).length}
                </div>
              </div>
              
              <div className="analytics-card">
                <h3>📦 Physical Redemptions</h3>
                <div className="analytics-value">
                  {players.filter(p => p.physicalRewardRedeemed).length}
                </div>
              </div>
              
              <div className="analytics-card">
                <h3>🔥 Conversion Rate</h3>
                <div className="analytics-value">
                  {players.length > 0 
                    ? `${Math.round((players.filter(p => p.status === 'completed').length / players.length) * 100)}%`
                    : '0%'
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};