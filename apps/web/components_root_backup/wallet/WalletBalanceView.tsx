import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import useWalletService from '../../hooks/services/useWalletService'; // Use the actual hook
import { useAuth } from '../../hooks/useAuth';

interface WalletBalanceViewProps {
  // Props if any, e.g., userId if not taken from context
}

const WalletBalanceView: React.FC<WalletBalanceViewProps> = () => {
  const { user } = useAuth(); // Get user from auth context
  // Fetch wallet data for the current user, or handle if no user
  // For now, let's assume the hook handles undefined userId if user is null
  const { walletData, loading, error, fetchWalletData } = useWalletService();

  React.useEffect(() => {
    if (user?.id) {
      // Ensure user and user.id are available
      fetchWalletData(user.id);
    } else {
      // Clear wallet data if user logs out
      setTimeout(() => {
        // Defensive: clear after render
        if (walletData !== null) {
          fetchWalletData(''); // Will clear walletData in hook
        }
      }, 0);
    }
  }, [user, fetchWalletData]);

  const balanceToDisplay = walletData?.balance;

  return (
    <Paper elevation={3} sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        Dojo Coin Balance
      </Typography>
      {loading && <Typography>Loading balance...</Typography>}
      {error && (
        <Typography color="error">
          Error fetching balance:{' '}
          {typeof error === 'string' ? error : 'An error occurred'}
        </Typography>
      )}
      {!loading &&
        !error &&
        balanceToDisplay !== undefined &&
        balanceToDisplay !== null && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="h4"
              component="span"
              sx={{ fontWeight: 'bold' }}
            >
              {balanceToDisplay.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
            <Typography
              variant="subtitle1"
              component="span"
              sx={{ marginLeft: 1 }}
            >
              {walletData?.currency || 'DOJO'}
            </Typography>
          </Box>
        )}
      {/* Condition for no data available when not loading and no error, and balance is null/undefined */}
      {!loading &&
        !error &&
        (balanceToDisplay === undefined || balanceToDisplay === null) && (
          <Typography>
            {user?.id
              ? 'No balance data available.'
              : 'Please log in to view your balance.'}
          </Typography>
        )}
    </Paper>
  );
};

export default WalletBalanceView;
