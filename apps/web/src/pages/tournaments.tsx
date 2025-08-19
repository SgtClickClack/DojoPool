import { Alert, Box, Snackbar } from '@mui/material';
import { useState } from 'react';
import TournamentList from '../components/Tournament/TournamentList';

// Sample tournament data
const sampleTournaments = [
  {
    id: '1',
    name: 'Brisbane Pool Championship',
    description:
      'The biggest pool tournament in Brisbane featuring top players from across Queensland.',
    startDate: '2024-02-15',
    endDate: '2024-02-17',
    location: 'Brisbane',
    maxParticipants: 64,
    currentParticipants: 32,
    entryFee: 50,
    prizePool: 5000,
    status: 'upcoming' as const,
  },
  {
    id: '2',
    name: 'Gold Coast Masters',
    description:
      'Elite tournament for advanced players with high stakes and prestige.',
    startDate: '2024-02-20',
    endDate: '2024-02-22',
    location: 'Gold Coast',
    maxParticipants: 32,
    currentParticipants: 32,
    entryFee: 100,
    prizePool: 3000,
    status: 'upcoming' as const,
  },
  {
    id: '3',
    name: 'Sunshine Coast Open',
    description:
      'Open tournament for all skill levels, perfect for beginners and pros alike.',
    startDate: '2024-01-25',
    endDate: '2024-01-26',
    location: 'Sunshine Coast',
    maxParticipants: 48,
    currentParticipants: 45,
    entryFee: 25,
    prizePool: 1500,
    status: 'upcoming' as const,
  },
  {
    id: '4',
    name: 'Brisbane Winter Classic',
    description:
      'Annual winter tournament with special winter-themed prizes and atmosphere.',
    startDate: '2024-01-15',
    endDate: '2024-01-16',
    location: 'Brisbane',
    maxParticipants: 40,
    currentParticipants: 40,
    entryFee: 75,
    prizePool: 2500,
    status: 'completed' as const,
  },
  {
    id: '5',
    name: 'Queensland State Championship',
    description:
      'State-level championship determining the best pool player in Queensland.',
    startDate: '2024-03-01',
    endDate: '2024-03-03',
    location: 'Brisbane',
    maxParticipants: 128,
    currentParticipants: 89,
    entryFee: 150,
    prizePool: 10000,
    status: 'upcoming' as const,
  },
];

const TournamentsPage = () => {
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleJoinTournament = (tournamentId: string) => {
    const tournament = sampleTournaments.find((t) => t.id === tournamentId);
    if (tournament) {
      setNotification({
        open: true,
        message: `Successfully joined ${tournament.name}!`,
        severity: 'success',
      });
    }
  };

  const handleViewTournament = (tournamentId: string) => {
    const tournament = sampleTournaments.find((t) => t.id === tournamentId);
    if (tournament) {
      setNotification({
        open: true,
        message: `Viewing details for ${tournament.name}`,
        severity: 'info',
      });
    }
  };

  const handleCreateTournament = () => {
    setNotification({
      open: true,
      message: 'Tournament creation feature coming soon!',
      severity: 'info',
    });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <TournamentList
        tournaments={sampleTournaments}
        onJoinTournament={handleJoinTournament}
        onViewTournament={handleViewTournament}
        onCreateTournament={handleCreateTournament}
      />

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

export default TournamentsPage;
