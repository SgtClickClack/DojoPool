import { apiClient } from '@/services/APIService';
import {
  CheckCircle as AcceptIcon,
  AccessTime as PendingIcon,
  Cancel as RejectIcon,
  SwapHoriz as TradeIcon,
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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface Trade {
  id: string;
  proposerId: string;
  recipientId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  proposerItems: any[];
  proposerCoins: number;
  recipientItems: any[];
  recipientCoins: number;
  message?: string;
  expiresAt?: string;
  respondedAt?: string;
  createdAt: string;
  proposer: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  recipient: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

interface TradeProposal {
  recipientId: string;
  proposerItems?: Array<{
    assetId: string;
    type: 'AVATAR_ASSET' | 'DOJO_COINS';
  }>;
  proposerCoins?: number;
  recipientItems?: Array<{
    assetId: string;
    type: 'AVATAR_ASSET' | 'DOJO_COINS';
  }>;
  recipientCoins?: number;
  message?: string;
  expiresInHours?: number;
}

const Trading: React.FC = () => {
  const [pendingTrades, setPendingTrades] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showTradeDetails, setShowTradeDetails] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Proposal form state
  const [proposal, setProposal] = useState<TradeProposal>({
    recipientId: '',
    proposerCoins: 0,
    recipientCoins: 0,
    message: '',
    expiresInHours: 24,
  });

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const [pendingResponse, historyResponse] = await Promise.all([
        apiClient.get('/trading/pending/current-user-id'), // Replace with actual user ID
        apiClient.get('/trading/history/current-user-id'), // Replace with actual user ID
      ]);

      setPendingTrades(pendingResponse.data);
      setTradeHistory(historyResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async () => {
    try {
      await apiClient.post('/trading/propose', {
        ...proposal,
        proposerId: 'current-user-id', // Replace with actual user ID
      });

      setShowProposalDialog(false);
      setProposal({
        recipientId: '',
        proposerCoins: 0,
        recipientCoins: 0,
        message: '',
        expiresInHours: 24,
      });
      await loadTrades();
    } catch (err: any) {
      setError(err.message || 'Failed to create trade proposal');
    }
  };

  const handleRespondToTrade = async (tradeId: string, accept: boolean) => {
    try {
      await apiClient.post('/trading/respond', {
        tradeId,
        userId: 'current-user-id', // Replace with actual user ID
        accept,
      });

      await loadTrades();
      setShowTradeDetails(false);
      setSelectedTrade(null);
    } catch (err: any) {
      setError(err.message || 'Failed to respond to trade');
    }
  };

  const handleCancelTrade = async (tradeId: string) => {
    try {
      await apiClient.delete(`/trading/${tradeId}/cancel/current-user-id`); // Replace with actual user ID
      await loadTrades();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel trade');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FF9800';
      case 'ACCEPTED':
        return '#4CAF50';
      case 'REJECTED':
        return '#F44336';
      case 'CANCELLED':
        return '#9E9E9E';
      case 'EXPIRED':
        return '#607D8B';
      default:
        return '#FFFFFF';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <PendingIcon />;
      case 'ACCEPTED':
        return <AcceptIcon />;
      case 'REJECTED':
        return <RejectIcon />;
      case 'CANCELLED':
        return <RejectIcon />;
      case 'EXPIRED':
        return <PendingIcon />;
      default:
        return null;
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
        Player Trading
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" component="h2">
          Trade Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<TradeIcon />}
          onClick={() => setShowProposalDialog(true)}
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          }}
        >
          Create Trade Proposal
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`Pending Trades (${pendingTrades.length})`} />
          <Tab label={`Trade History (${tradeHistory.length})`} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {pendingTrades.map((trade) => (
                <Grid item xs={12} md={6} key={trade.id}>
                  <Card
                    sx={{
                      background:
                        'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
                      color: 'white',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        transition: 'all 0.3s ease',
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={2}
                      >
                        <Box display="flex" alignItems="center">
                          <Avatar src={trade.proposer.avatarUrl} sx={{ mr: 2 }}>
                            {trade.proposer.username[0]}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 'bold' }}
                            >
                              {trade.proposer.username}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                              → {trade.recipient.username}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          icon={getStatusIcon(trade.status)}
                          label={trade.status}
                          sx={{
                            backgroundColor: getStatusColor(trade.status),
                            color: 'white',
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{ opacity: 0.8, mb: 1 }}
                        >
                          Offering: {trade.proposerCoins} DojoCoins
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Requesting: {trade.recipientCoins} DojoCoins
                        </Typography>
                      </Box>

                      {trade.message && (
                        <Typography
                          variant="body2"
                          sx={{ fontStyle: 'italic', opacity: 0.8, mb: 2 }}
                        >
                          "{trade.message}"
                        </Typography>
                      )}

                      <Typography variant="body2" sx={{ opacity: 0.6 }}>
                        Created:{' '}
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                          setSelectedTrade(trade);
                          setShowTradeDetails(true);
                        }}
                        sx={{
                          color: 'white',
                          borderColor: 'rgba(255,255,255,0.3)',
                        }}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              {tradeHistory.map((trade) => (
                <Grid item xs={12} md={6} key={trade.id}>
                  <Card
                    sx={{
                      background:
                        'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
                      color: 'white',
                      opacity: 0.8,
                    }}
                  >
                    <CardContent>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={2}
                      >
                        <Box display="flex" alignItems="center">
                          <Avatar src={trade.proposer.avatarUrl} sx={{ mr: 2 }}>
                            {trade.proposer.username[0]}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 'bold' }}
                            >
                              {trade.proposer.username}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                              ↔ {trade.recipient.username}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          icon={getStatusIcon(trade.status)}
                          label={trade.status}
                          sx={{
                            backgroundColor: getStatusColor(trade.status),
                            color: 'white',
                          }}
                        />
                      </Box>

                      <Typography variant="body2" sx={{ opacity: 0.6 }}>
                        {trade.respondedAt
                          ? `Completed: ${new Date(trade.respondedAt).toLocaleDateString()}`
                          : `Created: ${new Date(trade.createdAt).toLocaleDateString()}`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {activeTab === 0 && pendingTrades.length === 0 && (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                No pending trades
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Create a trade proposal to get started!
              </Typography>
            </Paper>
          )}

          {activeTab === 1 && tradeHistory.length === 0 && (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                No trade history
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Your completed trades will appear here.
              </Typography>
            </Paper>
          )}
        </Box>
      </Paper>

      {/* Create Trade Proposal Dialog */}
      <Dialog
        open={showProposalDialog}
        onClose={() => setShowProposalDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: 'white',
          }}
        >
          Create Trade Proposal
        </DialogTitle>
        <DialogContent sx={{ background: '#0f0f23', color: 'white' }}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Recipient User ID"
                value={proposal.recipientId}
                onChange={(e) =>
                  setProposal({ ...proposal, recipientId: e.target.value })
                }
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
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>
                  Expiration (hours)
                </InputLabel>
                <Select
                  value={proposal.expiresInHours}
                  label="Expiration (hours)"
                  onChange={(e) =>
                    setProposal({
                      ...proposal,
                      expiresInHours: Number(e.target.value),
                    })
                  }
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '& .MuiSelect-icon': { color: 'white' },
                    '& .MuiInputBase-input': { color: 'white' },
                  }}
                >
                  <MenuItem value={1}>1 hour</MenuItem>
                  <MenuItem value={6}>6 hours</MenuItem>
                  <MenuItem value={24}>24 hours</MenuItem>
                  <MenuItem value={72}>3 days</MenuItem>
                  <MenuItem value={168}>1 week</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Your DojoCoins"
                type="number"
                value={proposal.proposerCoins}
                onChange={(e) =>
                  setProposal({
                    ...proposal,
                    proposerCoins: Number(e.target.value),
                  })
                }
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
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Their DojoCoins"
                type="number"
                value={proposal.recipientCoins}
                onChange={(e) =>
                  setProposal({
                    ...proposal,
                    recipientCoins: Number(e.target.value),
                  })
                }
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
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Trade Message (optional)"
                value={proposal.message}
                onChange={(e) =>
                  setProposal({ ...proposal, message: e.target.value })
                }
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
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ background: '#0f0f23' }}>
          <Button
            onClick={() => setShowProposalDialog(false)}
            sx={{ color: 'white' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateProposal}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
            }}
          >
            Create Proposal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trade Details Dialog */}
      <Dialog
        open={showTradeDetails}
        onClose={() => setShowTradeDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: 'white',
          }}
        >
          Trade Details
        </DialogTitle>
        <DialogContent sx={{ background: '#0f0f23', color: 'white' }}>
          {selectedTrade && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ background: 'rgba(255,255,255,0.1)' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {selectedTrade.proposer.username} Offers
                      </Typography>
                      <Typography variant="body1">
                        {selectedTrade.proposerCoins} DojoCoins
                      </Typography>
                      {selectedTrade.proposerItems &&
                        selectedTrade.proposerItems.length > 0 && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            + {selectedTrade.proposerItems.length} items
                          </Typography>
                        )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ background: 'rgba(255,255,255,0.1)' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Requesting from {selectedTrade.recipient.username}
                      </Typography>
                      <Typography variant="body1">
                        {selectedTrade.recipientCoins} DojoCoins
                      </Typography>
                      {selectedTrade.recipientItems &&
                        selectedTrade.recipientItems.length > 0 && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            + {selectedTrade.recipientItems.length} items
                          </Typography>
                        )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {selectedTrade.message && (
                <Paper
                  sx={{ p: 2, mt: 3, background: 'rgba(255,255,255,0.05)' }}
                >
                  <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                    "{selectedTrade.message}"
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ background: '#0f0f23' }}>
          <Button
            onClick={() => setShowTradeDetails(false)}
            sx={{ color: 'white' }}
          >
            Close
          </Button>
          {selectedTrade && selectedTrade.status === 'PENDING' && (
            <>
              <Button
                onClick={() => handleRespondToTrade(selectedTrade.id, false)}
                variant="contained"
                sx={{
                  background:
                    'linear-gradient(45deg, #F44336 30%, #D32F2F 90%)',
                }}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleRespondToTrade(selectedTrade.id, true)}
                variant="contained"
                sx={{
                  background:
                    'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                }}
              >
                Accept Trade
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Trading;
