import { Test, TestingModule } from '@nestjs/testing';
import { SkillCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SkillsService } from '../skills.service';

describe('SkillsService', () => {
  let service: SkillsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    skillProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    skill: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    skillPointLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    matchAnalysis: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    match: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlayerSkillProfile', () => {
    it('should return player skill profile with all required data', async () => {
      const mockUser = { id: 'user1', username: 'TestPlayer' };
      const mockSkillProfiles = [
        {
          id: 'profile1',
          skillId: 'skill1',
          currentLevel: 5,
          currentPoints: 150,
          totalPoints: 450,
          proficiencyScore: 75.5,
          skill: {
            id: 'skill1',
            name: 'Aiming Accuracy',
            category: SkillCategory.AIMING_ACCURACY,
          },
        },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.skillProfile.findMany
        .mockResolvedValueOnce(mockSkillProfiles)
        .mockResolvedValueOnce(mockSkillProfiles);

      const result = await service.getPlayerSkillProfile('user1');

      expect(result.playerId).toBe('user1');
      expect(result.username).toBe('TestPlayer');
      expect(result.totalSkills).toBe(1);
      expect(result.averageLevel).toBe(5);
      expect(result.totalPoints).toBe(450);
      expect(result.topSkills).toHaveLength(1);
    });

    it('should throw NotFoundException when player not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getPlayerSkillProfile('nonexistent')
      ).rejects.toThrow('Player not found');
    });
  });

  describe('extractSkillsFromInsight', () => {
    it('should extract aiming accuracy skills from pot-related insights', () => {
      const skills = (service as any).extractSkillsFromInsight(
        'Player made an excellent pot shot'
      );

      expect(skills).toContain(SkillCategory.AIMING_ACCURACY);
    });

    it('should extract defensive skills from safety insights', () => {
      const skills = (service as any).extractSkillsFromInsight(
        'Great defensive safety play'
      );

      expect(skills).toContain(SkillCategory.DEFENSIVE_PLAY);
      expect(skills).toContain(SkillCategory.SAFETY_PLAY);
    });

    it('should extract multiple skills from complex insights', () => {
      const skills = (service as any).extractSkillsFromInsight(
        'Excellent positioning and aiming accuracy in that safety shot'
      );

      expect(skills).toContain(SkillCategory.POSITIONING);
      expect(skills).toContain(SkillCategory.AIMING_ACCURACY);
      expect(skills).toContain(SkillCategory.SAFETY_PLAY);
    });

    it('should return consistency skill as default', () => {
      const skills = (service as any).extractSkillsFromInsight(
        'General good performance'
      );

      expect(skills).toContain(SkillCategory.CONSISTENCY);
    });
  });

  describe('calculateSkillPoints', () => {
    it('should calculate skill points with win multiplier', async () => {
      const context = {
        matchId: 'match1',
        playerId: 'user1',
        isWinner: true,
        score: 10,
        opponentScore: 5,
        keyMoments: ['Excellent pot shot', 'Great positioning'],
        strategicInsights: ['Strong offensive strategy'],
        playerPerformance:
          'Outstanding performance with excellent shot selection',
        overallAssessment: 'Dominant performance',
        recommendations: ['Continue aggressive play'],
      };

      const skillPoints = await (service as any).calculateSkillPoints(context);

      expect(skillPoints.length).toBeGreaterThan(0);
      expect(skillPoints[0].points).toBeGreaterThan(10); // Should have win multiplier applied
      expect(skillPoints[0].metadata.matchContext).toContain('won');
    });

    it('should apply perfect performance multiplier', async () => {
      const context = {
        matchId: 'match1',
        playerId: 'user1',
        isWinner: true,
        score: 10,
        opponentScore: 5,
        keyMoments: ['Perfect flawless execution'],
        strategicInsights: [],
        playerPerformance: 'Outstanding performance',
        overallAssessment: 'Perfect game',
        recommendations: [],
      };

      const skillPoints = await (service as any).calculateSkillPoints(context);

      expect(skillPoints.length).toBeGreaterThan(0);
      // Should have perfect multiplier applied (2.0x)
      expect(skillPoints[0].points).toBeGreaterThan(15); // Base * win multiplier * perfect multiplier
    });
  });

  describe('calculateProficiencyScore', () => {
    it('should calculate proficiency score correctly', () => {
      const mockSkill = {
        maxLevel: 100,
        pointsPerLevel: 100,
      };

      const score = (service as any).calculateProficiencyScore(500, mockSkill);

      expect(score).toBe(50); // 500 points / (100 levels * 100 points) * 100 = 50%
    });

    it('should cap proficiency score at 100%', () => {
      const mockSkill = {
        maxLevel: 10,
        pointsPerLevel: 10,
      };

      const score = (service as any).calculateProficiencyScore(200, mockSkill);

      expect(score).toBe(100); // Should be capped at 100%
    });
  });

  describe('calculateLevel', () => {
    it('should calculate level based on total points', () => {
      const mockSkill = {
        maxLevel: 100,
        pointsPerLevel: 100,
      };

      const level = (service as any).calculateLevel(350, mockSkill);

      expect(level).toBe(4); // 350 points / 100 points per level = level 4
    });

    it('should cap level at max level', () => {
      const mockSkill = {
        maxLevel: 10,
        pointsPerLevel: 50,
      };

      const level = (service as any).calculateLevel(600, mockSkill);

      expect(level).toBe(10); // Should be capped at max level
    });
  });

  describe('calculateSkillPointsForMatch', () => {
    it('should calculate and save skill points for a match', async () => {
      const mockMatchAnalysis = {
        matchId: 'match1',
        keyMoments: ['Excellent shot'],
        strategicInsights: ['Good positioning'],
        playerPerformanceA: 'Strong performance',
        playerPerformanceB: 'Decent performance',
        overallAssessment: 'Good match',
        recommendations: ['Keep practicing'],
      };

      const mockMatch = {
        id: 'match1',
        playerAId: 'user1',
        playerBId: 'user2',
        winnerId: 'user1',
        scoreA: 10,
        scoreB: 5,
        playerA: { username: 'PlayerA' },
        playerB: { username: 'PlayerB' },
        venue: { name: 'Test Venue' },
      };

      mockPrismaService.matchAnalysis.findUnique.mockResolvedValue(
        mockMatchAnalysis
      );
      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.skill.findUnique.mockResolvedValue(null);
      mockPrismaService.skill.create.mockResolvedValue({
        id: 'skill1',
        name: 'aiming accuracy',
        category: SkillCategory.AIMING_ACCURACY,
      });
      mockPrismaService.skillProfile.findUnique.mockResolvedValue(null);
      mockPrismaService.skillProfile.create.mockResolvedValue({
        id: 'profile1',
        skillId: 'skill1',
        userId: 'user1',
        currentLevel: 0,
        currentPoints: 0,
        totalPoints: 0,
        proficiencyScore: 0,
        unlockedAt: new Date(),
        lastUpdated: new Date(),
      });
      mockPrismaService.skillProfile.update.mockResolvedValue({
        id: 'profile1',
        skillId: 'skill1',
        userId: 'user1',
        currentLevel: 1,
        currentPoints: 15,
        totalPoints: 15,
        proficiencyScore: 15,
        unlockedAt: new Date(),
        lastUpdated: new Date(),
      });
      mockPrismaService.skillPointLog.create.mockResolvedValue({
        id: 'log1',
        skillProfileId: 'profile1',
        points: 15,
        reason: 'Test reason',
        matchId: 'match1',
        metadata: {},
        createdAt: new Date(),
      });

      const result = await service.calculateSkillPointsForMatch(
        'match1',
        'user1'
      );

      expect(result.playerId).toBe('user1');
      expect(result.matchId).toBe('match1');
      expect(result.skillPoints).toBeDefined();
      expect(result.totalPointsAwarded).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when match analysis not found', async () => {
      mockPrismaService.matchAnalysis.findUnique.mockResolvedValue(null);

      await expect(
        service.calculateSkillPointsForMatch('nonexistent', 'user1')
      ).rejects.toThrow('Match analysis not found');
    });
  });

  describe('getSkillCategoryProgress', () => {
    it('should calculate category progress correctly', async () => {
      const mockSkillProfiles = [
        {
          id: 'profile1',
          skillId: 'skill1',
          currentLevel: 5,
          currentPoints: 150,
          totalPoints: 450,
          proficiencyScore: 75.5,
          skill: {
            id: 'skill1',
            name: 'Aiming Accuracy',
            category: SkillCategory.AIMING_ACCURACY,
          },
        },
        {
          id: 'profile2',
          skillId: 'skill2',
          currentLevel: 3,
          currentPoints: 80,
          totalPoints: 280,
          proficiencyScore: 56.0,
          skill: {
            id: 'skill2',
            name: 'Positioning',
            category: SkillCategory.POSITIONING,
          },
        },
      ];

      mockPrismaService.skillProfile.findMany.mockResolvedValue(
        mockSkillProfiles
      );

      const result = await (service as any).getSkillCategoryProgress('user1');

      const aimingCategory = result.find(
        (cat) => cat.category === SkillCategory.AIMING_ACCURACY
      );
      expect(aimingCategory).toBeDefined();
      expect(aimingCategory!.totalSkills).toBe(1);
      expect(aimingCategory!.averageLevel).toBe(5);
      expect(aimingCategory!.totalPoints).toBe(450);
    });
  });
});
