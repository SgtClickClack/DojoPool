import Head from 'next/head';
import Layout from '../apps/web/src/components/layout/Layout';

export default function SimpleMapPage() {
  return (
    <>
      <Head>
        <title>DojoPool — Simple Map</title>
        <meta
          name="description"
          content="Simple map view for DojoPool development testing."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Layout>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#1a1a1a',
            minHeight: '100vh',
            color: '#00ff9d',
          }}
        >
          <h1>🗺️ Simple World Map</h1>
          <p>This is a simplified version to test the layout and routing.</p>

          <div
            style={{
              width: '100%',
              height: '400px',
              backgroundColor: '#2a2a2a',
              border: '2px solid #00ff9d',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '20px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h3>🌍 DojoPool World</h3>
              <p>Interactive map would be here</p>
              <p style={{ fontSize: '12px', color: '#888' }}>
                Mapbox integration pending
              </p>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <a
              href="/world-map"
              style={{ color: '#00a8ff', textDecoration: 'none' }}
            >
              → Try Full World Map
            </a>
          </div>

          <div style={{ marginTop: '20px' }}>
            <a href="/" style={{ color: '#00a8ff', textDecoration: 'none' }}>
              → Back to Home
            </a>
          </div>
        </div>
      </Layout>
    </>
  );
}
