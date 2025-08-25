import marketplaceService, {
  UserBalance,
  UserInventoryItem,
} from '@/services/marketplaceService';
import { Cancel, CheckCircle } from '@mui/icons-material';
import { CoinIcon } from '@mui/icons-material/AttachMoney';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material';
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

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'legendary':
        return '#ffd700';
      case 'epic':
        return '#a335ee';
      case 'rare':
        return '#0070dd';
      default:
        return '#ffffff';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'avatar':
        return '👤';
      case 'cue':
        return '🎱';
      case 'table':
        return '🏓';
      case 'emote':
        return '😊';
      case 'title':
        return '🏆';
      default:
        return '📦';
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
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
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
              Inventory
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Your collection of Dojo items and collectibles
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

      {/* Inventory Stats */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                color="primary"
                sx={{ fontWeight: 'bold' }}
              >
                {inventory.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Items
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                color="success.main"
                sx={{ fontWeight: 'bold' }}
              >
                {inventory.filter((item) => item.equipped).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Equipped
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                color="warning.main"
                sx={{ fontWeight: 'bold' }}
              >
                {inventory.filter((item) => item.rarity === 'legendary').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Legendary
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                color="info.main"
                sx={{ fontWeight: 'bold' }}
              >
                {new Set(inventory.map((item) => item.type)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Categories
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Inventory Grid */}
      {inventory.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Your inventory is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Visit the marketplace to purchase your first items!
          </Typography>
          <Button variant="contained" color="primary" href="/marketplace">
            Go to Marketplace
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {inventory.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: item.equipped
                    ? '2px solid #4caf50'
                    : '1px solid #e0e0e0',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                    transition: 'all 0.2s ease-in-out',
                  },
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.image}
                    alt={item.name}
                    sx={{ objectFit: 'cover' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTIwQzExMC40NTcgMTIwIDExOSAxMTEuNDU3IDExOSAxMDFDMTE5IDkwLjU0MzUgMTEwLjQ1NyA4MiAxMDAgODJDODkuNTQzNSA4MiA4MSA5MC41NDM1IDgxIDEwMUM4MSAxMTEuNDU3IDg5LjU0MzUgMTIwIDEwMCAxMjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzExMC40NTcgMTQwIDExOSAxMzEuNDU3IDExOSAxMjFDMTE5IDExMC41NDQgMTEwLjQ1NyAxMDIgMTAwIDEwMkM4OS41NDM1IDEwMiA4MSAxMTAuNTQ0IDgxIDEyMUM4MSAxMzEuNDU3IDg5LjU0MzUgMTQwIDEwMCAxNDBaIiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo=';
                    }}
                  />

                  {/* Rarity Badge */}
                  <Chip
                    label={
                      item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)
                    }
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: getRarityColor(item.rarity),
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                    }}
                  />

                  {/* Equipped Badge */}
                  {item.equipped && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: '#4caf50',
                        color: 'white',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle fontSize="small" />
                    </Box>
                  )}
                </Box>

                <CardContent
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {item.name}
                    </Typography>
                    <Typography variant="h5">
                      {getTypeIcon(item.type)}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, flexGrow: 1 }}
                  >
                    {item.description}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Chip
                      label={item.category}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(item.acquiredAt).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Button
                    variant={item.equipped ? 'outlined' : 'contained'}
                    color={item.equipped ? 'success' : 'primary'}
                    fullWidth
                    onClick={() => handleEquipItem(item)}
                    startIcon={item.equipped ? <CheckCircle /> : <Cancel />}
                  >
                    {item.equipped ? 'Equipped' : 'Equip'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

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
