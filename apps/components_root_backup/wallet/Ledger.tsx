import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
  Badge,
  Container,
} from '@mui/material';
import {
  AccountBalance,
  CreditCard,
  Security,
  History,
  Send,
  South,
  SwapHoriz,
  QrCode,
  Visibility,
  VisibilityOff,
  Add,
  Edit,
  Delete,
  Star,
  EmojiEvents,
  Diamond,
  LocalAtm,
  AccountBalanceWallet,
  Payment,
  Settings,
  Receipt,
  AddCard,
  PhotoLibrary,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import useWalletService from '../../hooks/services/useWalletService';
import { useWalletConnection } from '../../hooks/useWalletConnection';
import { Layout } from '../Layout/[UI]Layout';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface NFT {
  id: number;
  name: string;
  type: string;
  description: string;
  image: string;
  value: number;
  rarity: string;
  acquiredDate: string;
}

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  description: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
}

interface BankDetails {
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  bankName: string;
  isVerified: boolean;
}

const Ledger: React.FC = () => {
  const { user } = useAuth();
  const { walletData, loading, error, fetchWalletData } = useWalletService();
  const {
    connection,
    isConnected,
    isLoading: walletConnecting,
    error: walletError,
    connectMetaMask,
    disconnect,
    getDojoCoinBalance,
    addDojoCoinToWallet,
    switchToEthereumMainnet,
    switchToPolygon,
  } = useWalletConnection();

  const [activeTab, setActiveTab] = useState(0);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendPassword, setSendPassword] = useState('');
  const [externalWalletBalance, setExternalWalletBalance] =
    useState<string>('0');

  // Mock data for NFTs and transactions
  const [nfts] = useState<NFT[]>([
    {
      id: 1,
      name: 'Championship Trophy',
      type: 'trophy',
      description: 'Awarded for winning the DojoPool Championship',
      image: '/images/trophy.png',
      value: 5000,
      rarity: 'legendary',
      acquiredDate: '2024-01-15',
    },
    {
      id: 2,
      name: 'Perfect Game Badge',
      type: 'award',
      description: 'Achieved a perfect game score',
      image: '/images/badge.png',
      value: 1000,
      rarity: 'epic',
      acquiredDate: '2024-01-10',
    },
    {
      id: 3,
      name: 'Dragon Avatar',
      type: 'avatar',
      description: 'Exclusive dragon-themed avatar',
      image: '/images/dragon.webp',
      value: 2500,
      rarity: 'rare',
      acquiredDate: '2024-01-05',
    },
  ]);

  const [transactions] = useState<Transaction[]>([
    {
      id: 1,
      type: 'credit',
      description: 'Tournament winnings',
      amount: 1000,
      currency: 'DOJO',
      date: '2024-01-15',
      status: 'completed',
    },
    {
      id: 2,
      type: 'debit',
      description: 'Payment to player',
      amount: 500,
      currency: 'DOJO',
      date: '2024-01-14',
      status: 'completed',
    },
    {
      id: 3,
      type: 'credit',
      description: 'NFT purchase',
      amount: 2500,
      currency: 'DOJO',
      date: '2024-01-10',
      status: 'completed',
    },
  ]);

  useEffect(() => {
    if (user?.id) {
      fetchWalletData(user.id);
    }
  }, [user, fetchWalletData]);

  // Fetch external wallet balance when connected
  useEffect(() => {
    if (isConnected && connection?.address) {
      getDojoCoinBalance()
        .then((balance) => setExternalWalletBalance(balance))
        .catch((err) =>
          console.error('Failed to get external wallet balance:', err)
        );
    }
  }, [isConnected, connection, getDojoCoinBalance]);

  const handleSendTransaction = () => {
    // Implement send transaction logic
    console.log('Sending transaction:', {
      amount: sendAmount,
      address: sendAddress,
    });
    setShowSendDialog(false);
    setSendAmount('');
    setSendAddress('');
    setSendPassword('');
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#ffd700';
      case 'epic':
        return '#9932cc';
      case 'rare':
        return '#4169e1';
      case 'common':
        return '#808080';
      default:
        return '#808080';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trophy':
        return <EmojiEvents />;
      case 'award':
        return <Star />;
      case 'avatar':
        return <Diamond />;
      default:
        return <Diamond />;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <Receipt color="success" />;
      case 'debit':
        return <Send color="error" />;
      default:
        return <Send color="error" />;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Error loading wallet data: {error}</Alert>;
  }

  if (!user) {
    return <Alert severity="warning">Please log in to view your wallet.</Alert>;
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            textAlign: 'center',
            mb: 4,
            background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          🏦 LEDGER
        </Typography>

        {/* External Wallet Connection Section */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper
              elevation={6}
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <Typography variant="h6" gutterBottom>
                🔗 External Wallet Integration
              </Typography>

              {!isConnected ? (
                <Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Connect your existing crypto wallet to view and manage Dojo
                    Coin alongside your other tokens.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={connectMetaMask}
                    disabled={walletConnecting}
                    startIcon={<AccountBalanceWallet />}
                    sx={{
                      background: 'rgba(255,255,255,0.2)',
                      '&:hover': { background: 'rgba(255,255,255,0.3)' },
                    }}
                  >
                    {walletConnecting ? 'Connecting...' : 'Connect MetaMask'}
                  </Button>
                  {walletError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {walletError}
                    </Alert>
                  )}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Connected: {connection?.address.slice(0, 6)}...
                    {connection?.address.slice(-4)}
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    External Wallet Balance:{' '}
                    {parseFloat(externalWalletBalance).toFixed(2)} DOJO
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      onClick={addDojoCoinToWallet}
                      startIcon={<AddCard />}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.5)',
                        color: 'white',
                        '&:hover': { borderColor: 'white' },
                      }}
                    >
                      Add to Wallet
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={switchToEthereumMainnet}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.5)',
                        color: 'white',
                        '&:hover': { borderColor: 'white' },
                      }}
                    >
                      Switch to Ethereum
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={switchToPolygon}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.5)',
                        color: 'white',
                        '&:hover': { borderColor: 'white' },
                      }}
                    >
                      Switch to Polygon
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={disconnect}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.5)',
                        color: 'white',
                        '&:hover': { borderColor: 'white' },
                      }}
                    >
                      Disconnect
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Main Balance Card */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              elevation={6}
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <Typography variant="h4" gutterBottom>
                💰 Total Balance
              </Typography>
              {loading ? (
                <CircularProgress sx={{ color: 'white' }} />
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  {walletData?.balance || '0.00'} DOJO
                </Typography>
              )}

              {/* Combined Balance Display */}
              {isConnected && (
                <Typography variant="h6" sx={{ mt: 2, opacity: 0.9 }}>
                  Combined:{' '}
                  {(
                    parseFloat(String(walletData?.balance || '0')) +
                    parseFloat(externalWalletBalance.toString())
                  ).toFixed(2)}{' '}
                  DOJO
                </Typography>
              )}

              <Box
                sx={{
                  mt: 3,
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                }}
              >
                <Button
                  variant="contained"
                  onClick={() => setShowSendDialog(true)}
                  startIcon={<Send />}
                  sx={{
                    background: 'rgba(255,255,255,0.2)',
                    '&:hover': { background: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  Send
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Receipt />}
                  sx={{
                    background: 'rgba(255,255,255,0.2)',
                    '&:hover': { background: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  Receive
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Tabs */}
          <Grid item xs={12}>
            <Paper
              elevation={6}
              sx={{
                background:
                  'linear-gradient(135deg, #181818 60%, #00a8ff 100%)',
                border: '2px solid #00a8ff',
                borderRadius: 3,
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  borderBottom: '2px solid #00a8ff',
                  '& .MuiTab-root': {
                    color: '#00a8ff',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 700,
                    '&.Mui-selected': {
                      color: '#00ff9d',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#00ff9d',
                  },
                }}
              >
                <Tab label="NFTs & Trophies" />
                <Tab label="Transactions" />
                <Tab label="Bank Details" />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <Grid container spacing={3}>
                  {nfts.map((nft) => (
                    <Grid item xs={12} sm={6} md={4} key={nft.id}>
                      <Card
                        sx={{
                          background: 'rgba(0, 0, 0, 0.8)',
                          border: '2px solid #00a8ff',
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 0 30px rgba(0, 168, 255, 0.5)',
                          },
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="200"
                          image={nft.image}
                          alt={nft.name}
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardContent>
                          <Typography
                            variant="h6"
                            sx={{
                              color: '#00ff9d',
                              fontFamily: 'Orbitron, monospace',
                              fontWeight: 700,
                              mb: 1,
                            }}
                          >
                            {nft.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#ccc',
                              fontFamily: 'Orbitron, monospace',
                              mb: 2,
                            }}
                          >
                            {nft.description}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mb: 2,
                            }}
                          >
                            <Chip
                              label={nft.rarity.toUpperCase()}
                              sx={{
                                backgroundColor: getRarityColor(nft.rarity),
                                color: '#000',
                                fontFamily: 'Orbitron, monospace',
                                fontWeight: 700,
                              }}
                            />
                            <Typography
                              variant="h6"
                              sx={{
                                color: '#00a8ff',
                                fontFamily: 'Orbitron, monospace',
                                fontWeight: 700,
                              }}
                            >
                              {nft.value} DOJO
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#888',
                              fontFamily: 'Orbitron, monospace',
                            }}
                          >
                            Acquired: {nft.acquiredDate}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <List>
                  {transactions.map((transaction) => (
                    <React.Fragment key={transaction.id}>
                      <ListItem
                        sx={{
                          background: 'rgba(0, 0, 0, 0.5)',
                          borderRadius: 2,
                          mb: 1,
                          border: '1px solid #00a8ff',
                        }}
                      >
                        <ListItemIcon>
                          {getTransactionIcon(transaction.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              sx={{
                                color: '#00ff9d',
                                fontFamily: 'Orbitron, monospace',
                                fontWeight: 700,
                              }}
                            >
                              {transaction.description}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              sx={{
                                color: '#ccc',
                                fontFamily: 'Orbitron, monospace',
                              }}
                            >
                              {transaction.date} • {transaction.status}
                            </Typography>
                          }
                        />
                        <Typography
                          variant="h6"
                          sx={{
                            color:
                              transaction.type === 'credit'
                                ? '#00ff9d'
                                : '#ff6b6b',
                            fontFamily: 'Orbitron, monospace',
                            fontWeight: 700,
                          }}
                        >
                          {transaction.type === 'credit' ? '+' : '-'}
                          {transaction.amount} {transaction.currency}
                        </Typography>
                      </ListItem>
                      <Divider sx={{ borderColor: '#00a8ff' }} />
                    </React.Fragment>
                  ))}
                </List>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 3,
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: '2px solid #00a8ff',
                        borderRadius: 3,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#00ff9d',
                          fontFamily: 'Orbitron, monospace',
                          fontWeight: 700,
                          mb: 2,
                        }}
                      >
                        Bank Account Details
                      </Typography>
                      {bankDetails ? (
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              color: '#ccc',
                              fontFamily: 'Orbitron, monospace',
                              mb: 1,
                            }}
                          >
                            Bank: {bankDetails.bankName}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              color: '#ccc',
                              fontFamily: 'Orbitron, monospace',
                              mb: 1,
                            }}
                          >
                            Account: ****{bankDetails.accountNumber.slice(-4)}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              color: '#ccc',
                              fontFamily: 'Orbitron, monospace',
                              mb: 2,
                            }}
                          >
                            Type: {bankDetails.accountType}
                          </Typography>
                          <Chip
                            label={
                              bankDetails.isVerified
                                ? 'Verified'
                                : 'Pending Verification'
                            }
                            color={
                              bankDetails.isVerified ? 'success' : 'warning'
                            }
                            sx={{
                              fontFamily: 'Orbitron, monospace',
                              fontWeight: 700,
                            }}
                          />
                        </Box>
                      ) : (
                        <Typography
                          variant="body1"
                          sx={{
                            color: '#888',
                            fontFamily: 'Orbitron, monospace',
                            mb: 2,
                          }}
                        >
                          No bank details added yet.
                        </Typography>
                      )}
                      <Button
                        variant="contained"
                        onClick={() => setShowBankDialog(true)}
                        startIcon={bankDetails ? <Edit /> : <Add />}
                        sx={{
                          background:
                            'linear-gradient(45deg, #00ff9d, #00a8ff)',
                          color: '#000',
                          fontFamily: 'Orbitron, monospace',
                          fontWeight: 700,
                          mt: 2,
                          '&:hover': {
                            background:
                              'linear-gradient(45deg, #00a8ff, #00ff9d)',
                          },
                        }}
                      >
                        {bankDetails ? 'Edit Bank Details' : 'Add Bank Details'}
                      </Button>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 3,
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: '2px solid #00a8ff',
                        borderRadius: 3,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#00ff9d',
                          fontFamily: 'Orbitron, monospace',
                          fontWeight: 700,
                          mb: 2,
                        }}
                      >
                        Security Settings
                      </Typography>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          sx={{ color: '#00a8ff' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                        <Typography
                          variant="body1"
                          sx={{
                            color: '#ccc',
                            fontFamily: 'Orbitron, monospace',
                          }}
                        >
                          {showPassword ? 'Hide' : 'Show'} Password
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        startIcon={<Security />}
                        sx={{
                          borderColor: '#00a8ff',
                          color: '#00a8ff',
                          fontFamily: 'Orbitron, monospace',
                          '&:hover': {
                            borderColor: '#00ff9d',
                            color: '#00ff9d',
                          },
                        }}
                      >
                        Change Password
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>

        {/* Send Transaction Dialog */}
        <Dialog
          open={showSendDialog}
          onClose={() => setShowSendDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #181818 60%, #00a8ff 100%)',
              border: '2px solid #00a8ff',
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle
            sx={{
              color: '#00ff9d',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
            }}
          >
            Send DOJO
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Recipient Address"
              value={sendAddress}
              onChange={(e) => setSendAddress(e.target.value)}
              sx={{
                mb: 2,
                mt: 1,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: '#00a8ff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00ff9d',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#00a8ff',
                  fontFamily: 'Orbitron, monospace',
                },
              }}
            />
            <TextField
              fullWidth
              label="Amount (DOJO)"
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: '#00a8ff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00ff9d',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#00a8ff',
                  fontFamily: 'Orbitron, monospace',
                },
              }}
            />
            <TextField
              fullWidth
              label="Wallet Password"
              type={showPassword ? 'text' : 'password'}
              value={sendPassword}
              onChange={(e) => setSendPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    sx={{ color: '#00a8ff' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: '#00a8ff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00ff9d',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#00a8ff',
                  fontFamily: 'Orbitron, monospace',
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowSendDialog(false)}
              sx={{
                color: '#ff6b6b',
                fontFamily: 'Orbitron, monospace',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTransaction}
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #00ff9d, #00a8ff)',
                color: '#000',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 700,
                '&:hover': {
                  background: 'linear-gradient(45deg, #00a8ff, #00ff9d)',
                },
              }}
            >
              Send
            </Button>
          </DialogActions>
        </Dialog>

        {/* Receive Dialog */}
        <Dialog
          open={showReceiveDialog}
          onClose={() => setShowReceiveDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #181818 60%, #00a8ff 100%)',
              border: '2px solid #00a8ff',
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle
            sx={{
              color: '#00ff9d',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
            }}
          >
            Receive DOJO
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center' }}>
            <Box sx={{ p: 3 }}>
              <QrCode sx={{ fontSize: 200, color: '#00a8ff', mb: 2 }} />
              <Typography
                variant="h6"
                sx={{
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                Your Wallet Address
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid #00a8ff',
                  borderRadius: 2,
                  wordBreak: 'break-all',
                }}
              >
                <Typography
                  sx={{
                    color: '#fff',
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '0.8rem',
                  }}
                >
                  0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
                </Typography>
              </Paper>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowReceiveDialog(false)}
              sx={{
                color: '#00a8ff',
                fontFamily: 'Orbitron, monospace',
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bank Details Dialog */}
        <Dialog
          open={showBankDialog}
          onClose={() => setShowBankDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #181818 60%, #00a8ff 100%)',
              border: '2px solid #00a8ff',
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle
            sx={{
              color: '#00ff9d',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
            }}
          >
            {bankDetails ? 'Edit Bank Details' : 'Add Bank Details'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Bank Name"
              defaultValue={bankDetails?.bankName || ''}
              sx={{
                mb: 2,
                mt: 1,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: '#00a8ff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00ff9d',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#00a8ff',
                  fontFamily: 'Orbitron, monospace',
                },
              }}
            />
            <TextField
              fullWidth
              label="Account Number"
              defaultValue={bankDetails?.accountNumber || ''}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: '#00a8ff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00ff9d',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#00a8ff',
                  fontFamily: 'Orbitron, monospace',
                },
              }}
            />
            <TextField
              fullWidth
              label="Routing Number"
              defaultValue={bankDetails?.routingNumber || ''}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: '#00a8ff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00ff9d',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#00a8ff',
                  fontFamily: 'Orbitron, monospace',
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowBankDialog(false)}
              sx={{
                color: '#ff6b6b',
                fontFamily: 'Orbitron, monospace',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setBankDetails({
                  bankName: 'Sample Bank',
                  accountNumber: '1234567890',
                  routingNumber: '021000021',
                  accountType: 'checking',
                  isVerified: true,
                });
                setShowBankDialog(false);
              }}
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #00ff9d, #00a8ff)',
                color: '#000',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 700,
                '&:hover': {
                  background: 'linear-gradient(45deg, #00a8ff, #00ff9d)',
                },
              }}
            >
              {bankDetails ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Ledger;
