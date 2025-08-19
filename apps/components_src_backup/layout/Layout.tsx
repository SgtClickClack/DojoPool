import { Box } from '@mui/material';
import React from 'react';
import Navbar from './Navbar';

const Layout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        fontFamily: 'Orbitron, Roboto Mono, monospace',
        position: 'relative',
      }}
    >
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'transparent',
          color: 'inherit',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
