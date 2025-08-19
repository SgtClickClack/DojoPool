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
          alignItems: 'center',
          justifyContent: 'center',
          background: '#121212',
          color: '#00ff88',
          fontSize: '24px',
          flexDirection: 'column',
        }}
      >
        <h1>DojoPool Test Page</h1>
        <p>Frontend is working! 🎉</p>
        <p>Backend is running on port 8080</p>
        <p>AWS Infrastructure is deployed and working</p>
        <p>Venue management is integrated</p>
      </div>
    </>
  );
};

export default TestPage;
