import React from 'react';

const SimpleTest: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background:
          'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#00ff88',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <h1
        style={{
          fontSize: '3rem',
          marginBottom: '2rem',
          textShadow: '0 0 20px #00ff88',
        }}
      >
        🎱 DojoPool World Hub
      </h1>

      <div
        style={{
          fontSize: '1.5rem',
          textAlign: 'center',
          maxWidth: '600px',
          padding: '2rem',
          background: 'rgba(0,0,0,0.8)',
          border: '2px solid #00ff88',
          borderRadius: '10px',
        }}
      >
        <p style={{ marginBottom: '1rem' }}>
          ✅ React Application Loaded Successfully!
        </p>
        <p style={{ marginBottom: '1rem' }}>
          🎮 Cyberpunk Territory Control System
        </p>
        <p style={{ marginBottom: '1rem' }}>🌍 Clan Wars & Dojo Conquest</p>
        <p style={{ marginBottom: '1rem' }}>⚡ Real-time Multiplayer Gaming</p>

        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(0,255,136,0.1)',
            borderRadius: '5px',
          }}
        >
          <h3>🎯 SPRINT 26 Features:</h3>
          <ul style={{ textAlign: 'left', fontSize: '1rem' }}>
            <li>🎱 8-Ball Dojo Icons with Clan Colors</li>
            <li>🌍 Territory Boundaries & Control</li>
            <li>⚡ Animated Connection Lines</li>
            <li>✨ Floating Cyberpunk Particles</li>
            <li>📊 Territory Information Panels</li>
            <li>👤 Player HUD Overlay</li>
          </ul>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px',
          background: 'rgba(0,255,136,0.2)',
          border: '1px solid #00ff88',
          borderRadius: '5px',
          fontSize: '0.9rem',
        }}
      >
        <p>🟢 Server: Running</p>
        <p>🟢 React: Loaded</p>
        <p>🟢 Components: Working</p>
      </div>
    </div>
  );
};

export default SimpleTest;
