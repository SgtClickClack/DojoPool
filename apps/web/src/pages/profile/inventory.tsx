import { ProfileInventoryGrid } from '@/components/Inventory/ProfileInventoryGrid';
import { ProfileInventoryHeader } from '@/components/Inventory/ProfileInventoryHeader';
import { ProfileInventoryNotification } from '@/components/Inventory/ProfileInventoryNotification';
import { ProfileInventoryStats } from '@/components/Inventory/ProfileInventoryStats';
import marketplaceService, {
  UserBalance,
  UserInventoryItem,
} from '@/services/marketplaceService';
import { Box, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const [inventoryItems, balance] = await Promise.all([
          marketplaceService.getUserInventory(),
          marketplaceService.getUserBalance(),
        ]);
        setInventory(inventoryItems);
        setUserBalance(balance);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setNotification({
          open: true,
          message: 'Failed to load inventory',
          severity: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handleEquipItem = async (item: UserInventoryItem) => {
    try {
      // TODO: Implement equip functionality when backend is ready
      setInventory((prevItems) =>
        prevItems.map((prevItem) => ({
          ...prevItem,
          equipped:
            prevItem.type === item.type ? prevItem.id === item.id : false,
        }))
      );

      setNotification({
        open: true,
        message: `${item.name} equipped successfully!`,
        severity: 'success',
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Failed to equip item',
        severity: 'error',
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <ProfileInventoryHeader userBalance={userBalance} />
      <ProfileInventoryStats inventory={inventory} />
      <ProfileInventoryGrid
        inventory={inventory}
        onEquipItem={handleEquipItem}
      />
      <ProfileInventoryNotification
        notification={notification}
        onClose={handleCloseNotification}
      />
    </Box>
  );
}
