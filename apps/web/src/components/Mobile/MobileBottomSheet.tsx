import { useIsMobile } from '@/hooks/useDevice';
import { useSwipe } from '@/hooks/useTouch';
import { Close as CloseIcon } from '@mui/icons-material';
import { Box, IconButton, Paper, Typography, useTheme } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'small' | 'medium' | 'large' | 'full';
  showDragHandle?: boolean;
  swipeToClose?: boolean;
}

const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  height = 'medium',
  showDragHandle = true,
  swipeToClose = true,
}) => {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Height configurations
  const heightMap = {
    small: '30vh',
    medium: '50vh',
    large: '75vh',
    full: '90vh',
  };

  // Swipe to close functionality
  const handleSwipe = (result: any) => {
    if (swipeToClose && result.direction === 'down' && result.distance > 50) {
      onClose();
    }
  };

  const { bindSwipe } = useSwipe(handleSwipe, {
    threshold: 30,
    velocity: 0.2,
  });

  useEffect(() => {
    if (sheetRef.current && isMobile && swipeToClose) {
      bindSwipe(sheetRef.current);
    }
  }, [bindSwipe, isMobile, swipeToClose]);

  if (!isMobile || !open) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1300,
          opacity: open ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <Paper
        ref={sheetRef}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: heightMap[height],
          zIndex: 1301,
          borderRadius: '16px 16px 0 0',
          background: theme.cyberpunk.gradients.card,
          border: `1px solid ${theme.palette.primary.main}`,
          borderBottom: 'none',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-out',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: `1px solid ${theme.palette.primary.main}30`,
            minHeight: 64,
          }}
        >
          {showDragHandle && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.palette.primary.main,
                opacity: 0.5,
              }}
            />
          )}

          <Box sx={{ flex: 1 }}>
            {title && (
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                {title}
              </Typography>
            )}
          </Box>

          <IconButton
            onClick={onClose}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.primary.main,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 0,
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.primary.main,
              borderRadius: '2px',
            },
          }}
        >
          {children}
        </Box>

        {/* Drag handle for touch feedback */}
        {isDragging && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              pointerEvents: 'none',
              borderRadius: '16px 16px 0 0',
            }}
          />
        )}
      </Paper>
    </>
  );
};

export default MobileBottomSheet;
