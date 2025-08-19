import { Box, Typography } from '@mui/material';
import React from 'react';

function MapView() {
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #666',
          borderRadius: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Map View (Google Maps not configured)
        </Typography>
      </Box>
    </Box>
  );
}

export default React.memo(MapView);
