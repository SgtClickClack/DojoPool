import { Test, TestingModule } from '@nestjs/testing';
import { TerritoriesController } from '../territories.controller';
import { TerritoriesService } from '../territories.service';

describe('TerritoriesController', () => {
  let controller: TerritoriesController;
  let service: TerritoriesService;

  const mockTerritoriesService = {
    findAllTerritories: jest.fn(),
    getTerritoriesByClan: jest.fn(),
    getTerritoriesByVenue: jest.fn(),
    getStrategicMap: jest.fn(),
    scoutTerritory: jest.fn(),
    manageTerritory: jest.fn(),
    claimTerritory: jest.fn(),
    challengeTerritory: jest.fn(),
    processTerritoryDecay: jest.fn(),
    resolveExpiredContests: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TerritoriesController],
      providers: [
        {
          provide: TerritoriesService,
          useValue: mockTerritoriesService,
        },
      ],
    }).compile();

    controller = module.get<TerritoriesController>(TerritoriesController);
    service = module.get<TerritoriesService>(TerritoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all territories', async () => {
      const mockTerritories = [
        { id: '1', name: 'Territory 1' },
        { id: '2', name: 'Territory 2' },
      ];

      mockTerritoriesService.findAllTerritories.mockResolvedValue(
        mockTerritories
      );

      const result = await controller.findAll();

      expect(result).toEqual(mockTerritories);
      expect(mockTerritoriesService.findAllTerritories).toHaveBeenCalled();
    });
  });

  describe('findByClan', () => {
    it('should return territories by clan ID', async () => {
      const clanId = 'clan-1';
      const mockTerritories = [{ id: '1', name: 'Territory 1', clanId }];

      mockTerritoriesService.getTerritoriesByClan.mockResolvedValue(
        mockTerritories
      );

      const result = await controller.findByClan(clanId);

      expect(result).toEqual(mockTerritories);
      expect(mockTerritoriesService.getTerritoriesByClan).toHaveBeenCalledWith(
        clanId
      );
    });
  });

  describe('findByVenue', () => {
    it('should return territories by venue ID', async () => {
      const venueId = 'venue-1';
      const mockTerritories = [{ id: '1', name: 'Territory 1', venueId }];

      mockTerritoriesService.getTerritoriesByVenue.mockResolvedValue(
        mockTerritories
      );

      const result = await controller.findByVenue(venueId);

      expect(result).toEqual(mockTerritories);
      expect(mockTerritoriesService.getTerritoriesByVenue).toHaveBeenCalledWith(
        venueId
      );
    });
  });

  describe('getStrategicMap', () => {
    it('should return strategic map data', async () => {
      const bbox = 'minLng,minLat,maxLng,maxLat';
      const mockMapData = {
        territories: [
          { id: '1', name: 'Territory 1', coordinates: { lat: 0, lng: 0 } },
        ],
      };

      mockTerritoriesService.getStrategicMap.mockResolvedValue(mockMapData);

      const result = await controller.getStrategicMap(bbox);

      expect(result).toEqual(mockMapData);
      expect(mockTerritoriesService.getStrategicMap).toHaveBeenCalledWith(bbox);
    });

    it('should handle undefined bbox', async () => {
      const mockMapData = {
        territories: [],
      };

      mockTerritoriesService.getStrategicMap.mockResolvedValue(mockMapData);

      const result = await controller.getStrategicMap(undefined);

      expect(result).toEqual(mockMapData);
      expect(mockTerritoriesService.getStrategicMap).toHaveBeenCalledWith(
        undefined
      );
    });
  });

  describe('scoutTerritory', () => {
    it('should scout a territory', async () => {
      const territoryId = 'territory-1';
      const body = { playerId: 'player-1' };
      const mockResult = { success: true, eventId: 'event-1' };

      mockTerritoriesService.scoutTerritory.mockResolvedValue(mockResult);

      const result = await controller.scoutTerritory(territoryId, body);

      expect(result).toEqual(mockResult);
      expect(mockTerritoriesService.scoutTerritory).toHaveBeenCalledWith(
        territoryId,
        body.playerId
      );
    });
  });

  describe('manageTerritory', () => {
    it('should manage territory with upgrade_defense action', async () => {
      const territoryId = 'territory-1';
      const body = {
        action: 'upgrade_defense' as const,
        payload: {},
      };
      const mockResult = { success: true };

      mockTerritoriesService.manageTerritory.mockResolvedValue(mockResult);

      const result = await controller.manageTerritory(territoryId, body);

      expect(result).toEqual(mockResult);
      expect(mockTerritoriesService.manageTerritory).toHaveBeenCalledWith(
        territoryId,
        body.action,
        body.payload
      );
    });
  });

  describe('claimTerritory', () => {
    it('should claim a territory', async () => {
      const body = { territoryId: 'territory-1', playerId: 'player-1' };
      const mockResult = {
        success: true,
        territory: { id: 'territory-1', ownerId: 'player-1' },
        message: 'Territory claimed successfully',
      };

      mockTerritoriesService.claimTerritory.mockResolvedValue(mockResult);

      const result = await controller.claimTerritory(body);

      expect(result).toEqual(mockResult);
      expect(mockTerritoriesService.claimTerritory).toHaveBeenCalledWith(
        body.territoryId,
        body.playerId
      );
    });
  });

  describe('challengeTerritory', () => {
    it('should challenge a territory', async () => {
      const body = { territoryId: 'territory-1', challengerId: 'challenger-1' };
      const mockResult = {
        success: true,
        challengeId: 'challenge-1',
        message: 'Challenge issued successfully',
      };

      mockTerritoriesService.challengeTerritory.mockResolvedValue(mockResult);

      const result = await controller.challengeTerritory(body);

      expect(result).toEqual(mockResult);
      expect(mockTerritoriesService.challengeTerritory).toHaveBeenCalledWith(
        body.territoryId,
        body.challengerId
      );
    });
  });

  describe('processTerritoryDecay', () => {
    it('should process territory decay', async () => {
      const mockResult = {
        success: true,
        processed: 5,
        results: [],
      };

      mockTerritoriesService.processTerritoryDecay.mockResolvedValue(
        mockResult
      );

      const result = await controller.processTerritoryDecay();

      expect(result).toEqual(mockResult);
      expect(mockTerritoriesService.processTerritoryDecay).toHaveBeenCalled();
    });
  });

  describe('resolveExpiredContests', () => {
    it('should resolve expired contests', async () => {
      const mockResult = {
        success: true,
        processed: 3,
        results: [],
      };

      mockTerritoriesService.resolveExpiredContests.mockResolvedValue(
        mockResult
      );

      const result = await controller.resolveExpiredContests();

      expect(result).toEqual(mockResult);
      expect(mockTerritoriesService.resolveExpiredContests).toHaveBeenCalled();
    });
  });
});
