import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/venue/:venueId/analytics', (req, res) => {
  const { venueId } = req.params;
  res.json({
    venueId,
    visitorCount: 150,
    revenue: 2500,
    matchesPlayed: 45
  });
});

router.get('/venue/:venueId/status', (req, res) => {
  const { venueId } = req.params;
  res.json({
    venueId,
    isOpen: true,
    currentPlayers: 12,
    availableTables: 3
  });
});

router.post('/venue/:venueId/tournaments', (req, res) => {
  const { venueId } = req.params;
  const { name, description, startDate, endDate, entryFee, maxParticipants, format } = req.body;
  res.json({
    tournamentId: 'tournament-1',
    name,
    venueId,
    status: 'scheduled'
  });
});

router.get('/venue/:venueId/tournaments', (req, res) => {
  res.json([
    { id: 'tournament-1', name: 'Spring Championship', status: 'scheduled' },
    { id: 'tournament-2', name: 'Summer Cup', status: 'completed' }
  ]);
});

router.get('/venue/:venueId/metrics', (req, res) => {
  res.json({
    tableUtilization: 0.75,
    averageSessionDuration: 42
  });
});

export default router; 


