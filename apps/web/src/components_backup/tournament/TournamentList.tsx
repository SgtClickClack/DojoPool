import React from 'react';

interface TournamentListProps {
  onTournamentSelect?: (t: any) => void;
}

const mockTournaments = [
  {
    id: 'tourn-1',
    name: 'Neo Dojo Open',
    venue: { id: 'v1', name: 'Neo Dojo' },
    format: 'SINGLE_ELIMINATION',
  },
  {
    id: 'tourn-2',
    name: 'Cyber City Classic',
    venue: { id: 'v2', name: 'Cyber City Arena' },
    format: 'DOUBLE_ELIMINATION',
  },
];

const TournamentList: React.FC<TournamentListProps> = ({ onTournamentSelect }) => {
  return (
    <div style={{ padding: 16 }}>
      <h3>Available Tournaments</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {mockTournaments.map((t) => (
          <li
            key={t.id}
            style={{
              marginBottom: 12,
              padding: 12,
              border: '1px solid #0ff',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            onClick={() => onTournamentSelect && onTournamentSelect(t)}
          >
            <div style={{ fontWeight: 600 }}>{t.name}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {t.venue.name} • {t.format}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TournamentList;
