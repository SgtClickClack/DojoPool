'use client';

import { Box, Paper, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import React from 'react';

const WorldHubMap = dynamic(
  () => import('./WorldHubMap'),
  { ssr: false } // This is the crucial part
);

interface WorldHubMapWrapperProps {
  height?: string | number;
}

const WorldHubMapWrapper: React.FC<WorldHubMapWrapperProps> = ({
  height = '100%',
}) => {
  // Check for required environment variables
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return (
      <Paper
        sx={{
          p: 3,
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(26, 26, 46, 0.9)',
          border: '2px solid #ff6b6b',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 2 }}>
            Map Configuration Required
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
            Mapbox API token is missing. Please set NEXT_PUBLIC_MAPBOX_TOKEN in
            your environment variables.
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: '#888', display: 'block', mb: 1 }}
          >
            For development, create a .env.local file with:
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#00ff9d',
              fontFamily: 'monospace',
              display: 'block',
              mb: 2,
            }}
          >
            NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
          </Typography>
          <Typography variant="caption" sx={{ color: '#888' }}>
            You can get a free token from{' '}
            <a
              href="https://www.mapbox.com/account/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#00a8ff', textDecoration: 'none' }}
            >
              Mapbox
            </a>
          </Typography>
        </Box>
      </Paper>
    );
  }

  return <WorldHubMap height={height} />;
};

export default WorldHubMapWrapper;
