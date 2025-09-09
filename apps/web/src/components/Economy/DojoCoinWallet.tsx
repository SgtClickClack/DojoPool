import { useAuth } from '@/hooks/useAuth';
import economyService, { DojoCoinBalance } from '@/services/economyService';
import {
  Add as AddIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface DojoCoinWalletProps {
  showPurchaseButton?: boolean;
  compact?: boolean;
  onBalanceUpdate?: (balance: number) => void;
}

const DojoCoinWallet: React.FC<DojoCoinWalletProps> = ({
  showPurchaseButton = false,
  compact = false,
  onBalanceUpdate,
}) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<DojoCoinBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const fetchBalance = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const balanceData = await economyService.getBalance();
      setBalance(balanceData);
      onBalanceUpdate?.(balanceData.balance);
    } catch (err) {
      console.error('Failed to fetch DojoCoin balance:', err);
      setError('Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const handlePurchase = async () => {
    const amount = parseInt(purchaseAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setPurchaseLoading(true);
    setError(null);
    try {
      const result = await economyService.purchaseDojoCoins({
        amount,
        paymentMethod: 'stripe', // This would be configurable
      });

      if (result.status === 'COMPLETED') {
        setBalance((prev) =>
          prev ? { ...prev, balance: result.newBalance } : null
        );
        setPurchaseDialogOpen(false);
        setPurchaseAmount('');
        onBalanceUpdate?.(result.newBalance);
      } else {
        setError('Purchase is being processed. Please check back later.');
      }
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchBalance();
  };

  if (!user) {
    return null;
  }

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip
          title={`DojoCoins: ${balance?.balance?.toLocaleString() || '...'}`}
        >
          <Chip
            icon={<MoneyIcon sx={{ color: '#ffd700' }} />}
            label={balance ? balance.balance.toLocaleString() : '...'}
            size="small"
            variant="outlined"
            sx={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white',
              fontWeight: 'bold',
              '& .MuiChip-label': {
                color: 'white',
              },
            }}
          />
        </Tooltip>
        {showPurchaseButton && (
          <IconButton
            size="small"
            onClick={() => setPurchaseDialogOpen(true)}
            sx={{ color: 'white' }}
          >
            <AddIcon />
          </IconButton>
        )}
        <IconButton
          size="small"
          onClick={handleRefresh}
          disabled={loading}
          sx={{ color: 'white' }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          icon={<MoneyIcon sx={{ color: '#ffd700' }} />}
          label={
            loading ? (
              <CircularProgress size={16} sx={{ color: 'white' }} />
            ) : (
              `${balance?.balance?.toLocaleString() || '0'} DojoCoins`
            )
          }
          variant="outlined"
          sx={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderColor: 'rgba(255,255,255,0.3)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            '& .MuiChip-label': {
              color: 'white',
            },
          }}
        />

        {error && (
          <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          {showPurchaseButton && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setPurchaseDialogOpen(true)}
              sx={{
                backgroundColor: '#1976d2',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
              }}
            >
              Buy Coins
            </Button>
          )}

          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={loading}
            sx={{ color: 'white' }}
            title="Refresh balance"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Purchase Dialog */}
      <Dialog
        open={purchaseDialogOpen}
        onClose={() => !purchaseLoading && setPurchaseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Purchase DojoCoins</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the amount of DojoCoins you want to purchase:
          </Typography>

          <TextField
            autoFocus
            margin="dense"
            label="Amount (DojoCoins)"
            type="number"
            fullWidth
            variant="outlined"
            value={purchaseAmount}
            onChange={(e) => setPurchaseAmount(e.target.value)}
            disabled={purchaseLoading}
            inputProps={{ min: 1 }}
          />

          {purchaseAmount && (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              Cost: ${(parseInt(purchaseAmount) * 0.01).toFixed(2)} USD
            </Typography>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPurchaseDialogOpen(false)}
            disabled={purchaseLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            variant="contained"
            disabled={purchaseLoading || !purchaseAmount}
            startIcon={purchaseLoading ? <CircularProgress size={16} /> : null}
          >
            {purchaseLoading ? 'Processing...' : 'Purchase'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DojoCoinWallet;
