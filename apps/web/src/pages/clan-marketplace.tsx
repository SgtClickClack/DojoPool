import { apiClient } from '@/services/APIService';
import { marketplaceService } from '@/services/marketplaceService';
import {
  Add as AddIcon,
  AttachMoney as MoneyIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

interface ClanListing {
  id: string;
  sellerId: string;
  clanId: string;
  listingType: string;
  assetId: string;
  assetType: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  seller: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  clan: {
    id: string;
    name: string;
    tag: string;
  };
}

interface ClanWallet {
  id: string;
  clanId: string;
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  clan: {
    id: string;
    name: string;
    tag: string;
    leader: {
      id: string;
      username: string;
    };
  };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    balanceAfter: number;
    createdAt: string;
    user: {
      id: string;
      username: string;
      avatarUrl?: string;
    };
  }>;
}

const ClanMarketplace: React.FC = () => {
  const router = useRouter();
  const { clanId } = router.query;

  const [listings, setListings] = useState<ClanListing[]>([]);
  const [clanWallet, setClanWallet] = useState<ClanWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    if (clanId) {
      loadData();
    }
  }, [clanId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [listingsResponse, walletResponse, balanceResponse] =
        await Promise.all([
          apiClient.get(`/marketplace/clan/${clanId}/listings`),
          apiClient.get(`/marketplace/clan/${clanId}/wallet`),
          marketplaceService.getUserBalance(),
        ]);

      setListings(listingsResponse.data);
      setClanWallet(walletResponse.data);
      setUserBalance(balanceResponse.dojoCoins);
    } catch (err: any) {
      setError(err.message || 'Failed to load clan marketplace data');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyFromClanMarketplace = async (listing: ClanListing) => {
    try {
      await apiClient.post('/marketplace/clan/buy', {
        buyerId: 'current-user-id', // Replace with actual user ID from auth
        listingId: listing.id,
        clanId: listing.clanId,
      });

      // Refresh data
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to purchase item');
    }
  };

  const handleDepositToClanWallet = async () => {
    const amount = parseInt(depositAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await apiClient.post('/marketplace/clan/wallet/deposit', {
        userId: 'current-user-id', // Replace with actual user ID from auth
        clanId,
        amount,
      });

      setDepositAmount('');
      setShowWalletDialog(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to deposit coins');
    }
  };

  const handleWithdrawFromClanWallet = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await apiClient.post('/marketplace/clan/wallet/withdraw', {
        userId: 'current-user-id', // Replace with actual user ID from auth
        clanId,
        amount,
      });

      setWithdrawAmount('');
      setShowWalletDialog(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw coins');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ color: 'primary.main', fontWeight: 'bold' }}
      >
        Clan Marketplace
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Clan Wallet Section */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" sx={{ color: 'white' }}>
            Clan Wallet
          </Typography>
          <Button
            variant="contained"
            startIcon={<WalletIcon />}
            onClick={() => setShowWalletDialog(true)}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            }}
          >
            Manage Wallet
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
              <CardContent>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ fontWeight: 'bold' }}
                >
                  {clanWallet?.balance || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Current Balance
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
              <CardContent>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ fontWeight: 'bold' }}
                >
                  {clanWallet?.totalDeposits || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Total Deposits
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
              <CardContent>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ fontWeight: 'bold' }}
                >
                  {clanWallet?.totalWithdrawals || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Total Withdrawals
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Listings Section */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" component="h2">
          Available Listings
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
          sx={{
            background: 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)',
          }}
        >
          Create Listing
        </Button>
      </Box>

      <Grid container spacing={3}>
        {listings.map((listing) => (
          <Grid item xs={12} md={6} lg={4} key={listing.id}>
            <Card
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
                color: 'white',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar src={listing.seller.avatarUrl} sx={{ mr: 2 }}>
                    {listing.seller.username[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {listing.seller.username}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      {listing.clan.name} [{listing.clan.tag}]
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h6" component="h3" gutterBottom>
                  {listing.assetType.replace('_', ' ').toUpperCase()}
                </Typography>

                <Box display="flex" alignItems="center" mb={2}>
                  <MoneyIcon sx={{ mr: 1, color: '#ffd700' }} />
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 'bold', color: '#ffd700' }}
                  >
                    {listing.price}
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 1, opacity: 0.8 }}>
                    DojoCoins
                  </Typography>
                </Box>

                <Chip
                  label={listing.assetType}
                  size="small"
                  sx={{
                    background:
                      'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    color: 'white',
                    mb: 2,
                  }}
                />
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleBuyFromClanMarketplace(listing)}
                  disabled={(clanWallet?.balance || 0) < listing.price}
                  sx={{
                    background:
                      (clanWallet?.balance || 0) >= listing.price
                        ? 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
                        : 'rgba(255,255,255,0.2)',
                    color: 'white',
                  }}
                >
                  {(clanWallet?.balance || 0) >= listing.price
                    ? 'Buy Now'
                    : 'Insufficient Funds'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {listings.length === 0 && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            No listings available
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Be the first to create a listing for your clan!
          </Typography>
        </Paper>
      )}

      {/* Wallet Management Dialog */}
      <Dialog
        open={showWalletDialog}
        onClose={() => setShowWalletDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: 'white',
          }}
        >
          Clan Wallet Management
        </DialogTitle>
        <DialogContent sx={{ background: '#0f0f23', color: 'white' }}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ background: 'rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Deposit to Clan Wallet
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                    Your Balance: {userBalance} DojoCoins
                  </Typography>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    sx={{
                      '& .MuiInputLabel-root': { color: 'white' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255,255,255,0.5)',
                        },
                      },
                      '& .MuiInputBase-input': { color: 'white' },
                    }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 2,
                      background:
                        'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                    }}
                    onClick={handleDepositToClanWallet}
                  >
                    Deposit
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ background: 'rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Withdraw from Clan Wallet
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                    Clan Balance: {clanWallet?.balance || 0} DojoCoins
                  </Typography>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    sx={{
                      '& .MuiInputLabel-root': { color: 'white' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255,255,255,0.5)',
                        },
                      },
                      '& .MuiInputBase-input': { color: 'white' },
                    }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 2,
                      background:
                        'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)',
                    }}
                    onClick={handleWithdrawFromClanWallet}
                  >
                    Withdraw
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Transaction History */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Recent Transactions
          </Typography>
          {clanWallet?.transactions.slice(0, 10).map((transaction) => (
            <Card
              key={transaction.id}
              sx={{ mb: 2, background: 'rgba(255,255,255,0.05)' }}
            >
              <CardContent sx={{ py: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {transaction.description}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      by {transaction.user.username} •{' '}
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 'bold',
                        color: transaction.amount > 0 ? '#4CAF50' : '#FF6B35',
                      }}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {transaction.amount}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Balance: {transaction.balanceAfter}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </DialogContent>
        <DialogActions sx={{ background: '#0f0f23' }}>
          <Button
            onClick={() => setShowWalletDialog(false)}
            sx={{ color: 'white' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Listing Dialog - Placeholder for now */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: 'white',
          }}
        >
          Create Clan Listing
        </DialogTitle>
        <DialogContent sx={{ background: '#0f0f23', color: 'white' }}>
          <Typography variant="body1" sx={{ py: 2 }}>
            Listing creation functionality will be implemented in the next
            phase.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ background: '#0f0f23' }}>
          <Button
            onClick={() => setShowCreateDialog(false)}
            sx={{ color: 'white' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClanMarketplace;
