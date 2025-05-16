import React from 'react';
// Import the Match interface (assuming it's exported from TournamentDetailPage or moved to a types file)
// Adjust the import path as necessary
import { Match } from '../pages/TournamentDetailPage';

interface MatchListProps {
  matches: Match[];
  onReportScore: (matchId: number) => void; // Add callback prop
  isAdmin?: boolean; // Prop to indicate if current user is admin
}

const MatchList: React.FC<MatchListProps> = ({ matches, onReportScore, isAdmin }) => {

  // Helper to display player info
  const renderPlayer = (playerId?: number | null, username?: string) => {
    if (username) return username;
    if (playerId) return `Player ${playerId}`;
    return 'TBD'; // Or 'BYE' if applicable, needs more logic
  };

  // Simple grouping by round (can be made more sophisticated)
  const matchesByRound: { [round: number]: Match[] } = {};
  matches.forEach(match => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round].push(match);
  });

  return (
    <div>
      <h2>Matches</h2>
      {Object.entries(matchesByRound)
        .sort(([roundA], [roundB]) => parseInt(roundA) - parseInt(roundB)) // Sort rounds numerically
        .map(([round, roundMatches]) => (
          <div key={`round-${round}`} style={{ marginBottom: '20px' }}>
            <h3>Round {round} {roundMatches[0]?.bracket_type ? `(${roundMatches[0].bracket_type})` : ''}</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {roundMatches
                .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0)) // Sort matches within round
                .map(match => (
                  <li key={match.id} style={{ marginBottom: '10px', border: '1px solid #ddd', padding: '8px' }}>
                    <div>
                      Match {match.match_number ?? match.id}:
                      <strong> {renderPlayer(match.player1_id, match.player1_username)}</strong> vs
                      <strong> {renderPlayer(match.player2_id, match.player2_username)}</strong>
                    </div>
                    <div>Status: {match.status}</div>
                    {match.status === 'COMPLETED' && (
                      <div>
                        Score: {match.score ?? 'N/A'} | Winner: {renderPlayer(match.winner_id)}
                        {/* Add logic to highlight the actual winner username if available */}
                      </div>
                    )}
                    {/* Add button for admins/players to report score later */}
                    {isAdmin && match.status !== 'COMPLETED' && match.player1_id && match.player2_id && (
                      <button
                        onClick={() => onReportScore(match.id)}
                        style={{ marginTop: '5px', marginLeft: '10px', padding: '2px 5px' }}>
                        Report Score
                      </button>
                    )}
                  </li>
              ))}
            </ul>
          </div>
      ))}
    </div>
  );
};

export default MatchList; 