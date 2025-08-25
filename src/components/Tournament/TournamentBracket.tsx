import React from 'react';

export interface TournamentBracketProps {
  tournamentId?: string;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournamentId,
}) => {
  return (
    <div>
      <h2>Tournament Bracket</h2>
      {tournamentId && <p>Tournament ID: {tournamentId}</p>}
    </div>
  );
};

export default TournamentBracket;
