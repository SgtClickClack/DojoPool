import React from 'react';

const HomePage: React.FC = () => {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '2rem',
        textAlign: 'center',
        background: '#050b1a',
        color: '#f5f7ff',
      }}
    >
      <h1 style={{ margin: 0, fontSize: '3rem' }}>Welcome to Dojo Pool</h1>
      <p style={{ maxWidth: '32rem', lineHeight: 1.6, fontSize: '1.25rem' }}>
        Challenge rivals, claim territories, and rise through the ranks in the
        hybrid world of Dojo Pool. E2E tests are now unblocked and ready to run
        against a live homepage.
      </p>
    </main>
  );
};

export default HomePage;
