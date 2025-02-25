/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Tab,
  Tabs,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  Event as CalendarIcon,
  LocationOn as LocationIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import TournamentBracket from '../packages/frontend/src/components/tournaments/[TOURN]TournamentBracket';

// Mock data for tournaments
const MOCK_TOURNAMENTS = [
  {
    id: 1,
    name: 'Spring Championship',
    venue_name: 'Golden Cue Billiards',
    venue_id: 101,
    start_date: '2025-04-15T18:00:00Z',
    end_date: '2025-04-17T22:00:00Z',
    registration_deadline: '2025-04-14T23:59:59Z',
    entryFee: 25,
    prizePool: 1000,
    maxParticipants: 32,
    currentParticipants: 28,
    status: 'registering',
    description: 'Our quarterly championship tournament with cash prizes and trophies.',
    rules: '8-ball competition, double elimination.',
  },
  {
    id: 2,
    name: 'Weekly 9-Ball Challenge',
    venue_name: 'Downtown Pool Hall',
    venue_id: 102,
    start_date: '2025-03-10T19:00:00Z',
    end_date: '2025-03-10T23:00:00Z',
    registration_deadline: '2025-03-10T18:45:00Z',
    entryFee: 10,
    prizePool: 200,
    maxParticipants: 16,
    currentParticipants: 16,
    status: 'in_progress',
    description: 'Weekly 9-ball tournament, winner takes all.',
    rules: '9-ball competition, single elimination.',
  },
  {
    id: 3,
    name: 'Pro-Am Partner Tournament',
    venue_name: 'Shark\'s Billiards',
    venue_id: 103,
    start_date: '2025-05-20T17:00:00Z',
    end_date: '2025-05-20T23:00:00Z',
    registration_deadline: '2025-05-18T23:59:59Z',
    entryFee: 30,
    prizePool: 800,
    maxParticipants: 24,
    currentParticipants: 12,
    status: 'registering',
    description: 'Team up with a pro or amateur player for this unique doubles format.',
    rules: 'Scotch doubles format, alternating shots, 8-ball rules.',
  },
  {
    id: 4,
    name: 'Summer Straight Pool Classic',
    venue_name: 'Cue Masters Academy',
    venue_id: 104,
    start_date: '2025-06-15T14:00:00Z',
    end_date: '2025-06-16T20:00:00Z',
    registration_deadline: '2025-06-10T23:59:59Z',
    entryFee: 40,
    prizePool: 1200,
    maxParticipants: 32,
    currentParticipants: 22,
    status: 'registering',
    description: 'Straight pool tournament with races to 100 points.',
    rules: '14.1 continuous, race to 100 points in prelims, 150 in finals.'
  }
];

// Mock data for tournament matches
const MOCK_MATCHES = [
  // Round 1
  { id: 1, tournament_id: 2, round_number: 1, match_number: 1, player1: { id: 101, username: 'JohnTheShark' }, player2: { id: 102, username: 'CueArtist' }, status: 'completed', winner_id: 101, score: { player1: 7, player2: 4 }, next_match_id: 9 },
  { id: 2, tournament_id: 2, round_number: 1, match_number: 2, player1: { id: 103, username: 'PoolWizard' }, player2: { id: 104, username: 'StickHandlerPro' }, status: 'completed', winner_id: 103, score: { player1: 7, player2: 3 }, next_match_id: 9 },
  { id: 3, tournament_id: 2, round_number: 1, match_number: 3, player1: { id: 105, username: 'ChalkMaster' }, player2: { id: 106, username: 'EnglishSpin' }, status: 'completed', winner_id: 106, score: { player1: 5, player2: 7 }, next_match_id: 10 },
  { id: 4, tournament_id: 2, round_number: 1, match_number: 4, player1: { id: 107, username: 'BankShotKing' }, player2: { id: 108, username: 'CueballControl' }, status: 'completed', winner_id: 108, score: { player1: 2, player2: 7 }, next_match_id: 10 },
  { id: 5, tournament_id: 2, round_number: 1, match_number: 5, player1: { id: 109, username: 'SafetyPlayer' }, player2: { id: 110, username: 'PowerBreaker' }, status: 'completed', winner_id: 110, score: { player1: 6, player2: 7 }, next_match_id: 11 },
  { id: 6, tournament_id: 2, round_number: 1, match_number: 6, player1: { id: 111, username: 'SpinMaster' }, player2: { id: 112, username: 'PocketMachine' }, status: 'completed', winner_id: 111, score: { player1: 7, player2: 5 }, next_match_id: 11 },
  { id: 7, tournament_id: 2, round_number: 1, match_number: 7, player1: { id: 113, username: 'DefenseTactic' }, player2: { id: 114, username: 'CornerHunter' }, status: 'completed', winner_id: 114, score: { player1: 4, player2: 7 }, next_match_id: 12 },
  { id: 8, tournament_id: 2, round_number: 1, match_number: 8, player1: { id: 115, username: 'StraightShooter' }, player2: { id: 116, username: 'RailMaster' }, status: 'completed', winner_id: 115, score: { player1: 7, player2: 6 }, next_match_id: 12 },
  
  // Round 2
  { id: 9, tournament_id: 2, round_number: 2, match_number: 1, player1: { id: 101, username: 'JohnTheShark' }, player2: { id: 103, username: 'PoolWizard' }, status: 'completed', winner_id: 101, score: { player1: 7, player2: 5 }, next_match_id: 13 },
  { id: 10, tournament_id: 2, round_number: 2, match_number: 2, player1: { id: 106, username: 'EnglishSpin' }, player2: { id: 108, username: 'CueballControl' }, status: 'completed', winner_id: 108, score: { player1: 3, player2: 7 }, next_match_id: 13 },
  { id: 11, tournament_id: 2, round_number: 2, match_number: 3, player1: { id: 110, username: 'PowerBreaker' }, player2: { id: 111, username: 'SpinMaster' }, status: 'in_progress', next_match_id: 14 },
  { id: 12, tournament_id: 2, round_number: 2, match_number: 4, player1: { id: 114, username: 'CornerHunter' }, player2: { id: 115, username: 'StraightShooter' }, status: 'in_progress', next_match_id: 14 },
  
  // Round 3 (Semifinals)
  { id: 13, tournament_id: 2, round_number: 3, match_number: 1, player1: { id: 101, username: 'JohnTheShark' }, player2: { id: 108, username: 'CueballControl' }, status: 'not_started', next_match_id: 15 },
  { id: 14, tournament_id: 2, round_number: 3, match_number: 2, player1: null, player2: null, status: 'not_started', next_match_id: 15 },
  
  // Round 4 (Final)
  { id: 15, tournament_id: 2, round_number: 4, match_number: 1, player1: null, player2: null, status: 'not_started' }
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
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
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TournamentsPage: React.FC = () => {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState(MOCK_TOURNAMENTS);
  const [selectedTournament, setSelectedTournament] = useState<typeof MOCK_TOURNAMENTS[0] | null>(null);
  const [tournamentMatches, setTournamentMatches] = useState<typeof MOCK_MATCHES>([]);

  useEffect(() => {
    // In a real app, we would fetch tournaments from the API
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setTournaments(MOCK_TOURNAMENTS);
      setLoading(false);
    }, 800);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewTournament = (tournamentId: number) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      setSelectedTournament(tournament);
      
      // Fetch tournament matches
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const matches = MOCK_MATCHES.filter(m => m.tournament_id === tournamentId);
        setTournamentMatches(matches);
        setLoading(false);
        
        // Switch to details tab
        setTabValue(1);
      }, 500);
    }
  };

  const handleRegisterForTournament = (tournamentId: number) => {
    // In a real app, we would make an API call to register
    alert(`Registration for tournament ${tournamentId} would happen here.`);
  };

  return (
    <>
      <Head>
        <title>Tournaments | DojoPool</title>
        <meta name="description" content="Join competitive pool tournaments in your area" />
      </Head>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Pool Tournaments
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="tournament tabs">
            <Tab label="Available Tournaments" />
            {selectedTournament && <Tab label={`${selectedTournament.name} Details`} />}
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : tournaments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No tournaments available
              </Typography>
              <Typography color="textSecondary">
                Check back soon for upcoming tournaments.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {tournaments.map((tournament) => (
                <Grid item xs={12} md={6} key={tournament.id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h5" component="h2">
                          {tournament.name}
                        </Typography>
                        <Chip 
                          label={tournament.status === 'registering' ? 'Registration Open' : tournament.status === 'in_progress' ? 'In Progress' : 'Completed'} 
                          color={tournament.status === 'registering' ? 'success' : tournament.status === 'in_progress' ? 'primary' : 'default'}
                        />
                      </Box>
                      
                      <Typography color="textSecondary" paragraph>
                        {tournament.description}
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {formatDate(tournament.start_date)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {tournament.venue_name}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Entry Fee
                          </Typography>
                          <Typography variant="body1">
                            ${tournament.entryFee}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Prize Pool
                          </Typography>
                          <Typography variant="body1">
                            ${tournament.prizePool}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Participants
                          </Typography>
                          <Typography variant="body1">
                            {tournament.currentParticipants} / {tournament.maxParticipants}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Registration Deadline
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(tournament.registration_deadline)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button 
                        size="small" 
                        onClick={() => handleViewTournament(tournament.id)}
                        endIcon={<ArrowIcon />}
                      >
                        View Details
                      </Button>
                      
                      {tournament.status === 'registering' && (
                        <Button 
                          variant="contained" 
                          size="small" 
                          color="primary"
                          disabled={tournament.currentParticipants >= tournament.maxParticipants}
                          onClick={() => handleRegisterForTournament(tournament.id)}
                        >
                          Register Now
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {selectedTournament && (
            <>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  {selectedTournament.name}
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Tournament Bracket
                      </Typography>
                      
                      {loading ? (
                        <Box display="flex" justifyContent="center" py={6}>
                          <CircularProgress />
                        </Box>
                      ) : tournamentMatches.length === 0 ? (
                        <Alert severity="info">
                          Bracket will be available once the tournament begins.
                        </Alert>
                      ) : (
                        <TournamentBracket 
                          matches={tournamentMatches} 
                          totalRounds={Math.max(...tournamentMatches.map(m => m.round_number))}
                        />
                      )}
                    </Paper>
                    
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Tournament Rules
                      </Typography>
                      <Typography>
                        {selectedTournament.rules}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Tournament Details
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Date & Time
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(selectedTournament.start_date)} at {formatTime(selectedTournament.start_date)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Venue
                        </Typography>
                        <Typography variant="body1">
                          {selectedTournament.venue_name}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Entry Fee
                        </Typography>
                        <Typography variant="body1">
                          ${selectedTournament.entryFee}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Prize Pool
                        </Typography>
                        <Typography variant="body1">
                          ${selectedTournament.prizePool}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Participants
                        </Typography>
                        <Typography variant="body1">
                          {selectedTournament.currentParticipants} / {selectedTournament.maxParticipants}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Registration Closes
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(selectedTournament.registration_deadline)} at {formatTime(selectedTournament.registration_deadline)}
                        </Typography>
                      </Box>
                      
                      {selectedTournament.status === 'registering' && (
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          sx={{ mt: 3 }}
                          disabled={selectedTournament.currentParticipants >= selectedTournament.maxParticipants}
                          onClick={() => handleRegisterForTournament(selectedTournament.id)}
                        >
                          Register for Tournament
                        </Button>
                      )}
                    </Paper>
                    
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Contact Information
                      </Typography>
                      <Typography paragraph>
                        For questions about this tournament, please contact the venue directly.
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => router.push(`/venues/${selectedTournament.venue_id}`)}
                      >
                        View Venue Details
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </TabPanel>
      </Container>
    </>
  );
};

export default TournamentsPage;