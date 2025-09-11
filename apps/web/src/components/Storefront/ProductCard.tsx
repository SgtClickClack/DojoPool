import { CheckCircle, Lock, ShoppingCart } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl?: string;
  isOwned: boolean;
  canPurchase: boolean;
  isUnique: boolean;
  type: 'consumable' | 'non_consumable' | 'currency';
  metadata?: Record<string, any>;
}

interface ProductCardProps {
  product: Product;
  onPurchase: (product: Product) => void;
  loading?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPurchase,
  loading = false,
}) => {
  const theme = useTheme();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consumable':
        return 'success';
      case 'non_consumable':
        return 'primary';
      case 'currency':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consumable':
        return '📦';
      case 'non_consumable':
        return '🔒';
      case 'currency':
        return '💰';
      default:
        return '📦';
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'VIRTUAL') {
      return `${price} coins`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'USD',
    }).format(price);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        opacity: product.canPurchase ? 1 : 0.7,
      }}
    >
      {product.imageUrl && (
        <CardMedia
          component="img"
          height="140"
          image={product.imageUrl}
          alt={product.name}
          sx={{ objectFit: 'cover' }}
        />
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            {product.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Chip
              label={`${getTypeIcon(product.type)} ${product.type.replace('_', ' ')}`}
              size="small"
              color={getTypeColor(product.type) as any}
              variant="outlined"
            />
          </Box>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, minHeight: 40 }}
        >
          {product.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h6" color="primary">
            {formatPrice(product.price, product.currency)}
          </Typography>
          {product.isUnique && (
            <Chip label="Unique" size="small" variant="outlined" />
          )}
        </Box>

        {product.isOwned && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'success.main',
            }}
          >
            <CheckCircle sx={{ fontSize: 16 }} />
            <Typography variant="body2">Owned</Typography>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        {product.isOwned ? (
          <Button
            variant="outlined"
            fullWidth
            disabled
            startIcon={<CheckCircle />}
          >
            Owned
          </Button>
        ) : product.canPurchase ? (
          <Button
            variant="contained"
            fullWidth
            onClick={() => onPurchase(product)}
            disabled={loading}
            startIcon={<ShoppingCart />}
          >
            {loading ? 'Processing...' : 'Purchase'}
          </Button>
        ) : (
          <Button variant="outlined" fullWidth disabled startIcon={<Lock />}>
            Not Available
          </Button>
        )}
      </CardActions>
    </Card>
  );
};
