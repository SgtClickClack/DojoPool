import ClanMemberCard from '@/components/clans/ClanMemberCard';
import ClanTerritoriesTab from '@/components/clans/ClanTerritoriesTab';
import {
  getClanDetails,
  getClanMembers,
  joinClan,
  leaveClan,
} from '@/services/APIService';
import type { Clan, ClanMember } from '@/types/clan';
import {
  Add,
  Edit,
  EmojiEvents,
  ExitToApp,
  Shield,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

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
      id={`clan-tabpanel-${index}`}
      aria-labelledby={`clan-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ClanProfilePage: React.FC = () => {
  const router = useRouter();
  const { clanId } = router.query;

  const [clan, setClan] = useState<Clan | null>(null);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    if (clanId) {
      loadClanData();
    }
  }, [clanId]);

  const loadClanData = async () => {
    try {
      setLoading(true);
      const [clanData, membersData] = await Promise.all([
        getClanDetails(clanId as string),
        getClanMembers(clanId as string),
      ]);

      setClan(clanData);
      setMembers(membersData);

      // Check if current user is a member or leader
      // TODO: Get current user ID from auth context
      const currentUserId = 'current-user-id'; // Replace with actual user ID
      const currentMember = membersData.find((m) => m.userId === currentUserId);
      setIsMember(!!currentMember);
      setIsLeader(currentMember?.role === 'LEADER');

      setError(null);
    } catch (err) {
      setError('Failed to load clan data');
      console.error('Error loading clan data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleJoinClan = async () => {
    try {
      await joinClan(clanId as string);
      setIsMember(true);
      await loadClanData(); // Refresh data
    } catch (err) {
      setError('Failed to join clan');
      console.error('Error joining clan:', err);
    }
  };

  const handleLeaveClan = async () => {
    try {
      await leaveClan(clanId as string);
      setIsMember(false);
      await loadClanData(); // Refresh data
    } catch (err) {
      setError('Failed to leave clan');
      console.error('Error leaving clan:', err);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!clan) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Clan not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Clan Header */}
      <Paper sx={{ p: 4, mb: 4, position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
          <Avatar
            src={clan.avatar}
            sx={{
              width: 120,
              height: 120,
              bgcolor: 'primary.main',
              fontSize: '3rem',
            }}
          >
            {clan.name.charAt(0)}
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{ fontWeight: 'bold' }}
              >
                {clan.name}
              </Typography>
              <Chip
                label={clan.tag}
                size="large"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '1.2rem', height: 32 }}
              />
              <Chip
                label={clan.isPublic ? 'Public' : 'Private'}
                size="medium"
                color={clan.isPublic ? 'success' : 'default'}
                variant="outlined"
              />
            </Box>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 600 }}
            >
              {clan.description}
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {clan.memberCount}/{clan.maxMembers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Members
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {clan.territories}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Territories
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {clan.rating}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rating
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {clan.stats.winRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Win Rate
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {!isMember ? (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleJoinClan}
                  disabled={clan.memberCount >= clan.maxMembers}
                >
                  {clan.memberCount >= clan.maxMembers
                    ? 'Clan Full'
                    : 'Join Clan'}
                </Button>
              ) : (
                <>
                  {isLeader && (
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => router.push(`/clans/${clanId}/edit`)}
                    >
                      Edit Clan
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<ExitToApp />}
                    onClick={handleLeaveClan}
                  >
                    Leave Clan
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Clan Stats */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Clan Statistics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <EmojiEvents
                sx={{ fontSize: 40, color: 'primary.main', mb: 1 }}
              />
              <Typography variant="h6">{clan.stats.totalWins}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Wins
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6">{clan.stats.clanWarsWon}</Typography>
              <Typography variant="body2" color="text.secondary">
                Clan Wars Won
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Star sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6">
                {clan.stats.averageRating.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Rating
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Shield sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6">{clan.stats.totalMatches}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Matches
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="clan tabs"
        >
          <Tab label="Members" />
          <Tab label="Territories" />
          <Tab label="History" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Clan Members ({members.length})
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {members.map((member) => (
            <Grid item xs={12} sm={6} md={4} key={member.id}>
              <ClanMemberCard
                member={member}
                isLeader={member.role === 'LEADER'}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ClanTerritoriesTab clanId={clanId as string} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h5" gutterBottom>
          Clan History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Clan history and achievements will be displayed here.
        </Typography>
      </TabPanel>
    </Container>
  );
};

export default ClanProfilePage;
