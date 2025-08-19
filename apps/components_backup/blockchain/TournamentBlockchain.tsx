import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Payment,
  Token,
  SmartToy,
  Collections,
  TrendingUp,
  Refresh,
  Add,
  Send,
  Receipt,
  Security,
  Speed,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import TournamentBlockchainService, {
  type BlockchainTransaction,
  type WalletInfo,
  type SmartContract,
  type NFTMetadata,
  type DeFiPool,
} from '../../services/blockchain/TournamentBlockchainService';

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
      id={`blockchain-tabpanel-${index}`}
      aria-labelledby={`blockchain-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TournamentBlockchain: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [nfts, setNfts] = useState<NFTMetadata[]>([]);
  const [defiPools, setDefiPools] = useState<DeFiPool[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    type: 'payment' as const,
    amount: '',
    currency: 'DOJO' as const,
    to: '',
    tournamentId: '',
    matchId: '',
    playerId: '',
  });

  // Wallet connection state
  const [selectedNetwork, setSelectedNetwork] = useState<
    'ethereum' | 'solana' | 'polygon'
  >('ethereum');

  // NFT minting state
  const [nftForm, setNftForm] = useState({
    name: '',
    description: '',
    image: '',
    rarity: 'common' as const,
    tournamentId: '',
    playerId: '',
  });

  // DeFi pool state
  const [poolForm, setPoolForm] = useState({
    name: '',
    tokens: [] as string[],
    liquidity: '',
  });

  // Dialog states
  const [transactionDialog, setTransactionDialog] = useState(false);
  const [nftDialog, setNftDialog] = useState(false);
  const [poolDialog, setPoolDialog] = useState(false);

  const blockchainService = TournamentBlockchainService.getInstance();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setTransactions(blockchainService.getTransactions());
    setWallets(blockchainService.getWallets());
    setContracts(blockchainService.getContracts());
    setNfts(blockchainService.getNFTs());
    setDefiPools(blockchainService.getDeFiPools());
    setIsConnected(blockchainService.isOnline());
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateTransaction = async () => {
    if (!transactionForm.amount || !transactionForm.to) {
      return;
    }

    setLoading(true);
    try {
      await blockchainService.createTransaction({
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount),
        currency: transactionForm.currency,
        from:
          wallets[0]?.address || '0x0000000000000000000000000000000000000000',
        to: transactionForm.to,
        tournamentId: transactionForm.tournamentId || undefined,
        matchId: transactionForm.matchId || undefined,
        playerId: transactionForm.playerId || undefined,
      });

      setTransactionForm({
        type: 'payment',
        amount: '',
        currency: 'DOJO',
        to: '',
        tournamentId: '',
        matchId: '',
        playerId: '',
      });
      setTransactionDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      await blockchainService.connectWallet(selectedNetwork);
      loadData();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMintNFT = async () => {
    if (!nftForm.name || !nftForm.description) {
      return;
    }

    setLoading(true);
    try {
      await blockchainService.mintNFT({
        name: nftForm.name,
        description: nftForm.description,
        image: nftForm.image || '/images/default-nft.png',
        attributes: [
          { trait_type: 'Rarity', value: nftForm.rarity },
          { trait_type: 'Tournament', value: nftForm.tournamentId || 'N/A' },
          { trait_type: 'Player', value: nftForm.playerId || 'N/A' },
        ],
        tournamentId: nftForm.tournamentId || undefined,
        playerId: nftForm.playerId || undefined,
        rarity: nftForm.rarity,
      });

      setNftForm({
        name: '',
        description: '',
        image: '',
        rarity: 'common',
        tournamentId: '',
        playerId: '',
      });
      setNftDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to mint NFT:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePool = async () => {
    if (!poolForm.name || !poolForm.liquidity || poolForm.tokens.length === 0) {
      return;
    }

    setLoading(true);
    try {
      await blockchainService.createDeFiPool({
        name: poolForm.name,
        tokens: poolForm.tokens,
        liquidity: parseFloat(poolForm.liquidity),
        volume24h: 0,
        apy: Math.random() * 20 + 5,
        tvl: parseFloat(poolForm.liquidity),
      });

      setPoolForm({
        name: '',
        tokens: [],
        liquidity: '',
      });
      setPoolDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to create pool:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#00ff88';
      case 'pending':
        return '#ffaa00';
      case 'failed':
        return '#ff4444';
      default:
        return '#888888';
    }
  };

  const getCurrencyColor = (currency: string) => {
    switch (currency) {
      case 'DOJO':
        return '#ff6b35';
      case 'ETH':
        return '#627eea';
      case 'SOL':
        return '#9945ff';
      default:
        return '#888888';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#ffffff',
        p: 3,
      }}
    >
      <Box
        sx={{
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 3,
          border: '1px solid #00ff88',
          boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(90deg, #00ff88 0%, #00ccff 100%)',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <AccountBalanceWallet sx={{ fontSize: 40, color: '#000' }} />
          <Box>
            <Typography variant="h4" sx={{ color: '#000', fontWeight: 'bold' }}>
              Blockchain Integration
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ color: '#000', opacity: 0.8 }}
            >
              Cryptocurrency payments, NFTs, and DeFi integration
            </Typography>
          </Box>
          <Box
            sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}
          >
            <Chip
              label={isConnected ? 'Connected' : 'Disconnected'}
              color={isConnected ? 'success' : 'error'}
              sx={{
                background: isConnected
                  ? 'rgba(0, 255, 136, 0.2)'
                  : 'rgba(255, 68, 68, 0.2)',
                border: `1px solid ${isConnected ? '#00ff88' : '#ff4444'}`,
              }}
            />
            <IconButton onClick={loadData} disabled={loading}>
              <Refresh sx={{ color: '#000' }} />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: '#333' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: '#888',
                '&.Mui-selected': {
                  color: '#00ff88',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#00ff88',
              },
            }}
          >
            <Tab label="Transactions" icon={<Receipt />} />
            <Tab label="Wallets" icon={<AccountBalanceWallet />} />
            <Tab label="Smart Contracts" icon={<SmartToy />} />
            <Tab label="NFTs" icon={<Collections />} />
            <Tab label="DeFi Pools" icon={<TrendingUp />} />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#00ff88' }}>
              Blockchain Transactions
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setTransactionDialog(true)}
              sx={{
                background: 'linear-gradient(45deg, #00ff88, #00ccff)',
                color: '#000',
                '&:hover': {
                  background: 'linear-gradient(45deg, #00ccff, #00ff88)',
                },
              }}
            >
              New Transaction
            </Button>
          </Box>

          <Grid container spacing={2}>
            {transactions.map((tx) => (
              <Grid item xs={12} md={6} key={tx.id}>
                <Card
                  sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid #333',
                    '&:hover': { borderColor: '#00ff88' },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#00ff88' }}>
                        {tx.type.replace('_', ' ').toUpperCase()}
                      </Typography>
                      <Chip
                        label={tx.status}
                        sx={{
                          background: `rgba(${getStatusColor(tx.status)}, 0.2)`,
                          border: `1px solid ${getStatusColor(tx.status)}`,
                          color: getStatusColor(tx.status),
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      Amount:{' '}
                      <span style={{ color: getCurrencyColor(tx.currency) }}>
                        {tx.amount} {tx.currency}
                      </span>
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      From: {tx.from.substring(0, 10)}...
                      {tx.from.substring(tx.from.length - 8)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      To: {tx.to.substring(0, 10)}...
                      {tx.to.substring(tx.to.length - 8)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {tx.timestamp.toLocaleString()}
                    </Typography>
                    {tx.transactionHash && (
                      <Typography variant="body2" sx={{ color: '#888', mt: 1 }}>
                        Hash: {tx.transactionHash.substring(0, 20)}...
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#00ff88' }}>
              Connected Wallets
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: '#888' }}>Network</InputLabel>
                <Select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value as any)}
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#333',
                    },
                  }}
                >
                  <MenuItem value="ethereum">Ethereum</MenuItem>
                  <MenuItem value="solana">Solana</MenuItem>
                  <MenuItem value="polygon">Polygon</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleConnectWallet}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(45deg, #00ff88, #00ccff)',
                  color: '#000',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #00ccff, #00ff88)',
                  },
                }}
              >
                Connect Wallet
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {wallets.map((wallet) => (
              <Grid item xs={12} md={6} key={wallet.address}>
                <Card
                  sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid #333',
                    '&:hover': { borderColor: '#00ff88' },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#00ff88' }}>
                        {wallet.network.toUpperCase()} Wallet
                      </Typography>
                      <Chip
                        label={
                          wallet.isConnected ? 'Connected' : 'Disconnected'
                        }
                        color={wallet.isConnected ? 'success' : 'error'}
                        sx={{
                          background: wallet.isConnected
                            ? 'rgba(0, 255, 136, 0.2)'
                            : 'rgba(255, 68, 68, 0.2)',
                          border: `1px solid ${wallet.isConnected ? '#00ff88' : '#ff4444'}`,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      Address: {wallet.address.substring(0, 10)}...
                      {wallet.address.substring(wallet.address.length - 8)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#ff6b35', mb: 1 }}
                    >
                      DOJO: {wallet.balance.DOJO.toFixed(2)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#627eea', mb: 1 }}
                    >
                      ETH: {wallet.balance.ETH.toFixed(4)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#9945ff', mb: 1 }}
                    >
                      SOL: {wallet.balance.SOL.toFixed(4)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Last Sync: {wallet.lastSync.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ color: '#00ff88', mb: 3 }}>
            Smart Contracts
          </Typography>

          <Grid container spacing={2}>
            {contracts.map((contract) => (
              <Grid item xs={12} md={6} key={contract.address}>
                <Card
                  sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid #333',
                    '&:hover': { borderColor: '#00ff88' },
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00ff88', mb: 2 }}>
                      {contract.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      Type: {contract.type}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      Network: {contract.network}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      Address: {contract.address.substring(0, 10)}...
                      {contract.address.substring(contract.address.length - 8)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Functions: {contract.functions.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Events: {contract.events.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#00ff88' }}>
              NFT Collection
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setNftDialog(true)}
              sx={{
                background: 'linear-gradient(45deg, #00ff88, #00ccff)',
                color: '#000',
                '&:hover': {
                  background: 'linear-gradient(45deg, #00ccff, #00ff88)',
                },
              }}
            >
              Mint NFT
            </Button>
          </Box>

          <Grid container spacing={2}>
            {nfts.map((nft) => (
              <Grid item xs={12} md={4} key={nft.tokenId}>
                <Card
                  sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid #333',
                    '&:hover': { borderColor: '#00ff88' },
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00ff88', mb: 2 }}>
                      {nft.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                      {nft.description}
                    </Typography>
                    <Chip
                      label={nft.rarity}
                      sx={{
                        background: `rgba(${
                          nft.rarity === 'legendary'
                            ? '255, 215, 0'
                            : nft.rarity === 'epic'
                              ? '138, 43, 226'
                              : nft.rarity === 'rare'
                                ? '0, 191, 255'
                                : '128, 128, 128'
                        }, 0.2)`,
                        border: `1px solid ${
                          nft.rarity === 'legendary'
                            ? '#ffd700'
                            : nft.rarity === 'epic'
                              ? '#8a2be2'
                              : nft.rarity === 'rare'
                                ? '#00bfff'
                                : '#808080'
                        }`,
                        color:
                          nft.rarity === 'legendary'
                            ? '#ffd700'
                            : nft.rarity === 'epic'
                              ? '#8a2be2'
                              : nft.rarity === 'rare'
                                ? '#00bfff'
                                : '#808080',
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#888', mt: 2 }}>
                      Token ID: {nft.tokenId}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Minted: {nft.mintDate.toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#00ff88' }}>
              DeFi Liquidity Pools
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setPoolDialog(true)}
              sx={{
                background: 'linear-gradient(45deg, #00ff88, #00ccff)',
                color: '#000',
                '&:hover': {
                  background: 'linear-gradient(45deg, #00ccff, #00ff88)',
                },
              }}
            >
              Create Pool
            </Button>
          </Box>

          <Grid container spacing={2}>
            {defiPools.map((pool) => (
              <Grid item xs={12} md={6} key={pool.id}>
                <Card
                  sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid #333',
                    '&:hover': { borderColor: '#00ff88' },
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00ff88', mb: 2 }}>
                      {pool.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      Tokens: {pool.tokens.join(' - ')}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#00ff88', mb: 1 }}
                    >
                      Liquidity: ${pool.liquidity.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#00ccff', mb: 1 }}
                    >
                      APY: {pool.apy.toFixed(2)}%
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#ffaa00', mb: 1 }}
                    >
                      24h Volume: ${pool.volume24h.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      TVL: ${pool.tvl.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Box>

      {/* Transaction Dialog */}
      <Dialog
        open={transactionDialog}
        onClose={() => setTransactionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ background: '#1a1a2e', color: '#00ff88' }}>
          Create New Transaction
        </DialogTitle>
        <DialogContent sx={{ background: '#1a1a2e', pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#888' }}>Transaction Type</InputLabel>
                <Select
                  value={transactionForm.type}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      type: e.target.value as any,
                    })
                  }
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#333',
                    },
                  }}
                >
                  <MenuItem value="payment">Payment</MenuItem>
                  <MenuItem value="reward">Reward</MenuItem>
                  <MenuItem value="entry_fee">Entry Fee</MenuItem>
                  <MenuItem value="prize_payout">Prize Payout</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={transactionForm.amount}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    amount: e.target.value,
                  })
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: '#333' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#888' }}>Currency</InputLabel>
                <Select
                  value={transactionForm.currency}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      currency: e.target.value as any,
                    })
                  }
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#333',
                    },
                  }}
                >
                  <MenuItem value="DOJO">DOJO</MenuItem>
                  <MenuItem value="ETH">ETH</MenuItem>
                  <MenuItem value="SOL">SOL</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="To Address"
                value={transactionForm.to}
                onChange={(e) =>
                  setTransactionForm({ ...transactionForm, to: e.target.value })
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: '#333' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tournament ID"
                value={transactionForm.tournamentId}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    tournamentId: e.target.value,
                  })
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: '#333' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Match ID"
                value={transactionForm.matchId}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    matchId: e.target.value,
                  })
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: '#333' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Player ID"
                value={transactionForm.playerId}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    playerId: e.target.value,
                  })
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: '#333' },
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ background: '#1a1a2e' }}>
          <Button
            onClick={() => setTransactionDialog(false)}
            sx={{ color: '#888' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateTransaction}
            disabled={loading}
            sx={{
              background: 'linear-gradient(45deg, #00ff88, #00ccff)',
              color: '#000',
              '&:hover': {
                background: 'linear-gradient(45deg, #00ccff, #00ff88)',
              },
            }}
          >
            {loading ? <CircularProgress size={20} /> : 'Create Transaction'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* NFT Dialog */}
      <Dialog
        open={nftDialog}
        onClose={() => setNftDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ background: '#1a1a2e', color: '#00ff88' }}>
          Mint New NFT
        </DialogTitle>
        <DialogContent sx={{ background: '#1a1a2e', pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="NFT Name"
                value={nftForm.name}
                onChange={(e) =>
                  setNftForm({ ...nftForm, name: e.target.value })
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: '#333' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={nftForm.description}
                onChange={(e) =>
                  setNftForm({ ...nftForm, description: e.target.value })
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: '#333' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#888' }}>Rarity</InputLabel>
                <Select
                  value={nftForm.rarity}
                  onChange={(e) =>
                    setNftForm({ ...nftForm, rarity: e.target.value as any })
                  }
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#333',
                    },
                  }}
                >
                  <MenuItem value="common">Common</MenuItem>
                  <MenuItem value="rare">Rare</MenuItem>
                  <MenuItem value="epic">Epic</MenuItem>
                  <MenuItem value="legendary">Legendary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Image URL"
                value={nftForm.image}
                onChange={(e) =>
                  setNftForm({ ...nftForm, image: e.target.value })
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: '#333' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tournament ID"
                value={nftForm.tournamentId}
                onChange={(e) =>
                  setNftForm({ ...nftForm, tournamentId: e.target.value })
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: '#333' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Player ID"
                value={nftForm.playerId}
                onChange={(e) =>
                  setNftForm({ ...nftForm, playerId: e.target.value })
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: '#333' },
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ background: '#1a1a2e' }}>
          <Button onClick={() => setNftDialog(false)} sx={{ color: '#888' }}>
            Cancel
          </Button>
          <Button
            onClick={handleMintNFT}
            disabled={loading}
            sx={{
              background: 'linear-gradient(45deg, #00ff88, #00ccff)',
              color: '#000',
              '&:hover': {
                background: 'linear-gradient(45deg, #00ccff, #00ff88)',
              },
            }}
          >
            {loading ? <CircularProgress size={20} /> : 'Mint NFT'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pool Dialog */}
      <Dialog
        open={poolDialog}
        onClose={() => setPoolDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ background: '#1a1a2e', color: '#00ff88' }}>
          Create DeFi Pool
        </DialogTitle>
        <DialogContent sx={{ background: '#1a1a2e', pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pool Name"
                value={poolForm.name}
                onChange={(e) =>
                  setPoolForm({ ...poolForm, name: e.target.value })
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: '#333' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Initial Liquidity"
                type="number"
                value={poolForm.liquidity}
                onChange={(e) =>
                  setPoolForm({ ...poolForm, liquidity: e.target.value })
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: '#333' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#888' }}>Tokens</InputLabel>
                <Select
                  multiple
                  value={poolForm.tokens}
                  onChange={(e) =>
                    setPoolForm({
                      ...poolForm,
                      tokens: e.target.value as string[],
                    })
                  }
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#333',
                    },
                  }}
                >
                  <MenuItem value="DOJO">DOJO</MenuItem>
                  <MenuItem value="ETH">ETH</MenuItem>
                  <MenuItem value="SOL">SOL</MenuItem>
                  <MenuItem value="USDC">USDC</MenuItem>
                  <MenuItem value="USDT">USDT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ background: '#1a1a2e' }}>
          <Button onClick={() => setPoolDialog(false)} sx={{ color: '#888' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreatePool}
            disabled={loading}
            sx={{
              background: 'linear-gradient(45deg, #00ff88, #00ccff)',
              color: '#000',
              '&:hover': {
                background: 'linear-gradient(45deg, #00ccff, #00ff88)',
              },
            }}
          >
            {loading ? <CircularProgress size={20} /> : 'Create Pool'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentBlockchain;
