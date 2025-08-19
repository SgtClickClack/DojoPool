import { Box } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  itemHeight: number;
  maxHeight: number;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  maxHeight,
  overscan = 3,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleItems = Math.ceil(maxHeight / itemHeight);
  const totalVisibleItems = visibleItems + 2 * overscan;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + totalVisibleItems);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  // Update scroll position when items change
  useEffect(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, [items]);

  const visibleItemsStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    transform: `translateY(${startIndex * itemHeight}px)`,
  } as const;

  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      sx={{
        height: Math.min(totalHeight, maxHeight),
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      <Box sx={{ height: totalHeight, position: 'relative' }}>
        <Box sx={visibleItemsStyle}>
          {items.slice(startIndex, endIndex).map((item, index) => (
            <Box key={startIndex + index} sx={{ height: itemHeight }}>
              {renderItem(item)}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
