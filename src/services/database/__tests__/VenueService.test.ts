/// <reference types="jest" />

import { PrismaClient } from '@prisma/client';
import { VenueService } from '../VenueService';
import { Venue, VenueStatus } from '../../../types/venue';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      venue: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    })),
  };
});

describe('VenueService', () => {
  let venueService: VenueService;
  let prisma: jest.Mocked<PrismaClient>;

  const mockVenue: Venue = {
    id: '1',
    name: 'Test Venue',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    phone: '123-456-7890',
    email: 'test@venue.com',
    ownerId: 'owner1',
    tableCount: 10,
    status: VenueStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    venueService = new VenueService(prisma);
  });

  describe('createVenue', () => {
    it('should create a new venue', async () => {
      (prisma.venue.create as jest.Mock).mockResolvedValue(mockVenue);

      const result = await venueService.createVenue({
        name: 'Test Venue',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        phone: '123-456-7890',
        email: 'test@venue.com',
        ownerId: 'owner1',
        tableCount: 10,
      });

      expect(result).toEqual(mockVenue);
      expect(prisma.venue.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Venue',
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          phone: '123-456-7890',
          email: 'test@venue.com',
          ownerId: 'owner1',
          tableCount: 10,
          status: VenueStatus.PENDING,
        },
      });
    });
  });

  describe('getVenue', () => {
    it('should return a venue by id', async () => {
      (prisma.venue.findUnique as jest.Mock).mockResolvedValue(mockVenue);

      const result = await venueService.getVenue('1');

      expect(result).toEqual(mockVenue);
      expect(prisma.venue.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null if venue not found', async () => {
      (prisma.venue.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await venueService.getVenue('1');

      expect(result).toBeNull();
    });
  });

  describe('updateVenue', () => {
    it('should update a venue', async () => {
      const updatedVenue = { ...mockVenue, name: 'Updated Venue' };
      (prisma.venue.update as jest.Mock).mockResolvedValue(updatedVenue);

      const result = await venueService.updateVenue('1', {
        name: 'Updated Venue',
      });

      expect(result).toEqual(updatedVenue);
      expect(prisma.venue.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated Venue' },
      });
    });
  });

  describe('updateVenueStatus', () => {
    it('should update venue status', async () => {
      const updatedVenue = { ...mockVenue, status: VenueStatus.INACTIVE };
      (prisma.venue.update as jest.Mock).mockResolvedValue(updatedVenue);

      const result = await venueService.updateVenueStatus('1', VenueStatus.INACTIVE);

      expect(result).toEqual(updatedVenue);
      expect(prisma.venue.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: VenueStatus.INACTIVE },
      });
    });
  });

  describe('getVenuesByOwner', () => {
    it('should return venues by owner id', async () => {
      (prisma.venue.findMany as jest.Mock).mockResolvedValue([mockVenue]);

      const result = await venueService.getVenuesByOwner('owner1');

      expect(result).toEqual([mockVenue]);
      expect(prisma.venue.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'owner1' },
      });
    });
  });

  describe('getActiveVenues', () => {
    it('should return active venues', async () => {
      (prisma.venue.findMany as jest.Mock).mockResolvedValue([mockVenue]);

      const result = await venueService.getActiveVenues();

      expect(result).toEqual([mockVenue]);
      expect(prisma.venue.findMany).toHaveBeenCalledWith({
        where: { status: VenueStatus.ACTIVE },
      });
    });
  });

  describe('searchVenues', () => {
    it('should search venues by name', async () => {
      (prisma.venue.findMany as jest.Mock).mockResolvedValue([mockVenue]);

      const result = await venueService.searchVenues('Test');

      expect(result).toEqual([mockVenue]);
      expect(prisma.venue.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'Test',
            mode: 'insensitive',
          },
          status: VenueStatus.ACTIVE,
        },
      });
    });

    it('should search venues by location', async () => {
      (prisma.venue.findMany as jest.Mock).mockResolvedValue([mockVenue]);

      const result = await venueService.searchVenues('Test', 'Test City');

      expect(result).toEqual([mockVenue]);
      expect(prisma.venue.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'Test',
            mode: 'insensitive',
          },
          city: {
            contains: 'Test City',
            mode: 'insensitive',
          },
          status: VenueStatus.ACTIVE,
        },
      });
    });
  });
}); 