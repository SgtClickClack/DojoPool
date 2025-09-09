import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantStatus, TournamentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TournamentService } from '../tournament.service';

describe('TournamentService', () => {
  let service: TournamentService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    tournament: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    tournamentParticipant: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    bracket: {
      upsert: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    match: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    content: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TournamentService>(TournamentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a tournament successfully', async () => {
      const createTournamentDto = {
        name: 'Test Tournament',
        description: 'A test tournament',
        eventId: 'event-1',
        venueId: 'venue-1',
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T18:00:00Z',
        maxParticipants: 16,
        entryFee: 100,
        prizePool: 1600,
        format: 'SINGLE_ELIMINATION',
        rules: { maxScore: 11, gamesToWin: 3 },
      };

      const mockTournament = {
        id: 'tournament-1',
        ...createTournamentDto,
        status: TournamentStatus.UPCOMING,
        currentParticipants: 0,
        createdBy: 'admin-1',
        venue: { id: 'venue-1', name: 'Test Venue' },
        event: {
          content: {
            title: 'Test Event',
            description: 'Test event description',
          },
        },
        participants: [],
        matches: [],
        _count: { participants: 0, matches: 0 },
      };

      mockPrismaService.tournament.create.mockResolvedValue(mockTournament);

      const result = await service.create(createTournamentDto, 'admin-1');

      expect(mockPrismaService.tournament.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Tournament',
          description: 'A test tournament',
          eventId: 'event-1',
          venueId: 'venue-1',
          startTime: new Date('2024-01-01T10:00:00Z'),
          maxPlayers: 16,
          entryFee: 100,
          prizePool: 1600,
          format: 'SINGLE_ELIMINATION',
          rules: JSON.stringify({ maxScore: 11, gamesToWin: 3 }),
          createdBy: 'admin-1',
        }),
        include: expect.any(Object),
      });

      expect(result).toEqual(mockTournament);
    });

    it('should create tournament with default values', async () => {
      const createTournamentDto = {
        name: 'Simple Tournament',
        startTime: '2024-01-01T10:00:00Z',
      };

      const mockTournament = {
        id: 'tournament-2',
        name: 'Simple Tournament',
        description: null,
        status: TournamentStatus.UPCOMING,
        startTime: new Date('2024-01-01T10:00:00Z'),
        maxPlayers: 8,
        currentParticipants: 0,
        entryFee: 0,
        prizePool: 0,
        format: 'SINGLE_ELIMINATION',
        rules: JSON.stringify({}),
        createdBy: 'admin-1',
      };

      mockPrismaService.tournament.create.mockResolvedValue(mockTournament);

      const result = await service.create(createTournamentDto, 'admin-1');

      expect(mockPrismaService.tournament.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          maxPlayers: 8,
          entryFee: 0,
          prizePool: 0,
          format: 'SINGLE_ELIMINATION',
          rules: JSON.stringify({}),
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated tournaments', async () => {
      const mockTournaments = [
        {
          id: 'tournament-1',
          name: 'Test Tournament 1',
          status: TournamentStatus.UPCOMING,
          startTime: new Date(),
          venue: { name: 'Venue 1' },
          _count: { participants: 5, matches: 0 },
        },
        {
          id: 'tournament-2',
          name: 'Test Tournament 2',
          status: TournamentStatus.IN_PROGRESS,
          startTime: new Date(),
          venue: { name: 'Venue 2' },
          _count: { participants: 8, matches: 3 },
        },
      ];

      mockPrismaService.tournament.findMany.mockResolvedValue(mockTournaments);
      mockPrismaService.tournament.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(mockPrismaService.tournament.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { startTime: 'asc' },
        skip: 0,
        take: 10,
      });

      expect(result).toEqual({
        tournaments: mockTournaments,
        totalCount: 2,
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should filter tournaments by status', async () => {
      mockPrismaService.tournament.findMany.mockResolvedValue([]);
      mockPrismaService.tournament.count.mockResolvedValue(0);

      await service.findAll({ status: TournamentStatus.UPCOMING });

      expect(mockPrismaService.tournament.findMany).toHaveBeenCalledWith({
        where: { status: TournamentStatus.UPCOMING },
        include: expect.any(Object),
        orderBy: { startTime: 'asc' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findOne', () => {
    it('should return tournament with full details', async () => {
      const mockTournament = {
        id: 'tournament-1',
        name: 'Test Tournament',
        status: TournamentStatus.UPCOMING,
        startTime: new Date(),
        participants: [
          {
            id: 'participant-1',
            userId: 'user-1',
            seed: 1,
            status: ParticipantStatus.REGISTERED,
            joinedAt: new Date(),
            user: {
              id: 'user-1',
              username: 'testuser',
              profile: {
                avatarUrl: 'avatar.jpg',
                skillRating: 1500,
              },
            },
          },
        ],
        matches: [
          {
            id: 'match-1',
            playerAId: 'user-1',
            playerBId: 'user-2',
            status: 'SCHEDULED',
            scoreA: 0,
            scoreB: 0,
            bracketRound: 1,
            bracketMatch: 1,
            playerA: { username: 'player1' },
            playerB: { username: 'player2' },
            winner: null,
          },
        ],
        bracket: {
          id: 'bracket-1',
          structure: JSON.stringify({}),
          currentRound: 1,
          totalRounds: 4,
          status: 'PENDING',
        },
        _count: { participants: 1, matches: 1 },
      };

      mockPrismaService.tournament.findUnique.mockResolvedValue(mockTournament);

      const result = await service.findOne('tournament-1');

      expect(mockPrismaService.tournament.findUnique).toHaveBeenCalledWith({
        where: { id: 'tournament-1' },
        include: expect.any(Object),
      });

      expect(result).toEqual(mockTournament);
    });

    it('should throw NotFoundException for non-existent tournament', async () => {
      mockPrismaService.tournament.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Tournament not found'
      );
    });
  });

  describe('joinTournament', () => {
    const mockTournament = {
      id: 'tournament-1',
      name: 'Test Tournament',
      status: TournamentStatus.UPCOMING,
      maxPlayers: 16,
      currentParticipants: 5,
      entryFee: 100,
      participants: [],
    };

    beforeEach(() => {
      mockPrismaService.tournament.findUnique.mockResolvedValue(mockTournament);
      mockPrismaService.tournamentParticipant.findUnique.mockResolvedValue(
        null
      );
    });

    it('should successfully join tournament', async () => {
      const tournamentId = 'tournament-1';
      const userId = 'user-1';
      const joinTournamentDto = {};

      const mockUser = {
        id: userId,
        dojoCoinBalance: 200,
      };

      const mockParticipant = {
        id: 'participant-1',
        tournamentId,
        userId,
        status: ParticipantStatus.REGISTERED,
        joinedAt: new Date(),
        tournament: {
          id: tournamentId,
          name: 'Test Tournament',
          entryFee: 100,
        },
        user: {
          id: userId,
          username: 'testuser',
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.tournamentParticipant.create.mockResolvedValue(
        mockParticipant
      );
      mockPrismaService.tournament.update.mockResolvedValue({
        ...mockTournament,
        currentParticipants: 6,
      });

      const result = await service.joinTournament(
        tournamentId,
        joinTournamentDto,
        userId
      );

      expect(
        mockPrismaService.tournamentParticipant.create
      ).toHaveBeenCalledWith({
        data: {
          tournamentId,
          userId,
          status: ParticipantStatus.REGISTERED,
        },
        include: expect.any(Object),
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          dojoCoinBalance: {
            decrement: 100,
          },
        },
      });

      expect(mockPrismaService.tournament.update).toHaveBeenCalledWith({
        where: { id: tournamentId },
        data: {
          prizePool: {
            increment: 100,
          },
        },
      });

      expect(result).toEqual(mockParticipant);
    });

    it('should join free tournament without deducting coins', async () => {
      const freeTournament = { ...mockTournament, entryFee: 0 };
      mockPrismaService.tournament.findUnique.mockResolvedValue(freeTournament);

      const mockParticipant = {
        id: 'participant-2',
        tournamentId: 'tournament-1',
        userId: 'user-1',
        status: ParticipantStatus.REGISTERED,
        tournament: { entryFee: 0 },
      };

      mockPrismaService.tournamentParticipant.create.mockResolvedValue(
        mockParticipant
      );

      await service.joinTournament('tournament-1', {}, 'user-1');

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw error if tournament registration is closed', async () => {
      const closedTournament = {
        ...mockTournament,
        status: TournamentStatus.IN_PROGRESS,
      };
      mockPrismaService.tournament.findUnique.mockResolvedValue(
        closedTournament
      );

      await expect(
        service.joinTournament('tournament-1', {}, 'user-1')
      ).rejects.toThrow('Tournament registration is not open');
    });

    it('should throw error if tournament is full', async () => {
      const fullTournament = { ...mockTournament, currentParticipants: 16 };
      mockPrismaService.tournament.findUnique.mockResolvedValue(fullTournament);

      await expect(
        service.joinTournament('tournament-1', {}, 'user-1')
      ).rejects.toThrow('Tournament is full');
    });

    it('should throw error if user already registered', async () => {
      mockPrismaService.tournamentParticipant.findUnique.mockResolvedValue({
        id: 'existing-participant',
      });

      await expect(
        service.joinTournament('tournament-1', {}, 'user-1')
      ).rejects.toThrow('User is already registered for this tournament');
    });

    it('should throw error if insufficient coins', async () => {
      const mockUser = {
        id: 'user-1',
        dojoCoinBalance: 50, // Less than entry fee of 100
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.joinTournament('tournament-1', {}, 'user-1')
      ).rejects.toThrow('Insufficient DojoCoins for tournament entry');
    });
  });

  describe('leaveTournament', () => {
    const mockTournament = {
      id: 'tournament-1',
      status: TournamentStatus.UPCOMING,
      entryFee: 100,
    };

    const mockParticipant = {
      id: 'participant-1',
      tournamentId: 'tournament-1',
      userId: 'user-1',
    };

    it('should successfully leave tournament and refund coins', async () => {
      mockPrismaService.tournament.findUnique.mockResolvedValue(mockTournament);
      mockPrismaService.tournamentParticipant.findUnique.mockResolvedValue(
        mockParticipant
      );
      mockPrismaService.tournament.update.mockResolvedValue(mockTournament);

      const result = await service.leaveTournament('tournament-1', 'user-1');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          dojoCoinBalance: {
            increment: 100,
          },
        },
      });

      expect(mockPrismaService.tournament.update).toHaveBeenCalledWith({
        where: { id: 'tournament-1' },
        data: {
          prizePool: {
            decrement: 100,
          },
        },
      });

      expect(
        mockPrismaService.tournamentParticipant.delete
      ).toHaveBeenCalledWith({
        where: {
          tournamentId_userId: {
            tournamentId: 'tournament-1',
            userId: 'user-1',
          },
        },
      });

      expect(result).toEqual({ success: true });
    });

    it('should leave tournament without refund for free tournament', async () => {
      const freeTournament = { ...mockTournament, entryFee: 0 };
      mockPrismaService.tournament.findUnique.mockResolvedValue(freeTournament);

      await service.leaveTournament('tournament-1', 'user-1');

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw error if tournament has started', async () => {
      const startedTournament = {
        ...mockTournament,
        status: TournamentStatus.IN_PROGRESS,
      };
      mockPrismaService.tournament.findUnique.mockResolvedValue(
        startedTournament
      );

      await expect(
        service.leaveTournament('tournament-1', 'user-1')
      ).rejects.toThrow('Cannot leave tournament that has started');
    });
  });

  describe('generateBracket', () => {
    const mockTournament = {
      id: 'tournament-1',
      name: 'Test Tournament',
      status: TournamentStatus.UPCOMING,
      format: 'SINGLE_ELIMINATION',
      participants: [
        {
          id: 'p1',
          userId: 'user-1',
          user: { profile: { skillRating: 1600 } },
        },
        {
          id: 'p2',
          userId: 'user-2',
          user: { profile: { skillRating: 1500 } },
        },
        {
          id: 'p3',
          userId: 'user-3',
          user: { profile: { skillRating: 1400 } },
        },
        {
          id: 'p4',
          userId: 'user-4',
          user: { profile: { skillRating: 1300 } },
        },
      ],
      bracket: null,
    };

    it('should generate bracket for tournament', async () => {
      mockPrismaService.tournament.findUnique.mockResolvedValue(mockTournament);
      mockPrismaService.bracket.upsert.mockResolvedValue({
        id: 'bracket-1',
        tournamentId: 'tournament-1',
        structure: JSON.stringify({}),
        currentRound: 1,
        totalRounds: 2,
        status: 'GENERATED',
      });

      const result = await service.generateBracket('tournament-1', 'admin-1');

      expect(
        mockPrismaService.tournamentParticipant.update
      ).toHaveBeenCalledTimes(4); // Update seeds
      expect(mockPrismaService.bracket.upsert).toHaveBeenCalled();
      expect(result.status).toBe('GENERATED');
    });

    it('should throw error if tournament has already started', async () => {
      const startedTournament = {
        ...mockTournament,
        status: TournamentStatus.IN_PROGRESS,
      };
      mockPrismaService.tournament.findUnique.mockResolvedValue(
        startedTournament
      );

      await expect(
        service.generateBracket('tournament-1', 'admin-1')
      ).rejects.toThrow(
        'Cannot generate bracket for tournament that has started'
      );
    });

    it('should throw error if tournament has too few participants', async () => {
      const emptyTournament = { ...mockTournament, participants: [] };
      mockPrismaService.tournament.findUnique.mockResolvedValue(
        emptyTournament
      );

      await expect(
        service.generateBracket('tournament-1', 'admin-1')
      ).rejects.toThrow('Tournament needs at least 2 participants');
    });
  });

  describe('startTournament', () => {
    it('should start tournament successfully', async () => {
      const mockTournament = {
        id: 'tournament-1',
        status: TournamentStatus.UPCOMING,
        participants: [{ id: 'p1' }, { id: 'p2' }],
        bracket: null,
      };

      mockPrismaService.tournament.findUnique.mockResolvedValue(mockTournament);
      mockPrismaService.tournament.update.mockResolvedValue({
        ...mockTournament,
        status: TournamentStatus.IN_PROGRESS,
      });

      const result = await service.startTournament('tournament-1', 'admin-1');

      expect(mockPrismaService.tournament.update).toHaveBeenCalledWith({
        where: { id: 'tournament-1' },
        data: {
          status: TournamentStatus.IN_PROGRESS,
          startTime: expect.any(Date),
        },
      });

      expect(result).toEqual({ success: true });
    });

    it('should throw error if tournament cannot be started', async () => {
      const mockTournament = {
        id: 'tournament-1',
        status: TournamentStatus.IN_PROGRESS,
      };

      mockPrismaService.tournament.findUnique.mockResolvedValue(mockTournament);

      await expect(
        service.startTournament('tournament-1', 'admin-1')
      ).rejects.toThrow('Tournament cannot be started');
    });
  });

  describe('getUserTournamentHistory', () => {
    it('should return user tournament participation history', async () => {
      const userId = 'user-1';
      const mockParticipations = [
        {
          id: 'participation-1',
          tournamentId: 'tournament-1',
          status: ParticipantStatus.ACTIVE,
          joinedAt: new Date(),
          tournament: {
            id: 'tournament-1',
            name: 'Test Tournament 1',
            status: TournamentStatus.COMPLETED,
            venue: { name: 'Venue 1' },
            _count: { participants: 8, matches: 7 },
          },
        },
      ];

      mockPrismaService.tournamentParticipant.findMany.mockResolvedValue(
        mockParticipations
      );
      mockPrismaService.tournamentParticipant.count.mockResolvedValue(1);

      const result = await service.getUserTournamentHistory(userId, 1, 10);

      expect(
        mockPrismaService.tournamentParticipant.findMany
      ).toHaveBeenCalledWith({
        where: { userId },
        include: expect.any(Object),
        orderBy: { joinedAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(result).toEqual({
        participations: mockParticipations,
        totalCount: 1,
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });
  });
});
