import { Box, Link, Typography } from '@mui/material';

export default function TestPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#1a1a1a',
        color: '#00ff9d',
        p: '20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>🧪 DojoPool Test Page</h1>
      <p>
        If you can see this page, the routing and basic rendering is working!
      </p>
      <Box sx={{ mt: '20px' }}>
        <Link href="/world-map" sx={{ color: '#00a8ff', textDecoration: 'none' }}>
          → Go to World Map
        </Link>
      </Box>
      <Box sx={{ mt: '20px' }}>
        <Link href="/" sx={{ color: '#00a8ff', textDecoration: 'none' }}>
          → Go to Home
        </Link>
      </Box>
    </Box>
  );
}
