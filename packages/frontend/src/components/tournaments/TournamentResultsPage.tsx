import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Breadcrumbs, 
  Link, 
  Paper, 
  Tabs, 
  Tab, 
  Divider,
  Button
} from '@mui/material';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { TournamentLeaderboardIntegration } from '../leaderboard/TournamentLeaderboardIntegration';
import TournamentRewardDistribution from './TournamentRewardDistribution';
import { useWallet } from '../../hooks/useWallet';
import { crossChainTournamentService } from '../../services/crossChainTournamentService';
import { analyticsService } from '../../services/analytics';

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
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * Tournament Results Page Component
 * 
 * This page displays tournament results and allows tournament organizers
 * to submit final results to update global leaderboards.
 */
export const TournamentResultsPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { walletAddress, isConnected } = useWallet();
  const [tabValue, setTabValue] = useState(0);
  const [tournamentDetails, setTournamentDetails] = useState<any>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load tournament details
  useEffect(() => {
    const loadTournamentDetails = async () => {
      if (tournamentId) {
        try {
          setLoading(true);
          const details = await crossChainTournamentService.getTournamentDetails(tournamentId);
          setTournamentDetails(details);
          
          // Check if current user is the tournament organizer
          if (details && walletAddress.ethereum) {
            setIsOrganizer(details.creator.toLowerCase() === walletAddress.ethereum.toLowerCase());
          }
          
          analyticsService.trackEvent('tournament_results_page_viewed', {
            tournamentId,
            tournamentName: details?.name
          });
        } catch (err) {
          console.error('Error loading tournament details:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadTournamentDetails();
  }, [tournamentId, walletAddress.ethereum]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Track tab changes
    const tabNames = ['leaderboard', 'match_history', 'player_stats', 'rewards'];
    analyticsService.trackEvent('tournament_tab_changed', {
      tournamentId,
      tabName: tabNames[newValue]
    });
  };

  // Check if both Ethereum and tournament details are ready
  const canSubmitResults = isOrganizer && 
                          isConnected('ethereum') && 
                          tournamentDetails?.status === 'in_progress';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" color="inherit">
          Home
        </Link>
        <Link component={RouterLink} to="/tournaments" color="inherit">
          Tournaments
        </Link>
        <Typography color="textPrimary">
          {loading ? 'Loading...' : tournamentDetails?.name || 'Tournament Results'}
        </Typography>
      </Breadcrumbs>

      {/* Tabs Navigation */}
      <Paper elevation={1} sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          aria-label="tournament tabs"
        >
          <Tab label="Leaderboard & Results" />
          <Tab label="Match History" />
          <Tab label="Player Stats" />
          <Tab label="Rewards" />
        </Tabs>
      </Paper>

      {/* Leaderboard Tab */}
      <TabPanel value={tabValue} index={0}>
        <TournamentLeaderboardIntegration 
          tournamentId={tournamentId || ''} 
          allowSubmission={canSubmitResults}
          showGlobalLeaderboard={true}
        />
      </TabPanel>

      {/* Match History Tab */}
      <TabPanel value={tabValue} index={1}>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Match History
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body1">
            Match history will be displayed here. This feature is coming soon.
          </Typography>
        </Paper>
      </TabPanel>

      {/* Player Stats Tab */}
      <TabPanel value={tabValue} index={2}>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Player Statistics
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body1">
            Detailed player statistics will be displayed here. This feature is coming soon.
          </Typography>
        </Paper>
      </TabPanel>
      
      {/* Rewards Tab */}
      <TabPanel value={tabValue} index={3}>
        <TournamentRewardDistribution 
          tournamentId={tournamentId || ''} 
          isOrganizer={isOrganizer} 
        />
      </TabPanel>
    </Container>
  );
};

export default TournamentResultsPage; 