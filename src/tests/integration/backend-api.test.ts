import request from 'supertest';
import { app } from '../../backend/index';
import { challenges, matchResults } from '../../services/challengeStorage';

describe('Backend API Integration Tests', () => {
  beforeEach(() => {
    challenges.clear();
    matchResults.clear();
  });

  describe('Territory API', () => {
    it('should get all territories', async () => {
      const response = await request(app).get('/api/territories').expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get territory by ID', async () => {
      const response = await request(app)
        .get('/api/territories/territory-1')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe('territory-1');
    });

    it('should create territory challenge', async () => {
      const challengeData = {
        territoryId: 'territory-1',
        challengerId: 'user-1',
        defenderId: 'user-2',
        challengeType: 'standard',
      };

      const response = await request(app)
        .post('/api/challenges')
        .send(challengeData)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.territoryId).toBe('territory-1');
      expect(response.body.challengerId).toBe('user-1');
      expect(response.body.status).toBe('pending');
    });

    it('should create, accept, and decline a challenge (full flow)', async () => {
      // Create a challenge
      const challengeData = {
        territoryId: 'territory-1',
        challengerId: 'user-1',
        defenderId: 'user-2',
        challengeType: 'standard',
      };

      const createResponse = await request(app)
        .post('/api/challenges')
        .send(challengeData)
        .expect(201);
      expect(createResponse.body).toBeDefined();
      expect(createResponse.body.territoryId).toBe('territory-1');
      expect(createResponse.body.challengerId).toBe('user-1');
      expect(createResponse.body.status).toBe('pending');

      const challengeId = createResponse.body.id;

      // Accept the challenge
      const acceptResponse = await request(app)
        .put(`/api/challenges/${challengeId}/accept-challenge`)
        .send({ defenderId: 'user-2' })
        .expect(200);
      expect(acceptResponse.body.success).toBe(true);
      expect(acceptResponse.body.challenge.status).toBe('accepted');

      // Decline a new challenge (create another one with a different territory)
      const declineChallengeData = {
        territoryId: 'territory-2',
        challengerId: 'user-1',
        defenderId: 'user-2',
        challengeType: 'standard',
      };
      const declineCreateResponse = await request(app)
        .post('/api/challenges')
        .send(declineChallengeData)
        .expect(201);
      const declineChallengeId = declineCreateResponse.body.id;

      const declineResponse = await request(app)
        .put(`/api/challenges/${declineChallengeId}/decline-challenge`)
        .send({ defenderId: 'user-2' })
        .expect(200);
      expect(declineResponse.body.success).toBe(true);
      expect(declineResponse.body.challenge.status).toBe('declined');
    });

    it('should respond to GET /api/challenges/test-alive', async () => {
      const response = await request(app)
        .get('/api/challenges/test-alive')
        .expect(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.method).toBe('GET');
    });

    it('should respond to PUT /api/challenges/test-alive', async () => {
      const response = await request(app)
        .put('/api/challenges/test-alive')
        .send({ test: true })
        .expect(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.method).toBe('PUT');
    });

    it('should respond to PUT /api/challenges/123/test', async () => {
      const response = await request(app)
        .put('/api/challenges/123/test')
        .send({ test: true })
        .expect(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.method).toBe('PUT');
      expect(response.body.challengeId).toBe('123');
    });

    it('should respond to PUT /api/challenges/123/accept-minimal', async () => {
      const response = await request(app)
        .put('/api/challenges/123/accept-minimal')
        .send({ test: true })
        .expect(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.method).toBe('PUT');
      expect(response.body.challengeId).toBe('123');
      expect(response.body.action).toBe('accept-minimal');
    });
  });

  describe('Economy API', () => {
    it('should get user balance', async () => {
      const response = await request(app)
        .get('/api/economy/balance/user-1')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.userId).toBe('user-1');
      expect(response.body.balance).toBeGreaterThanOrEqual(0);
    });

    it('should get user transactions', async () => {
      const response = await request(app)
        .get('/api/economy/transactions/user-1')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should transfer coins', async () => {
      const transferData = {
        fromUserId: 'user-1',
        toUserId: 'user-2',
        amount: '100',
        description: 'Test transfer',
      };

      const response = await request(app)
        .post('/api/economy/transfer')
        .send(transferData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transactionHash).toBeDefined();
    });

    it('should get leaderboard', async () => {
      const response = await request(app)
        .get('/api/economy/leaderboard')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Blockchain API', () => {
    it('should get Dojo Coin balance', async () => {
      const response = await request(app)
        .get('/api/blockchain/balance/user-1/ethereum')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.userId).toBe('user-1');
      expect(response.body.network).toBe('ethereum');
      expect(response.body.balance).toBeDefined();
    });

    it('should initiate cross-chain transfer', async () => {
      const transferData = {
        fromUserId: 'user-1',
        toUserId: 'user-2',
        amount: '100',
        fromNetwork: 'ethereum',
        toNetwork: 'polygon',
      };

      const response = await request(app)
        .post('/api/blockchain/transfer/cross-chain')
        .send(transferData)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.status).toBe('pending');
    });

    it('should get transfer status', async () => {
      const response = await request(app)
        .get('/api/blockchain/transfer/transfer-123')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe('transfer-123');
    });

    it('should mint NFT', async () => {
      const mintData = {
        to: 'user-1',
        tokenId: 'trophy-123',
        metadata: {
          name: 'Test Trophy',
          description: 'A test trophy',
          image: 'https://example.com/image.png',
        },
        network: 'ethereum',
      };

      const response = await request(app)
        .post('/api/blockchain/nft/mint')
        .send(mintData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transactionHash).toBeDefined();
    });

    it('should get blockchain analytics', async () => {
      const response = await request(app)
        .get('/api/blockchain/analytics')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.totalTransactions).toBeGreaterThanOrEqual(0);
      expect(response.body.totalVolume).toBeDefined();
      expect(response.body.activeUsers).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Social API', () => {
    it('should add friend', async () => {
      const response = await request(app)
        .post('/api/social/friends/add')
        .send({
          userId: 'user-1',
          friendId: 'user-2',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should get friends list', async () => {
      const response = await request(app)
        .get('/api/social/friends/user-1')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should send message', async () => {
      const messageData = {
        fromUserId: 'user-1',
        toUserId: 'user-2',
        content: 'Hello!',
      };

      const response = await request(app)
        .post('/api/social/messages/send')
        .send(messageData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.messageId).toBeDefined();
    });

    it('should get conversation', async () => {
      const response = await request(app)
        .get('/api/social/messages/conversation/user-1/user-2')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should create activity post', async () => {
      const postData = {
        userId: 'user-1',
        type: 'match_win',
        content: 'Won a match!',
        metadata: { opponent: 'user-2', score: '5-3' },
      };

      const response = await request(app)
        .post('/api/social/activity/create')
        .send(postData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.postId).toBeDefined();
    });

    it('should get user activity feed', async () => {
      const response = await request(app)
        .get('/api/social/activity/feed/user-1')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Clan API', () => {
    it('should create clan', async () => {
      const clanData = {
        leaderId: 'user-1',
        name: 'Test Clan',
        description: 'A test clan',
        tag: 'TEST',
        color: '#FF0000',
      };

      const response = await request(app)
        .post('/api/clans/create')
        .send(clanData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.clanId).toBeDefined();
    });

    it('should get clan by ID', async () => {
      const response = await request(app).get('/api/clans/clan-1').expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe('clan-1');
    });

    it('should invite member to clan', async () => {
      const response = await request(app)
        .post('/api/clans/clan-1/invite')
        .send({
          leaderId: 'user-1',
          userId: 'user-2',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.inviteId).toBeDefined();
    });

    it('should get clan members', async () => {
      const response = await request(app)
        .get('/api/clans/clan-1/members')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should declare war', async () => {
      const response = await request(app)
        .post('/api/clans/clan-1/war/declare')
        .send({
          leaderId: 'user-1',
          targetClanId: 'clan-2',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.warId).toBeDefined();
    });
  });

  describe('Venue API', () => {
    it('should get venue analytics', async () => {
      const response = await request(app)
        .get('/api/venue/venue-1/analytics')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          period: 'daily',
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.venueId).toBe('venue-1');
      expect(response.body.visitorCount).toBeGreaterThanOrEqual(0);
    });

    it('should get venue status', async () => {
      const response = await request(app)
        .get('/api/venue/venue-1/status')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.venueId).toBe('venue-1');
      expect(response.body.isOpen).toBeDefined();
    });

    it('should create tournament', async () => {
      const tournamentData = {
        name: 'Spring Championship',
        description: 'Annual spring tournament',
        startDate: '2025-03-01',
        endDate: '2025-03-15',
        entryFee: 50,
        maxParticipants: 32,
        format: 'single_elimination',
      };

      const response = await request(app)
        .post('/api/venue/venue-1/tournaments')
        .send(tournamentData)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.tournamentId).toBeDefined();
      expect(response.body.name).toBe('Spring Championship');
    });

    it('should get venue tournaments', async () => {
      const response = await request(app)
        .get('/api/venue/venue-1/tournaments')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get performance metrics', async () => {
      const response = await request(app)
        .get('/api/venue/venue-1/metrics')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.tableUtilization).toBeGreaterThanOrEqual(0);
      expect(response.body.averageSessionDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AI Commentary API', () => {
    it('should generate commentary for match event', async () => {
      const eventData = {
        type: 'shot_made',
        matchId: 'match-123',
        playerId: 'user-1',
        data: {
          shotType: 'bank_shot',
          difficulty: 'medium',
          score: '3-2',
        },
      };

      const response = await request(app)
        .post('/api/ai/commentary/generate')
        .send(eventData)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.commentary).toBeDefined();
      expect(response.body.audioUrl).toBeDefined();
    });

    it('should get commentary history', async () => {
      const response = await request(app)
        .get('/api/ai/commentary/history/match-123')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      await request(app).get('/api/non-existent-route').expect(404);
    });

    it('should handle invalid request data', async () => {
      await request(app)
        .post('/api/challenges')
        .send({}) // Missing required fields
        .expect(400);
    });

    it('should handle unauthorized access', async () => {
      await request(app)
        .get('/api/admin/users') // Assuming this requires admin access
        .expect(401);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health').expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Tournament API', () => {
    it('should get all tournaments', async () => {
      const response = await request(app).get('/api/tournaments').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.tournaments)).toBe(true);
    });

    it('should create a new tournament', async () => {
      const tournamentData = {
        name: 'Test Tournament',
        format: 'single_elimination',
        venueId: 'venue-1',
        startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        endDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
        maxParticipants: 16,
        entryFee: 100,
        prizePool: 1000,
      };

      const response = await request(app)
        .post('/api/tournaments')
        .send(tournamentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.tournament.name).toBe('Test Tournament');
      expect(response.body.tournament.format).toBe('single_elimination');
    });

    it('should get tournament by ID', async () => {
      // First create a tournament
      const createResponse = await request(app)
        .post('/api/tournaments')
        .send({
          name: 'Test Tournament',
          format: 'single_elimination',
          venueId: 'venue-1',
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 172800000).toISOString(),
          maxParticipants: 16,
          entryFee: 100,
          prizePool: 1000,
        });

      const tournamentId = createResponse.body.tournament.id;

      const response = await request(app)
        .get(`/api/tournaments/${tournamentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tournament.id).toBe(tournamentId);
    });

    it('should register for tournament', async () => {
      // First create a tournament
      const createResponse = await request(app)
        .post('/api/tournaments')
        .send({
          name: 'Test Tournament',
          format: 'single_elimination',
          venueId: 'venue-1',
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 172800000).toISOString(),
          maxParticipants: 16,
          entryFee: 100,
          prizePool: 1000,
        });

      const tournamentId = createResponse.body.tournament.id;

      const response = await request(app)
        .post(`/api/tournaments/${tournamentId}/register`)
        .send({ participantId: 'user-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
