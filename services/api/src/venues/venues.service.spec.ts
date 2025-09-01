import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CacheHelper } from '../cache/cache.helper';
import { MatchesGateway } from '../matches/matches.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { VenuesService } from './venues.service';

describe('VenuesService', () => {
  let service: VenuesService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheHelper: jest.Mocked<CacheHelper>;
  let matchesGateway: jest.Mocked<MatchesGateway>;

  const mockUser = {
    id: '1',
    email: 'owner@example.com',
    username: 'venueowner',
    role: 'VENUE_ADMIN' as const,
  };

  const mockVenue = {
    id: '1',
    name: 'Test Venue',
    description: 'A test venue',
    lat: 40.7128,
    lng: -74.006,
    address: '123 Test St',
    ownerId: '1',
    controllingClanId: null,
    incomeModifier: 1.0,
    defenseLevel: 0,
    status: 'ACTIVE',
    photos: [],
    rating: 4.5,
    features: ['pool', 'darts'],
    tables: 4,
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTable = {
    id: '1',
    venueId: '1',
    name: 'Table 1',
    status: 'AVAILABLE',
    matchId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      venue: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      table: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      venueSpecial: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockCacheHelper = {
      readThrough: jest.fn(),
      writeThrough: jest.fn(),
      invalidatePatterns: jest.fn(),
    };

    const mockMatchesGateway = {
      notifyTableUpdate: jest.fn(),
      notifyVenueUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenuesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheHelper,
          useValue: mockCacheHelper,
        },
        {
          provide: MatchesGateway,
          useValue: mockMatchesGateway,
        },
      ],
    }).compile();

    service = module.get<VenuesService>(VenuesService);
    prismaService = module.get(PrismaService);
    cacheHelper = module.get(CacheHelper);
    matchesGateway = module.get(MatchesGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVenues', () => {
    it('should return all venues', async () => {
      // Arrange
      const venues = [mockVenue];
      prismaService.venue.findMany.mockResolvedValue(venues);

      // Act
      const result = await (service as any).getVenues();

      // Assert
      expect(result).toEqual(venues);
      expect(prismaService.venue.findMany).toHaveBeenCalledWith({
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    });

    it('should filter by controlling clan', async () => {
      // Arrange
      const clanId = 'clan-1';
      const filteredVenues = [mockVenue];
      prismaService.venue.findMany.mockResolvedValue(filteredVenues);

      // Act
      const result = await (service as any).getVenues({
        controllingClanId: clanId,
      });

      // Assert
      expect(result).toEqual(filteredVenues);
      expect(prismaService.venue.findMany).toHaveBeenCalledWith({
        where: { controllingClanId: clanId },
        include: expect.any(Object),
      });
    });
  });

  describe('getVenueById', () => {
    it('should return venue by ID', async () => {
      // Arrange
      prismaService.venue.findUnique.mockResolvedValue(mockVenue);

      // Act
      const result = await (service as any).getVenueById('1');

      // Assert
      expect(result).toEqual(mockVenue);
      expect(prismaService.venue.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException for non-existent venue', async () => {
      // Arrange
      prismaService.venue.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect((service as any).getVenueById('999')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('createVenue', () => {
    const createVenueData = {
      name: 'New Venue',
      description: 'A new test venue',
      lat: 40.7589,
      lng: -73.9851,
      address: '456 New St',
    };

    it('should create venue successfully', async () => {
      // Arrange
      const newVenue = { ...mockVenue, ...createVenueData, id: '2' };
      prismaService.venue.create.mockResolvedValue(newVenue);

      // Act
      const result = await (service as any).createVenue(createVenueData, '1');

      // Assert
      expect(result).toEqual(newVenue);
      expect(prismaService.venue.create).toHaveBeenCalledWith({
        data: {
          ...createVenueData,
          ownerId: '1',
        },
      });
    });

    it('should validate required fields', async () => {
      // Act & Assert
      await expect((service as any).createVenue({}, '1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('updateVenue', () => {
    const updateData = {
      name: 'Updated Venue Name',
      description: 'Updated description',
    };

    it('should update venue successfully', async () => {
      // Arrange
      const updatedVenue = { ...mockVenue, ...updateData };
      prismaService.venue.findUnique.mockResolvedValue(mockVenue);
      prismaService.venue.update.mockResolvedValue(updatedVenue);

      // Act
      const result = await (service as any).updateVenue('1', updateData, '1');

      // Assert
      expect(result).toEqual(updatedVenue);
      expect(prismaService.venue.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
    });

    it('should throw ForbiddenException for non-owner update', async () => {
      // Arrange
      prismaService.venue.findUnique.mockResolvedValue(mockVenue);

      // Act & Assert
      await expect(
        (service as any).updateVenue('1', updateData, '2')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteVenue', () => {
    it('should delete venue successfully', async () => {
      // Arrange
      prismaService.venue.findUnique.mockResolvedValue(mockVenue);
      prismaService.venue.delete.mockResolvedValue(mockVenue);

      // Act
      const result = await (service as any).deleteVenue('1', '1');

      // Assert
      expect(result).toEqual(mockVenue);
      expect(prismaService.venue.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw ForbiddenException for non-owner delete', async () => {
      // Arrange
      prismaService.venue.findUnique.mockResolvedValue(mockVenue);

      // Act & Assert
      await expect((service as any).deleteVenue('1', '2')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('Table Management', () => {
    describe('createTable', () => {
      const createTableData = { name: 'New Table', status: 'AVAILABLE' };

      it('should create table successfully', async () => {
        // Arrange
        prismaService.venue.findUnique.mockResolvedValue(mockVenue);
        prismaService.table.create.mockResolvedValue({
          ...mockTable,
          ...createTableData,
          id: '2',
        });

        // Act
        const result = await service.createTable('1', createTableData);

        // Assert
        expect(result).toHaveProperty('id');
        expect(result.name).toBe(createTableData.name);
        expect(prismaService.table.create).toHaveBeenCalledWith({
          data: {
            venueId: '1',
            name: createTableData.name,
            status: createTableData.status,
          },
        });
        expect(cacheHelper.invalidatePatterns).toHaveBeenCalledWith(['venues']);
      });

      it('should throw BadRequestException for invalid data', async () => {
        // Act & Assert
        await expect(service.createTable('1', { name: '' })).rejects.toThrow(
          BadRequestException
        );
      });

      it('should throw NotFoundException for non-existent venue', async () => {
        // Arrange
        prismaService.venue.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.createTable('999', createTableData)
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('getVenueTables', () => {
      it('should return venue tables', async () => {
        // Arrange
        const tables = [mockTable];
        prismaService.table.findMany.mockResolvedValue(tables);

        // Act
        const result = await (service as any).getVenueTables('1');

        // Assert
        expect(result).toEqual(tables);
        expect(prismaService.table.findMany).toHaveBeenCalledWith({
          where: { venueId: '1' },
          orderBy: { createdAt: 'asc' },
        });
      });
    });

    describe('updateTable', () => {
      const updateData = { status: 'OCCUPIED', matchId: 'match-1' };

      it('should update table successfully', async () => {
        // Arrange
        const updatedTable = { ...mockTable, ...updateData };
        prismaService.table.findUnique.mockResolvedValue(mockTable);
        prismaService.table.update.mockResolvedValue(updatedTable);

        // Act
        const result = await (service as any).updateTable('1', '1', updateData);

        // Assert
        expect(result).toEqual(updatedTable);
        expect(result.status).toBe(updateData.status);
        expect(result.matchId).toBe(updateData.matchId);
        expect(matchesGateway.notifyTableUpdate).toHaveBeenCalled();
      });

      it('should throw NotFoundException for non-existent table', async () => {
        // Arrange
        prismaService.table.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          (service as any).updateTable('1', '999', updateData)
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteTable', () => {
      it('should delete table successfully', async () => {
        // Arrange
        prismaService.table.findUnique.mockResolvedValue(mockTable);
        prismaService.table.delete.mockResolvedValue(mockTable);

        // Act
        const result = await (service as any).deleteTable('1', '1');

        // Assert
        expect(result).toEqual(mockTable);
        expect(prismaService.table.delete).toHaveBeenCalledWith({
          where: { id: '1' },
        });
      });
    });
  });

  describe('Venue Specials', () => {
    const mockSpecial = {
      id: '1',
      venueId: '1',
      name: 'Happy Hour',
      description: '50% off drinks',
      discount: 50,
      startTime: '17:00',
      endTime: '19:00',
      daysOfWeek: ['monday', 'tuesday'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('getVenueSpecials', () => {
      it('should return venue specials', async () => {
        // Arrange
        const specials = [mockSpecial];
        (prismaService as any).venueSpecial.findMany.mockResolvedValue(
          specials
        );

        // Act
        const result = await (service as any).getVenueSpecials('1');

        // Assert
        expect(result).toEqual(specials);
        expect(
          (prismaService as any).venueSpecial.findMany
        ).toHaveBeenCalledWith({
          where: { venueId: '1' },
          orderBy: { createdAt: 'desc' },
        });
      });
    });

    describe('createVenueSpecial', () => {
      const createSpecialData = {
        name: 'New Special',
        description: 'New discount offer',
        discount: 25,
        startTime: '18:00',
        endTime: '20:00',
        daysOfWeek: ['wednesday', 'thursday'],
      };

      it('should create special successfully', async () => {
        // Arrange
        prismaService.venue.findUnique.mockResolvedValue(mockVenue);
        (prismaService as any).venueSpecial.create.mockResolvedValue({
          ...mockSpecial,
          ...createSpecialData,
          id: '2',
        });

        // Act
        const result = await (service as any).createVenueSpecial(
          '1',
          createSpecialData,
          '1'
        );

        // Assert
        expect(result).toHaveProperty('id');
        expect(result.name).toBe(createSpecialData.name);
        expect((prismaService as any).venueSpecial.create).toHaveBeenCalledWith(
          {
            data: {
              venueId: '1',
              ...createSpecialData,
            },
          }
        );
      });

      it('should throw ForbiddenException for non-owner', async () => {
        // Arrange
        prismaService.venue.findUnique.mockResolvedValue(mockVenue);

        // Act & Assert
        await expect(
          (service as any).createVenueSpecial('1', createSpecialData, '2')
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('updateVenueSpecial', () => {
      const updateData = { name: 'Updated Special', discount: 30 };

      it('should update special successfully', async () => {
        // Arrange
        prismaService.venue.findUnique.mockResolvedValue(mockVenue);
        (prismaService as any).venueSpecial.findUnique.mockResolvedValue(
          mockSpecial
        );
        (prismaService as any).venueSpecial.update.mockResolvedValue({
          ...mockSpecial,
          ...updateData,
        });

        // Act
        const result = await (service as any).updateVenueSpecial(
          '1',
          '1',
          updateData,
          '1'
        );

        // Assert
        expect(result.name).toBe(updateData.name);
        expect(result.discount).toBe(updateData.discount);
      });
    });

    describe('deleteVenueSpecial', () => {
      it('should delete special successfully', async () => {
        // Arrange
        prismaService.venue.findUnique.mockResolvedValue(mockVenue);
        (prismaService as any).venueSpecial.findUnique.mockResolvedValue(
          mockSpecial
        );
        (prismaService as any).venueSpecial.delete.mockResolvedValue(
          mockSpecial
        );

        // Act
        const result = await (service as any).deleteVenueSpecial('1', '1', '1');

        // Assert
        expect(result).toEqual(mockSpecial);
      });
    });
  });

  describe('Venue Statistics', () => {
    it('should return venue statistics', async () => {
      // Arrange
      const stats = {
        totalVenues: 10,
        activeVenues: 8,
        totalTables: 50,
        averageRating: 4.2,
        topRatedVenues: [mockVenue],
      };

      prismaService.venue.count.mockResolvedValue(10);
      prismaService.table.count.mockResolvedValue(50);
      prismaService.venue.findMany.mockResolvedValue([mockVenue]);

      // Act
      const result = await (service as any).getVenueStatistics();

      // Assert
      expect(result).toHaveProperty('totalVenues');
      expect(result).toHaveProperty('totalTables');
      expect(result.totalVenues).toBe(10);
      expect(result.totalTables).toBe(50);
    });
  });

  describe('Access Control', () => {
    it('should validate venue ownership', async () => {
      // Arrange
      prismaService.venue.findUnique.mockResolvedValue(mockVenue);

      // Act
      const result = await (service as any).validateVenueOwnership('1', '1');

      // Assert
      expect(result).toBe(true);
    });

    it('should reject non-owner access', async () => {
      // Arrange
      prismaService.venue.findUnique.mockResolvedValue(mockVenue);

      // Act
      const result = await (service as any).validateVenueOwnership('1', '2');

      // Assert
      expect(result).toBe(false);
    });

    it('should validate venue admin role', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await (service as any).validateVenueAdminRole('1');

      // Assert
      expect(result).toBe(true);
    });

    it('should reject non-admin users', async () => {
      // Arrange
      const regularUser = { ...mockUser, role: 'USER' as const };
      prismaService.user.findUnique.mockResolvedValue(regularUser);

      // Act
      const result = await (service as any).validateVenueAdminRole('1');

      // Assert
      expect(result).toBe(false);
    });
  });
});
