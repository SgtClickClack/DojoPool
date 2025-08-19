import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';

const TestPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>DojoPool - Test Page</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#121212',
          color: '#00ff88',
          fontSize: '24px',
          textAlign: 'center',
          padding: '20px',
        }}
      >
        <h1 style={{ marginBottom: '20px', color: '#00ff88' }}>
          🎱 DojoPool Test Page
        </h1>
        <p style={{ marginBottom: '10px' }}>
          If you can see this, Next.js is working!
        </p>
        <p style={{ fontSize: '16px', color: '#ccc' }}>
          The blank page issue might be with the MapView component.
        </p>
        <div
          style={{
            marginTop: '40px',
            padding: '20px',
            border: '2px solid #00ff88',
            borderRadius: '10px',
            background: '#1a1a1a',
          }}
        >
          <p style={{ margin: '0', fontSize: '18px' }}>✅ React is rendering</p>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#ccc' }}>
            Next.js application is functional
          </p>
        </div>
      </div>
    </>
  );
};

export default TestPage;
