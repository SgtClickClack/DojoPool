import { AccountBalanceWallet, CreditCard, Payment } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';

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

interface PurchaseDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (paymentMethod: string) => void;
  loading?: boolean;
}

const PAYMENT_METHODS = [
  {
    id: 'virtual_currency',
    name: 'Virtual Currency',
    description: 'Pay with your DojoPool coins',
    icon: <AccountBalanceWallet />,
    available: true,
  },
  {
    id: 'stripe',
    name: 'Credit Card',
    description: 'Pay with credit card via Stripe',
    icon: <CreditCard />,
    available: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pay with PayPal account',
    icon: <Payment />,
    available: false, // Not implemented yet
  },
];

export const PurchaseDialog: React.FC<PurchaseDialogProps> = ({
  open,
  product,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const theme = useTheme();
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>('virtual_currency');

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'VIRTUAL') {
      return `${price} coins`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'USD',
    }).format(price);
  };

  const handleConfirm = () => {
    if (product && selectedPaymentMethod) {
      onConfirm(selectedPaymentMethod);
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'consumable':
        return 'This item can be used multiple times and will be added to your inventory.';
      case 'non_consumable':
        return 'This is a one-time purchase that unlocks permanent access.';
      case 'currency':
        return 'This purchase adds virtual currency to your account.';
      default:
        return '';
    }
  };

  if (!product) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" component="span">
            Confirm Purchase
          </Typography>
          <Chip
            label={product.category}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Product Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {product.description}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h5" color="primary" fontWeight="bold">
              {formatPrice(product.price, product.currency)}
            </Typography>
            <Chip
              label={product.type.replace('_', ' ').toUpperCase()}
              size="small"
              color={
                product.type === 'consumable'
                  ? 'success'
                  : product.type === 'non_consumable'
                    ? 'primary'
                    : 'warning'
              }
            />
          </Box>

          <Typography
            variant="body2"
            sx={{ fontStyle: 'italic', color: 'text.secondary' }}
          >
            {getTypeDescription(product.type)}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Payment Methods */}
        <FormControl component="fieldset" sx={{ width: '100%' }}>
          <FormLabel component="legend" sx={{ mb: 2 }}>
            <Typography variant="h6">Select Payment Method</Typography>
          </FormLabel>

          <RadioGroup
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            sx={{ gap: 1 }}
          >
            {PAYMENT_METHODS.map((method) => (
              <Box
                key={method.id}
                sx={{
                  border: 1,
                  borderColor:
                    selectedPaymentMethod === method.id
                      ? theme.palette.primary.main
                      : 'divider',
                  borderRadius: 1,
                  p: 2,
                  cursor: method.available ? 'pointer' : 'not-allowed',
                  opacity: method.available ? 1 : 0.5,
                  transition: 'all 0.2s ease',
                  '&:hover': method.available
                    ? {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: theme.palette.action.hover,
                      }
                    : {},
                }}
                onClick={() =>
                  method.available && setSelectedPaymentMethod(method.id)
                }
              >
                <FormControlLabel
                  value={method.id}
                  control={<Radio />}
                  label={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        width: '100%',
                      }}
                    >
                      {method.icon}
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {method.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {method.description}
                        </Typography>
                      </Box>
                      {!method.available && (
                        <Chip
                          label="Coming Soon"
                          size="small"
                          color="warning"
                          sx={{ ml: 'auto' }}
                        />
                      )}
                    </Box>
                  }
                  disabled={!method.available}
                  sx={{ width: '100%', m: 0 }}
                />
              </Box>
            ))}
          </RadioGroup>
        </FormControl>

        {/* Terms and Conditions */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: theme.palette.grey[50],
            borderRadius: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
          >
            By completing this purchase, you agree to our Terms of Service and
            acknowledge that virtual items are non-refundable unless otherwise
            stated. All purchases are final.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading || !selectedPaymentMethod}
          variant="contained"
          size="large"
          sx={{ minWidth: 120 }}
        >
          {loading
            ? 'Processing...'
            : `Pay ${formatPrice(product.price, product.currency)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
