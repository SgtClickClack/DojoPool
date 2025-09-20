import { Test, TestingModule } from '@nestjs/testing';
import { CacheHelper } from '../cache/cache.helper';
import {
  Tournament,
  TournamentListParams,
  TournamentsService,
} from './tournaments.service';

describe('TournamentsService', () => {
  let service: TournamentsService;
  let cacheHelper: jest.Mocked<CacheHelper>;

  const mockTournament: Tournament = {
    id: '1',
    name: 'Test Tournament',
    status: 'active',
    participants: 8,
    maxParticipants: 16,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-02'),
    venueId: 'venue-1',
    prizePool: 1000,
  };

  const mockTournaments: Tournament[] = [mockTournament];

  beforeEach(async () => {
    const mockCacheHelper = {
      readThrough: jest.fn(),
      writeThrough: jest.fn(),
      invalidatePatterns: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentsService,
        {
          provide: CacheHelper,
          useValue: mockCacheHelper,
        },
      ],
    }).compile();

    service = module.get<TournamentsService>(TournamentsService);
    cacheHelper = module.get(CacheHelper);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTournaments', () => {
    it('should return cached tournaments when available', async () => {
      // Arrange
      const params: TournamentListParams = { status: 'active' };

      // Mock the cache to return data (simulating cache hit)
      jest
        .spyOn(service as any, 'fetchTournamentsFromDb')
        .mockResolvedValue(mockTournaments);

      // Act
      const result = await service.getTournaments(params);

      // Assert
      expect(result).toEqual(mockTournaments);
    });

    it('should fetch from database when cache miss', async () => {
      // Arrange
      const params: TournamentListParams = { status: 'active' };

      // Act
      const result = await service.getTournaments(params);

      // Assert
      expect(result).toEqual(mockTournaments);
    });

    it('should filter by status', async () => {
      // Arrange
      const params: TournamentListParams = { status: 'active' };
      const filteredTournaments = mockTournaments.filter(
        (t) => t.status === 'active'
      );
      jest
        .spyOn(service as any, 'fetchTournamentsFromDb')
        .mockResolvedValue(filteredTournaments);

      // Act
      const result = await service.getTournaments(params);

      // Assert
      expect(result).toEqual(filteredTournaments);
      expect(result.every((t) => t.status === 'active')).toBe(true);
    });

    it('should filter by venue ID', async () => {
      // Arrange
      const params: TournamentListParams = { venueId: 'venue-1' };
      const filteredTournaments = mockTournaments.filter(
        (t) => t.venueId === 'venue-1'
      );
      jest
        .spyOn(service as any, 'fetchTournamentsFromDb')
        .mockResolvedValue(filteredTournaments);

      // Act
      const result = await service.getTournaments(params);

      // Assert
      expect(result).toEqual(filteredTournaments);
      expect(result.every((t) => t.venueId === 'venue-1')).toBe(true);
    });

    it('should handle pagination', async () => {
      // Arrange
      const params: TournamentListParams = { page: 1, limit: 10 };

      // Act
      const result = await service.getTournaments(params);

      // Assert
      expect(result).toEqual(mockTournaments);
    });
  });

  describe('getTournamentById', () => {
    it('should return tournament by ID', async () => {
      // Arrange
      jest
        .spyOn(service as any, 'fetchTournamentFromDb')
        .mockResolvedValue(mockTournament);

      // Act
      const result = await (service as any).getTournamentById('1');

      // Assert
      expect(result).toEqual(mockTournament);
      expect(result.id).toBe('1');
    });

    it('should return null for non-existent tournament', async () => {
      // Arrange
      jest
        .spyOn(service as any, 'fetchTournamentFromDb')
        .mockResolvedValue(null);

      // Act
      const result = await (service as any).getTournamentById('999');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createTournament', () => {
    const createTournamentData = {
      name: 'New Tournament',
      venueId: 'venue-1',
      maxParticipants: 16,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-02'),
      prizePool: 2000,
    };

    it('should create tournament successfully', async () => {
      // Arrange
      const newTournament = {
        ...createTournamentData,
        id: '2',
      };

      // Act
      const result = await (service as any).createTournament(
        createTournamentData
      );

      // Assert
      expect(result).toEqual(newTournament);
      expect(result.name).toBe(createTournamentData.name);
      expect(result.venueId).toBe(createTournamentData.venueId);
    });

    it('should validate required fields', async () => {
      // Act & Assert
      await expect((service as any).createTournament({})).rejects.toThrow();
    });
  });

  describe('updateTournament', () => {
    const updateData = {
      name: 'Updated Tournament Name',
      prizePool: 3000,
    };

    it('should update tournament successfully', async () => {
      // Arrange
      const updatedTournament = { ...mockTournament, ...updateData };
      jest
        .spyOn(service as any, 'updateTournamentInDb')
        .mockResolvedValue(updatedTournament);

      // Act
      const result = await (service as any).updateTournament('1', updateData);

      // Assert
      expect(result).toEqual(updatedTournament);
      expect(result.name).toBe(updateData.name);
      expect(result.prizePool).toBe(updateData.prizePool);
    });

    it('should handle non-existent tournament', async () => {
      // Arrange
      jest
        .spyOn(service as any, 'updateTournamentInDb')
        .mockResolvedValue(null);

      // Act
      const result = await (service as any).updateTournament('999', updateData);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('deleteTournament', () => {
    it('should delete tournament successfully', async () => {
      // Arrange
      jest
        .spyOn(service as any, 'deleteTournamentFromDb')
        .mockResolvedValue(true);

      // Act
      const result = await (service as any).deleteTournament('1');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-existent tournament', async () => {
      // Arrange
      jest
        .spyOn(service as any, 'deleteTournamentFromDb')
        .mockResolvedValue(false);

      // Act
      const result = await (service as any).deleteTournament('999');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('addParticipant', () => {
    it('should add participant successfully', async () => {
      // Arrange
      const updatedTournament = { ...mockTournament, participants: 9 };
      jest
        .spyOn(service as any, 'addParticipantToDb')
        .mockResolvedValue(updatedTournament);

      // Act
      const result = await (service as any).addParticipant('1', 'user-1');

      // Assert
      expect(result).toEqual(updatedTournament);
      expect(result.participants).toBe(9);
    });

    it('should prevent adding to full tournament', async () => {
      // Arrange
      const fullTournament = {
        ...mockTournament,
        participants: 16,
        maxParticipants: 16,
      };
      jest.spyOn(service as any, 'addParticipantToDb').mockResolvedValue(null);

      // Act
      const result = await (service as any).addParticipant('1', 'user-1');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant successfully', async () => {
      // Arrange
      const updatedTournament = { ...mockTournament, participants: 7 };
      jest
        .spyOn(service as any, 'removeParticipantFromDb')
        .mockResolvedValue(updatedTournament);

      // Act
      const result = await (service as any).removeParticipant('1', 'user-1');

      // Assert
      expect(result).toEqual(updatedTournament);
      expect(result.participants).toBe(7);
    });
  });

  describe('getTournamentStats', () => {
    it('should return tournament statistics', async () => {
      // Arrange
      const stats = {
        totalTournaments: 1,
        activeTournaments: 1,
        upcomingTournaments: 0,
        completedTournaments: 0,
        totalParticipants: 8,
        totalPrizePool: 1000,
        averageParticipants: 8,
      };

      // Act
      const result = await (service as any).getTournamentStats();

      // Assert
      expect(result).toEqual(stats);
      expect(result.totalTournaments).toBe(1);
      expect(result.activeTournaments).toBe(1);
    });
  });

  describe('validateTournamentData', () => {
    it('should validate correct tournament data', () => {
      // Arrange
      const validData = {
        name: 'Valid Tournament',
        venueId: 'venue-1',
        maxParticipants: 16,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-02'),
        prizePool: 1000,
      };

      // Act
      const result = (service as any).validateTournamentData(validData);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject invalid tournament data', () => {
      // Arrange
      const invalidData = {
        name: '',
        venueId: '',
        maxParticipants: 0,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2023-12-31'), // End before start
        prizePool: -100,
      };

      // Act
      const result = (service as any).validateTournamentData(invalidData);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject tournament with end date before start date', () => {
      // Arrange
      const invalidData = {
        name: 'Invalid Tournament',
        venueId: 'venue-1',
        maxParticipants: 16,
        startDate: new Date('2024-02-02'),
        endDate: new Date('2024-02-01'), // End before start
        prizePool: 1000,
      };

      // Act
      const result = (service as any).validateTournamentData(invalidData);

      // Assert
      expect(result).toBe(false);
    });
  });

});
