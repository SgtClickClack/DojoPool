import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Snackbar,
  Link
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  EmojiEvents as TrophyIcon,
  MonetizationOn as CoinsIcon,
  Send as SendIcon,
  Check as CheckIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { crossChainTournamentService } from '../../services/crossChainTournamentService';
import { useWallet } from '../../hooks/useWallet';
import { analyticsService } from '../../services/analytics';

// Trophy colors based on placement
const trophyColors: Record<number, string> = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
  4: '#A2A2A2', // Special mention
};

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[4]
  }
}));

const StyledTrophy = styled(TrophyIcon)(({ theme }) => ({
  fontSize: '2rem',
  marginRight: theme.spacing(1)
}));

const TransactionLink = styled(Link)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  maxWidth: '200px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline'
  }
}));

interface TournamentRewardDistributionProps {
  tournamentId: string;
  isOrganizer?: boolean;
}

/**
 * The types of rewards that can be distributed to tournament winners
 */
interface RewardItem {
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  finalRank: number;
  prize: string;
  rewardType: 'dojo_coins' | 'nft_trophy' | 'both';
  walletAddress?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  transactionHash?: string;
}

// Define the return type for the distributeTournamentRewards method
interface TournamentRewardDistributionResponse {
  success: boolean;
  message: string;
  tournamentId?: string;
  chain?: string;
}

/**
 * TournamentRewardDistribution Component
 * 
 * This component handles the distribution of rewards to tournament winners
 * via blockchain transactions, supporting both Ethereum and Solana chains.
 */
const TournamentRewardDistribution: React.FC<TournamentRewardDistributionProps> = ({
  tournamentId,
  isOrganizer = false
}) => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [tournamentDetails, setTournamentDetails] = useState<any>(null);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Wallet connection
  const { isConnected, walletAddress, connectWallet } = useWallet();
  
  // Load tournament data and rewards
  useEffect(() => {
    const loadData = async () => {
      if (!tournamentId) return;
      
      try {
        setLoading(true);
        
        // Load tournament details
        const details = await crossChainTournamentService.getTournamentDetails(tournamentId);
        setTournamentDetails(details);
        
        // Fetch leaderboard to determine winners
        const response = await fetch(`/api/tournament/rewards?tournamentId=${tournamentId}`);
        const data = await response.json();
        
        // Format rewards
        if (data.rewards && data.rewards.length) {
          // Get existing distributions if any
          const distributions = data.distributions || [];
          
          // Map rewards to our format
          const formattedRewards: RewardItem[] = data.rewards.map((reward: any) => {
            // Find matching distribution if it exists
            const distribution = distributions.find((d: any) => d.placement === reward.placement);
            
            return {
              playerId: distribution?.user_id || '',
              playerName: distribution?.username || `Rank ${reward.placement}`,
              finalRank: reward.placement,
              prize: reward.dojo_coins_amount.toString(),
              rewardType: reward.nft_trophy_type ? 'both' : 'dojo_coins',
              status: distribution?.status || 'pending',
              transactionHash: distribution?.transaction_hash || undefined
            };
          });
          
          setRewards(formattedRewards);
        }
        
        analyticsService.trackEvent('tournament_rewards_loaded', {
          tournamentId,
          rewardsCount: data.rewards?.length || 0
        });
      } catch (err) {
        console.error('Error loading tournament rewards:', err);
        setError('Failed to load tournament rewards. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [tournamentId, refreshTrigger]);
  
  // Handle distributing rewards
  const handleDistributeRewards = async () => {
    try {
      setDistributing(true);
      setError(null);
      setSuccess(null);
      
      // Prepare rewards data for blockchain distribution
      const rewardsToDistribute = rewards
        .filter(r => r.status !== 'completed' && r.playerId) // Only distribute pending rewards with assigned players
        .map(r => ({
          address: r.walletAddress || '',  // This would come from looking up player wallet
          amount: r.prize,
          rank: r.finalRank
        }));
      
      if (rewardsToDistribute.length === 0) {
        setError('No valid rewards to distribute');
        setDistributing(false);
        return;
      }
      
      // Call the service to distribute rewards
      // Note: We're using any here because we don't have the actual implementation of the service
      const result = await (crossChainTournamentService as any).distributeTournamentRewards(
        tournamentId,
        rewardsToDistribute
      ) as TournamentRewardDistributionResponse;
      
      if (result.success) {
        setSuccess('Tournament rewards distributed successfully!');
        
        // Refresh the rewards data
        setRefreshTrigger(prev => prev + 1);
        
        analyticsService.trackEvent('tournament_rewards_distributed', {
          tournamentId,
          rewardsCount: rewardsToDistribute.length,
          chain: tournamentDetails?.isNativeChain
        });
      } else {
        throw new Error(result.message || 'Failed to distribute rewards');
      }
    } catch (err) {
      console.error('Error distributing rewards:', err);
      setError(err instanceof Error ? err.message : 'An error occurred distributing rewards');
      
      analyticsService.trackEvent('tournament_rewards_distribution_error', {
        tournamentId,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setDistributing(false);
      setShowConfirmDialog(false);
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Copy transaction hash to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Transaction hash copied to clipboard');
  };
  
  // Get blockchain explorer URL based on the chain
  const getExplorerUrl = (hash: string): string => {
    if (!tournamentDetails) return '#';
    
    const chain = tournamentDetails.isNativeChain;
    if (chain === 'ethereum') {
      return `https://etherscan.io/tx/${hash}`;
    } else if (chain === 'solana') {
      return `https://explorer.solana.com/tx/${hash}`;
    }
    return '#';
  };
  
  // Check if the current user is authorized to distribute rewards
  const canDistributeRewards = () => {
    if (!isOrganizer) return false;
    if (!tournamentDetails) return false;
    if (tournamentDetails.status !== 'completed') return false;
    
    // Check if wallet is connected for the relevant chain
    return isConnected(tournamentDetails.isNativeChain);
  };
  
  // Render the reward status chip
  const renderStatusChip = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Chip 
          size="small" 
          color="success" 
          icon={<CheckIcon />} 
          label="Completed" 
        />;
      case 'processing':
        return <Chip 
          size="small" 
          color="primary" 
          icon={<CircularProgress size={14} />} 
          label="Processing" 
        />;
      case 'failed':
        return <Chip 
          size="small" 
          color="error" 
          icon={<ErrorIcon />} 
          label="Failed" 
        />;
      default:
        return <Chip 
          size="small" 
          color="default" 
          label="Pending" 
        />;
    }
  };
  
  // Connect wallet dialog
  const renderConnectWalletPrompt = () => {
    if (!tournamentDetails) return null;
    
    return (
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          You need to connect your {tournamentDetails.isNativeChain} wallet to distribute rewards
        </Alert>
        <Button
          variant="contained"
          onClick={() => connectWallet(tournamentDetails.isNativeChain)}
          startIcon={<CoinsIcon />}
        >
          Connect {tournamentDetails.isNativeChain} Wallet
        </Button>
      </Box>
    );
  };
  
  // Show loading state
  if (loading) {
    return (
      <StyledPaper>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <StyledTrophy color="primary" />
          <Skeleton variant="text" width={300} />
        </Box>
        <Divider sx={{ mb: 3 }} />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Player</TableCell>
                <TableCell>Reward</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Transaction</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" width={80} /></TableCell>
                  <TableCell><Skeleton variant="text" width={150} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </StyledPaper>
    );
  }
  
  return (
    <>
      {/* Error and success messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
      
      {/* Rewards Distribution UI */}
      <StyledPaper>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StyledTrophy style={{ color: trophyColors[1] }} />
            <Typography variant="h5" component="h2">
              Tournament Rewards
            </Typography>
          </Box>
          
          <Tooltip title="Refresh rewards data">
            <IconButton onClick={handleRefresh} disabled={loading || distributing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {tournamentDetails?.status === 'completed' 
            ? 'Tournament is completed. Rewards are ready to be distributed.'
            : 'Tournament must be completed before rewards can be distributed.'}
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {rewards.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Player</TableCell>
                    <TableCell>Reward</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Transaction</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rewards.map((reward) => (
                    <TableRow key={reward.finalRank}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrophyIcon 
                            sx={{ 
                              mr: 1, 
                              color: trophyColors[reward.finalRank] || 'inherit',
                              fontSize: '1.2rem'
                            }}
                          />
                          {reward.finalRank}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            src={reward.playerAvatar} 
                            alt={reward.playerName}
                            sx={{ width: 30, height: 30, mr: 1 }}
                          >
                            {reward.playerName.charAt(0)}
                          </Avatar>
                          {reward.playerName}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CoinsIcon sx={{ mr: 0.5, color: 'gold' }} />
                          {reward.prize} Dojo Coins
                          {reward.rewardType === 'both' && (
                            <Chip 
                              size="small" 
                              label="+ NFT" 
                              sx={{ ml: 1, background: trophyColors[reward.finalRank] || 'inherit', color: '#000' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {renderStatusChip(reward.status)}
                      </TableCell>
                      <TableCell>
                        {reward.transactionHash ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TransactionLink 
                              href={getExplorerUrl(reward.transactionHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {reward.transactionHash.substring(0, 8)}...
                            </TransactionLink>
                            <IconButton 
                              size="small" 
                              onClick={() => copyToClipboard(reward.transactionHash!)}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not distributed
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Distribution Button */}
            {isOrganizer && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                {canDistributeRewards() ? (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SendIcon />}
                    disabled={distributing || tournamentDetails?.status !== 'completed'}
                    onClick={() => setShowConfirmDialog(true)}
                    sx={{ py: 1, px: 3 }}
                  >
                    {distributing ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                        Distributing...
                      </>
                    ) : (
                      'Distribute Rewards'
                    )}
                  </Button>
                ) : (
                  renderConnectWalletPrompt()
                )}
              </Box>
            )}
          </>
        ) : (
          <Alert severity="info">
            No rewards found for this tournament. Rewards will be available once the tournament is completed.
          </Alert>
        )}
      </StyledPaper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
      >
        <DialogTitle>Confirm Reward Distribution</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to distribute rewards for tournament 
            <strong> {tournamentDetails?.name}</strong>. This action will execute blockchain 
            transactions to transfer {tournamentDetails?.isNativeChain === 'ethereum' ? 'ERC-20' : 'SPL'} tokens 
            to the winners. 
            
            <Box component="div" sx={{ mt: 2 }}>
              This action cannot be undone. Are you sure you want to proceed?
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDistributeRewards} 
            color="primary" 
            variant="contained"
            disabled={distributing}
          >
            {distributing ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                Processing...
              </>
            ) : (
              'Confirm Distribution'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TournamentRewardDistribution; 