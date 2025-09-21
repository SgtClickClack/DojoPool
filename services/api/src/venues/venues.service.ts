import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CacheInvalidate, CacheKey, Cacheable } from '../cache/cache.decorator';
import { CacheHelper } from '../cache/cache.helper';
import { MatchesGateway } from '../matches/matches.gateway';
import { PrismaService } from '../prisma/prisma.service';

interface UpdateTableInput {
  venueId: string;
  tableId: string;
  status: string;
  matchId?: string;
}

@Injectable()
export class VenuesService {
  private readonly logger = new Logger(VenuesService.name);

  constructor(
    private readonly _prisma: PrismaService,
    private readonly _cacheHelper: CacheHelper,
    @Inject(forwardRef(() => MatchesGateway))
    private readonly _matchesGateway: MatchesGateway
  ) {}

  // Missing methods that tests are calling
  async getVenues(filters?: any): Promise<any[]> {
    return this._prisma.venue.findMany({
      where: filters,
      include: {
        owner: { select: { id: true, username: true } },
        _count: { select: { tablesList: true } },
      },
    });
  }

  async getVenueById(id: string): Promise<any> {
    const venue = await this._prisma.venue.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true } },
        tablesList: true,
      },
    });
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }
    return venue;
  }

  async createVenue(data: any, userId: string): Promise<any> {
    if (!data.name || !data.address) {
      throw new BadRequestException('Name and address are required');
    }
    return this._prisma.venue.create({
      data: {
        ...data,
        ownerId: userId,
      },
      include: {
        owner: { select: { id: true, username: true } },
      },
    });
  }

  async deleteVenue(id: string, userId: string): Promise<any> {
    const venue = await this._prisma.venue.findUnique({ where: { id } });
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }
    if (venue.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own venue');
    }
    return this._prisma.venue.delete({ where: { id } });
  }

  async updateTable(tableId: string, venueId: string, data: any): Promise<any> {
    const table = await this._prisma.table.findUnique({
      where: { id: tableId },
    });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    if (table.venueId !== venueId) {
      throw new ForbiddenException('Table does not belong to this venue');
    }
    return this._prisma.table.update({
      where: { id: tableId },
      data,
    });
  }

  async getVenueSpecials(venueId: string): Promise<any[]> {
    return this._prisma.venueSpecial.findMany({
      where: { venueId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createVenueSpecial(venueId: string, data: any, userId: string): Promise<any> {
    const venue = await this._prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }
    if (venue.ownerId !== userId) {
      throw new ForbiddenException('You can only create specials for your own venue');
    }
    return this._prisma.venueSpecial.create({
      data: {
        ...data,
        venueId,
      },
    });
  }

  async updateVenueSpecial(specialId: string, venueId: string, data: any, userId: string): Promise<any> {
    const venue = await this._prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }
    if (venue.ownerId !== userId) {
      throw new ForbiddenException('You can only update specials for your own venue');
    }
    return this._prisma.venueSpecial.update({
      where: { id: specialId },
      data,
    });
  }

  async deleteVenueSpecial(specialId: string, venueId: string, userId: string): Promise<any> {
    const venue = await this._prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }
    if (venue.ownerId !== userId) {
      throw new ForbiddenException('You can only delete specials for your own venue');
    }
    return this._prisma.venueSpecial.delete({ where: { id: specialId } });
  }

  async getVenueStatistics(): Promise<any> {
    const [totalVenues, totalTables, venueStats] = await Promise.all([
      this._prisma.venue.count(),
      this._prisma.table.count(),
      this._prisma.table.groupBy({
        by: ['venueId'],
        _count: {
          venueId: true,
        },
        where: {
          venueId: {
            not: undefined,
          },
        },
      }),
    ]);

    // Calculate average tables per venue
    const totalVenuesWithTables = venueStats.length;
    const averageTablesPerVenue = totalVenuesWithTables > 0
      ? venueStats.reduce((sum: number, stat: any) => sum + (stat._count?.venueId || 0), 0) / totalVenuesWithTables
      : 0;

    return {
      totalVenues,
      totalTables,
      averageTablesPerVenue: Math.round(averageTablesPerVenue * 100) / 100,
    };
  }

  async validateVenueOwnership(venueId: string, userId: string): Promise<boolean> {
    const venue = await this._prisma.venue.findUnique({
      where: { id: venueId },
      select: { ownerId: true },
    });
    return venue?.ownerId === userId;
  }

  async validateVenueAdminRole(venueId: string, userId: string): Promise<boolean> {
    const venue = await this._prisma.venue.findUnique({
      where: { id: venueId },
      select: { ownerId: true },
    });
    return venue?.ownerId === userId;
  }

  private async getVenueTables(venueId: string) {
    return this._prisma.table.findMany({
      where: { venueId },
      orderBy: { createdAt: 'asc' },
    });
  }

  @CacheInvalidate(['venues'])
  async createTable(venueId: string, data: { name: string; status?: string }) {
    if (!data?.name || typeof data.name !== 'string') {
      throw new BadRequestException('name is required');
    }

    // Optional: ensure venue exists
    const venue = await this._prisma.venue.findUnique({
      where: { id: venueId },
    });
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    const newTable = await this._prisma.table.create({
      data: {
        venueId,
        // Remove tableNumber as it doesn't exist in schema
        name: data.name,
        status: (data.status ?? 'AVAILABLE') as any,
      },
    });

    const tables = await this.getVenueTables(venueId);

    try {
      this._matchesGateway.broadcastVenueTablesUpdated(venueId, tables);
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to emit tablesUpdated event: ${
          (err as Error).message || String(err)
        }`
      );
    }

    return newTable;
  }

  async updateTableInfo(
    venueId: string,
    tableId: string,
    data: { name?: string; status?: string }
  ) {
    const table = await this._prisma.table.findUnique({
      where: { id: tableId },
    });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    if (table.venueId !== venueId) {
      throw new BadRequestException(
        'Table does not belong to the specified venue'
      );
    }

    const updateData: any = {};
    if (typeof data.name === 'string') updateData.name = data.name;
    if (data.status) updateData.status = data.status as any;
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No changes provided');
    }

    await this._prisma.table.update({
      where: { id: tableId },
      data: updateData,
    });

    const tables = await this.getVenueTables(venueId);

    try {
      this._matchesGateway.broadcastVenueTablesUpdated(venueId, tables);
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to emit tablesUpdated event: ${
          (err as Error).message || String(err)
        }`
      );
    }

    return tables;
  }

  async deleteTable(venueId: string, tableId: string) {
    const table = await this._prisma.table.findUnique({
      where: { id: tableId },
    });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    if (table.venueId !== venueId) {
      throw new BadRequestException(
        'Table does not belong to the specified venue'
      );
    }

    const deletedTable = await this._prisma.$transaction(async (tx: any) => {
      // Nullify references in matches first to avoid foreign key constraint issues
      await tx.match.updateMany({
        where: { tableId },
        data: { tableId: null },
      });
      return await tx.table.delete({ where: { id: tableId } });
    });

    const tables = await this.getVenueTables(venueId);

    try {
      this._matchesGateway.broadcastVenueTablesUpdated(venueId, tables);
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to emit tablesUpdated event: ${
          (err as Error).message || String(err)
        }`
      );
    }

    return deletedTable;
  }

  async updateTableStatus({
    venueId,
    tableId,
    status,
    matchId,
  }: UpdateTableInput) {
    // Validate input
    if (!status || typeof status !== 'string') {
      throw new BadRequestException('status is required');
    }

    // Ensure the table exists and belongs to this venue
    const table = await this._prisma.table.findUnique({
      where: { id: tableId },
    });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    if (table.venueId !== venueId) {
      throw new BadRequestException(
        'Table does not belong to the specified venue'
      );
    }

    // Optional: if matchId provided, ensure match exists and belongs to this venue
    if (matchId) {
      const match = await this._prisma.match.findUnique({
        where: { id: matchId },
      });
      if (!match) {
        throw new NotFoundException('Match not found');
      }
      if (match.venueId !== venueId) {
        throw new BadRequestException(
          'Match does not belong to the specified venue'
        );
      }
    }

    // Update within a transaction to maintain consistency if matchId provided
    const result = await this._prisma.$transaction(async (tx: any) => {
      const _updatedTable = await tx.table.update({
        where: { id: tableId },
        data: { status: status as any },
      });

      if (matchId) {
        // Assign the match to this table
        await tx.match.update({
          where: { id: matchId },
          data: { tableId: tableId },
        });
      }

      // Return table with basic info and any currently assigned in-progress match
      const payload = await tx.table.findUnique({
        where: { id: tableId },
        include: {
          matches: matchId
            ? {
                where: { id: matchId },
              }
            : false,
        },
      });

      return payload!;
    });

    // Emit real-time update to venue room (legacy single-table event)
    try {
      this._matchesGateway.broadcastVenueTableUpdate(venueId, result);
    } catch (err) {
      this.logger.warn(
        `Failed to emit tableUpdated event: ${
          (err as Error).message || String(err)
        }`
      );
    }

    return result;
  }

  private haversineDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async checkIn(params: {
    venueId: string;
    userId?: string;
    lat: number;
    lng: number;
  }) {
    const { venueId, userId, lat, lng } = params;

    if (!userId) {
      throw new BadRequestException('Authenticated user required');
    }
    if (
      typeof lat !== 'number' ||
      Number.isNaN(lat) ||
      typeof lng !== 'number' ||
      Number.isNaN(lng)
    ) {
      throw new BadRequestException('lat and lng must be valid numbers');
    }

    const venue = await this._prisma.venue.findUnique({
      where: { id: venueId },
    });
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    const distance = this.haversineDistanceMeters(
      lat,
      lng,
      venue.lat || 0,
      venue.lng || 0
    );
    const MAX_RADIUS_METERS = 100;
    if (distance > MAX_RADIUS_METERS) {
      throw new ForbiddenException('You are too far away to check in.');
    }

    await this._prisma.dojoCheckIn.create({
      data: {
        userId,
        venueId,
        // Remove dojoName as it doesn't exist in schema
      },
    });

    return {
      status: 'ok',
      message: 'Checked in successfully',
      distanceMeters: Math.round(distance),
    };
  }

  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'venues:owned',
    keyGenerator: (userId: string) => CacheKey('owned', userId),
  })
  async getOwnedVenues(userId: string) {
    return this._prisma.venue.findMany({ where: { ownerId: userId } });
  }

  @CacheInvalidate(['venues', 'venues:owned'])
  async updateVenue(id: string, userId: string, data: any) {
    const venue = await this._prisma.venue.findUnique({ where: { id } });
    if (!venue || venue.ownerId !== userId) throw new ForbiddenException();
    return this._prisma.venue.update({ where: { id }, data });
  }

  // New: get the single venue owned by the authenticated user
  async getMyVenue(userId: string) {
    const venue = await this._prisma.venue.findFirst({
      where: { ownerId: userId },
    });
    if (!venue) {
      throw new NotFoundException('You do not own a venue');
    }
    return venue;
  }

  // New: update the authenticated user's venue profile
  async updateMyVenue(userId: string, data: any) {
    const venue = await this._prisma.venue.findFirst({
      where: { ownerId: userId },
    });
    if (!venue) {
      throw new NotFoundException('You do not own a venue');
    }
    const allowed: any = {};
    if (typeof data?.description === 'string')
      allowed.description = data.description;
    if (data?.photos !== undefined) allowed.photos = data.photos;
    if (data?.openingHours !== undefined)
      allowed.openingHours = data.openingHours;
    if (typeof data?.address === 'string') allowed.address = data.address;
    if (Object.keys(allowed).length === 0) {
      throw new BadRequestException('No valid profile fields provided');
    }
    return this._prisma.venue.update({ where: { id: venue.id }, data: allowed });
  }

  // New: list specials for the authenticated user's venue
  async listMySpecials(userId: string) {
    const venue = await this._prisma.venue.findFirst({
      where: { ownerId: userId },
    });
    if (!venue) throw new NotFoundException('You do not own a venue');
    return this._prisma.venueSpecial.findMany({
      where: { venueId: venue.id },
      orderBy: { validUntil: 'asc' },
    });
  }

  // New: create a special for the authenticated user's venue
  async createMySpecial(userId: string, data: any) {
    const venue = await this._prisma.venue.findFirst({
      where: { ownerId: userId },
    });
    if (!venue) throw new NotFoundException('You do not own a venue');
    const title = data?.title;
    if (!title || typeof title !== 'string') {
      throw new BadRequestException('title is required');
    }
    let validUntil = data?.validUntil as any;
    if (!validUntil) {
      throw new BadRequestException('validUntil is required');
    }
    if (typeof validUntil === 'string') {
      const parsed = new Date(validUntil);
      if (isNaN(parsed.getTime()))
        throw new BadRequestException('validUntil must be a valid date');
      validUntil = parsed;
    }
    return this._prisma.venueSpecial.create({
      data: {
        venueId: venue.id,
        title,
        description:
          typeof data?.description === 'string' ? data.description : undefined,
        type: 'SPECIAL',
        // Remove startDate as it doesn't exist in schema
        validUntil: validUntil as Date,
      },
    });
  }

  // New: delete a special ensuring it belongs to the authenticated user's venue
  async deleteMySpecial(userId: string, specialId: string) {
    const special = await this._prisma.venueSpecial.findUnique({
      where: { id: specialId },
      include: { venue: { select: { id: true, ownerId: true } } },
    });
    if (!special) throw new NotFoundException('Special not found');
    if (special.venue?.ownerId !== userId) throw new ForbiddenException();
    await this._prisma.venueSpecial.delete({
      where: { id: specialId },
    });
    return { status: 'ok' };
  }

  // Sponsorship: set isSponsored=true for a tournament owned by this venue. Payment simulated.
  async sponsorTournament(
    userId: string,
    tournamentId: string,
    sponsorBannerUrl?: string
  ) {
    const venue = await this._prisma.venue.findFirst({
      where: { ownerId: userId },
    });
    if (!venue) throw new NotFoundException('You do not own a venue');

    const tournament = await this._prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.venueId !== venue.id)
      throw new ForbiddenException('Tournament does not belong to your venue');

    // Simulate payment processing (future integration point)
    this.logger.log(
      `Simulating sponsorship payment for venue ${venue.id} on tournament ${tournamentId}`
    );

    const updated = await this._prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        isSponsored: true,
        sponsorBannerUrl:
          typeof sponsorBannerUrl === 'string' && sponsorBannerUrl.length > 0
            ? sponsorBannerUrl
            : undefined,
      },
    });

    return {
      status: 'ok',
      message: 'Tournament sponsored successfully (payment simulated)',
      tournament: updated,
    };
  }

  // Quests: create a quest for the authenticated venue owner
  async createMyQuest(userId: string, data: any) {
    const venue = await this._prisma.venue.findFirst({
      where: { ownerId: userId },
    });
    if (!venue) throw new NotFoundException('You do not own a venue');

    const title = data?.title;
    const reward = data?.rewardDojoCoins;
    if (!title || typeof title !== 'string')
      throw new BadRequestException('title is required');
    if (typeof reward !== 'number' || !Number.isInteger(reward) || reward < 0) {
      throw new BadRequestException(
        'rewardDojoCoins must be a non-negative integer'
      );
    }

    const quest = await this._prisma.venueQuest.create({
      data: {
        venueId: venue.id,
        title,
        description:
          typeof data?.description === 'string' ? data.description : undefined,
        rewardDojoCoins: reward,
        isActive: data?.isActive === false ? false : true,
      },
    });

    return quest;
  }

  // Quests: delete a quest if it belongs to the owner's venue
  async deleteMyQuest(userId: string, questId: string) {
    const quest = await this._prisma.venueQuest.findUnique({
      where: { id: questId },
      include: { venue: { select: { id: true, ownerId: true } } },
    });
    if (!quest) throw new NotFoundException('Quest not found');
    if (quest.venue?.ownerId !== userId)
      throw new ForbiddenException('You are not allowed to delete this quest');

    await this._prisma.venueQuest.delete({ where: { id: questId } });
    return { status: 'ok' };
  }

  // Public: list all venues with filters and pagination
  async listVenues(filters: any, pagination: { page: number; limit: number }) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: any = {
      status: 'ACTIVE', // Only show active venues
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.city) {
      where.address = {
        ...where.address,
        city: { contains: filters.city, mode: 'insensitive' },
      };
    }

    if (filters.state) {
      where.address = {
        ...where.address,
        state: { contains: filters.state, mode: 'insensitive' },
      };
    }

    // Feature filters
    if (filters.hasTournaments) {
      where.features = {
        has: 'TOURNAMENTS',
      };
    }

    if (filters.hasFood) {
      where.features = {
        ...where.features,
        has:
          filters.hasFood && where.features?.has
            ? [...where.features.has, 'FOOD']
            : ['FOOD'],
      };
    }

    if (filters.hasBar) {
      where.features = {
        ...where.features,
        has:
          filters.hasBar && where.features?.has
            ? [...where.features.has, 'BAR']
            : ['BAR'],
      };
    }

    // Get total count for pagination
    const total = await this._prisma.venue.count({ where });

    // Get venues with related data
    const venues = await this._prisma.venue.findMany({
      where,
      skip,
      take: limit,
      include: {
        // tables: true, // Tables stored as field, not relation
        _count: {
          select: {
            // reviews: true, // Reviews stored as JSON, not relation
            // tables: true, // Tables stored as field, not relation
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPages = Math.ceil(total / limit);

    // Transform data to match frontend expectations
    const transformedVenues = venues.map((venue: any) => ({
      id: venue.id,
      name: venue.name,
      description: venue.description,
      status: venue.status,
      address: venue.address,
      images: venue.photos || [],
      rating: venue.rating || 0,
      features: venue.features || [],
      tables: [],
      reviews: [], // We'll populate this if needed
      lat: venue.lat,
      lng: venue.lng,
    }));

    return {
      venues: transformedVenues,
      total,
      page,
      totalPages,
    };
  }

  // Public: get venue by ID
  @Cacheable({
    ttl: 600, // 10 minutes
    keyPrefix: 'venues',
    keyGenerator: (id: string) => CacheKey('venue', id),
  })
  async getVenue(id: string) {
    const venue = await this._prisma.venue.findUnique({
      where: { id },
      include: {
        // tables: true, // Tables stored as field, not relation
        _count: {
          select: {
            // reviews: true, // Reviews stored as JSON, not relation
            // tables: true, // Tables stored as field, not relation
          },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    return {
      id: venue.id,
      name: venue.name,
      description: venue.description,
      status: venue.status,
      address: venue.address,
      images: venue.photos || [],
      rating: venue.rating || 0,
      features: venue.features || [],
      tables: [],
      reviews: [],
      lat: venue.lat,
      lng: venue.lng,
    };
  }

  // Public: list active quests for a venue
  async listActiveQuests(venueId: string) {
    if (!venueId || typeof venueId !== 'string') {
      throw new BadRequestException('venueId is required');
    }
    return this._prisma.venueQuest.findMany({
      where: { venueId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Tournament Management for Venue Owners

  // List tournaments for the authenticated venue owner
  async listMyTournaments(userId: string) {
    const venue = await this._prisma.venue.findFirst({
      where: { ownerId: userId },
    });
    if (!venue) throw new NotFoundException('You do not own a venue');
    
    return this._prisma.tournament.findMany({
      where: { venueId: venue.id },
      include: {
        _count: {
          select: { participants: true, matches: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Create a tournament for the authenticated venue owner
  async createMyTournament(userId: string, data: any) {
    const venue = await this._prisma.venue.findFirst({
      where: { ownerId: userId },
    });
    if (!venue) throw new NotFoundException('You do not own a venue');

    const { name, description: _description, startTime, endTime, maxPlayers, entryFee, prizePool, format, rewards } = data;

    if (!name || typeof name !== 'string') {
      throw new BadRequestException('name is required');
    }
    if (!startTime) {
      throw new BadRequestException('startTime is required');
    }

    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('startTime must be a valid date');
    }

    const tournament = await this._prisma.tournament.create({
      data: {
        venueId: venue.id,
        name,
        // description field does not exist in prisma Tournament model
        startTime: startDate,
        endTime: endTime ? new Date(endTime) : undefined,
        startDate: startDate,
        endDate: endTime ? new Date(endTime) : undefined,
        maxPlayers: maxPlayers || 8,
        entryFee: entryFee || 0,
        prizePool: prizePool || 0,
        format: format || 'SINGLE_ELIMINATION',
        rewards: rewards || undefined,
        status: 'UPCOMING',
      },
    });

    return tournament;
  }

  // Update a tournament for the authenticated venue owner
  async updateMyTournament(userId: string, tournamentId: string, data: any) {
    const venue = await this._prisma.venue.findFirst({
      where: { ownerId: userId },
    });
    if (!venue) throw new NotFoundException('You do not own a venue');

    const tournament = await this._prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.venueId !== venue.id) {
      throw new ForbiddenException('Tournament does not belong to your venue');
    }
    if (tournament.status !== 'UPCOMING') {
      throw new BadRequestException('Can only update upcoming tournaments');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startTime) {
      const startDate = new Date(data.startTime);
      if (!isNaN(startDate.getTime())) {
        updateData.startTime = startDate;
        updateData.startDate = startDate;
      }
    }
    if (data.endTime !== undefined) {
      const endDate = data.endTime ? new Date(data.endTime) : null;
      if (endDate && !isNaN(endDate.getTime())) {
        updateData.endTime = endDate;
        updateData.endDate = endDate;
      }
    }
    if (data.maxPlayers !== undefined) updateData.maxPlayers = data.maxPlayers;
    if (data.entryFee !== undefined) updateData.entryFee = data.entryFee;
    if (data.prizePool !== undefined) updateData.prizePool = data.prizePool;
    if (data.format) updateData.format = data.format;
    if (data.rewards !== undefined) updateData.rewards = data.rewards;

    return this._prisma.tournament.update({
      where: { id: tournamentId },
      data: updateData,
    });
  }

  // Start a tournament for the authenticated venue owner
  async startMyTournament(userId: string, tournamentId: string, _options?: { shuffleParticipants?: boolean }) {
    const venue = await this._prisma.venue.findFirst({
      where: { ownerId: userId },
    });
    if (!venue) throw new NotFoundException('You do not own a venue');

    const tournament = await this._prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true } }
          }
        }
      }
    });
    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.venueId !== venue.id) {
      throw new ForbiddenException('Tournament does not belong to your venue');
    }
    if (tournament.status !== 'UPCOMING' && tournament.status !== 'REGISTRATION') {
      throw new BadRequestException('Tournament has already started or finished');
    }
    if (tournament.participants.length < 2) {
      throw new BadRequestException('Need at least 2 participants to start tournament');
    }

    // Update tournament status to ACTIVE
    const updatedTournament = await this._prisma.tournament.update({
      where: { id: tournamentId },
      data: { 
        status: 'ACTIVE',
        startTime: new Date(), // Update actual start time
      },
    });

    // TODO: Generate tournament brackets/matches based on format
    // For now, just return the updated tournament
    return {
      tournament: updatedTournament,
      message: 'Tournament started successfully',
      participantCount: tournament.participants.length,
    };
  }

  // Get a single tournament for the authenticated venue owner
  async getMyTournament(userId: string, tournamentId: string) {
    const venue = await this._prisma.venue.findFirst({
      where: { ownerId: userId },
    });
    if (!venue) throw new NotFoundException('You do not own a venue');

    const tournament = await this._prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } }
          }
        },
        matches: {
          include: {
            playerA: { select: { id: true, username: true } },
            playerB: { select: { id: true, username: true } },
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { participants: true, matches: true }
        }
      }
    });

    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.venueId !== venue.id) {
      throw new ForbiddenException('Tournament does not belong to your venue');
    }

    return tournament;
  }

  // Delete a tournament for the authenticated venue owner
  async deleteMyTournament(userId: string, tournamentId: string) {
    const venue = await this._prisma.venue.findFirst({
      where: { ownerId: userId },
    });
    if (!venue) throw new NotFoundException('You do not own a venue');

    const tournament = await this._prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.venueId !== venue.id) {
      throw new ForbiddenException('Tournament does not belong to your venue');
    }
    if (tournament.status === 'ACTIVE') {
      throw new BadRequestException('Cannot delete an active tournament');
    }

    await this._prisma.tournament.delete({
      where: { id: tournamentId },
    });

    return { status: 'ok', message: 'Tournament deleted successfully' };
  }
}
