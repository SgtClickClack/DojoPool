import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert, 
  Grid, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  Avatar, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  MenuItem, 
  Select, 
  TextField, 
  Card, 
  Chip,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  LinearProgress,
  Fade,
  Zoom
} from '@mui/material';
import { 
  EmojiEvents, 
  People, 
  Schedule, 
  LocationOn, 
  AttachMoney, 
  SportsEsports, 
  CheckCircle, 
  Cancel, 
  Warning,
  AccountTree,
  Timeline,
  Videocam,
  Share,
  Favorite,
  FavoriteBorder,
  Refresh,
  PlayArrow,
  Stop,
  Pause
} from '@mui/icons-material';
import { getTournament } from '@/frontend/api/tournaments'; 
import { getVenue } from '@/dojopool/frontend/api/venues';
import { joinTournament } from '@/frontend/api/tournaments';
import { Tournament, Participant, TournamentStatus, Match } from '@/types/tournament';
import { Venue } from '@/dojopool/frontend/types/venue';
import { useAuth } from '../../hooks/useAuth'; 
import { SocketIOService } from '@/services/network/WebSocketService';
import { submitMatchResult } from '@/services/tournament/tournament';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import VideoHighlights from '@/frontend/components/VideoHighlights';
import { TournamentBracket } from '../tournament/TournamentBracket';
import TournamentRegistration from '../tournament/TournamentRegistration';

// Define registration steps
enum RegistrationStep {
  IDLE = 'idle',
  CONFIRM_DETAILS = 'confirm-details',
  CONFIRM_RULES = 'confirm-rules',
  PAYMENT = 'payment',
  REGISTERING = 'registering',
  COMPLETED = 'completed',
  ERROR = 'error',
}

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
      id={`tournament-tabpanel-${index}`}
      aria-labelledby={`tournament-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Enhanced Participants List Component
interface ParticipantsListProps {
  participants?: Participant[];
  maxParticipants?: number;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({ participants, maxParticipants }) => {
  const cyberCardStyle = {
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid #00ff9d',
    borderRadius: '15px',
    padding: '1.5rem',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.4s ease',
    boxShadow: '0 0 30px rgba(0, 255, 157, 0.1), inset 0 0 30px rgba(0, 255, 157, 0.05)',
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

  if (!participants || participants.length === 0) {
    return (
      <Card sx={cyberCardStyle}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <People sx={{ fontSize: 64, color: '#00ff9d', mb: 2, filter: 'drop-shadow(0 0 20px #00ff9d)' }} />
          <Typography sx={{ color: '#888', fontStyle: 'italic' }}>
            No participants registered yet.
          </Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card sx={cyberCardStyle}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={neonTextStyle}>
          <People sx={{ mr: 1, color: '#00ff9d' }} />
          Participants ({participants.length}{maxParticipants ? `/${maxParticipants}` : ''})
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={maxParticipants ? (participants.length / maxParticipants) * 100 : 0}
          sx={{
            width: 100,
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(0, 255, 157, 0.2)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: 'linear-gradient(90deg, #00ff9d 0%, #00a8ff 100%)',
              boxShadow: '0 0 20px #00ff9d',
            },
          }}
        />
      </Box>
      
      <List dense>
        {participants.map((p, index) => (
          <ListItem 
            key={p.id} 
            sx={{ 
              border: '1px solid rgba(0, 255, 157, 0.2)', 
              borderRadius: 1, 
              mb: 1,
              background: 'rgba(0, 255, 157, 0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(0, 255, 157, 0.1)',
                borderColor: 'rgba(0, 255, 157, 0.4)',
                transform: 'translateX(5px)',
              }
            }}
          >
            <Avatar sx={{ 
              width: 40, 
              height: 40, 
              mr: 2,
              background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
              color: '#000',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 0 15px rgba(0, 255, 157, 0.5)'
            }}>
              {p.username.charAt(0).toUpperCase()}
            </Avatar> 
            <ListItemText 
              primary={p.username} 
              secondary={`Status: ${p.status} • Rank: ${index + 1}`}
              primaryTypographyProps={{
                sx: { 
                  color: '#fff', 
                  fontWeight: 600,
                  textShadow: '0 0 5px rgba(0, 255, 157, 0.5)'
                }
              }}
              secondaryTypographyProps={{
                sx: { color: '#888' }
              }}
            />
            <Chip 
              label={p.status} 
              size="small" 
              sx={{ 
                background: p.status === 'active' ? 'rgba(0, 255, 157, 0.2)' : 'rgba(255, 255, 0, 0.2)',
                border: `1px solid ${p.status === 'active' ? '#00ff9d' : '#ffff00'}`,
                color: p.status === 'active' ? '#00ff9d' : '#ffff00',
                textShadow: `0 0 5px ${p.status === 'active' ? '#00ff9d' : '#ffff00'}`,
                fontWeight: 600,
                letterSpacing: '1px',
              }}
            />
          </ListItem>
        ))}
      </List>
    </Card>
  );
};

// Enhanced Tournament Detail Component
const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>(RegistrationStep.IDLE);
  const [tabValue, setTabValue] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [registrationOpen, setRegistrationOpen] = useState(false);

  // Cyberpunk styling constants
  const cyberCardStyle = {
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid #00ff9d',
    borderRadius: '15px',
    padding: '1.5rem',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.4s ease',
    transformStyle: 'preserve-3d' as const,
    perspective: '1000px' as const,
    boxShadow: '0 0 30px rgba(0, 255, 157, 0.1), inset 0 0 30px rgba(0, 255, 157, 0.05)',
    '&:hover': {
      transform: 'translateY(-5px) scale(1.02)',
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

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.OPEN: return '#00ff9d';
      case TournamentStatus.ACTIVE: return '#00a8ff';
      case TournamentStatus.COMPLETED: return '#ffff00';
      case TournamentStatus.CANCELLED: return '#ff4444';
      case TournamentStatus.FULL: return '#ff00ff';
      case TournamentStatus.CLOSED: return '#888888';
      default: return '#888888';
    }
  };

  const getStatusChipStyle = (status: TournamentStatus) => ({
    background: `rgba(${status === TournamentStatus.OPEN ? '0, 255, 157' : status === TournamentStatus.ACTIVE ? '0, 168, 255' : status === TournamentStatus.COMPLETED ? '255, 255, 0' : status === TournamentStatus.CANCELLED ? '255, 68, 68' : status === TournamentStatus.FULL ? '255, 0, 255' : '136, 136, 136'}, 0.2)`,
    border: `1px solid ${getStatusColor(status)}`,
    color: getStatusColor(status),
    textShadow: `0 0 5px ${getStatusColor(status)}`,
    fontWeight: 600,
    letterSpacing: '1px',
  });

  useEffect(() => {
    const fetchTournamentDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        const tournamentData = await getTournament(id);
        setTournament(tournamentData);
        
        if (tournamentData.venueId) {
          const venueData = await getVenue(tournamentData.venueId);
          setVenue(venueData);
        }
      } catch (err) {
        console.error('Failed to fetch tournament details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tournament details');
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentDetails();
  }, [id]);

  // Real-time updates
  useEffect(() => {
    if (!tournament) return;

    const socket = SocketIOService.getInstance();
    socket.connect();
    
    const handleTournamentUpdate = (notification: unknown) => {
      console.log('Tournament update received:', notification);
      // Refresh tournament data
      if (id) {
        getTournament(id).then(setTournament).catch(console.error);
      }
    };

    socket.on('tournament_update', handleTournamentUpdate);
    
    return () => {
      socket.off('tournament_update', handleTournamentUpdate);
      socket.disconnect();
    };
  }, [tournament, id]);

  const handleRegister = async () => {
    setRegistrationOpen(true);
  };

  const handleRegistrationSuccess = async () => {
    // Refresh tournament data after registration
    if (tournament) {
      const updatedTournament = await getTournament(tournament.id);
      setTournament(updatedTournament);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    setSnackbar({
      open: true,
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      severity: 'success'
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: tournament?.name || 'Tournament',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setSnackbar({
        open: true,
        message: 'Link copied to clipboard!',
        severity: 'success'
      });
    }
  };

  const renderActionButtons = () => {
    if (!tournament || authLoading) return null;

    const isUserAuthenticated = user !== null;
    const canRegister = 
      (tournament.status === TournamentStatus.OPEN || tournament.status === TournamentStatus.UPCOMING) &&
      isUserAuthenticated &&
      tournament.participants < tournament.maxParticipants;

    return (
      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {canRegister && (
          <Button 
            variant="contained"
            onClick={handleRegister}
            disabled={isRegistering}
            sx={cyberButtonStyle}
            startIcon={isRegistering ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {isRegistering ? 'Registering...' : 'Register Now'}
          </Button>
        )}
        
        {tournament.status === TournamentStatus.FULL && (
          <Button variant="outlined" disabled sx={{ borderColor: '#ff00ff', color: '#ff00ff' }}>
            Registration Full
          </Button>
        )}
        
        {tournament.status === TournamentStatus.CLOSED && (
          <Button variant="outlined" disabled sx={{ borderColor: '#888888', color: '#888888' }}>
            Registration Closed
          </Button>
        )}
        
        {tournament.status === TournamentStatus.ACTIVE && (
          <Button variant="outlined" disabled sx={{ borderColor: '#00a8ff', color: '#00a8ff' }}>
            Tournament In Progress
          </Button>
        )}
        
        {tournament.status === TournamentStatus.COMPLETED && (
          <Button variant="outlined" disabled sx={{ borderColor: '#ffff00', color: '#ffff00' }}>
            Tournament Completed
          </Button>
        )}
        
        {tournament.status === TournamentStatus.CANCELLED && (
          <Button variant="outlined" disabled sx={{ borderColor: '#ff4444', color: '#ff4444' }}>
            Tournament Cancelled
          </Button>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
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

  if (error || !tournament) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ 
          background: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid #ff4444',
          color: '#ff4444',
          '& .MuiAlert-icon': { color: '#ff4444' }
        }}>
          {error || 'Tournament not found'}
        </Alert>
      </Box>
    );
  }

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
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Card sx={cyberCardStyle} style={{ marginBottom: '2rem' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h3" sx={neonTextStyle} gutterBottom>
                <EmojiEvents sx={{ mr: 2, color: '#00ff9d' }} />
                {tournament.name}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={tournament.status} 
                  sx={getStatusChipStyle(tournament.status)}
                />
                <Chip 
                  label={tournament.format} 
                  sx={{ 
                    background: 'rgba(0, 168, 255, 0.2)',
                    border: '1px solid #00a8ff',
                    color: '#00a8ff',
                    textShadow: '0 0 5px #00a8ff',
                    fontWeight: 600,
                    letterSpacing: '1px',
                  }}
                />
              </Box>
              
              <Typography variant="body1" sx={{ color: '#ccc', mb: 2 }}>
                {tournament.description}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton onClick={handleFavorite} sx={{ color: isFavorite ? '#ff00ff' : '#888' }}>
                  {isFavorite ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Share tournament">
                <IconButton onClick={handleShare} sx={{ color: '#00a8ff' }}>
                  <Share />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton onClick={() => window.location.reload()} sx={{ color: '#00ff9d' }}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Tournament Stats */}
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid rgba(0, 255, 157, 0.2)', borderRadius: 2 }}>
                <Schedule sx={{ fontSize: 40, color: '#00ff9d', mb: 1 }} />
                <Typography variant="h6" sx={{ color: '#00ff9d', fontWeight: 'bold' }}>
                  {new Date(tournament.startDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>Start Date</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid rgba(0, 168, 255, 0.2)', borderRadius: 2 }}>
                <People sx={{ fontSize: 40, color: '#00a8ff', mb: 1 }} />
                <Typography variant="h6" sx={{ color: '#00a8ff', fontWeight: 'bold' }}>
                  {tournament.participants}/{tournament.maxParticipants}
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>Participants</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid rgba(255, 0, 255, 0.2)', borderRadius: 2 }}>
                <AttachMoney sx={{ fontSize: 40, color: '#ff00ff', mb: 1 }} />
                <Typography variant="h6" sx={{ color: '#ff00ff', fontWeight: 'bold' }}>
                  {tournament.entryFee} DOJO
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>Entry Fee</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid rgba(255, 255, 0, 0.2)', borderRadius: 2 }}>
                <EmojiEvents sx={{ fontSize: 40, color: '#ffff00', mb: 1 }} />
                <Typography variant="h6" sx={{ color: '#ffff00', fontWeight: 'bold' }}>
                  {tournament.prizePool} DOJO
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>Prize Pool</Typography>
              </Box>
            </Grid>
          </Grid>

          {renderActionButtons()}
        </Card>

        {/* Tabs */}
        <Card sx={cyberCardStyle}>
          <Box sx={{ borderBottom: 1, borderColor: 'rgba(0, 255, 157, 0.2)' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  color: '#888',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  '&.Mui-selected': {
                    color: '#00ff9d',
                    textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#00ff9d',
                  boxShadow: '0 0 10px #00ff9d',
                },
              }}
            >
              <Tab label="Overview" icon={<SportsEsports />} iconPosition="start" />
              <Tab label="Bracket" icon={<AccountTree />} iconPosition="start" />
              <Tab label="Participants" icon={<People />} iconPosition="start" />
              <Tab label="Highlights" icon={<Videocam />} iconPosition="start" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h5" sx={neonTextStyle} gutterBottom>
                  Tournament Details
                </Typography>
                <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
                  {tournament.description}
                </Typography>
                
                {venue && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#00a8ff', mb: 1 }}>
                      <LocationOn sx={{ mr: 1 }} />
                      Venue Information
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ccc' }}>
                      {venue.name} • {venue.address && typeof venue.address === 'string' ? venue.address : ''}
                    </Typography>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="h5" sx={neonTextStyle} gutterBottom>
                  Quick Stats
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ p: 2, border: '1px solid rgba(0, 255, 157, 0.2)', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>Format</Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>{tournament.format}</Typography>
                  </Box>
                  <Box sx={{ p: 2, border: '1px solid rgba(0, 168, 255, 0.2)', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ color: '#00a8ff' }}>Status</Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>{tournament.status}</Typography>
                  </Box>
                  <Box sx={{ p: 2, border: '1px solid rgba(255, 0, 255, 0.2)', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ color: '#ff00ff' }}>Entry Fee</Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>{tournament.entryFee} DOJO</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TournamentBracket 
              bracket={tournament.bracket}
              isAdmin={false} // TODO: Get from auth context
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <ParticipantsList 
              participants={tournament.participantsList} 
              maxParticipants={tournament.maxParticipants}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <VideoHighlights tournamentId={tournament.id} />
          </TabPanel>
        </Card>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <MuiAlert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ 
            background: snackbar.severity === 'success' ? 'rgba(0, 255, 157, 0.1)' : 'rgba(255, 68, 68, 0.1)',
            border: `1px solid ${snackbar.severity === 'success' ? '#00ff9d' : '#ff4444'}`,
            color: snackbar.severity === 'success' ? '#00ff9d' : '#ff4444',
          }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
      <TournamentRegistration
        tournament={tournament}
        open={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />
    </Box>
  );
};

export default TournamentDetail; 