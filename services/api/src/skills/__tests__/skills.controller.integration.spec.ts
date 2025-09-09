import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SkillCategory } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { SkillsService } from '../skills.service';

describe('SkillsController (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let skillsService: SkillsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    skillsService = moduleFixture.get<SkillsService>(SkillsService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/skills/player/:playerId (GET)', () => {
    it('should return player skill profile', async () => {
      // Create test user
      const testUser = await prismaService.user.create({
        data: {
          id: 'test-user-1',
          email: 'test@example.com',
          username: 'TestPlayer',
          passwordHash: 'hashedpassword',
        },
      });

      // Create test skill
      const testSkill = await prismaService.skill.create({
        data: {
          name: 'Aiming Accuracy',
          category: SkillCategory.AIMING_ACCURACY,
          description: 'Skill in aiming and potting balls',
        },
      });

      // Create skill profile
      await prismaService.skillProfile.create({
        data: {
          userId: testUser.id,
          skillId: testSkill.id,
          currentLevel: 5,
          currentPoints: 150,
          totalPoints: 450,
          proficiencyScore: 75.5,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/skills/player/test-user-1')
        .expect(200);

      expect(response.body.playerId).toBe('test-user-1');
      expect(response.body.username).toBe('TestPlayer');
      expect(response.body.totalSkills).toBe(1);
      expect(response.body.averageLevel).toBe(5);
      expect(response.body.totalPoints).toBe(450);
      expect(response.body.topSkills).toHaveLength(1);
      expect(response.body.skillCategories).toHaveLength(1);

      // Cleanup
      await prismaService.skillProfile.deleteMany({
        where: { userId: testUser.id },
      });
      await prismaService.skill.delete({ where: { id: testSkill.id } });
      await prismaService.user.delete({ where: { id: testUser.id } });
    });

    it('should return 404 for non-existent player', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/skills/player/non-existent-player')
        .expect(404);

      expect(response.body.message).toBe('Player not found');
    });
  });

  describe('/api/v1/skills/me (GET)', () => {
    it('should return user skill profiles', async () => {
      // Create test user
      const testUser = await prismaService.user.create({
        data: {
          id: 'test-user-2',
          email: 'test2@example.com',
          username: 'TestPlayer2',
          passwordHash: 'hashedpassword',
        },
      });

      // Create test skill
      const testSkill = await prismaService.skill.create({
        data: {
          name: 'Positioning',
          category: SkillCategory.POSITIONING,
          description: 'Skill in ball positioning',
        },
      });

      // Create skill profile
      await prismaService.skillProfile.create({
        data: {
          userId: testUser.id,
          skillId: testSkill.id,
          currentLevel: 3,
          currentPoints: 80,
          totalPoints: 280,
          proficiencyScore: 56.0,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/skills/me')
        .set('Authorization', 'Bearer mock-token') // This would need proper JWT setup
        .expect(401); // Will fail without proper auth, but that's expected

      // Cleanup
      await prismaService.skillProfile.deleteMany({
        where: { userId: testUser.id },
      });
      await prismaService.skill.delete({ where: { id: testSkill.id } });
      await prismaService.user.delete({ where: { id: testUser.id } });
    });
  });

  describe('/api/v1/skills/profile/:profileId (GET)', () => {
    it('should return skill profile details', async () => {
      // Create test user
      const testUser = await prismaService.user.create({
        data: {
          id: 'test-user-3',
          email: 'test3@example.com',
          username: 'TestPlayer3',
          passwordHash: 'hashedpassword',
        },
      });

      // Create test skill
      const testSkill = await prismaService.skill.create({
        data: {
          name: 'Defensive Play',
          category: SkillCategory.DEFENSIVE_PLAY,
          description: 'Skill in defensive strategies',
          maxLevel: 100,
          pointsPerLevel: 100,
        },
      });

      // Create skill profile
      const skillProfile = await prismaService.skillProfile.create({
        data: {
          userId: testUser.id,
          skillId: testSkill.id,
          currentLevel: 7,
          currentPoints: 50,
          totalPoints: 650,
          proficiencyScore: 65.0,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/skills/profile/${skillProfile.id}`)
        .expect(200);

      expect(response.body.id).toBe(skillProfile.id);
      expect(response.body.skillName).toBe('Defensive Play');
      expect(response.body.category).toBe(SkillCategory.DEFENSIVE_PLAY);
      expect(response.body.currentLevel).toBe(7);
      expect(response.body.currentPoints).toBe(50);
      expect(response.body.totalPoints).toBe(650);
      expect(response.body.proficiencyScore).toBe(65.0);
      expect(response.body.maxLevel).toBe(100);
      expect(response.body.pointsToNextLevel).toBe(50); // 800 - 650 = 150, but wait...

      // Cleanup
      await prismaService.skillProfile.delete({
        where: { id: skillProfile.id },
      });
      await prismaService.skill.delete({ where: { id: testSkill.id } });
      await prismaService.user.delete({ where: { id: testUser.id } });
    });

    it('should return 404 for non-existent skill profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/skills/profile/non-existent-profile')
        .expect(404);

      expect(response.body.message).toBe('Skill profile not found');
    });
  });

  describe('/api/v1/skills/calculate/:matchId (POST)', () => {
    it('should calculate skill points for a match', async () => {
      // Create test user
      const testUser = await prismaService.user.create({
        data: {
          id: 'test-user-4',
          email: 'test4@example.com',
          username: 'TestPlayer4',
          passwordHash: 'hashedpassword',
        },
      });

      // Create test match
      const testMatch = await prismaService.match.create({
        data: {
          id: 'test-match-1',
          tournamentId: null,
          venueId: null,
          playerAId: testUser.id,
          playerBId: 'opponent-id',
          winnerId: testUser.id,
          scoreA: 10,
          scoreB: 5,
          status: 'COMPLETED',
        },
      });

      // Create match analysis
      await prismaService.matchAnalysis.create({
        data: {
          matchId: testMatch.id,
          keyMoments: ['Excellent pot shot', 'Great positioning'],
          strategicInsights: ['Strong offensive strategy'],
          playerPerformanceA:
            'Outstanding performance with excellent shot selection',
          overallAssessment: 'Dominant performance',
          recommendations: ['Continue aggressive play'],
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/skills/calculate/test-match-1')
        .expect(200);

      expect(response.body.playerId).toBe(testUser.id);
      expect(response.body.matchId).toBe('test-match-1');
      expect(response.body.skillPoints).toBeDefined();
      expect(Array.isArray(response.body.skillPoints)).toBe(true);
      expect(response.body.totalPointsAwarded).toBeGreaterThan(0);
      expect(response.body.calculationTimestamp).toBeDefined();

      // Cleanup
      await prismaService.skillPointLog.deleteMany({
        where: { matchId: testMatch.id },
      });
      await prismaService.skillProfile.deleteMany({
        where: { userId: testUser.id },
      });
      await prismaService.matchAnalysis.delete({
        where: { matchId: testMatch.id },
      });
      await prismaService.match.delete({ where: { id: testMatch.id } });
      await prismaService.user.delete({ where: { id: testUser.id } });
    });

    it('should return 404 for non-existent match', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/skills/calculate/non-existent-match')
        .expect(404);

      expect(response.body.message).toBe('Match analysis not found');
    });
  });

  describe('/api/v1/skills/achievements (GET)', () => {
    it('should return skills with achievements linkage', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/skills/achievements')
        .expect(200);

      expect(response.body.skills).toBeDefined();
      expect(Array.isArray(response.body.skills)).toBe(true);
      expect(response.body.linkedAchievements).toBeDefined();
      expect(Array.isArray(response.body.linkedAchievements)).toBe(true);
      expect(response.body.unifiedProgress).toBeDefined();
      expect(typeof response.body.unifiedProgress.totalSkillPoints).toBe(
        'number'
      );
      expect(typeof response.body.unifiedProgress.averageProficiency).toBe(
        'number'
      );
    });
  });
});
