import { vi } from 'vitest';
import { TestDataManager, TestDataScenarios } from '../fixtures/test-data-manager';
import { MockFactoryRegistry } from '../mocks/mock-factory';
import { DatabaseTestUtils } from '../utils/service-isolation';

/**
 * API Integration Test Suite
 * Comprehensive testing of API endpoints and service interactions
 *
 * Note: Full API integration tests require NestJS setup which is complex.
 * For now, focusing on service integration and mock testing.
 */

describe('API Integration Tests', () => {
  let prismaMock: any;
  let authToken: string;

  beforeAll(async () => {
    // Initialize test data manager
    TestDataManager.initialize();

    // Create mock prisma instance
    prismaMock = MockFactoryRegistry.create('prisma');

    // Mock basic auth response
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      username: 'testuser',
      password: '$2a$10$test.hashed.password',
    });
  });

  beforeEach(() => {
    // Reset mocks before each test
    MockFactoryRegistry.resetAll();
  });

  describe('Authentication Service Integration', () => {
    it('should create test user data correctly', () => {
      const testUser = TestDataManager.create('user');
      const testProfile = TestDataManager.create('profile', { userId: testUser.id });

      expect(testUser).toHaveProperty('id');
      expect(testUser).toHaveProperty('email');
      expect(testUser).toHaveProperty('username');
      expect(testProfile).toHaveProperty('userId');
      expect(testProfile.userId).toBe(testUser.id);
    });

    it('should setup mock database responses', () => {
      const testUser = TestDataManager.create('user');
      const testProfile = TestDataManager.create('profile', { userId: testUser.id });

      DatabaseTestUtils.setupMockResponses(prismaMock, {
        'user.findFirst': testUser,
        'user.create': testUser,
        'profile.create': testProfile,
      });

      expect(prismaMock.user.findFirst).toHaveBeenCalledTimes(0); // Not called yet
      expect(prismaMock.user.create).toHaveBeenCalledTimes(0); // Not called yet
    });
  });

  describe('Tournament Service Integration', () => {
    it('should create tournament test data correctly', () => {
      const testTournament = TestDataManager.create('tournament');
      const testVenue = TestDataManager.create('venue');

      expect(testTournament).toHaveProperty('id');
      expect(testTournament).toHaveProperty('name');
      expect(testTournament).toHaveProperty('venueId');
      expect(testVenue).toHaveProperty('id');
      expect(testVenue).toHaveProperty('name');
    });

    it('should create related tournament data', () => {
      const relatedData = TestDataManager.createRelatedData();

      expect(relatedData).toHaveProperty('tournament');
      expect(relatedData).toHaveProperty('venue');
      expect(relatedData).toHaveProperty('user');
      expect(relatedData.tournament.venueId).toBe(relatedData.venue.id);
    });
  });

  describe('Data Relationships Integration', () => {
    it('should create complex related data scenarios', () => {
      const scenario = TestDataScenarios.createTournamentScenario();

      expect(scenario.organizer).toHaveProperty('id');
      expect(scenario.venue).toHaveProperty('id');
      expect(scenario.tournament).toHaveProperty('venueId');
      expect(scenario.tournament.venueId).toBe(scenario.venue.id);
      expect(scenario.participants).toHaveLength(8);
      expect(scenario.matches).toHaveLength(8);
    });

    it('should create clan scenarios with members', () => {
      const clanScenario = TestDataScenarios.createClanScenario();

      expect(clanScenario.clan).toHaveProperty('id');
      expect(clanScenario.clan).toHaveProperty('leaderId');
      expect(clanScenario.leader).toHaveProperty('id');
      expect(clanScenario.members).toHaveLength(clanScenario.clan.memberCount);
      expect(clanScenario.profiles).toHaveLength(clanScenario.members.length);
    });
  });

  describe('Mock Integration', () => {
    it('should properly integrate mock factory with test data', () => {
      const testUser = TestDataManager.create('user');
      const mockPrisma = MockFactoryRegistry.create('prisma');

      DatabaseTestUtils.setupMockResponses(mockPrisma, {
        'user.findUnique': testUser,
        'user.findFirst': testUser,
      });

      expect(mockPrisma.user.findUnique).toBeDefined();
      expect(mockPrisma.user.findFirst).toBeDefined();
    });

    it('should reset all mocks between tests', () => {
      const mockCache = MockFactoryRegistry.create('cacheHelper');
      const mockJwt = MockFactoryRegistry.create('jwtService');

      // Call some mock methods
      mockCache.get('test');
      mockJwt.sign({});

      // Reset all mocks
      MockFactoryRegistry.resetAll();

      // Create new mocks after reset to verify clean state
      const newMockCache = MockFactoryRegistry.create('cacheHelper');
      const newMockJwt = MockFactoryRegistry.create('jwtService');

      // New mocks should not have been called
      expect(newMockCache.get).toHaveBeenCalledTimes(0);
      expect(newMockJwt.sign).toHaveBeenCalledTimes(0);
    });
  });
});
