import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Divider, CircularProgress, Alert, Button } from '@mui/material';

// Placeholder type for shop items - will need a proper definition later
interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number; // Cost in Dojo Coins or points
  // Add other relevant properties like type of item, image, etc.
}

interface RewardsShopProps {}

const RewardsShop: React.FC<RewardsShopProps> = () => {
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/rewards/shop-items"); // Placeholder endpoint
        if (!response.ok) {
          throw new Error(`Failed to fetch shop items: ${response.statusText}`);
        }
        const data = await response.json();
        setShopItems(data as ShopItem[]);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError("Error loading shop items: " + err.message);
        } else {
          setError("An unknown error occurred while loading shop items.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShopItems();
  }, []); // Empty dependency array to run once on mount

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const handlePurchase = async (itemId: string) => {
    setSuccessMessage(null);
    setPurchaseError(null);
    try {
      const response = await fetch(`/api/rewards/shop/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Purchase failed: ${response.statusText}`);
      }
      setShopItems(prev => prev.filter(item => item.id !== itemId));
      setSuccessMessage('Purchase successful!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error: any) {
      setPurchaseError(error.message || 'Error during purchase.');
      setTimeout(() => setPurchaseError(null), 4000);
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>Rewards Shop</Typography>
      <Divider sx={{ my: 2 }} />
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      {purchaseError && <Alert severity="error" sx={{ mb: 2 }}>{purchaseError}</Alert>}
      <Box>
        {shopItems.length === 0 ? (
          <Typography variant="body1">No items available in the shop.</Typography>
        ) : (
          <Box>
            {shopItems.map(item => (
              <Paper key={item.id} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{item.name}</Typography>
                  <Typography variant="body2">{item.description}</Typography>
                </Box>
                <Typography variant="body1">Cost: {item.cost}</Typography>
                <Button variant="contained" color="primary" onClick={() => handlePurchase(item.id)}>Purchase</Button>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default RewardsShop; 