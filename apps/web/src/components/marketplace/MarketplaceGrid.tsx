import { MarketplaceItem } from '@/services/marketplaceService';
import { AttachMoney as AttachMoneyIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Typography,
} from '@mui/material';
import React from 'react';
import styles from './MarketplaceGrid.module.css';

interface MarketplaceGridProps {
  items: MarketplaceItem[];
  onBuyItem: (item: MarketplaceItem) => void;
  userBalance: number;
  isLoading?: boolean;
}

export const MarketplaceGrid: React.FC<MarketplaceGridProps> = ({
  items,
  onBuyItem,
  userBalance,
  isLoading = false,
}) => {
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

  const getRarityLabel = (rarity: string): string => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const canAfford = (price: number): boolean => {
    return userBalance >= price;
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
        gap: 3,
      }}
    >
      {items.map((item) => (
        <Box key={item.id}>
          <Card
            className={styles.itemCard}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
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
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTIwQzExMC40NTcgMTIwIDExOSAxMTEuNDU3IDExOSAxMDFDMTE5IDkwLjU0MzUgMTEwLjQ1NyA4MiAxMDAgODJDODkuNTQzNSA4MiA4MSA5MC41NDM1IDgxIDEwMUM4MSAxMTEuNDU3IDg5LjU0MzUgMTIwIDEwMCAxMjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzExMC40NTcgMTQwIDExOSAxMzEuNDU3IDExOSAxMjFDMTE5IDExMC41NDQgMTEwLjQ1NyAxMDIgMTAwIDEwMkM4OS41NDM1IDEwMiA4MSAxMTAuNTQ0IDgxIDEyMUM4MSAxMzEuNDU3IDg5LjU0MzUgMTQwIDEwMCAxNDBaIiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo=';
                }}
              />
              <Chip
                label={getRarityLabel(item.rarity)}
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
            </Box>

            <CardContent
              sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
            >
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                sx={{ fontWeight: 'bold' }}
              >
                {item.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, flexGrow: 1 }}
              >
                {item.description}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoneyIcon sx={{ color: '#ffd700', mr: 1 }} />
                <Typography
                  variant="h6"
                  color="primary"
                  sx={{ fontWeight: 'bold' }}
                >
                  {item.price}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  DojoCoins
                </Typography>
              </Box>

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
                <Typography variant="body2" color="text.secondary">
                  {item.stock > 0 ? `${item.stock} available` : 'Out of stock'}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled={
                  !canAfford(item.price) || item.stock === 0 || isLoading
                }
                onClick={() => onBuyItem(item)}
                sx={{ mt: 'auto' }}
              >
                {!canAfford(item.price)
                  ? 'Not Enough Coins'
                  : item.stock === 0
                    ? 'Out of Stock'
                    : 'Buy Now'}
              </Button>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
};

export default MarketplaceGrid;
