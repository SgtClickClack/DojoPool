import MarketplaceGrid from '@/components/marketplace/MarketplaceGrid';
import marketplaceService, {
  MarketplaceItem,
  UserBalance,
} from '@/services/marketplaceService';
import { CoinIcon } from '@mui/icons-material/AttachMoney';
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marketplaceItems, balance] = await Promise.all([
          marketplaceService.getMarketplaceItems(),
          marketplaceService.getUserBalance(),
        ]);
        setItems(marketplaceItems);
        setUserBalance(balance);
      } catch (error) {
        console.error('Error fetching marketplace data:', error);
        setNotification({
          open: true,
          message: 'Failed to load marketplace items',
          severity: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBuyItem = async (item: MarketplaceItem) => {
    if (!userBalance || userBalance.dojoCoins < item.price) {
      setNotification({
        open: true,
        message: 'Insufficient DojoCoins to purchase this item',
        severity: 'error',
      });
      return;
    }

    setIsPurchasing(true);
    try {
      const result = await marketplaceService.buyMarketplaceItem(item.id);

      if (result.success) {
        // Update local state
        setItems((prevItems) =>
          prevItems.map((prevItem) =>
            prevItem.id === item.id
              ? { ...prevItem, stock: Math.max(0, prevItem.stock - 1) }
              : prevItem
          )
        );

        // Update user balance
        if (result.newBalance !== undefined) {
          setUserBalance((prev) =>
            prev ? { ...prev, dojoCoins: result.newBalance! } : null
          );
        } else {
          setUserBalance((prev) =>
            prev ? { ...prev, dojoCoins: prev.dojoCoins - item.price } : null
          );
        }

        setNotification({
          open: true,
          message: result.message || 'Item purchased successfully!',
          severity: 'success',
        });
      }
    } catch (error: any) {
      setNotification({
        open: true,
        message: error.message || 'Failed to purchase item',
        severity: 'error',
      });
    } finally {
      setIsPurchasing(false);
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
      {/* Header with Balance */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography
              variant="h3"
              component="h1"
              sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}
            >
              Marketplace
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Buy and sell Dojo items, skins, and collectibles
            </Typography>
          </Box>

          {userBalance && (
            <Paper
              sx={{
                p: 2,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CoinIcon sx={{ color: '#ffd700', fontSize: 28 }} />
                <Box>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 'bold', color: '#1a1a1a' }}
                  >
                    {userBalance.dojoCoins.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    DojoCoins
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      </Paper>

      {/* Marketplace Grid */}
      <MarketplaceGrid
        items={items}
        onBuyItem={handleBuyItem}
        userBalance={userBalance?.dojoCoins || 0}
        isLoading={isPurchasing}
      />

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
