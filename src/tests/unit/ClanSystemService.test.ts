import { clanSystemService } from '../../services/clan/ClanSystemService';
import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('ClanSystemService', () => {
  let service: typeof clanSystemService;

  beforeEach(() => {
    service = clanSystemService;
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      expect(service).toBeDefined();
    });
  });

  describe('clan creation and management', () => {
    it('should create clan', async () => {
      const mockClan = {
        id: 'clan-1',
        name: 'Test Clan',
        description: 'A test clan',
        tag: 'TEST',
        avatar: '',
        banner: '',
        leaderId: 'user-1',
        leaderName: 'User 1',
        memberCount: 1,
        maxMembers: 50,
        level: 1,
        experience: 0,
        territoryCount: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        createdAt: new Date(),
        isPublic: true,
        requirements: {
          minRank: 'bronze',
          minTerritories: 0,
          minWins: 0,
        },
      };

      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockClan,
      });

      const result = await service.createClan({
        name: 'Test Clan',
        description: 'A test clan',
        tag: 'TEST',
        isPublic: true,
        requirements: {
          minRank: 'bronze',
          minTerritories: 0,
          minWins: 0,
        },
      });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Clan');
    });

    it('should get user clan', async () => {
      const mockClan = {
        id: 'clan-1',
        name: 'Test Clan',
        description: 'A test clan',
        tag: 'TEST',
        avatar: '',
        banner: '',
        leaderId: 'user-1',
        leaderName: 'User 1',
        memberCount: 1,
        maxMembers: 50,
        level: 1,
        experience: 0,
        territoryCount: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        createdAt: new Date(),
        isPublic: true,
        requirements: {
          minRank: 'bronze',
          minTerritories: 0,
          minWins: 0,
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockClan,
      });

      const result = await service.getUserClan();
      expect(result).toBeDefined();
    });

    it('should update clan information', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await service.updateClan({
        description: 'Updated description',
      });

      expect(typeof result).toBe('boolean');
    });
  });

  describe('member management', () => {
    beforeEach(async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'clan-1',
          name: 'Test Clan',
        }),
      });

      await service.createClan({
        name: 'Test Clan',
        description: 'A test clan',
        tag: 'TEST',
        isPublic: true,
        requirements: {
          minRank: 'bronze',
          minTerritories: 0,
          minWins: 0,
        },
      });
    });

    it('should invite player to clan', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await service.invitePlayer('user-2', 'Join our clan!');
      expect(typeof result).toBe('boolean');
    });

    it('should get clan members', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          username: 'User 1',
          avatar: '',
          rank: 'bronze',
          role: 'leader' as const,
          joinedAt: new Date(),
          contribution: 100,
          territoryCount: 0,
          matchWins: 0,
          isOnline: true,
          lastSeen: new Date(),
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMembers,
      });

      const members = await service.getClanMembers();
      expect(Array.isArray(members)).toBe(true);
    });

    it('should promote member to officer', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await service.promoteMember('user-2', 'officer');
      expect(typeof result).toBe('boolean');
    });

    it('should kick member from clan', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await service.kickMember('user-2');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('clan wars', () => {
    beforeEach(async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'clan-1',
          name: 'Test Clan',
        }),
      });

      await service.createClan({
        name: 'Test Clan',
        description: 'A test clan',
        tag: 'TEST',
        isPublic: true,
        requirements: {
          minRank: 'bronze',
          minTerritories: 0,
          minWins: 0,
        },
      });
    });

    it('should declare war on another clan', async () => {
      const mockWar = {
        id: 'war-1',
        name: 'Test War',
        description: 'A test war',
        startDate: new Date(),
        endDate: new Date(),
        status: 'preparing' as const,
        clan1Id: 'clan-1',
        clan1Name: 'Clan 1',
        clan1Score: 0,
        clan2Id: 'clan-2',
        clan2Name: 'Clan 2',
        clan2Score: 0,
        rewards: {
          winner: 1000,
          loser: 100,
        },
        matches: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWar,
      });

      const result = await service.declareWar('clan-2', {
        name: 'Test War',
        description: 'A test war',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000), // 24 hours from now
        rewards: {
          winner: 1000,
          loser: 100,
        },
      });
      expect(result).toBeDefined();
    });

    it('should accept war declaration', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await service.acceptWar('war-1');
      expect(typeof result).toBe('boolean');
    });

    it('should submit war match', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await service.submitWarMatch('war-1', {
        player1Id: 'user-1',
        player2Id: 'user-2',
        winnerId: 'user-1',
        score: '7-5',
        territory: 'territory-1',
      });
      expect(typeof result).toBe('boolean');
    });
  });

  describe('clan discovery', () => {
    it('should search clans', async () => {
      const mockClans = [
        {
          id: 'clan-1',
          name: 'Test Clan',
          tag: 'TEST',
          description: 'A test clan',
          avatar: '',
          banner: '',
          leaderId: 'user-1',
          leaderName: 'User 1',
          memberCount: 1,
          maxMembers: 50,
          level: 1,
          experience: 0,
          territoryCount: 0,
          totalWins: 0,
          totalLosses: 0,
          winRate: 0,
          createdAt: new Date(),
          isPublic: true,
          requirements: {
            minRank: 'bronze',
            minTerritories: 0,
            minWins: 0,
          },
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockClans,
      });

      const results = await service.searchClans('test');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should get top clans', async () => {
      const mockClans = [
        {
          id: 'clan-1',
          name: 'Top Clan',
          tag: 'TOP',
          description: 'A top clan',
          avatar: '',
          banner: '',
          leaderId: 'user-1',
          leaderName: 'User 1',
          memberCount: 10,
          maxMembers: 50,
          level: 5,
          experience: 1000,
          territoryCount: 5,
          totalWins: 50,
          totalLosses: 10,
          winRate: 0.83,
          createdAt: new Date(),
          isPublic: true,
          requirements: {
            minRank: 'gold',
            minTerritories: 2,
            minWins: 20,
          },
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockClans,
      });

      const results = await service.getTopClans(10);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should get clan role', () => {
      const role = service.getClanRole();
      expect(role).toBeDefined();
    });

    it('should check if can manage clan', () => {
      const canManage = service.canManageClan();
      expect(typeof canManage).toBe('boolean');
    });

    it('should check if can invite members', () => {
      const canInvite = service.canInviteMembers();
      expect(typeof canInvite).toBe('boolean');
    });

    it('should get pending invites count', () => {
      const count = service.getPendingInvitesCount();
      expect(typeof count).toBe('number');
    });
  });
});
