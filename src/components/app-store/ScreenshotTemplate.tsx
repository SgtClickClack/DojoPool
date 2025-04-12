import React from 'react';
import { Box, styled } from '@mui/material';

const ScreenshotContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '1242px', // Standard iPhone Pro Max width
  height: '2688px', // Standard iPhone Pro Max height
  backgroundColor: theme.palette.background.default,
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(4),
}));

const DeviceFrame = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  border: `2px solid ${theme.palette.primary.main}`,
  borderRadius: '40px',
  pointerEvents: 'none',
}));

const StatusBar = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '44px',
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
  position: 'relative',
  zIndex: 1,
}));

interface ScreenshotTemplateProps {
  children: React.ReactNode;
  deviceType?: 'iphone' | 'ipad';
}

export const ScreenshotTemplate: React.FC<ScreenshotTemplateProps> = ({
  children,
  deviceType = 'iphone',
}) => {
  return (
    <ScreenshotContainer>
      <DeviceFrame />
      <StatusBar>
        {/* Status bar icons would go here */}
      </StatusBar>
      {children}
    </ScreenshotContainer>
  );
};

export default ScreenshotTemplate; 