import {
  Alert,
  AlertTitle,
  Box,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';

import InventoryErrorBoundary from '@/components/ErrorBoundary/InventoryErrorBoundary';
import { useInventory } from '@/components/Inventory/InventoryDataProvider';
import { InventoryFilters } from '@/components/Inventory/InventoryFilters';
import { InventoryHeader } from '@/components/Inventory/InventoryHeader';
import { InventoryStats } from '@/components/Inventory/InventoryStats';
import { InventoryTabs } from '@/components/Inventory/InventoryTabs';

interface InventoryLayoutProps {
  children?: React.ReactNode;
}

export const InventoryLayout: React.FC<InventoryLayoutProps> = ({
  children,
}) => {
  const { user, loading, error, inventory } = useInventory();

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          <AlertTitle>Please log in to view your inventory.</AlertTitle>
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3} alignItems="center">
          <CircularProgress size={60} />
          <Typography variant="h6">Loading your inventory...</Typography>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <InventoryErrorBoundary>
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Stack spacing={4} sx={{ width: '100%' }}>
            {/* Header */}
            <InventoryHeader />

            {/* Stats */}
            <InventoryStats
              totalItems={inventory.length}
              equippedItems={inventory.filter((item) => item.isEquipped).length}
              rareItems={
                inventory.filter((item) => item.item.rarity === 'rare').length
              }
              totalValue={inventory.reduce(
                (sum, item) => sum + (item.item.price || 0),
                0
              )}
            />

            {/* Filters */}
            <InventoryFilters />

            {/* Inventory Tabs */}
            <InventoryTabs />

            {children}
          </Stack>
        </Container>
      </Box>
    </InventoryErrorBoundary>
  );
};

export default InventoryLayout;
