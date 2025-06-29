import request from 'supertest';
import app from '../../backend/simple-index';

describe('Tournament API Integration Tests', () => {
  describe('Tournament Endpoints', () => {
    it('should get all tournaments', async () => {
      const response = await request(app)
        .get('/api/tournaments')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.tournaments)).toBe(true);
      expect(response.body.tournaments.length).toBeGreaterThan(0);
    });

    it('should get tournament by ID', async () => {
      const response = await request(app)
        .get('/api/tournaments/tournament-1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.tournament).toBeDefined();
      expect(response.body.tournament.id).toBe('tournament-1');
      expect(response.body.tournament.name).toBe('Summer Championship 2024');
    });

    it('should create a new tournament', async () => {
      const tournamentData = {
        name: 'Test Tournament 2025',
        format: 'SINGLE_ELIMINATION',
        venueId: 'venue-test',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        maxParticipants: 32,
        entryFee: 50,
        prizePool: 1000
      };

      const response = await request(app)
        .post('/api/tournaments')
        .send(tournamentData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.tournament).toBeDefined();
      expect(response.body.tournament.name).toBe('Test Tournament 2025');
      expect(response.body.tournament.format).toBe('SINGLE_ELIMINATION');
    });

    it('should register for tournament', async () => {
      const response = await request(app)
        .post('/api/tournaments/tournament-1/register')
        .send({ participantId: 'player-test' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.tournament).toBeDefined();
      expect(response.body.tournament.participants).toContain('player-test');
    });

    it('should get tournament participants', async () => {
      const response = await request(app)
        .get('/api/tournaments/tournament-1/participants')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.participants)).toBe(true);
    });

    it('should get tournament bracket', async () => {
      const response = await request(app)
        .get('/api/tournaments/tournament-1/bracket')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.bracket).toBeDefined();
    });

    it('should generate tournament bracket', async () => {
      const response = await request(app)
        .post('/api/tournaments/tournament-1/generate-bracket')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.bracket).toBeDefined();
    });

    it('should submit match result', async () => {
      const matchResult = {
        winnerId: 'player-1',
        loserId: 'player-2',
        player1Score: 9,
        player2Score: 7
      };

      const response = await request(app)
        .post('/api/tournaments/tournament-1/matches/match-1/result')
        .send(matchResult)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Match result submitted');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBe('1.0.0');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent tournament', async () => {
      await request(app)
        .get('/api/tournaments/non-existent')
        .expect(404);
    });

    it('should handle 404 for non-existent routes', async () => {
      await request(app)
        .get('/api/non-existent-route')
        .expect(404);
    });
  });
}); 