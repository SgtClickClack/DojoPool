import React from 'react';

const bracketContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  fontFamily: 'sans-serif',
};

const roundStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around',
  marginRight: '50px',
};

const matchStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  marginBottom: '20px',
  border: '1px solid #ccc',
  padding: '10px',
  borderRadius: '5px',
};

const playerStyle: React.CSSProperties = {
  padding: '5px',
};

interface Player {
  id: string;
  name: string;
}

interface Match {
  id: string;
  playerA: Player | null;
  playerB: Player | null;
  winner: Player | null;
}

interface Round {
  matches: Match[];
}

interface BracketProps {
  rounds: Round[];
}

export const Bracket: React.FC<BracketProps> = ({ rounds }) => {
  return (
    <div style={bracketContainerStyle}>
      {rounds.map((round, roundIndex) => (
        <div key={roundIndex} style={roundStyle}>
          {round.matches.map((match) => (
            <div key={match.id} style={matchStyle}>
              <div style={playerStyle}>
                {match.playerA ? match.playerA.name : 'TBD'}
              </div>
              <div style={playerStyle}>
                {match.playerB ? match.playerB.name : 'TBD'}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
