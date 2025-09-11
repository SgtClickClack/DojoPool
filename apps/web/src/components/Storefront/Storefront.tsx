import { useAuth } from '@/hooks/useAuth';
import {
  Alert,
  Box,
  Container,
  Grid,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { PurchaseDialog } from './PurchaseDialog';

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

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'cosmetic', label: 'Cosmetics' },
  { id: 'currency', label: 'Currency' },
  { id: 'powerup', label: 'Power-ups' },
  { id: 'tournament', label: 'Tournament' },
];

export const Storefront: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchaseDialog, setPurchaseDialog] = useState<{
    open: boolean;
    product: Product | null;
  }>({ open: false, product: null });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    if (user) {
      loadProducts();
      loadFeaturedProducts();
    }
  }, [user]);

  const loadProducts = async (category?: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        userId: user.id,
        ...(category && category !== 'all' && { category }),
      });

      const response = await fetch(`/api/storefront/products?${params}`);
      if (!response.ok) throw new Error('Failed to load products');

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      showSnackbar('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/storefront/products/featured?limit=6');
      if (!response.ok) throw new Error('Failed to load featured products');

      const data = await response.json();
      setFeaturedProducts(data);
    } catch (error) {
      console.error('Failed to load featured products:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    const category = CATEGORIES[newValue]?.id;
    loadProducts(category);
  };

  const handlePurchase = (product: Product) => {
    setPurchaseDialog({ open: true, product });
  };

  const handlePurchaseConfirm = async (paymentMethod: string) => {
    if (!purchaseDialog.product || !user) return;

    try {
      setLoading(true);

      // Initiate purchase
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          productId: purchaseDialog.product.id,
          paymentMethod,
        }),
      });

      if (!response.ok) throw new Error('Failed to initiate purchase');

      const result = await response.json();

      // Handle payment completion (this would typically redirect to payment processor)
      showSnackbar('Purchase initiated successfully!', 'success');
      setPurchaseDialog({ open: false, product: null });

      // Reload products to reflect ownership changes
      loadProducts();
    } catch (error) {
      console.error('Purchase failed:', error);
      showSnackbar('Purchase failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning">
          Please log in to access the storefront.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        🛍️ DojoPool Store
      </Typography>

      <Typography
        variant="h6"
        color="text.secondary"
        align="center"
        sx={{ mb: 4 }}
      >
        Level up your game with exclusive items and power-ups
      </Typography>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            🌟 Featured Products
          </Typography>
          <Grid container spacing={3}>
            {featuredProducts.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={product.id}>
                <ProductCard
                  product={product}
                  onPurchase={handlePurchase}
                  loading={loading}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Category Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: 120,
            },
          }}
        >
          {CATEGORIES.map((category, index) => (
            <Tab
              key={category.id}
              label={category.label}
              id={`storefront-tab-${index}`}
              aria-controls={`storefront-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Products Grid */}
      <Box sx={{ minHeight: 400 }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 200,
            }}
          >
            <Typography>Loading products...</Typography>
          </Box>
        ) : products.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No products available in this category
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check back later for new items!
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <ProductCard
                  product={product}
                  onPurchase={handlePurchase}
                  loading={loading}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Purchase Dialog */}
      <PurchaseDialog
        open={purchaseDialog.open}
        product={purchaseDialog.product}
        onClose={() => setPurchaseDialog({ open: false, product: null })}
        onConfirm={handlePurchaseConfirm}
        loading={loading}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};
