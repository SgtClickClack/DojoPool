import React from 'react';
import { Link, useParams } from 'react-router-dom';

const PlayerProfilePage: React.FC = () => {
  const params = useParams();
  const playerId = params.id as string | undefined;

  return (
    <div style={{ padding: 16 }}>
      <h2>Player Profile</h2>
      <p>Player ID: <strong>{playerId ?? 'unknown'}</strong></p>
      <p>This is a minimal player profile page placeholder under apps/web/src.</p>
      <div style={{ marginTop: 12 }}>
        <Link to="/tournaments">Back to Tournaments</Link>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
