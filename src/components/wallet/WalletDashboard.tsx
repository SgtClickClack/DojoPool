import React, { useEffect, useState } from 'react';
import { Card, Grid, Typography, Button, Box, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AccountBalanceWallet, SwapHoriz, Timeline, EmojiEvents } from '@mui/icons-material';

import { WalletService } from '../../services/wallet';
import { WalletTransactionList } from './WalletTransactionList';
import { WalletStats } from './WalletStats';
import { TransferDialog } from './TransferDialog';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';

export const WalletDashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const walletService = new WalletService();
      
      // Load wallet details
      const walletData = await walletService.getWallet();
      setWallet(walletData);

      // Load wallet stats
      if (walletData?.id) {
        const [statsData, transactionsData] = await Promise.all([
          walletService.getWalletStats(walletData.id),
          walletService.getTransactionHistory(walletData.id)
        ]);
        setStats(statsData);
        setTransactions(transactionsData);
      }
    } catch (error) {
      showNotification('Error loading wallet data', 'error');
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (recipientId: number, amount: number, description: string) => {
    try {
      const walletService = new WalletService();
      await walletService.transferCoins(recipientId, amount, description);
      showNotification('Transfer successful', 'success');
      loadWalletData(); // Reload wallet data
      setTransferDialogOpen(false);
    } catch (error) {
      showNotification('Transfer failed', 'error');
      console.error('Transfer error:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Balance Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <AccountBalanceWallet sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6">Balance</Typography>
            </Box>
            <Typography variant="h4" component="div">
              {formatCurrency(wallet?.balance || 0, 'DP')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<SwapHoriz />}
              onClick={() => setTransferDialogOpen(true)}
              sx={{ mt: 2 }}
              fullWidth
            >
              Transfer Coins
            </Button>
          </Card>
        </Grid>

        {/* Stats Cards */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Timeline sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6">Transactions</Typography>
            </Box>
            <Typography variant="h4" component="div">
              {stats?.total_transactions || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Volume: {formatCurrency(stats?.total_volume || 0, 'DP')}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <EmojiEvents sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6">Rewards</Typography>
            </Box>
            <Typography variant="h4" component="div">
              {Object.values(stats?.rewards || {}).reduce((acc: number, reward: any) => acc + reward.count, 0)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Earned: {formatCurrency(
                Object.values(stats?.rewards || {}).reduce((acc: number, reward: any) => acc + reward.total_amount, 0),
                'DP'
              )}
            </Typography>
          </Card>
        </Grid>

        {/* Transaction History */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Transaction History</Typography>
            <WalletTransactionList transactions={transactions} />
          </Card>
        </Grid>

        {/* Stats */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Statistics</Typography>
            <WalletStats stats={stats} />
          </Card>
        </Grid>
      </Grid>

      {/* Transfer Dialog */}
      <TransferDialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        onTransfer={handleTransfer}
        maxAmount={wallet?.balance || 0}
      />
    </Box>
  );
}; 