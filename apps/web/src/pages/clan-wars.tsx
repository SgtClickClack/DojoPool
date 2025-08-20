import React, { useState } from 'react';
import { Box, Alert, Snackbar, Paper, Typography, Grid, Chip } from '@mui/material';
import { EmojiEvents, Group, LocationOn, Shield } from '@mui/icons-material';
import ClanList from '../components/Clan/ClanList';

// Sample clan data with full details
const sampleClans = [
  {
    id: '1',
    name: 'Crimson Monkeys',
    description: 'Elite clan of skilled pool players from Brisbane. We dominate the southern territories and never back down from a challenge.',
    location: 'Brisbane',
    memberCount: 45,
    maxMembers: 50,
    level: 15,
    experience: 8500,
    experienceToNext: 10000,
    territoryCount: 12,
    warWins: 28,
    warLosses: 5,
    members: [
      { id: '1', name: 'RyuKlaw', role: 'leader' as const, level: 25, avatarUrl: undefined },
      { id: '2', name: 'ShadowStrike', role: 'officer' as const, level: 22, avatarUrl: undefined },
      { id: '3', name: 'PoolMaster', role: 'officer' as const, level: 20, avatarUrl: undefined },
    ],
    isMember: false,
  },
  {
    id: '2',
    name: 'Azure Dragons',
    description: 'Strategic clan focused on territory expansion and diplomatic alliances. We prefer smart wars over brute force.',
    location: 'Gold Coast',
    memberCount: 38,
    maxMembers: 45,
    level: 12,
    experience: 7200,
    experienceToNext: 8000,
    territoryCount: 8,
    warWins: 18,
    warLosses: 12,
    members: [
      { id: '4', name: 'DragonLord', role: 'leader' as const, level: 23, avatarUrl: undefined },
      { id: '5', name: 'AzureKnight', role: 'officer' as const, level: 19, avatarUrl: undefined },
      { id: '6', name: 'Tactician', role: 'member' as const, level: 18, avatarUrl: undefined },
    ],
    isMember: false,
  },
  {
    id: '3',
    name: 'Jade Tigers',
    description: 'Your current clan! We are peaceful defenders who focus on protecting our territories and helping new members grow.',
    location: 'Brisbane',
    memberCount: 52,
    maxMembers: 60,
    level: 18,
    experience: 9100,
    experienceToNext: 12000,
    territoryCount: 15,
    warWins: 35,
    warLosses: 8,
    members: [
      { id: '7', name: 'JadeMaster', role: 'leader' as const, level: 26, avatarUrl: undefined },
      { id: '8', name: 'TigerClaw', role: 'officer' as const, level: 21, avatarUrl: undefined },
      { id: '9', name: 'PeaceKeeper', role: 'officer' as const, level: 20, avatarUrl: undefined },
    ],
    isMember: true,
  },
  {
    id: '4',
    name: 'Shadow Wolves',
    description: 'Stealth-focused clan that excels in surprise attacks and guerrilla warfare tactics. We strike from the shadows.',
    location: 'Sunshine Coast',
    memberCount: 29,
    maxMembers: 35,
    level: 10,
    experience: 5800,
    experienceToNext: 7000,
    territoryCount: 6,
    warWins: 15,
    warLosses: 20,
    members: [
      { id: '10', name: 'ShadowAlpha', role: 'leader' as const, level: 20, avatarUrl: undefined },
      { id: '11', name: 'NightStalker', role: 'officer' as const, level: 17, avatarUrl: undefined },
      { id: '12', name: 'StealthKiller', role: 'member' as const, level: 16, avatarUrl: undefined },
    ],
    isMember: false,
  },
  {
    id: '5',
    name: 'Golden Phoenix',
    description: 'Rising clan from the northern territories. We focus on rapid expansion and building strong alliances.',
    location: 'Cairns',
    memberCount: 25,
    maxMembers: 40,
    level: 8,
    experience: 4200,
    experienceToNext: 5000,
    territoryCount: 4,
    warWins: 12,
    warLosses: 15,
    members: [
      { id: '13', name: 'PhoenixRise', role: 'leader' as const, level: 18, avatarUrl: undefined },
      { id: '14', name: 'GoldenWing', role: 'officer' as const, level: 16, avatarUrl: undefined },
      { id: '15', name: 'FireBird', role: 'member' as const, level: 15, avatarUrl: undefined },
    ],
    isMember: false,
  },
  {
    id: '6',
    name: 'Silver Serpents',
    description: 'Mysterious clan known for their cunning strategies and ability to turn the tide of any battle.',
    location: 'Townsville',
    memberCount: 33,
    maxMembers: 40,
    level: 11,
    experience: 6500,
    experienceToNext: 7500,
    territoryCount: 7,
    warWins: 22,
    warLosses: 18,
    members: [
      { id: '16', name: 'SerpentKing', role: 'leader' as const, level: 21, avatarUrl: undefined },
      { id: '17', name: 'SilverTongue', role: 'officer' as const, level: 18, avatarUrl: undefined },
      { id: '18', name: 'VenomStrike', role: 'member' as const, level: 17, avatarUrl: undefined },
    ],
    isMember: false,
  },
];

const ClanWarsPage = () => {
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleJoinClan = (clanId: string) => {
    const clan = sampleClans.find((c) => c.id === clanId);
    if (clan) {
      setNotification({
        open: true,
        message: `Successfully joined ${clan.name}!`,
        severity: 'success',
      });
    }
  };

  const handleViewClan = (clanId: string) => {
    const clan = sampleClans.find((c) => c.id === clanId);
    if (clan) {
      setNotification({
        open: true,
        message: `Viewing details for ${clan.name}`,
        severity: 'info',
      });
    }
  };

  const handleLeaveClan = (clanId: string) => {
    const clan = sampleClans.find((c) => c.id === clanId);
    if (clan) {
      setNotification({
        open: true,
        message: `Left ${clan.name}. You are now clanless.`,
        severity: 'info',
      });
    }
  };

  const handleCreateClan = () => {
    setNotification({
      open: true,
      message: 'Clan creation feature coming soon!',
      severity: 'info',
    });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Calculate war statistics
  const totalWars = sampleClans.reduce((sum, clan) => sum + clan.warWins + clan.warLosses, 0);
  const totalTerritories = sampleClans.reduce((sum, clan) => sum + clan.territoryCount, 0);
  const totalMembers = sampleClans.reduce((sum, clan) => sum + clan.memberCount, 0);
  const activeWars = sampleClans.filter((clan) => clan.warWins > 0 || clan.warLosses > 0).length;

  return (
    <Box>
      {/* War Statistics Overview */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          ⚔️ Clan War Statistics
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Shield sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" color="error.main">
                {activeWars}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Wars
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <LocationOn sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {totalTerritories}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Territories
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Group sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary.main">
                {totalMembers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Members
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {totalWars}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Battles
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Clan List */}
      <ClanList
        clans={sampleClans}
        onJoinClan={handleJoinClan}
        onViewClan={handleViewClan}
        onLeaveClan={handleLeaveClan}
        onCreateClan={handleCreateClan}
      />

      {/* War Rules */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          ⚔️ War Rules & Strategy
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              War Mechanics
            </Typography>
            <ul>
              <li>Clans can declare war on other clans to claim territory</li>
              <li>Wars last 24 hours and require active participation</li>
              <li>Winning clan gains control of contested territory</li>
              <li>Losing clan must surrender territory or pay tribute</li>
            </ul>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Strategic Tips
            </Typography>
            <ul>
              <li>Form alliances with neighboring clans</li>
              <li>Focus on defending your core territories</li>
              <li>Use diplomacy to avoid unnecessary conflicts</li>
              <li>Build strong member base before expanding</li>
            </ul>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClanWarsPage;
