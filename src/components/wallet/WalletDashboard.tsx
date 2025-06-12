import React, { useEffect, useState } from 'react';
import { Card, Grid, Typography, Button, Box, CircularProgress, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AccountBalanceWallet, SwapHoriz, Timeline, EmojiEvents, TrendingUp, Security } from '@mui/icons-material';

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
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          borderRadius: 2,
          border: '1px solid rgba(0, 255, 157, 0.2)',
          boxShadow: '0 0 20px rgba(0, 255, 157, 0.1)'
        }}
      >
        <CircularProgress 
          sx={{ 
            color: '#00ff9d',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
      </Box>
    );
  }

  const cyberCardStyle = {
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid #00ff9d',
    borderRadius: '15px',
    padding: '2rem',
    height: '100%',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.4s ease',
    transformStyle: 'preserve-3d' as const,
    perspective: '1000px' as const,
    boxShadow: '0 0 30px rgba(0, 255, 157, 0.1), inset 0 0 30px rgba(0, 255, 157, 0.05)',
    clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
    '&:hover': {
      transform: 'translateY(-10px) scale(1.02)',
      borderColor: '#00a8ff',
      boxShadow: '0 15px 40px rgba(0, 168, 255, 0.3), inset 0 0 40px rgba(0, 168, 255, 0.2)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, transparent, rgba(0, 255, 157, 0.1), transparent)',
      transform: 'translateZ(-1px)',
    }
  };

  const neonTextStyle = {
    color: '#fff',
    textShadow: '0 0 10px rgba(0, 255, 157, 0.8), 0 0 20px rgba(0, 255, 157, 0.4), 0 0 30px rgba(0, 255, 157, 0.2)',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  };

  const cyberButtonStyle = {
    background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    padding: '12px 24px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
      background: 'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: '0.5s',
    },
    '&:hover::before': {
      left: '100%',
    }
  };

  return (
    <Box 
      sx={{ 
        p: 3,
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        minHeight: '100vh',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(transparent 95%, rgba(0,255,157,0.2) 95%),
            linear-gradient(90deg, transparent 95%, rgba(0,255,157,0.2) 95%)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.15,
          pointerEvents: 'none',
        }
      }}
    >
      <Typography 
        variant="h3" 
        sx={{ 
          ...neonTextStyle,
          mb: 4,
          textAlign: 'center',
          fontSize: { xs: '2rem', md: '3rem' }
        }}
      >
        Dojo Wallet
      </Typography>

      <Grid container spacing={3}>
        {/* Balance Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={cyberCardStyle}>
            <Box display="flex" alignItems="center" mb={2}>
              <AccountBalanceWallet 
                sx={{ 
                  color: '#00ff9d', 
                  mr: 1,
                  fontSize: '2rem',
                  textShadow: '0 0 20px #00ff9d'
                }} 
              />
              <Typography variant="h6" sx={neonTextStyle}>Balance</Typography>
            </Box>
            <Typography 
              variant="h3" 
              component="div" 
              sx={{
                ...neonTextStyle,
                fontSize: { xs: '2rem', md: '3rem' },
                color: '#00ff9d',
                textShadow: '0 0 20px #00ff9d, 0 0 40px #00ff9d',
                mb: 2
              }}
            >
              {formatCurrency(wallet?.balance || 0, 'DP')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<SwapHoriz />}
              onClick={() => setTransferDialogOpen(true)}
              sx={cyberButtonStyle}
              fullWidth
            >
              Transfer Coins
            </Button>
          </Card>
        </Grid>

        {/* Transactions Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={cyberCardStyle}>
            <Box display="flex" alignItems="center" mb={2}>
              <Timeline 
                sx={{ 
                  color: '#00a8ff', 
                  mr: 1,
                  fontSize: '2rem',
                  textShadow: '0 0 20px #00a8ff'
                }} 
              />
              <Typography variant="h6" sx={neonTextStyle}>Transactions</Typography>
            </Box>
            <Typography 
              variant="h3" 
              component="div" 
              sx={{
                ...neonTextStyle,
                fontSize: { xs: '2rem', md: '3rem' },
                color: '#00a8ff',
                textShadow: '0 0 20px #00a8ff, 0 0 40px #00a8ff',
                mb: 2
              }}
            >
              {stats?.total_transactions ?? 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Total Volume: {formatCurrency(typeof stats?.total_volume === 'number' ? stats.total_volume : 0, 'DP')}
            </Typography>
          </Card>
        </Grid>

        {/* Rewards Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={cyberCardStyle}>
            <Box display="flex" alignItems="center" mb={2}>
              <EmojiEvents 
                sx={{ 
                  color: '#ff00ff', 
                  mr: 1,
                  fontSize: '2rem',
                  textShadow: '0 0 20px #ff00ff'
                }} 
              />
              <Typography variant="h6" sx={neonTextStyle}>Rewards</Typography>
            </Box>
            <Typography 
              variant="h3" 
              component="div" 
              sx={{
                ...neonTextStyle,
                fontSize: { xs: '2rem', md: '3rem' },
                color: '#ff00ff',
                textShadow: '0 0 20px #ff00ff, 0 0 40px #ff00ff',
                mb: 2
              }}
            >
              {/* Sum counts from the rewards object */}
              {stats?.rewards ? Object.values(stats.rewards).reduce((acc, reward) => acc + (reward?.count || 0), 0) : 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Total Earned: {formatCurrency(
                /* Sum total_amount from the rewards object */
                stats?.rewards ? Object.values(stats.rewards).reduce((acc, reward) => acc + (reward?.total_amount || 0), 0) : 0,
                'DP'
              )}
            </Typography>
          </Card>
        </Grid>

        {/* Security Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={cyberCardStyle}>
            <Box display="flex" alignItems="center" mb={2}>
              <Security 
                sx={{ 
                  color: '#00ffff', 
                  mr: 1,
                  fontSize: '2rem',
                  textShadow: '0 0 20px #00ffff'
                }} 
              />
              <Typography variant="h6" sx={neonTextStyle}>Security</Typography>
            </Box>
            <Typography 
              variant="h3" 
              component="div" 
              sx={{
                ...neonTextStyle,
                fontSize: { xs: '2rem', md: '3rem' },
                color: '#00ffff',
                textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
                mb: 2
              }}
            >
              Active
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Wallet Protected
            </Typography>
          </Card>
        </Grid>

        {/* Transaction History */}
        <Grid item xs={12} lg={8}>
          <Card sx={{
            ...cyberCardStyle,
            clipPath: 'none',
            '&:hover': {
              transform: 'none',
            }
          }}>
            <Typography variant="h5" gutterBottom sx={neonTextStyle}>
              Transaction History
            </Typography>
            <Box sx={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(16, 24, 39, 0.5)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0, 255, 157, 0.5)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(0, 255, 157, 0.7)',
              }
            }}>
              <WalletTransactionList transactions={transactions} />
            </Box>
          </Card>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} lg={4}>
          <Card sx={{
            ...cyberCardStyle,
            clipPath: 'none',
            '&:hover': {
              transform: 'none',
            }
          }}>
            <Typography variant="h5" gutterBottom sx={neonTextStyle}>
              Statistics
            </Typography>
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