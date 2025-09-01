import { Box, Grid, Typography } from '@mui/material';
import React from 'react';

interface InventoryGridProps {
  items: React.ReactNode[];
  emptyMessage?: string;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  emptyMessage = 'No items found.',
}) => {
  return (
    <Box sx={{ p: 3 }}>
      {items.length > 0 ? (
        <Grid container spacing={3}>
          {items.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`item-${index}`}>
              {item}
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography textAlign="center" color="text.secondary" sx={{ py: 8 }}>
          {emptyMessage}
        </Typography>
      )}
    </Box>
  );
};
