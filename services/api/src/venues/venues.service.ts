import { BadRequestException, Inject, Injectable, Logger, NotFoundException, ForbiddenException, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchesGateway } from '../matches/matches.gateway';


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
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => MatchesGateway))
    private readonly matchesGateway: MatchesGateway
  ) {}

  private async getVenueTables(venueId: string) {
    return this.prisma.table.findMany({ where: { venueId }, orderBy: { createdAt: 'asc' } });
  }

  async createTable(venueId: string, data: { name: string; status?: string }) {
    if (!data?.name || typeof data.name !== 'string') {
      throw new BadRequestException('name is required');
    }

    // Optional: ensure venue exists
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    await this.prisma.table.create({
      data: {
        venueId,
        name: data.name,
        status: (data.status ?? 'AVAILABLE') as any,
      },
    });

    const tables = await this.getVenueTables(venueId);

    try {
      this.matchesGateway.broadcastVenueTablesUpdated(venueId, tables);
    } catch (err) {
      this.logger.warn(`Failed to emit tablesUpdated event: ${err instanceof Error ? err.message : String(err)}`);
    }

    return tables;
  }

  async updateTableInfo(venueId: string, tableId: string, data: { name?: string; status?: string }) {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    if (table.venueId !== venueId) {
      throw new BadRequestException('Table does not belong to the specified venue');
    }

    const updateData: any = {};
    if (typeof data.name === 'string') updateData.name = data.name;
    if (data.status) updateData.status = data.status as any;
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No changes provided');
    }

    await this.prisma.table.update({ where: { id: tableId }, data: updateData });

    const tables = await this.getVenueTables(venueId);

    try {
      this.matchesGateway.broadcastVenueTablesUpdated(venueId, tables);
    } catch (err) {
      this.logger.warn(`Failed to emit tablesUpdated event: ${err instanceof Error ? err.message : String(err)}`);
    }

    return tables;
  }

  async deleteTable(venueId: string, tableId: string) {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    if (table.venueId !== venueId) {
      throw new BadRequestException('Table does not belong to the specified venue');
    }

    await this.prisma.$transaction(async (tx) => {
      // Nullify references in matches first to avoid foreign key constraint issues
      await tx.match.updateMany({ where: { tableId }, data: { tableId: null } });
      await tx.table.delete({ where: { id: tableId } });
    });

    const tables = await this.getVenueTables(venueId);

    try {
      this.matchesGateway.broadcastVenueTablesUpdated(venueId, tables);
    } catch (err) {
      this.logger.warn(`Failed to emit tablesUpdated event: ${err instanceof Error ? err.message : String(err)}`);
    }

    return tables;
  }

  async updateTableStatus({ venueId, tableId, status, matchId }: UpdateTableInput) {
    // Validate input
    if (!status || typeof status !== 'string') {
      throw new BadRequestException('status is required');
    }

    // Ensure the table exists and belongs to this venue
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    if (table.venueId !== venueId) {
      throw new BadRequestException('Table does not belong to the specified venue');
    }

    // Optional: if matchId provided, ensure match exists and belongs to this venue
    if (matchId) {
      const match = await this.prisma.match.findUnique({ where: { id: matchId } });
      if (!match) {
        throw new NotFoundException('Match not found');
      }
      if (match.venueId !== venueId) {
        throw new BadRequestException('Match does not belong to the specified venue');
      }
    }

    // Update within a transaction to maintain consistency if matchId provided
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedTable = await tx.table.update({
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
      this.matchesGateway.broadcastVenueTableUpdate(venueId, result);
    } catch (err) {
      this.logger.warn(`Failed to emit tableUpdated event: ${err instanceof Error ? err.message : String(err)}`);
    }

    return result;
  }

  private haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async checkIn(params: { venueId: string; userId?: string; lat: number; lng: number }) {
    const { venueId, userId, lat, lng } = params;

    if (!userId) {
      throw new BadRequestException('Authenticated user required');
    }
    if (
      typeof lat !== 'number' || Number.isNaN(lat) ||
      typeof lng !== 'number' || Number.isNaN(lng)
    ) {
      throw new BadRequestException('lat and lng must be valid numbers');
    }

    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    const distance = this.haversineDistanceMeters(lat, lng, venue.lat, venue.lng);
    const MAX_RADIUS_METERS = 100;
    if (distance > MAX_RADIUS_METERS) {
      throw new ForbiddenException('You are too far away to check in.');
    }

    await this.prisma.dojoCheckIn.create({
      data: {
        userId,
        venueId,
      },
    });

    return {
      status: 'ok',
      message: 'Checked in successfully',
      distanceMeters: Math.round(distance),
    };
  }
}
