import React from 'react';
import { Box, styled, useTheme, Typography } from '@mui/material'; // Added Typography for StatusBar
import {
  Wifi as WifiIcon,
  SignalCellularAlt as SignalIcon,
  BatteryFull as BatteryIcon,
} from '@mui/icons-material'; // Example icons

// --- Types and Interfaces ---
type DeviceType = 'iphone' | 'ipad' | 'android-phone' | 'android-tablet'; // Expanded options

interface DeviceDimensions {
  width: string;
  height: string;
  borderRadius: string;
  statusBarHeight: string;
  // Potentially add notch/dynamic island dimensions if going for high fidelity
}

interface ScreenshotTemplateProps {
  children: React.ReactNode;
  deviceType?: DeviceType;
  statusBarContent?: React.ReactNode; // Allow custom status bar content
  showDeviceFrame?: boolean;
  showStatusBar?: boolean;
  backgroundColor?: string; // Allow overriding background
  frameColor?: string; // Allow overriding frame color
}

// --- Device Configuration ---
const DEVICE_CONFIG: Record<DeviceType, DeviceDimensions> = {
  iphone: {
    width: '390px', // iPhone 13/14 Pro width (logical pixels)
    height: '844px', // iPhone 13/14 Pro height (logical pixels)
    borderRadius: '48px', // Rounded corners like modern iPhones
    statusBarHeight: '47px', // Approximate status bar height (can vary with notch)
  },
  ipad: {
    width: '820px', // iPad Air 10.9" width (logical pixels)
    height: '1180px', // iPad Air 10.9" height (logical pixels)
    borderRadius: '24px', // iPads have less pronounced rounding
    statusBarHeight: '24px', // iPad status bar is typically slimmer
  },
  'android-phone': {
    width: '360px', // Common Android phone width
    height: '740px', // Common Android phone height
    borderRadius: '24px',
    statusBarHeight: '24px',
  },
  'android-tablet': {
    width: '800px', // Common Android tablet width
    height: '1280px',
    borderRadius: '16px',
    statusBarHeight: '24px',
  },
};

// --- Styled Components ---

interface ScreenshotContainerProps {
  dimensions: DeviceDimensions;
  bgColor?: string;
}

const ScreenshotContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'dimensions' && prop !== 'bgColor',
})<ScreenshotContainerProps>(({ theme, dimensions, bgColor }) => ({
  width: dimensions.width,
  height: dimensions.height,
  backgroundColor: bgColor || theme.palette.background.default,
  position: 'relative', // For DeviceFrame and content positioning
  overflow: 'hidden', // Clip children to the screen bounds
  display: 'flex',
  flexDirection: 'column',
  // alignItems: 'center', // Removed: content should typically fill width
  boxShadow: theme.shadows[8], // Add a subtle shadow to lift the device
  borderRadius: dimensions.borderRadius, // Apply border radius to the container itself
}));

interface DeviceFrameProps {
  frameBorderRadius: string;
  borderColor?: string;
}

const DeviceFrame = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== 'frameBorderRadius' && prop !== 'borderColor',
})<DeviceFrameProps>(({ theme, frameBorderRadius, borderColor }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  // The border is now on the ScreenshotContainer for a more realistic "device body" feel
  // This component can be used for additional frame details like notches or camera bumps if needed.
  // For a simple border, it might be integrated directly into ScreenshotContainer's styles or a pseudo-element.
  // For this iteration, let's make it a slightly inset border to simulate a screen bezel.
  border: `8px solid ${borderColor || theme.palette.grey[800]}`, // Simulates bezel
  borderRadius: frameBorderRadius, // Match container's border radius
  pointerEvents: 'none',
  boxSizing: 'border-box',
}));

interface StatusBarStyledProps {
  height: string;
}
const StatusBar = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'height',
})<StatusBarStyledProps>(({ theme, height }) => ({
  width: '100%',
  height: height,
  // backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)', // Semi-transparent
  backdropFilter: 'blur(10px)', // For a frosted glass effect if content scrolls behind
  WebkitBackdropFilter: 'blur(10px)',
  backgroundColor:
    theme.palette.mode === 'dark'
      ? theme.palette.grey[900]
      : theme.palette.grey[100], // Or a solid color
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(0, 1.5), // Adjusted padding
  zIndex: 10, // Ensure status bar is on top of children content
  flexShrink: 0, // Prevent status bar from shrinking
  borderBottom: `1px solid ${theme.palette.divider}`, // Subtle separator
}));

const AppContentContainer = styled(Box)({
  flexGrow: 1, // Takes up remaining space
  width: '100%',
  overflowY: 'auto', // Allows children content to scroll if it exceeds screen height
  position: 'relative', // For any positioned children within the app screen
});

// --- Default Status Bar Content ---
const DefaultStatusBarContent: React.FC = () => {
  const theme = useTheme();
  const time = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const iconColor = theme.palette.text.secondary;

  return (
    <>
      <Typography
        variant="caption"
        sx={{ fontWeight: 'medium', color: iconColor }}
      >
        {time}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <SignalIcon sx={{ fontSize: '1rem', color: iconColor }} />
        <WifiIcon sx={{ fontSize: '1rem', color: iconColor }} />
        <BatteryIcon sx={{ fontSize: '1rem', color: iconColor }} />
        <Typography
          variant="caption"
          sx={{ fontWeight: 'medium', ml: 0.5, color: iconColor }}
        >
          100%
        </Typography>
      </Box>
    </>
  );
};

// --- Main Component ---
export const ScreenshotTemplate: React.FC<ScreenshotTemplateProps> = ({
  children,
  deviceType = 'iphone', // Default device
  statusBarContent,
  showDeviceFrame = true,
  showStatusBar = true,
  backgroundColor,
  frameColor,
}) => {
  const dimensions = DEVICE_CONFIG[deviceType] || DEVICE_CONFIG['iphone'];

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 2, md: 4 },
        width: 'fit-content',
        margin: 'auto',
      }}
    >
      {' '}
      {/* Outer centering wrapper */}
      <ScreenshotContainer dimensions={dimensions} bgColor={backgroundColor}>
        {showDeviceFrame && (
          <DeviceFrame
            frameBorderRadius={dimensions.borderRadius}
            borderColor={frameColor}
          />
        )}
        {showStatusBar && (
          <StatusBar height={dimensions.statusBarHeight}>
            {statusBarContent !== undefined ? (
              statusBarContent
            ) : (
              <DefaultStatusBarContent />
            )}
          </StatusBar>
        )}
        <AppContentContainer>{children}</AppContentContainer>
      </ScreenshotContainer>
    </Box>
  );
};

export default ScreenshotTemplate;
