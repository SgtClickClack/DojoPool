import React from 'react';
import type { Tournament } from '@/types/tournament';
import { TournamentStatus } from '@/types/tournament';

interface TournamentListProps {
  tournaments: Tournament[];
  onJoin: (tournamentId: string) => void;
  onView: (tournamentId: string) => void;
  onFilter?: (filter: string) => void;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
}

const TournamentList: React.FC<TournamentListProps> = ({ 
  tournaments, 
  onJoin, 
  onView, 
  onFilter, 
  loading = false, 
  error, 
  disabled = false 
}) => {
  // Component implementation
  return (
    <div>
      {loading && <div>Loading tournaments...</div>}
      {error && <div>{error}</div>}
      {!tournaments.length && !loading && !error && <div>No tournaments available</div>}
      {tournaments.map((tournament) => (
        <div key={tournament.id}>
          <h3>{tournament.name}</h3>
          <p>{tournament.description}</p>
          <p>Status: {tournament.status}</p>
          <button onClick={() => onJoin(tournament.id)} disabled={disabled}>
            Join
          </button>
          <button onClick={() => onView(tournament.id)}>
            View
          </button>
        </div>
      ))}
    </div>
  );
};

export default TournamentList;
