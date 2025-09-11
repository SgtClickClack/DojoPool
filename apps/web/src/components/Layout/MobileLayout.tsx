import MobileNavigation from '@/components/Mobile/MobileNavigation';
import { useDevice } from '@/hooks/useDevice';
import { Box, Container, useTheme } from '@mui/material';
import React from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disableGutters?: boolean;
  sx?: any;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  maxWidth = 'sm',
  disableGutters = false,
  sx = {},
}) => {
  const theme = useTheme();
  const { isMobile, orientation } = useDevice();

  if (!isMobile) {
    return (
      <Container maxWidth={maxWidth} disableGutters={disableGutters} sx={sx}>
        {children}
      </Container>
    );
  }

  const isPortrait = orientation === 'portrait';

  return (
    <MobileNavigation>
      <Box
        sx={{
          minHeight: '100vh',
          background: theme.cyberpunk.gradients.background,
          pb: isPortrait ? 10 : 6, // Extra padding for bottom navigation
          ...sx,
        }}
      >
        <Container
          maxWidth={maxWidth}
          disableGutters={disableGutters}
          sx={{
            px: isPortrait ? 2 : 1,
            py: 2,
          }}
        >
          {children}
        </Container>
      </Box>
    </MobileNavigation>
  );
};

export default MobileLayout;
