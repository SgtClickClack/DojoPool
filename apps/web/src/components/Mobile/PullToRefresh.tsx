import { useIsMobile } from '@/hooks/useDevice';
import { usePullToRefresh } from '@/hooks/useTouch';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}) => {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const [pullProgress, setPullProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { isRefreshing, pullDistance, bindPullToRefresh } = usePullToRefresh(
    onRefresh,
    threshold
  );

  useEffect(() => {
    if (containerRef.current && isMobile && !disabled) {
      const cleanup = bindPullToRefresh(containerRef.current);

      // Add scroll listener to track pull progress
      const handleScroll = () => {
        if (window.scrollY === 0) {
          setPullProgress(Math.min(pullDistance / threshold, 1));
        } else {
          setPullProgress(0);
        }
      };

      window.addEventListener('scroll', handleScroll);
      return () => {
        cleanup?.();
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [bindPullToRefresh, pullDistance, threshold, isMobile, disabled]);

  if (!isMobile || disabled) {
    return <>{children}</>;
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        minHeight: '100vh',
        touchAction: 'pan-y', // Allow vertical scrolling but prevent horizontal
      }}
    >
      {/* Pull indicator */}
      {pullProgress > 0 && !isRefreshing && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: threshold,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.cyberpunk.gradients.card,
            borderBottom: `1px solid ${theme.palette.primary.main}`,
            transform: `translateY(${Math.max(-threshold + pullProgress * threshold, -threshold)}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              opacity: pullProgress,
              transform: `rotate(${pullProgress * 180}deg)`,
              transition: 'all 0.1s ease-out',
            }}
          >
            <RefreshIcon
              sx={{
                color: theme.palette.primary.main,
                fontSize: 24,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 'bold',
              }}
            >
              {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Refreshing indicator */}
      {isRefreshing && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 60,
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.cyberpunk.gradients.card,
            borderBottom: `1px solid ${theme.palette.primary.main}`,
            boxShadow: `0 2px 10px ${theme.palette.primary.main}30`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress
              size={24}
              sx={{ color: theme.palette.primary.main }}
            />
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 'bold',
              }}
            >
              Refreshing...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Main content */}
      <Box
        sx={{
          transform: isRefreshing ? `translateY(60px)` : 'translateY(0)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PullToRefresh;
