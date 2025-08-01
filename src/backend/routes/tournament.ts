import express from 'express';

const router = express.Router();

// Tournament interface
interface Tournament {
  id: string;
  name: string;
  format: string;
  venueId: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  entryFee: number;
  prizePool: number;
  status: string;
  participants: string[];
  matches: string[];
  winnerId?: string;
  finalStandings: string[];
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
}

// In-memory storage for tournaments
const mockTournaments: Tournament[] = [
  {
    id: 'tournament-1',
    name: 'Summer Championship 2024',
    format: 'SINGLE_ELIMINATION',
    venueId: 'venue-1',
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-07-15'),
    maxParticipants: 32,
    entryFee: 50,
    prizePool: 1000,
    status: 'OPEN',
    participants: ['player-1', 'player-2'],
    matches: [],
    finalStandings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tournament-2',
    name: 'Winter League 2024',
    format: 'ROUND_ROBIN',
    venueId: 'venue-2',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    maxParticipants: 16,
    entryFee: 25,
    prizePool: 500,
    status: 'ACTIVE',
    participants: ['player-3', 'player-4', 'player-5'],
    matches: ['match-1', 'match-2'],
    finalStandings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// GET /api/tournaments - all tournaments
router.get('/tournaments', async (req: express.Request, res: express.Response) => {
  try {
    const { venueId, status } = req.query;
    
    let filteredTournaments = [...mockTournaments];
    
    if (venueId) {
      filteredTournaments = filteredTournaments.filter(t => t.venueId === venueId);
    }
    
    if (status) {
      filteredTournaments = filteredTournaments.filter(t => t.status === status);
    }
    
    res.json({ success: true, tournaments: filteredTournaments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tournaments' });
  }
});

// GET /api/tournaments/:id - single tournament
router.get('/tournaments/:id', async (req: express.Request, res: express.Response) => {
  try {
    const tournament = mockTournaments.find(t => t.id === req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });
    res.json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tournament' });
  }
});

// POST /api/tournaments - create a new tournament
router.post('/tournaments', async (req: express.Request, res: express.Response) => {
  try {
    const { name, format, venueId, startDate, endDate, maxParticipants, entryFee, prizePool } = req.body;
    if (!name || !format || !venueId || !startDate || !endDate || !maxParticipants || !entryFee || !prizePool) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const newTournament: Tournament = {
      id: `tournament_${Date.now()}`,
      name,
      format,
      venueId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxParticipants: Number(maxParticipants),
      entryFee: Number(entryFee),
      prizePool: Number(prizePool),
      status: 'OPEN',
      participants: [],
      matches: [],
      finalStandings: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockTournaments.push(newTournament);
    res.status(201).json({ success: true, tournament: newTournament });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create tournament' });
  }
});

// POST /api/tournaments/:id/register - register for tournament
router.post('/tournaments/:id/register', async (req: express.Request, res: express.Response) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      return res.status(400).json({ success: false, error: 'Participant ID required' });
    }
    
    const tournament = mockTournaments.find(t => t.id === req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    
    if (tournament.participants.includes(participantId)) {
      return res.status(400).json({ success: false, error: 'Already registered' });
    }
    
    if (tournament.participants.length >= tournament.maxParticipants) {
      return res.status(400).json({ success: false, error: 'Tournament is full' });
    }
    
    tournament.participants.push(participantId);
    tournament.updatedAt = new Date();
    
    res.json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to register for tournament' });
  }
});

// POST /api/tournaments/:id/withdraw - withdraw from tournament
router.post('/tournaments/:id/withdraw', async (req: express.Request, res: express.Response) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      return res.status(400).json({ success: false, error: 'Participant ID required' });
    }
    
    const tournament = mockTournaments.find(t => t.id === req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    
    const index = tournament.participants.indexOf(participantId);
    if (index === -1) {
      return res.status(400).json({ success: false, error: 'Not registered for tournament' });
    }
    
    tournament.participants.splice(index, 1);
    tournament.updatedAt = new Date();
    
    res.json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to withdraw from tournament' });
  }
});

// GET /api/tournaments/:id/participants - get tournament participants
router.get('/tournaments/:id/participants', async (req: express.Request, res: express.Response) => {
  try {
    const tournament = mockTournaments.find(t => t.id === req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });
    
    // Return participant IDs for now - in a real app, you'd fetch full participant details
    const participants = tournament.participants.map(id => ({ id, name: `Player ${id}` }));
    res.json({ success: true, participants });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch participants' });
  }
});

// GET /api/tournaments/:id/bracket - get tournament bracket
router.get('/tournaments/:id/bracket', async (req: express.Request, res: express.Response) => {
  try {
    const tournament = mockTournaments.find(t => t.id === req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });
    
    // Simple bracket structure for testing
    const bracket = {
      tournamentId: tournament.id,
      format: tournament.format,
      rounds: [],
      participants: tournament.participants,
    };
    
    res.json({ success: true, bracket });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch bracket' });
  }
});

// POST /api/tournaments/:id/generate-bracket - generate tournament bracket
router.post('/tournaments/:id/generate-bracket', async (req: express.Request, res: express.Response) => {
  try {
    const tournament = mockTournaments.find(t => t.id === req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });
    
    // Simple bracket generation for testing
    const bracket = {
      tournamentId: tournament.id,
      format: tournament.format,
      rounds: [
        {
          roundNumber: 1,
          matches: tournament.participants.slice(0, Math.floor(tournament.participants.length / 2))
            .map((participant, index) => ({
              matchId: `match_${Date.now()}_${index}`,
              player1: participant,
              player2: tournament.participants[Math.floor(tournament.participants.length / 2) + index] || null,
              winner: null,
            }))
        }
      ],
      participants: tournament.participants,
    };
    
    res.json({ success: true, bracket });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate bracket' });
  }
});

// POST /api/tournaments/:id/matches/:matchId/result - submit match result
router.post('/tournaments/:id/matches/:matchId/result', async (req: express.Request, res: express.Response) => {
  try {
    const { winnerId, loserId, player1Score, player2Score } = req.body;
    if (!winnerId || !loserId) {
      return res.status(400).json({ success: false, error: 'Winner and loser IDs required' });
    }
    
    const tournament = mockTournaments.find(t => t.id === req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });
    
    // Add match to tournament
    tournament.matches.push(req.params.matchId);
    tournament.updatedAt = new Date();
    
    res.json({ success: true, message: 'Match result submitted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit match result' });
  }
});

export default router; 


