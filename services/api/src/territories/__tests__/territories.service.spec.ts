import { Test, TestingModule } from '@nestjs/testing';
import { NotificationTemplatesService } from '../../notifications/notification-templates.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TerritoriesService } from '../territories.service';

describe('TerritoriesService', () => {
  let service: TerritoriesService;
  let prismaService: PrismaService;
  let notificationsService: NotificationsService;
  let notificationTemplatesService: NotificationTemplatesService;

  const mockPrismaService = {
    territory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    territoryEvent: {
      create: jest.fn(),
    },
    venue: {
      update: jest.fn(),
    },
    clanMember: {
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockNotificationsService = {
    createNotification: jest.fn(),
  };

  const mockNotificationTemplatesService = {
    getTerritoryChangedTemplate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TerritoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: NotificationTemplatesService,
          useValue: mockNotificationTemplatesService,
        },
      ],
    }).compile();

    service = module.get<TerritoriesService>(TerritoriesService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
    notificationTemplatesService = module.get<NotificationTemplatesService>(
      NotificationTemplatesService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('claimTerritory', () => {
    it('should successfully claim an unclaimed territory', async () => {
      const territoryId = 'territory-1';
      const playerId = 'player-1';
      const mockTerritory = {
        id: territoryId,
        ownerId: null,
        venueId: 'venue-1',
        venue: { id: 'venue-1', name: 'Test Venue' },
      };
      const mockUpdatedTerritory = {
        ...mockTerritory,
        ownerId: playerId,
        status: 'CLAIMED',
        lastOwnershipChange: new Date(),
        owner: { id: playerId, username: 'TestPlayer' },
      };

      mockPrismaService.territory.findUnique.mockResolvedValue(mockTerritory);
      mockPrismaService.territory.update.mockResolvedValue(
        mockUpdatedTerritory
      );
      mockPrismaService.territoryEvent.create.mockResolvedValue({
        id: 'event-1',
      });
      mockPrismaService.clanMember.findFirst.mockResolvedValue(null); // No clan membership

      const result = await service.claimTerritory(territoryId, playerId);

      expect(result.success).toBe(true);
      expect(result.territory.ownerId).toBe(playerId);
      expect(result.territory.status).toBe('CLAIMED');
      expect(mockPrismaService.territory.update).toHaveBeenCalledWith({
        where: { id: territoryId },
        data: {
          ownerId: playerId,
          status: 'CLAIMED',
          lastOwnershipChange: expect.any(Date),
          contestedById: null,
          contestDeadline: null,
        },
        include: expect.any(Object),
      });
    });

    it('should throw error when trying to claim already claimed territory', async () => {
      const territoryId = 'territory-1';
      const playerId = 'player-1';
      const mockTerritory = {
        id: territoryId,
        ownerId: 'existing-owner',
        venueId: 'venue-1',
      };

      mockPrismaService.territory.findUnique.mockResolvedValue(mockTerritory);

      await expect(
        service.claimTerritory(territoryId, playerId)
      ).rejects.toThrow('Territory is already claimed');
    });

    it('should throw error when territory does not exist', async () => {
      const territoryId = 'non-existent';
      const playerId = 'player-1';

      mockPrismaService.territory.findUnique.mockResolvedValue(null);

      await expect(
        service.claimTerritory(territoryId, playerId)
      ).rejects.toThrow('Territory not found');
    });
  });

  describe('challengeTerritory', () => {
    it('should successfully challenge a claimed territory', async () => {
      const territoryId = 'territory-1';
      const challengerId = 'challenger-1';
      const defenderId = 'defender-1';
      const mockTerritory = {
        id: territoryId,
        ownerId: defenderId,
        venueId: 'venue-1',
        venue: { id: 'venue-1', name: 'Test Venue' },
        owner: { id: defenderId, username: 'Defender' },
      };

      mockPrismaService.territory.findUnique.mockResolvedValue(mockTerritory);
      mockPrismaService.territory.update.mockResolvedValue({
        ...mockTerritory,
        status: 'CONTESTED',
        contestedById: challengerId,
        contestDeadline: expect.any(Date),
      });
      mockPrismaService.territoryEvent.create.mockResolvedValue({
        id: 'event-1',
      });
      mockPrismaService.clanMember.findFirst.mockResolvedValue(null);

      const result = await service.challengeTerritory(
        territoryId,
        challengerId
      );

      expect(result.success).toBe(true);
      expect(result.challengeId).toBe('event-1');
      expect(result.defenderId).toBe(defenderId);
      expect(mockPrismaService.territory.update).toHaveBeenCalledWith({
        where: { id: territoryId },
        data: {
          status: 'CONTESTED',
          contestedById: challengerId,
          contestDeadline: expect.any(Date),
        },
      });
    });

    it('should throw error when trying to challenge own territory', async () => {
      const territoryId = 'territory-1';
      const playerId = 'player-1';
      const mockTerritory = {
        id: territoryId,
        ownerId: playerId, // Same as challenger
        venueId: 'venue-1',
      };

      mockPrismaService.territory.findUnique.mockResolvedValue(mockTerritory);

      await expect(
        service.challengeTerritory(territoryId, playerId)
      ).rejects.toThrow('Cannot challenge your own territory');
    });

    it('should throw error when trying to challenge unclaimed territory', async () => {
      const territoryId = 'territory-1';
      const playerId = 'player-1';
      const mockTerritory = {
        id: territoryId,
        ownerId: null, // Unclaimed
        venueId: 'venue-1',
      };

      mockPrismaService.territory.findUnique.mockResolvedValue(mockTerritory);

      await expect(
        service.challengeTerritory(territoryId, playerId)
      ).rejects.toThrow('Territory is not claimed - use claim instead');
    });
  });

  describe('processTerritoryDecay', () => {
    it("should decay territories that haven't been active for 60+ days", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 70); // 70 days ago

      const mockTerritories = [
        {
          id: 'territory-1',
          ownerId: 'owner-1',
          lastOwnershipChange: oldDate,
          defenseScore: 5,
          status: 'CLAIMED',
          owner: { id: 'owner-1', username: 'OldOwner' },
          venue: { id: 'venue-1', name: 'Old Venue' },
        },
      ];

      mockPrismaService.territory.findMany.mockResolvedValue(mockTerritories);
      mockPrismaService.territory.update.mockResolvedValue({
        id: 'territory-1',
        status: 'UNCLAIMED',
        ownerId: null,
        clanId: null,
        defenseScore: 0,
      });
      mockPrismaService.territoryEvent.create.mockResolvedValue({
        id: 'decay-event',
      });

      const result = await service.processTerritoryDecay();

      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
      expect(result.results[0].action).toBe('DECAYED');
      expect(mockPrismaService.territory.update).toHaveBeenCalledWith({
        where: { id: 'territory-1' },
        data: {
          status: 'UNCLAIMED',
          ownerId: null,
          clanId: null,
          defenseScore: 0,
          contestedById: null,
          contestDeadline: null,
        },
      });
    });

    it('should reduce defense score for territories inactive for 30-45 days', async () => {
      const mediumOldDate = new Date();
      mediumOldDate.setDate(mediumOldDate.getDate() - 35); // 35 days ago

      const mockTerritories = [
        {
          id: 'territory-1',
          ownerId: 'owner-1',
          lastOwnershipChange: mediumOldDate,
          defenseScore: 5,
          status: 'CLAIMED',
          owner: { id: 'owner-1', username: 'MediumOwner' },
          venue: { id: 'venue-1', name: 'Medium Venue' },
        },
      ];

      mockPrismaService.territory.findMany.mockResolvedValue(mockTerritories);
      mockPrismaService.territory.update.mockResolvedValue({
        id: 'territory-1',
        defenseScore: 4,
      });

      const result = await service.processTerritoryDecay();

      expect(result.success).toBe(true);
      expect(result.results[0].action).toBe('DECAYED_DEFENSE');
      expect(result.results[0].newDefenseScore).toBe(4);
      expect(mockPrismaService.territory.update).toHaveBeenCalledWith({
        where: { id: 'territory-1' },
        data: { defenseScore: 4 },
      });
    });
  });

  describe('resolveExpiredContests', () => {
    it('should resolve contests that have expired', async () => {
      const expiredDeadline = new Date();
      expiredDeadline.setHours(expiredDeadline.getHours() - 1); // 1 hour ago

      const mockTerritories = [
        {
          id: 'territory-1',
          ownerId: 'owner-1',
          contestedById: 'challenger-1',
          contestDeadline: expiredDeadline,
          status: 'CONTESTED',
          owner: { id: 'owner-1', username: 'Owner' },
          contestedBy: { id: 'challenger-1', username: 'Challenger' },
          venue: { id: 'venue-1', name: 'Test Venue' },
        },
      ];

      mockPrismaService.territory.findMany.mockResolvedValue(mockTerritories);
      mockPrismaService.territory.update.mockResolvedValue({
        id: 'territory-1',
        status: 'CLAIMED',
        contestedById: null,
        contestDeadline: null,
      });
      mockPrismaService.territoryEvent.create.mockResolvedValue({
        id: 'contest-end-event',
      });

      const result = await service.resolveExpiredContests();

      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
      expect(result.results[0].action).toBe('CONTEST_EXPIRED');
      expect(result.results[0].winner).toBe('Owner');
      expect(result.results[0].loser).toBe('Challenger');
    });
  });
});
