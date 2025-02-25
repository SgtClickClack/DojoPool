/** @jsxImportSource react */
import React from 'react';
import { Box, Container } from '@mui/material';
import dynamic from 'next/dynamic';

// Import PWA components dynamically with SSR disabled
const PWAInstallPrompt = dynamic(
  () => import('../PWA/PWAInstallPrompt'),
  { ssr: false }
);

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* PWA install prompt and offline notifications */}
      <PWAInstallPrompt />
      
      <Container component="main" sx={{ flex: 1, py: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;