import React, { useEffect, useState } from 'react';
import { Card, Grid, Typography, Button, Box, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AccountBalanceWallet, SwapHoriz, Timeline, EmojiEvents } from '@mui/icons-material';

import { WalletService } from '../../services/wallet/WalletService';
import { WalletTransactionList } from './WalletTransactionList';
import { WalletStatsDisplay as WalletStatsComponent } from './WalletStats';
import { TransferDialog } from './TransferDialog';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
// import { useNotification } from '../../hooks/useNotification'; // Comment out
import { Wallet, Transaction, WalletStats } from '../../types/wallet';

export const WalletDashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  // const { showNotification } = useNotification(); // Comment out
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  // Instantiate the service once
  const walletService = React.useMemo(() => new WalletService(), []);

  useEffect(() => {
    loadWalletData();
  }, [walletService]); // Add service to dependency array

  const loadWalletData = async () => {
    try {
      setLoading(true);
      // Use the component-level instance
      const walletData = await walletService.getWallet();
      setWallet(walletData);

      if (walletData?.id) {
        const [statsData, transactionsData] = await Promise.all([
          walletService.getWalletStats(walletData.id),
          walletService.getTransactionHistory(walletData.id)
        ]);
        setStats(statsData);
        setTransactions(transactionsData);
      } else {
        setStats(null);
        setTransactions([]);
      }
    } catch (error) {
      // Comment out notification call
      // showNotification('Error loading wallet data', 'error'); 
      console.error('Error loading wallet data:', error);
      setWallet(null);
      setStats(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (recipientId: number, amount: number, description: string) => {
    try {
      // Use the component-level instance
      await walletService.transferCoins(recipientId, amount, description);
      // showNotification('Transfer successful', 'success'); // Comment out
      console.log('Transfer successful'); // Replace with console log for now
      loadWalletData();
      setTransferDialogOpen(false);
    } catch (error) {
      // showNotification('Transfer failed', 'error'); // Comment out
      console.error('Transfer error:', error); // Keep console error
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

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Timeline sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6">Transactions</Typography>
            </Box>
            <Typography variant="h4" component="div">
              {stats?.total_transactions ?? 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Volume: {formatCurrency(typeof stats?.total_volume === 'number' ? stats.total_volume : 0, 'DP')}
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
              {/* Sum counts from the rewards object */}
              {stats?.rewards ? Object.values(stats.rewards).reduce((acc, reward) => acc + (reward?.count || 0), 0) : 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Earned: {formatCurrency(
                /* Sum total_amount from the rewards object */
                stats?.rewards ? Object.values(stats.rewards).reduce((acc, reward) => acc + (reward?.total_amount || 0), 0) : 0,
                'DP'
              )}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Transaction History</Typography>
            <WalletTransactionList transactions={transactions} />
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Statistics</Typography>
            <WalletStatsComponent stats={stats} />
          </Card>
        </Grid>
      </Grid>

      <TransferDialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        onTransfer={handleTransfer}
        maxAmount={wallet?.balance || 0}
      />
    </Box>
  );
}; 