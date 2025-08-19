import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Stack,
  CircularProgress,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface InfiniteScrollProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  error?: Error | null;
  onRetry?: () => void;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const InfiniteScroll = <T extends unknown>({
  items,
  renderItem,
  hasMore,
  isLoading,
  onLoadMore,
  error,
  onRetry,
  loadingComponent,
  emptyComponent,
  threshold = 0.8,
  className,
  style,
}: InfiniteScrollProps<T>) => {
  const observer = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold }
    );

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasMore, isLoading, onLoadMore, threshold]);

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>
          Error loading items
        </Typography>
        {onRetry && (
          <Button
            variant="contained"
            color="primary"
            onClick={onRetry}
            sx={{ mt: 1 }}
          >
            Retry
          </Button>
        )}
      </Box>
    );
  }

  if (items.length === 0 && !isLoading) {
    return (
      emptyComponent || (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">No items to display</Typography>
        </Box>
      )
    );
  }

  return (
    <Stack spacing={2} className={className} style={style}>
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>

      {isLoading && (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          {loadingComponent || <CircularProgress />}
        </Box>
      )}

      {hasMore && !isLoading && (
        <div ref={loadMoreRef} style={{ height: '20px' }} />
      )}
    </Stack>
  );
};
