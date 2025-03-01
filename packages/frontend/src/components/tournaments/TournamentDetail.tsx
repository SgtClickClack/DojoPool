import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Divider,
  Grid,
  CircularProgress,
  Dialog,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Button,
  Card,
  CardContent
} from '@mui/material';
import {
  Event as EventIcon,
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  AccountBalanceWallet as WalletIcon,
  LinkOff as LinkOffIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

import { Tournament, TournamentMatch } from '../../types/tournament';
import { useAuth } from '../../hooks/useAuth';
import { TournamentRegistration } from './TournamentRegistration';
import { crossChainTournamentService } from '../../services/crossChainTournamentService';
import { useWallet } from '../../hooks/useWallet';

// Chain icons
import EthereumIcon from '../../assets/icons/ethereum.svg';
import SolanaIcon from '../../assets/icons/solana.svg';

interface ParamsType {
  [key: string]: string | undefined;
  id: string;
}

interface TournamentDetailProps {
  tournamentId: string;
  onRegister?: () => void;
}

const TournamentDetail: React.FC<TournamentDetailProps> = ({
  tournamentId,
  onRegister
}) => {
  const { id } = useParams<ParamsType>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch>();
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [showRegistrationModal, setShowRegistrationModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Wallet hook
  const { walletAddress, isConnected, connectWallet } = useWallet();

  useEffect(() => {
    // Fetch tournament data
    const fetchTournament = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be an API call
        const tournamentData = await crossChainTournamentService.getTournamentDetails(id || tournamentId);
        setTournament(tournamentData);
        
        // Fetch matches for this tournament
        // This would be another API call in a real implementation
        setMatches([]);
      } catch (error) {
        console.error('Error fetching tournament:', error);
        setError('Failed to load tournament details');
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [id, tournamentId]);

  // Format entry fee with chain information
  const formatEntryFee = () => {
    if (!tournament || !tournament.entryFees) return 'N/A';
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <img src={EthereumIcon} alt="ETH" width={16} height={16} style={{ marginRight: '4px' }} />
          <Typography variant="body2">{tournament.entryFees.ethereum} ETH</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src={SolanaIcon} alt="SOL" width={16} height={16} style={{ marginRight: '4px' }} />
          <Typography variant="body2">{tournament.entryFees.solana} SOL</Typography>
        </Box>
      </Box>
    );
  };

  // Handle registration button click
  const handleRegisterClick = () => {
    // Check if any wallet is connected
    if (!isConnected('ethereum') && !isConnected('solana')) {
      // If tournament is on Ethereum, connect Ethereum wallet first
      if (tournament?.nativeChain === 'ethereum') {
        connectWallet('ethereum');
      }
      // If tournament is on Solana, connect Solana wallet first
      else if (tournament?.nativeChain === 'solana') {
        connectWallet('solana');
      }
    } else {
      setShowRegistrationModal(true);
    }
  };
  
  // Handle registration completion
  const handleRegistrationSuccess = () => {
    setShowRegistrationModal(false);
    if (onRegister) {
      onRegister();
    }
    // Refresh tournament details to update participant count
    loadTournament();
  };
  
  // Handle registration modal close
  const handleRegistrationCancel = () => {
    setShowRegistrationModal(false);
  };
  
  // Load tournament details function for refreshing after registration
  const loadTournament = async () => {
    try {
      setLoading(true);
      const details = await crossChainTournamentService.getTournamentDetails(id || tournamentId);
      setTournament(details);
    } catch (err) {
      console.error('Error reloading tournament details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !tournament) {
    return (
      <Alert severity="error">
        {error || 'Tournament not found'}
      </Alert>
    );
  }

  // Calculate registration status
  const isRegistrationOpen = tournament.status === 'registration_open';
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;
  const userCanRegister = isRegistrationOpen && !isFull;
  
  // Determine if user is already registered
  const isUserRegistered = tournament.participants?.some(
    (p: any) => p.ethereumAddress === walletAddress.ethereum || p.solanaAddress === walletAddress.solana
  );

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              {tournament.name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title={`This tournament is based on the ${tournament.nativeChain === 'ethereum' ? 'Ethereum' : 'Solana'} blockchain`}>
                <Chip 
                  icon={
                    tournament.nativeChain === 'ethereum'
                      ? <img src={EthereumIcon} alt="ETH" width={20} height={20} />
                      : <img src={SolanaIcon} alt="SOL" width={20} height={20} />
                  }
                  label={tournament.nativeChain === 'ethereum' ? 'Ethereum' : 'Solana'}
                  color={tournament.nativeChain === 'ethereum' ? 'primary' : 'secondary'}
                  sx={{ mr: 1 }}
                />
              </Tooltip>
              
              <Chip 
                label={tournament.status === 'registration_open' ? 'Registration Open' : tournament.status.replace('_', ' ')}
                color={tournament.status === 'registration_open' ? 'success' : 'default'}
              />
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {tournament.description}
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EventIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Start Time" 
                    secondary={tournament.startTime ? new Date(tournament.startTime).toLocaleString() : 'TBD'} 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Participants" 
                    secondary={`${tournament.currentParticipants} / ${tournament.maxParticipants}`} 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <TrophyIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Format" 
                    secondary={tournament.format || 'Standard'} 
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <MoneyIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Entry Fee" 
                    secondary={formatEntryFee()} 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <TrophyIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Prize Pool" 
                    secondary={`${tournament.prizePool} DOJO`} 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <WalletIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Cross-Chain Support" 
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Pay with Ethereum">
                          <img src={EthereumIcon} alt="ETH" width={20} height={20} style={{ marginRight: '8px' }} />
                        </Tooltip>
                        <Tooltip title="Pay with Solana">
                          <img src={SolanaIcon} alt="SOL" width={20} height={20} />
                        </Tooltip>
                      </Box>
                    } 
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">
              {isRegistrationOpen 
                ? `Registration closes ${tournament.registrationCloseTime ? formatDistanceToNow(new Date(tournament.registrationCloseTime), { addSuffix: true }) : 'soon'}`
                : tournament.status === 'ongoing'
                ? 'Tournament is in progress'
                : tournament.status === 'completed'
                ? 'Tournament is completed'
                : 'Registration is closed'
              }
            </Typography>
            
            {isUserRegistered ? (
              <Chip 
                label="You are registered" 
                color="success" 
                icon={<EventIcon />} 
              />
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleRegisterClick}
                disabled={!userCanRegister}
                startIcon={(!isConnected('ethereum') && !isConnected('solana')) ? <LinkOffIcon /> : null}
              >
                {!userCanRegister 
                  ? isFull ? 'Tournament Full' : 'Registration Closed'
                  : (!isConnected('ethereum') && !isConnected('solana'))
                  ? 'Connect Wallet to Register'
                  : 'Register Now'
                }
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
      
      {/* Tournament Details Sections */}
      {tournament.rules && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Tournament Rules
            </Typography>
            <Typography variant="body1">
              {tournament.rules}
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {tournament.prizes && tournament.prizes.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Prize Distribution
            </Typography>
            <List>
              {tournament.prizes.map((prize: any, index: number) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <TrophyIcon color={index === 0 ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} Place`} 
                    secondary={`${prize.amount} ${prize.currency}`} 
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
      
      {/* Registration Modal */}
      <Dialog 
        open={showRegistrationModal} 
        onClose={handleRegistrationCancel}
        maxWidth="sm"
        fullWidth
      >
        <TournamentRegistration 
          tournamentId={id || tournamentId}
          onSuccess={handleRegistrationSuccess}
          onCancel={handleRegistrationCancel}
        />
      </Dialog>
    </Box>
  );
};

export default TournamentDetail;
