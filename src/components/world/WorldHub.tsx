'use client';

import { Box, Button, Paper, Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './WorldHub.module.css';

// Use the wrapper to handle missing environment variables gracefully
import WorldHubMapWrapper from './WorldHubMapWrapper';

const WorldHub: React.FC = () => {
  return (
    <Box sx={{ width: '100%', height: '100%', p: 2 }}>
      <Paper sx={{ p: 3, height: '100%' }}>
        <Typography variant="h4" gutterBottom>
          🌍 DojoPool World Hub
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Interactive world map of DojoPool dojos and territories. Explore,
          challenge, and claim your territory!
        </Typography>

        {/* Navigation Links */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Navigation
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="secondary"
              component={Link}
              to="/seasons"
              startIcon={<span>🏆</span>}
            >
              Seasonal Championship
            </Button>
            <Button
              variant="outlined"
              component={Link}
              to="/clans"
              startIcon={<span>👥</span>}
            >
              Clan Management
            </Button>
            <Button
              variant="outlined"
              component={Link}
              to="/tournaments"
              startIcon={<span>🏓</span>}
            >
              Tournaments
            </Button>
          </Box>
        </Box>

        <div className={styles.worldhubMapContainer}>
          <WorldHubMapWrapper height="500px" />
        </div>
      </Paper>
    </Box>
  );
};

export default WorldHub;
export const WorldMapHub = WorldHub;
