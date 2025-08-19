import { useState } from 'react';

const ProfilePage = () => {
  const [user] = useState({
    name: 'Demo Player',
    level: 5,
    clan: 'Pool Masters',
    wins: 23,
    losses: 7,
    avatar: '🎱',
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Player Profile</h1>

      {/* Profile Header */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '1.5rem',
          border: '1px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <div style={{ fontSize: '4rem' }}>{user.avatar}</div>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0' }}>{user.name}</h2>
          <p style={{ margin: '0', color: '#666' }}>
            Level {user.level} • {user.clan}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#007acc' }}>
            {user.wins}
          </h3>
          <p style={{ margin: '0', color: '#666' }}>Wins</p>
        </div>
        <div
          style={{
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#cc0000' }}>
            {user.losses}
          </h3>
          <p style={{ margin: '0', color: '#666' }}>Losses</p>
        </div>
        <div
          style={{
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#00cc00' }}>
            {Math.round((user.wins / (user.wins + user.losses)) * 100)}%
          </h3>
          <p style={{ margin: '0', color: '#666' }}>Win Rate</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3>Recent Activity</h3>
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {[
            'Won match vs. Player123',
            'Lost match vs. PoolShark',
            'Joined Crimson Monkeys clan',
          ].map((activity, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                borderBottom: index < 2 ? '1px solid #eee' : 'none',
                backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
              }}
            >
              {activity}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
