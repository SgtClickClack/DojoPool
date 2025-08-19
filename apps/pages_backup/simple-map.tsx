import Layout from '../components/layout/Layout';
import { Box, Typography, Link } from '@mui/material';

export default function SimpleMapPage() {
  return (
    <Layout>
      <Box sx={{ p: '20px', bgcolor: '#1a1a1a', minHeight: '100vh', color: '#00ff9d' }}>
        <h1>🗺️ Simple World Map</h1>
        <p>This is a simplified version to test the layout and routing.</p>

        <Box sx={{ width: '100%', height: '400px', bgcolor: '#2a2a2a', border: '2px solid #00ff9d', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: '20px' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" component="h3">🌍 DojoPool World</Typography>
            <Typography>Interactive map would be here</Typography>
            <Typography sx={{ fontSize: '12px', color: '#888' }}>
              Mapbox integration pending
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: '20px' }}>
          <Link href="/world-map" sx={{ color: '#00a8ff', textDecoration: 'none' }}>
            → Try Full World Map
          </Link>
        </Box>
      </Box>
    </Layout>
  );
}
