import { Box, Typography } from '@mui/material';
import React from 'react';

interface Avatar3DModelViewerProps {
  modelUrl?: string;
  height?: number;
}

const Avatar3DModelViewer: React.FC<Avatar3DModelViewerProps> = ({
  modelUrl,
  height = 400,
}) => {
  if (!modelUrl) {
    return (
      <Box
        sx={{
          width: '100%',
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #666',
          borderRadius: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No 3D model available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height }}>
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
          3D Model Viewer (3D packages not installed)
        </Typography>
      </Box>
    </Box>
  );
};

export default Avatar3DModelViewer;
