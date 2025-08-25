import TournamentList from '@/components/Tournament/TournamentList';
import { useAuth } from '@/hooks/useAuth';
import { Add as AddIcon } from '@mui/icons-material';
import { Box, Button, Container, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import React from 'react';

const TournamentDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const handleCreateTournament = () => {
    router.push('/tournaments/create');
  };

  const handleViewTournament = (tournamentId: string) => {
    router.push(`/tournaments/${tournamentId}`);
  };

  // Mock tournaments data for now
  const mockTournaments = [
    {
      id: '1',
      name: 'Spring Championship',
      description: 'Annual spring tournament for all skill levels',
      startDate: '2024-03-15',
      endDate: '2024-03-17',
      location: 'The Jade Tiger',
      maxParticipants: 32,
      currentParticipants: 24,
      entryFee: 50,
      prizePool: 2000,
      status: 'upcoming' as const,
    },
    {
      id: '2',
      name: 'Beginner Friendly',
      description: 'Perfect for new players',
      startDate: '2024-03-20',
      endDate: '2024-03-20',
      location: "Beginner's Haven",
      maxParticipants: 16,
      currentParticipants: 8,
      entryFee: 25,
      prizePool: 400,
      status: 'upcoming' as const,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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
          <Typography variant="h3" gutterBottom>
            Tournament Hub
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Compete, Challenge, Conquer
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTournament}
          >
            Create Tournament
          </Button>
        )}
      </Box>

      {/* Tournament List */}
      <TournamentList
        tournaments={mockTournaments}
        onViewTournament={handleViewTournament}
        onCreateTournament={handleCreateTournament}
      />
    </Container>
  );
};

export default TournamentDashboard;
