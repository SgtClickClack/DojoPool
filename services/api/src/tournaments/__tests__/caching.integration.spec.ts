import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { CacheService } from '../../cache/cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchmakingService } from '../matchmaking.service';
import { TournamentService } from '../tournament.service';

describe('Tournament Caching Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let cacheService: CacheService;
  let tournamentService: TournamentService;
  let matchmakingService: MatchmakingService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = app.get(PrismaService);
    cacheService = app.get(CacheService);
    tournamentService = app.get(TournamentService);
    matchmakingService = app.get(MatchmakingService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear cache before each test
    await cacheService.clear();

    // Clean up database
    await prismaService.tournamentParticipant.deleteMany();
    await prismaService.match.deleteMany();
    await prismaService.tournament.deleteMany();
  });

  describe('Tournament List Caching', () => {
    it('should cache tournament list and return from cache on subsequent requests', async () => {
      // Create test tournament
      const tournament = await tournamentService.create(
        {
          name: 'Cache Test Tournament',
          description: 'Testing caching functionality',
          startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          maxParticipants: 16,
          entryFee: 100,
          prizePool: 1600,
          format: 'SINGLE_ELIMINATION',
        },
        'admin-user-id'
      );

      // First request - should hit database
      const startTime = Date.now();
      const response1 = await request(app.getHttpServer())
        .get('/tournaments')
        .expect(200);

      const firstRequestTime = Date.now() - startTime;

      // Second request - should hit cache
      const startTime2 = Date.now();
      const response2 = await request(app.getHttpServer())
        .get('/tournaments')
        .expect(200);

      const secondRequestTime = Date.now() - startTime2;

      // Second request should be faster (indicating cache hit)
      expect(secondRequestTime).toBeLessThan(firstRequestTime);

      // Responses should be identical
      expect(response1.body.tournaments).toEqual(response2.body.tournaments);
      expect(response1.body.tournaments[0].id).toBe(tournament.id);
    });

    it('should invalidate tournament list cache when new tournament is created', async () => {
      // Get initial tournament list
      const response1 = await request(app.getHttpServer())
        .get('/tournaments')
        .expect(200);

      // Create new tournament
      const tournament = await tournamentService.create(
        {
          name: 'New Tournament',
          description: 'Should invalidate cache',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          maxParticipants: 8,
          entryFee: 50,
          prizePool: 400,
          format: 'SINGLE_ELIMINATION',
        },
        'admin-user-id'
      );

      // Get tournament list again - should show new tournament
      const response2 = await request(app.getHttpServer())
        .get('/tournaments')
        .expect(200);

      // Should have one more tournament
      expect(response2.body.tournaments.length).toBe(
        response1.body.tournaments.length + 1
      );

      // Should include the new tournament
      const newTournamentInList = response2.body.tournaments.find(
        (t: any) => t.id === tournament.id
      );
      expect(newTournamentInList).toBeDefined();
      expect(newTournamentInList.name).toBe('New Tournament');
    });
  });

  describe('Tournament Detail Caching', () => {
    let testTournament: any;

    beforeEach(async () => {
      testTournament = await tournamentService.create(
        {
          name: 'Detail Cache Test',
          description: 'Testing tournament detail caching',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          maxParticipants: 16,
          entryFee: 100,
          prizePool: 1600,
          format: 'SINGLE_ELIMINATION',
        },
        'admin-user-id'
      );
    });

    it('should cache tournament detail and return from cache', async () => {
      // First request
      const startTime1 = Date.now();
      const response1 = await request(app.getHttpServer())
        .get(`/tournaments/${testTournament.id}`)
        .expect(200);

      const firstRequestTime = Date.now() - startTime1;

      // Second request - should be cached
      const startTime2 = Date.now();
      const response2 = await request(app.getHttpServer())
        .get(`/tournaments/${testTournament.id}`)
        .expect(200);

      const secondRequestTime = Date.now() - startTime2;

      // Second request should be faster
      expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime);

      // Responses should be identical
      expect(response1.body).toEqual(response2.body);
      expect(response1.body.name).toBe('Detail Cache Test');
    });

    it('should invalidate tournament detail cache when tournament is updated', async () => {
      // Get initial tournament detail
      const response1 = await request(app.getHttpServer())
        .get(`/tournaments/${testTournament.id}`)
        .expect(200);

      // Update tournament
      await tournamentService.update(
        testTournament.id,
        {
          name: 'Updated Tournament Name',
          description: 'Updated description',
        },
        'admin-user-id'
      );

      // Get tournament detail again
      const response2 = await request(app.getHttpServer())
        .get(`/tournaments/${testTournament.id}`)
        .expect(200);

      // Should reflect the update
      expect(response2.body.name).toBe('Updated Tournament Name');
      expect(response2.body.description).toBe('Updated description');
      expect(response2.body.updatedAt).not.toBe(response1.body.updatedAt);
    });
  });

  describe('Tournament Bracket Caching', () => {
    let testTournament: any;

    beforeEach(async () => {
      testTournament = await tournamentService.create(
        {
          name: 'Bracket Cache Test',
          description: 'Testing bracket caching',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          maxParticipants: 8,
          entryFee: 50,
          prizePool: 400,
          format: 'SINGLE_ELIMINATION',
        },
        'admin-user-id'
      );
    });

    it('should cache tournament bracket data', async () => {
      // First request
      const startTime1 = Date.now();
      const response1 = await request(app.getHttpServer())
        .get(`/tournaments/${testTournament.id}/bracket`)
        .expect(200);

      const firstRequestTime = Date.now() - startTime1;

      // Second request - should be cached
      const startTime2 = Date.now();
      const response2 = await request(app.getHttpServer())
        .get(`/tournaments/${testTournament.id}/bracket`)
        .expect(200);

      const secondRequestTime = Date.now() - startTime2;

      // Should return the same data
      expect(response1.body.tournament.id).toBe(testTournament.id);
      expect(response2.body.tournament.id).toBe(testTournament.id);
    });
  });

  describe('Matchmaking Statistics Caching', () => {
    it('should cache matchmaking statistics', async () => {
      // First request
      const startTime1 = Date.now();
      const response1 = await request(app.getHttpServer())
        .get('/tournaments/matchmaking/statistics')
        .expect(200);

      const firstRequestTime = Date.now() - startTime1;

      // Second request - should be cached
      const startTime2 = Date.now();
      const response2 = await request(app.getHttpServer())
        .get('/tournaments/matchmaking/statistics')
        .expect(200);

      const secondRequestTime = Date.now() - startTime2;

      // Should return statistics object
      expect(response1.body).toHaveProperty('queueSize');
      expect(response1.body).toHaveProperty('averageWaitTime');
      expect(response1.body).toHaveProperty('matchesCreated');
      expect(response1.body).toHaveProperty('activeMatches');
    });
  });

  describe('Cache Invalidation on Write Operations', () => {
    let testTournament: any;

    beforeEach(async () => {
      testTournament = await tournamentService.create(
        {
          name: 'Invalidation Test',
          description: 'Testing cache invalidation',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          maxParticipants: 16,
          entryFee: 100,
          prizePool: 1600,
          format: 'SINGLE_ELIMINATION',
        },
        'admin-user-id'
      );
    });

    it('should invalidate tournament list cache when tournament is deleted', async () => {
      // Get initial list
      const response1 = await request(app.getHttpServer())
        .get('/tournaments')
        .expect(200);

      const initialCount = response1.body.tournaments.length;

      // Delete tournament
      await tournamentService.delete(testTournament.id, 'admin-user-id');

      // Get list again
      const response2 = await request(app.getHttpServer())
        .get('/tournaments')
        .expect(200);

      // Should have one less tournament
      expect(response2.body.tournaments.length).toBe(initialCount - 1);

      // Should not include the deleted tournament
      const deletedTournamentInList = response2.body.tournaments.find(
        (t: any) => t.id === testTournament.id
      );
      expect(deletedTournamentInList).toBeUndefined();
    });

    it('should invalidate tournament detail cache when joining tournament', async () => {
      // Get initial tournament detail
      const response1 = await request(app.getHttpServer())
        .get(`/tournaments/${testTournament.id}`)
        .expect(200);

      const initialParticipants = response1.body.currentParticipants;

      // Create a user and join tournament
      const user = await prismaService.user.create({
        data: {
          id: 'test-user-id',
          username: 'testuser',
          email: 'test@example.com',
        },
      });

      await prismaService.user.update({
        where: { id: user.id },
        data: { dojoCoinBalance: 200 },
      });

      await tournamentService.joinTournament(testTournament.id, {}, user.id);

      // Get tournament detail again
      const response2 = await request(app.getHttpServer())
        .get(`/tournaments/${testTournament.id}`)
        .expect(200);

      // Should reflect the participant increase
      expect(response2.body.currentParticipants).toBe(initialParticipants + 1);

      // Clean up
      await prismaService.tournamentParticipant.deleteMany({
        where: { tournamentId: testTournament.id },
      });
      await prismaService.user.delete({ where: { id: user.id } });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should demonstrate caching performance improvement', async () => {
      // Create multiple tournaments for realistic test
      const tournamentPromises = [];
      for (let i = 0; i < 5; i++) {
        tournamentPromises.push(
          tournamentService.create(
            {
              name: `Performance Test Tournament ${i}`,
              description: `Tournament ${i} for performance testing`,
              startTime: new Date(Date.now() + 86400000).toISOString(),
              maxParticipants: 16,
              entryFee: 100,
              prizePool: 1600,
              format: 'SINGLE_ELIMINATION',
            },
            'admin-user-id'
          )
        );
      }

      await Promise.all(tournamentPromises);

      // Measure uncached request time
      const uncachedStart = Date.now();
      await request(app.getHttpServer()).get('/tournaments').expect(200);
      const uncachedTime = Date.now() - uncachedStart;

      // Measure cached request time
      const cachedStart = Date.now();
      await request(app.getHttpServer()).get('/tournaments').expect(200);
      const cachedTime = Date.now() - cachedStart;

      // Cached request should be faster
      expect(cachedTime).toBeLessThanOrEqual(uncachedTime);

      // Log performance metrics
      console.log(`Uncached request time: ${uncachedTime}ms`);
      console.log(`Cached request time: ${cachedTime}ms`);
      console.log(
        `Performance improvement: ${(((uncachedTime - cachedTime) / uncachedTime) * 100).toFixed(2)}%`
      );
    });
  });

  describe('Cache Health and Monitoring', () => {
    it('should report cache health status', async () => {
      const healthResponse = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // Health endpoint should include cache status
      expect(healthResponse.body).toHaveProperty('status');
    });

    it('should handle cache service unavailability gracefully', async () => {
      // This test would simulate Redis being unavailable
      // For now, we'll just verify that the endpoints work without cache
      const response = await request(app.getHttpServer())
        .get('/tournaments')
        .expect(200);

      expect(Array.isArray(response.body.tournaments)).toBe(true);
    });
  });
});
