import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Paper, Tabs, Tab, Button, Chip } from '@mui/material';
import { Add as AddIcon, EmojiEvents, People, Schedule, TrendingUp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TournamentList from '@/components/tournament/TournamentList';
import TournamentRegistration from '@/components/tournament/TournamentRegistration';
import TournamentBracket from '@/components/tournament/TournamentBracket';
import MatchScheduler from '@/components/tournament/MatchScheduler';
import { useAuth } from '@/hooks/useAuth';

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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography 
            variant="h3" 
            sx={{ 
              color: '#fff',
              textShadow: '0 0 20px rgba(0, 255, 157, 0.8)',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              mb: 1
            }}
          >
            Tournament Hub
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: '#00ff9d',
              textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
              letterSpacing: '1px'
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
                background: 'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
              }
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
              }
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
              }
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
              }
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
              }
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

      {/* Main Content */}
      <Paper
        sx={{
          background: 'rgba(10, 10, 10, 0.95)',
          border: '1px solid #00ff9d',
          borderRadius: '15px',
          overflow: 'hidden',
        }}
      >
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: '#00ff9d' }}>
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
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#00ff9d',
                boxShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
              }
            }}
          >
            <Tab label="All Tournaments" />
            <Tab label="Tournament Bracket" />
            <Tab label="Match Scheduler" />
            <Tab label="Registration" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <TournamentList onTournamentSelect={handleTournamentSelect} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {selectedTournament ? (
            <TournamentBracket tournament={selectedTournament} />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: '#888' }}>
                Select a tournament to view the bracket
              </Typography>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <MatchScheduler tournament={selectedTournament} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <TournamentRegistration />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default TournamentDashboard; 