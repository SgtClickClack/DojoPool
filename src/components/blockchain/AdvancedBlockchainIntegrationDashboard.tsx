/**
 * Advanced Blockchain Integration & NFT Management Dashboard
 * 
 * Comprehensive dashboard for blockchain integration, NFT management,
 * smart contract interactions, cross-chain operations, and digital asset management.
 */

import React, { useState } from 'react';
import { useAdvancedBlockchainIntegration } from '../../hooks/useAdvancedBlockchainIntegration';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  AccountBalanceWallet as WalletIcon,
  Token as TokenIcon,
  Collections as CollectionsIcon,
  SwapHoriz as BridgeIcon,
  Analytics as AnalyticsIcon,
  Store as MarketplaceIcon,
  Code as ContractIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

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

export const AdvancedBlockchainIntegrationDashboard: React.FC = () => {
  const {
    collections,
    tokens,
    contracts,
    transactions,
    bridges,
    wallets,
    marketplaces,
    analytics,
    loading,
    errors,
    createCollection,
    mintNFT,
    transferNFT,
    evolveNFT,
    deployContract,
    createBridge,
    bridgeTokens,
    connectWallet,
    listNFT,
    buyNFT,
    getAnalytics,
    refreshData,
    clearErrors
  } = useAdvancedBlockchainIntegration();

  const [tabValue, setTabValue] = useState(0);
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (dialogName: string) => {
    setOpenDialogs(prev => ({ ...prev, [dialogName]: true }));
  };

  const handleCloseDialog = (dialogName: string) => {
    setOpenDialogs(prev => ({ ...prev, [dialogName]: false }));
    setFormData({});
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateCollection = async () => {
    try {
      await createCollection(formData);
      handleCloseDialog('createCollection');
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  const handleMintNFT = async () => {
    try {
      await mintNFT(
        formData.collectionId,
        formData.owner,
        formData.metadata,
        formData.gasPrice
      );
      handleCloseDialog('mintNFT');
    } catch (error) {
      console.error('Failed to mint NFT:', error);
    }
  };

  const handleDeployContract = async () => {
    try {
      await deployContract(
        formData.name,
        formData.abi,
        formData.bytecode,
        formData.chainId,
        formData.owner,
        formData.constructorArgs
      );
      handleCloseDialog('deployContract');
    } catch (error) {
      console.error('Failed to deploy contract:', error);
    }
  };

  const handleCreateBridge = async () => {
    try {
      await createBridge(formData);
      handleCloseDialog('createBridge');
    } catch (error) {
      console.error('Failed to create bridge:', error);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet(
        formData.userId,
        formData.address,
        formData.chainId,
        formData.walletType
      );
      handleCloseDialog('connectWallet');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleListNFT = async () => {
    try {
      await listNFT(
        formData.tokenId,
        formData.price,
        formData.currency,
        formData.marketplaceId
      );
      handleCloseDialog('listNFT');
    } catch (error) {
      console.error('Failed to list NFT:', error);
    }
  };

  const handleBuyNFT = async () => {
    try {
      await buyNFT(
        formData.tokenId,
        formData.buyer,
        formData.price,
        formData.marketplaceId
      );
      handleCloseDialog('buyNFT');
    } catch (error) {
      console.error('Failed to buy NFT:', error);
    }
  };

  const handleBridgeTokens = async () => {
    try {
      await bridgeTokens(
        formData.bridgeId,
        formData.amount,
        formData.fromAddress,
        formData.toAddress
      );
      handleCloseDialog('bridgeTokens');
    } catch (error) {
      console.error('Failed to bridge tokens:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return 'Ethereum';
      case 137:
        return 'Polygon';
      case 56:
        return 'BSC';
      default:
        return `Chain ${chainId}`;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Advanced Blockchain Integration & NFT Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Comprehensive blockchain integration, NFT management, smart contract interactions, and cross-chain operations
        </Typography>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshData}
            disabled={Object.values(loading).some(Boolean)}
          >
            Refresh Data
          </Button>
          <Button
            variant="outlined"
            onClick={clearErrors}
            disabled={!Object.values(errors).some(Boolean)}
          >
            Clear Errors
          </Button>
        </Box>
      </Box>

      {/* Error Alerts */}
      {Object.entries(errors).map(([key, error]) => 
        error && (
          <Alert key={key} severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )
      )}

      {/* Analytics Overview */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Transactions
                </Typography>
                <Typography variant="h4">
                  {analytics.totalTransactions.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Volume
                </Typography>
                <Typography variant="h4">
                  ${analytics.totalVolume.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Active Wallets
                </Typography>
                <Typography variant="h4">
                  {analytics.activeWallets.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  NFTs Minted
                </Typography>
                <Typography variant="h4">
                  {analytics.nftMinted.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="blockchain tabs">
          <Tab icon={<CollectionsIcon />} label="Collections" />
          <Tab icon={<TokenIcon />} label="NFTs" />
          <Tab icon={<ContractIcon />} label="Contracts" />
          <Tab icon={<BridgeIcon />} label="Cross-Chain" />
          <Tab icon={<WalletIcon />} label="Wallets" />
          <Tab icon={<MarketplaceIcon />} label="Marketplace" />
          <Tab icon={<AnalyticsIcon />} label="Analytics" />
        </Tabs>
      </Box>

      {/* Collections Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">NFT Collections</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('createCollection')}
          >
            Create Collection
          </Button>
        </Box>

        {loading.collections ? (
          <CircularProgress />
        ) : (
          <Grid container spacing={3}>
            {collections.map((collection) => (
              <Grid item xs={12} md={6} lg={4} key={collection.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {collection.name}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {collection.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">
                        Symbol: {collection.symbol}
                      </Typography>
                      <Typography variant="body2">
                        Chain: {getChainName(collection.chainId)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">
                        Minted: {collection.mintedCount}/{collection.totalSupply}
                      </Typography>
                      <Typography variant="body2">
                        Price: {collection.mintPrice} {collection.mintCurrency}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(collection.mintedCount / collection.totalSupply) * 100} 
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<ViewIcon />}>
                        View
                      </Button>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* NFTs Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">NFT Tokens</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('mintNFT')}
          >
            Mint NFT
          </Button>
        </Box>

        {loading.tokens ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Token ID</TableCell>
                  <TableCell>Collection</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Evolution Stage</TableCell>
                  <TableCell>Market Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>{token.tokenId}</TableCell>
                    <TableCell>{collections.find(c => c.id === token.collectionId)?.name}</TableCell>
                    <TableCell>{token.owner}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`Stage ${token.evolution.stage}/${token.evolution.maxStage}`}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {token.marketData.isListed ? (
                        <Chip label="Listed" color="warning" size="small" />
                      ) : (
                        <Chip label="Not Listed" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Transfer">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Evolve">
                          <IconButton size="small">
                            <TrendingUpIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Contracts Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Smart Contracts</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('deployContract')}
          >
            Deploy Contract
          </Button>
        </Box>

        {loading.contracts ? (
          <CircularProgress />
        ) : (
          <Grid container spacing={3}>
            {contracts.map((contract) => (
              <Grid item xs={12} md={6} key={contract.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {contract.name}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {contract.address}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">
                        Type: {contract.type}
                      </Typography>
                      <Typography variant="body2">
                        Chain: {getChainName(contract.chainId)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">
                        Gas Used: {contract.gasUsed.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        Transactions: {contract.transactionCount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<ViewIcon />}>
                        View
                      </Button>
                      <Button size="small" startIcon={<SecurityIcon />}>
                        Verify
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Cross-Chain Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Cross-Chain Bridges</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('createBridge')}
          >
            Create Bridge
          </Button>
        </Box>

        {loading.bridges ? (
          <CircularProgress />
        ) : (
          <Grid container spacing={3}>
            {bridges.map((bridge) => (
              <Grid item xs={12} md={6} key={bridge.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {bridge.name}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">
                        {getChainName(bridge.sourceChain)} → {getChainName(bridge.destinationChain)}
                      </Typography>
                      <Chip 
                        label={bridge.isActive ? 'Active' : 'Inactive'} 
                        color={bridge.isActive ? 'success' : 'default'} 
                        size="small" 
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">
                        Fee: {bridge.fee}%
                      </Typography>
                      <Typography variant="body2">
                        Est. Time: {bridge.estimatedTime}min
                      </Typography>
                    </Box>
                    <Typography variant="body2" gutterBottom>
                      Total Bridged: {bridge.totalBridged.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<ViewIcon />}>
                        View
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<BridgeIcon />}
                        onClick={() => handleOpenDialog('bridgeTokens')}
                      >
                        Bridge Tokens
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Wallets Tab */}
      <TabPanel value={tabValue} index={4}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Wallet Integration</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('connectWallet')}
          >
            Connect Wallet
          </Button>
        </Box>

        {loading.wallets ? (
          <CircularProgress />
        ) : (
          <Grid container spacing={3}>
            {wallets.map((wallet) => (
              <Grid item xs={12} md={6} key={wallet.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2 }}>
                        <WalletIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getChainName(wallet.chainId)} • {wallet.walletType}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">
                        Balance: {wallet.balance.native.toFixed(4)} ETH
                      </Typography>
                      <Chip 
                        label={wallet.isConnected ? 'Connected' : 'Disconnected'} 
                        color={wallet.isConnected ? 'success' : 'default'} 
                        size="small" 
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">
                        Transactions: {wallet.transactionCount}
                      </Typography>
                      <Typography variant="body2">
                        NFTs: {wallet.nftCount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<ViewIcon />}>
                        View
                      </Button>
                      <Button size="small" startIcon={<MoneyIcon />}>
                        Balance
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Marketplace Tab */}
      <TabPanel value={tabValue} index={5}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">NFT Marketplace</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('listNFT')}
            >
              List NFT
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('buyNFT')}
            >
              Buy NFT
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Marketplaces
                </Typography>
                <List>
                  {marketplaces.map((marketplace) => (
                    <ListItem key={marketplace.id}>
                      <ListItemAvatar>
                        <Avatar>
                          <Store />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={marketplace.name}
                        secondary={`${marketplace.listingCount} listings • $${marketplace.volume24h.toLocaleString()} 24h volume`}
                      />
                      <Chip 
                        label={marketplace.isActive ? 'Active' : 'Inactive'} 
                        color={marketplace.isActive ? 'success' : 'default'} 
                        size="small" 
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Listed NFTs
                </Typography>
                <List>
                  {tokens.filter(t => t.marketData.isListed).map((token) => (
                    <ListItem key={token.id}>
                      <ListItemAvatar>
                        <Avatar>
                          <TokenIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`Token #${token.tokenId}`}
                        secondary={`${token.marketData.listingPrice} ${token.marketData.listingCurrency}`}
                      />
                      <Button size="small" variant="outlined">
                        Buy
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={6}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Blockchain Analytics</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={getAnalytics}
            disabled={loading.analytics}
          >
            Refresh Analytics
          </Button>
        </Box>

        {loading.analytics ? (
          <CircularProgress />
        ) : analytics ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Chain Usage
                  </Typography>
                  {Object.entries(analytics.chainUsage).map(([chainId, usage]) => (
                    <Box key={chainId} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          {getChainName(parseInt(chainId))}
                        </Typography>
                        <Typography variant="body2">
                          {usage.transactions} tx
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(usage.transactions / analytics.totalTransactions) * 100} 
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Collections
                  </Typography>
                  <List>
                    {analytics.topCollections.map((collection) => (
                      <ListItem key={collection.id}>
                        <ListItemText
                          primary={collection.name}
                          secondary={`$${collection.volume.toLocaleString()} volume • ${collection.sales} sales`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Transactions
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Hash</TableCell>
                          <TableCell>From</TableCell>
                          <TableCell>To</TableCell>
                          <TableCell>Value</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Chain</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions.slice(0, 10).map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{tx.hash.slice(0, 8)}...</TableCell>
                            <TableCell>{tx.from.slice(0, 6)}...</TableCell>
                            <TableCell>{tx.to.slice(0, 6)}...</TableCell>
                            <TableCell>{tx.value.toFixed(4)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={tx.status} 
                                color={getStatusColor(tx.status) as any} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>{getChainName(tx.chainId)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Typography>No analytics data available</Typography>
        )}
      </TabPanel>

      {/* Dialogs */}
      
      {/* Create Collection Dialog */}
      <Dialog open={openDialogs.createCollection || false} onClose={() => handleCloseDialog('createCollection')} maxWidth="sm" fullWidth>
        <DialogTitle>Create NFT Collection</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name || ''}
            onChange={(e) => handleFormChange('name', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description || ''}
            onChange={(e) => handleFormChange('description', e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Symbol"
            value={formData.symbol || ''}
            onChange={(e) => handleFormChange('symbol', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Total Supply"
            type="number"
            value={formData.totalSupply || ''}
            onChange={(e) => handleFormChange('totalSupply', parseInt(e.target.value))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Mint Price"
            type="number"
            value={formData.mintPrice || ''}
            onChange={(e) => handleFormChange('mintPrice', parseFloat(e.target.value))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Contract Address"
            value={formData.contractAddress || ''}
            onChange={(e) => handleFormChange('contractAddress', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Chain ID"
            type="number"
            value={formData.chainId || ''}
            onChange={(e) => handleFormChange('chainId', parseInt(e.target.value))}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('createCollection')}>Cancel</Button>
          <Button onClick={handleCreateCollection} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Mint NFT Dialog */}
      <Dialog open={openDialogs.mintNFT || false} onClose={() => handleCloseDialog('mintNFT')} maxWidth="sm" fullWidth>
        <DialogTitle>Mint NFT</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Collection"
            value={formData.collectionId || ''}
            onChange={(e) => handleFormChange('collectionId', e.target.value)}
            margin="normal"
          >
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Owner Address"
            value={formData.owner || ''}
            onChange={(e) => handleFormChange('owner', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="NFT Name"
            value={formData.metadata?.name || ''}
            onChange={(e) => handleFormChange('metadata', { ...formData.metadata, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.metadata?.description || ''}
            onChange={(e) => handleFormChange('metadata', { ...formData.metadata, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Image URL"
            value={formData.metadata?.image || ''}
            onChange={(e) => handleFormChange('metadata', { ...formData.metadata, image: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('mintNFT')}>Cancel</Button>
          <Button onClick={handleMintNFT} variant="contained">Mint</Button>
        </DialogActions>
      </Dialog>

      {/* Deploy Contract Dialog */}
      <Dialog open={openDialogs.deployContract || false} onClose={() => handleCloseDialog('deployContract')} maxWidth="md" fullWidth>
        <DialogTitle>Deploy Smart Contract</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Contract Name"
            value={formData.name || ''}
            onChange={(e) => handleFormChange('name', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Owner Address"
            value={formData.owner || ''}
            onChange={(e) => handleFormChange('owner', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Chain ID"
            type="number"
            value={formData.chainId || ''}
            onChange={(e) => handleFormChange('chainId', parseInt(e.target.value))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="ABI (JSON)"
            value={formData.abi || ''}
            onChange={(e) => handleFormChange('abi', JSON.parse(e.target.value))}
            margin="normal"
            multiline
            rows={4}
            helperText="Enter the contract ABI as JSON"
          />
          <TextField
            fullWidth
            label="Bytecode"
            value={formData.bytecode || ''}
            onChange={(e) => handleFormChange('bytecode', e.target.value)}
            margin="normal"
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('deployContract')}>Cancel</Button>
          <Button onClick={handleDeployContract} variant="contained">Deploy</Button>
        </DialogActions>
      </Dialog>

      {/* Create Bridge Dialog */}
      <Dialog open={openDialogs.createBridge || false} onClose={() => handleCloseDialog('createBridge')} maxWidth="sm" fullWidth>
        <DialogTitle>Create Cross-Chain Bridge</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Bridge Name"
            value={formData.name || ''}
            onChange={(e) => handleFormChange('name', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Source Chain ID"
            type="number"
            value={formData.sourceChain || ''}
            onChange={(e) => handleFormChange('sourceChain', parseInt(e.target.value))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Destination Chain ID"
            type="number"
            value={formData.destinationChain || ''}
            onChange={(e) => handleFormChange('destinationChain', parseInt(e.target.value))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Source Token"
            value={formData.sourceToken || ''}
            onChange={(e) => handleFormChange('sourceToken', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Destination Token"
            value={formData.destinationToken || ''}
            onChange={(e) => handleFormChange('destinationToken', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Bridge Address"
            value={formData.bridgeAddress || ''}
            onChange={(e) => handleFormChange('bridgeAddress', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Fee (%)"
            type="number"
            value={formData.fee || ''}
            onChange={(e) => handleFormChange('fee', parseFloat(e.target.value))}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('createBridge')}>Cancel</Button>
          <Button onClick={handleCreateBridge} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Connect Wallet Dialog */}
      <Dialog open={openDialogs.connectWallet || false} onClose={() => handleCloseDialog('connectWallet')} maxWidth="sm" fullWidth>
        <DialogTitle>Connect Wallet</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="User ID"
            value={formData.userId || ''}
            onChange={(e) => handleFormChange('userId', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Wallet Address"
            value={formData.address || ''}
            onChange={(e) => handleFormChange('address', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Chain ID"
            type="number"
            value={formData.chainId || ''}
            onChange={(e) => handleFormChange('chainId', parseInt(e.target.value))}
            margin="normal"
          />
          <TextField
            select
            fullWidth
            label="Wallet Type"
            value={formData.walletType || ''}
            onChange={(e) => handleFormChange('walletType', e.target.value)}
            margin="normal"
          >
            <option value="metamask">MetaMask</option>
            <option value="walletconnect">WalletConnect</option>
            <option value="coinbase">Coinbase</option>
            <option value="hardware">Hardware</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('connectWallet')}>Cancel</Button>
          <Button onClick={handleConnectWallet} variant="contained">Connect</Button>
        </DialogActions>
      </Dialog>

      {/* List NFT Dialog */}
      <Dialog open={openDialogs.listNFT || false} onClose={() => handleCloseDialog('listNFT')} maxWidth="sm" fullWidth>
        <DialogTitle>List NFT for Sale</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="NFT Token"
            value={formData.tokenId || ''}
            onChange={(e) => handleFormChange('tokenId', e.target.value)}
            margin="normal"
          >
            {tokens.map((token) => (
              <option key={token.id} value={token.id}>
                Token #{token.tokenId} - {collections.find(c => c.id === token.collectionId)?.name}
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Price"
            type="number"
            value={formData.price || ''}
            onChange={(e) => handleFormChange('price', parseFloat(e.target.value))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Currency"
            value={formData.currency || ''}
            onChange={(e) => handleFormChange('currency', e.target.value)}
            margin="normal"
          />
          <TextField
            select
            fullWidth
            label="Marketplace"
            value={formData.marketplaceId || ''}
            onChange={(e) => handleFormChange('marketplaceId', e.target.value)}
            margin="normal"
          >
            {marketplaces.map((marketplace) => (
              <option key={marketplace.id} value={marketplace.id}>
                {marketplace.name}
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('listNFT')}>Cancel</Button>
          <Button onClick={handleListNFT} variant="contained">List</Button>
        </DialogActions>
      </Dialog>

      {/* Buy NFT Dialog */}
      <Dialog open={openDialogs.buyNFT || false} onClose={() => handleCloseDialog('buyNFT')} maxWidth="sm" fullWidth>
        <DialogTitle>Buy NFT</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="NFT Token"
            value={formData.tokenId || ''}
            onChange={(e) => handleFormChange('tokenId', e.target.value)}
            margin="normal"
          >
            {tokens.filter(t => t.marketData.isListed).map((token) => (
              <option key={token.id} value={token.id}>
                Token #{token.tokenId} - {token.marketData.listingPrice} {token.marketData.listingCurrency}
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Buyer Address"
            value={formData.buyer || ''}
            onChange={(e) => handleFormChange('buyer', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Price"
            type="number"
            value={formData.price || ''}
            onChange={(e) => handleFormChange('price', parseFloat(e.target.value))}
            margin="normal"
          />
          <TextField
            select
            fullWidth
            label="Marketplace"
            value={formData.marketplaceId || ''}
            onChange={(e) => handleFormChange('marketplaceId', e.target.value)}
            margin="normal"
          >
            {marketplaces.map((marketplace) => (
              <option key={marketplace.id} value={marketplace.id}>
                {marketplace.name}
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('buyNFT')}>Cancel</Button>
          <Button onClick={handleBuyNFT} variant="contained">Buy</Button>
        </DialogActions>
      </Dialog>

      {/* Bridge Tokens Dialog */}
      <Dialog open={openDialogs.bridgeTokens || false} onClose={() => handleCloseDialog('bridgeTokens')} maxWidth="sm" fullWidth>
        <DialogTitle>Bridge Tokens</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Bridge"
            value={formData.bridgeId || ''}
            onChange={(e) => handleFormChange('bridgeId', e.target.value)}
            margin="normal"
          >
            {bridges.filter(b => b.isActive).map((bridge) => (
              <option key={bridge.id} value={bridge.id}>
                {bridge.name} ({getChainName(bridge.sourceChain)} → {getChainName(bridge.destinationChain)})
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={formData.amount || ''}
            onChange={(e) => handleFormChange('amount', parseFloat(e.target.value))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="From Address"
            value={formData.fromAddress || ''}
            onChange={(e) => handleFormChange('fromAddress', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="To Address"
            value={formData.toAddress || ''}
            onChange={(e) => handleFormChange('toAddress', e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('bridgeTokens')}>Cancel</Button>
          <Button onClick={handleBridgeTokens} variant="contained">Bridge</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdvancedBlockchainIntegrationDashboard; 