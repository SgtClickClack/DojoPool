import { Box } from '@mui/material';
import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ children }) => {
  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
      {children}
    </Box>
  );
};

export default Container;
