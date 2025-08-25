import ClanCard from '@/components/clans/ClanCard';
import ClanMemberCard from '@/components/clans/ClanMemberCard';
import type { Clan, ClanMember } from '@/types/clan';
import { Box, Button, Container, Grid, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import React from 'react';

const ClanTestPage: React.FC = () => {
  const router = useRouter();

  // Mock data for testing
  const mockClan: Clan = {
    id: '1',
    name: 'Phoenix Warriors',
    tag: 'PHX',
    description:
      'A legendary clan of pool masters who rise from the ashes of defeat to claim victory.',
    memberCount: 15,
    maxMembers: 20,
    rating: 1850,
    territories: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    leaderId: 'leader-1',
    isPublic: true,
    requirements: {
      minRating: 1500,
      minLevel: 10,
      invitationOnly: false,
      approvalRequired: true,
    },
    stats: {
      totalWins: 45,
      totalLosses: 12,
      winRate: 78.9,
      totalMatches: 57,
      clanWarsWon: 8,
      clanWarsLost: 2,
      averageRating: 1820,
    },
  };

  const mockMember: ClanMember = {
    id: '1',
    userId: 'user-1',
    clanId: '1',
    role: 'LEADER',
    joinedAt: '2024-01-01T00:00:00Z',
    contribution: 1250,
    user: {
      id: 'user-1',
      username: 'PoolMaster',
      avatar: undefined,
      rating: 1850,
    },
  };

  const handleJoinClan = (clanId: string) => {
    console.log('Joining clan:', clanId);
    alert(`Joining clan ${clanId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Clan Components Test Page
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        This page tests the clan components to ensure they're working correctly.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Clan Card Component
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ClanCard
              clan={mockClan}
              onJoin={handleJoinClan}
              showJoinButton={true}
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Clan Member Card Component
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ClanMemberCard member={mockMember} isLeader={true} />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={() => router.push('/clans')}>
          Go to Clans Page
        </Button>
        <Button variant="outlined" onClick={() => router.push('/clans/create')}>
          Create Clan
        </Button>
        <Button variant="outlined" onClick={() => router.push('/clans/1')}>
          View Clan Profile
        </Button>
      </Box>
    </Container>
  );
};

export default ClanTestPage;
