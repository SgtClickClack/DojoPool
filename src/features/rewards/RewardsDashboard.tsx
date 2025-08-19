import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem,
  Button,
  Divider,
  ListItemText,
} from '@mui/material';
import { WalletTransactionList } from '../../components/wallet/WalletTransactionList';
import EarnedNftsDisplay from '../../components/wallet/EarnedNftsDisplay';
import NftDetailView from '../../components/wallet/NftDetailView';
import { type Transaction, type FungibleToken } from '../../types/wallet';
import { type RewardItem } from '../../types/rewards';
import { type NftItem } from '../../types/nft';
import RewardsShop from './RewardsShop';
import Dialog from '@mui/material/Dialog';
import useWalletService from '../../frontend/hooks/services/useWalletService';
import useRewardsService from '../../frontend/hooks/services/useRewardsService';
import Snackbar from '@mui/material/Snackbar';
import { useAuth } from '../../hooks/useAuth';

interface RewardsDashboardProps {}

const RewardsDashboard: React.FC<RewardsDashboardProps> = () => {
  // Use hooks for wallet and rewards
  const {
    walletData,
    loading: walletLoading,
    error: walletError,
    fetchWalletData,
  } = useWalletService();
  const {
    rewards,
    loading: rewardsLoading,
    error: rewardsError,
    fetchRewards,
  } = useRewardsService();
  const { user } = useAuth();

  // Keep local state for transactions, NFTs, etc.
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [earnedNfts, setEarnedNfts] = useState<NftItem[]>([]);
  const [otherTokens, setOtherTokens] = useState<FungibleToken[]>([]);
  const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  // Fetch wallet and rewards on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchWalletData('me'), fetchRewards('me')])
      .then(([_wallet, _rewards]) => {
        setOtherTokens([]);
      })
      .catch((err) => {
        setError(
          'Failed to load wallet or rewards data: ' + (err?.message || err)
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchWalletData, fetchRewards]);

  // Update otherTokens if walletData changes
  useEffect(() => {
    setOtherTokens([]);
  }, [walletData]);

  // Add useEffect to fetch transactions and earned NFTs when walletData and user are available
  useEffect(() => {
    if (!walletData || !user?.id) return;
    // Fetch transactions
    fetch(`/api/v1/wallet/me/transactions`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((txs: Transaction[]) => setTransactions(txs))
      .catch(() => setTransactions([]));
    // Fetch earned NFTs from new endpoint
    fetch(`/api/v1/nft/list?user_id=${user.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setEarnedNfts(data.nfts || []))
      .catch(() => setEarnedNfts([]));
  }, [walletData, user]);

  const handleClaim = async (rewardId: string) => {
    setClaiming(rewardId);
    setClaimError(null);
    try {
      const res = await fetch(`/api/rewards/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to claim reward');
      }
      // Refresh via hooks
      await Promise.all([fetchRewards('me'), fetchWalletData('me')]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setClaimError(err.message);
      } else {
        setClaimError('An unknown error occurred during claiming.');
      }
    } finally {
      setClaiming(null);
    }
  };

  // Handler for NFT click
  const handleNftClick = (nft: NftItem) => {
    setSelectedNft(nft);
  };

  // Placeholder handler for NFT actions (list/transfer)
  const handleNftAction = (nft: NftItem, action: 'list' | 'transfer') => {
    setSnackbarMsg(
      `${action === 'list' ? 'List' : 'Transfer'} NFT: not yet implemented`
    );
    setSnackbarOpen(true);
  };

  // Handler to close NFT detail view
  const handleCloseNftDetail = () => {
    setSelectedNft(null);
  };

  // Compose loading and error states
  const isLoading = loading || walletLoading || rewardsLoading;
  const combinedError = error || walletError || rewardsError;

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <CircularProgress />
      </Box>
    );
  }
  if (combinedError) {
    return <Alert severity="error">{combinedError}</Alert>;
  }

  // Conditionally render NFT detail view or main dashboard
  if (selectedNft) {
    return <NftDetailView nft={selectedNft} onClose={handleCloseNftDetail} />;
  }

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" gutterBottom>
          Rewards Dashboard
        </Typography>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => setShopOpen(true)}
        >
          Go to Rewards Shop
        </Button>
      </Box>
      <Dialog
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <RewardsShop />
        <Box display="flex" justifyContent="flex-end" p={2}>
          <Button onClick={() => setShopOpen(false)} color="primary">
            Close
          </Button>
        </Box>
      </Dialog>
      <Typography variant="h6">Wallet Balance</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {walletData && walletData.balance !== null
          ? `${walletData.balance} Dojo Coins`
          : '-'}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Available Rewards</Typography>
      {claimError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {claimError}
        </Alert>
      )}
      <List dense>
        {rewards.length === 0 && <ListItem>No rewards available.</ListItem>}
        {rewards.map((reward: RewardItem) => (
          <ListItem
            key={reward.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <Typography variant="subtitle2">{reward.name}</Typography>
            <Typography variant="body2">{reward.description}</Typography>
            {reward.type === 'dojo_coins' && (
              <Typography variant="body2">
                Amount: {reward.points_cost} Dojo Coins
              </Typography>
            )}
            {reward.type === 'nft' && (
              <Box>
                {reward.imageUrl && (
                  <img
                    src={reward.imageUrl}
                    alt={reward.name}
                    style={{ width: 50, height: 50, marginRight: 8 }}
                  />
                )}
                <Typography variant="body2">Type: NFT</Typography>
              </Box>
            )}
            {reward.type === 'achievement' && (
              <Typography variant="body2">Type: Achievement</Typography>
            )}
            {reward.type === 'boost' && (
              <Typography variant="body2">Type: Boost</Typography>
            )}

            <Typography variant="body2">
              Cost: {reward.points_cost} points
            </Typography>
            {reward.tier && (
              <Typography variant="body2">Tier: {reward.tier.name}</Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ mt: 1 }}
              disabled={claiming === reward.id}
              onClick={() => handleClaim(reward.id)}
            >
              {claiming === reward.id ? 'Claiming...' : 'Claim'}
            </Button>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Transaction History</Typography>
      <WalletTransactionList transactions={transactions} />
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Other Tokens</Typography>
      <List dense>
        {otherTokens.length === 0 ? (
          <ListItem>
            <ListItemText primary="No other tokens found." />
          </ListItem>
        ) : (
          otherTokens.map((token) => (
            <ListItem key={token.id}>
              <ListItemText
                primary={`${token.name} (${token.symbol}): ${token.balance}`}
              />
            </ListItem>
          ))
        )}
      </List>
      <EarnedNftsDisplay
        nfts={earnedNfts}
        onNftClick={handleNftClick}
        onActionClick={handleNftAction}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
      />
    </Paper>
  );
};

export default RewardsDashboard;
