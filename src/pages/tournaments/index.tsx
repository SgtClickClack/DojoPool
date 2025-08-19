import {
  Add as AddIcon,
  EmojiEvents,
  People,
  Schedule,
  TrendingUp,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
// Mock hooks for development
const useAuth = () => ({
  user: { id: '1', name: 'Mock User', email: 'mock@example.com' },
  isAdmin: true,
  isLoading: false,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  register: () => Promise.resolve(),
});

const useNavigate = () => (path: string) => {
  console.log('Mock navigation to:', path);
};

// Mock components for development
const TournamentList: React.FC<{
  onTournamentSelect: (tournament: any) => void;
}> = ({ onTournamentSelect }) => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
      Tournament List Component - Coming Soon
    </Typography>
    <Button
      variant="outlined"
      onClick={() => onTournamentSelect({ id: '1', name: 'Mock Tournament' })}
      sx={{ borderColor: '#00a8ff', color: '#00a8ff' }}
    >
      Select Mock Tournament
    </Button>
  </Box>
);

const TournamentRegistration: React.FC = () => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
      Tournament Registration Component - Coming Soon
    </Typography>
  </Box>
);

const TournamentBracket: React.FC<{ tournament: any }> = ({ tournament }) => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
      Tournament Bracket Component - Coming Soon
    </Typography>
    {tournament && (
      <Typography variant="body2" sx={{ color: '#ccc' }}>
        Selected: {tournament.name}
      </Typography>
    )}
  </Box>
);

const MatchScheduler: React.FC = () => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
      Match Scheduler Component - Coming Soon
    </Typography>
  </Box>
);

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TournamentDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateTournament = () => {
    navigate('/tournaments/create');
  };

  const handleTournamentSelect = (tournament: any) => {
    setSelectedTournament(tournament);
    setTabValue(1); // Switch to bracket view
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300a8ff' fill-opacity='0.05'%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          opacity: 0.3,
        },
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{
                color: '#fff',
                textShadow: '0 0 20px rgba(0, 255, 157, 0.8)',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                mb: 1,
              }}
            >
              Tournament Hub
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: '#00ff9d',
                textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
                letterSpacing: '1px',
              }}
            >
              Compete, Conquer, Champion
            </Typography>
          </Box>

          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateTournament}
              sx={{
                background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
                color: '#000',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                px: 3,
                py: 1.5,
                borderRadius: '8px',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
                },
              }}
            >
              Create Tournament
            </Button>
          )}
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 3,
                background: 'rgba(10, 10, 10, 0.95)',
                border: '1px solid #00ff9d',
                borderRadius: '15px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
                },
              }}
            >
              <EmojiEvents sx={{ fontSize: 40, color: '#00ff9d', mb: 2 }} />
              <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                12
              </Typography>
              <Typography variant="body2" sx={{ color: '#00ff9d' }}>
                Active Tournaments
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 3,
                background: 'rgba(10, 10, 10, 0.95)',
                border: '1px solid #00a8ff',
                borderRadius: '15px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
                },
              }}
            >
              <People sx={{ fontSize: 40, color: '#00a8ff', mb: 2 }} />
              <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                1,247
              </Typography>
              <Typography variant="body2" sx={{ color: '#00a8ff' }}>
                Total Participants
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 3,
                background: 'rgba(10, 10, 10, 0.95)',
                border: '1px solid #ff00ff',
                borderRadius: '15px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 0 30px rgba(255, 0, 255, 0.3)',
                },
              }}
            >
              <Schedule sx={{ fontSize: 40, color: '#ff00ff', mb: 2 }} />
              <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                89
              </Typography>
              <Typography variant="body2" sx={{ color: '#ff00ff' }}>
                Matches Today
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 3,
                background: 'rgba(10, 10, 10, 0.95)',
                border: '1px solid #ffff00',
                borderRadius: '15px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 0 30px rgba(255, 255, 0, 0.3)',
                },
              }}
            >
              <TrendingUp sx={{ fontSize: 40, color: '#ffff00', mb: 2 }} />
              <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                $45.2K
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffff00' }}>
                Total Prize Pool
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tournament Tabs */}
        <Paper
          sx={{
            background: 'rgba(10, 10, 10, 0.95)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '15px',
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              background: 'rgba(20, 20, 20, 0.9)',
              borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
              '& .MuiTab-root': {
                color: '#fff',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                '&.Mui-selected': {
                  color: '#ffd700',
                  textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#ffd700',
                boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
              },
            }}
          >
            <Tab label="Tournaments" />
            <Tab label="Bracket" />
            <Tab label="Schedule" />
            <Tab label="Registration" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <TournamentList onTournamentSelect={handleTournamentSelect} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {selectedTournament ? (
              <TournamentBracket tournament={selectedTournament} />
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                  Select a tournament to view the bracket
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <MatchScheduler />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <TournamentRegistration />
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default TournamentDashboard;
