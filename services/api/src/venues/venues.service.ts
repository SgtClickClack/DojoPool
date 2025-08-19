import { BadRequestException, Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';
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
        status: data.status ?? 'AVAILABLE',
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
    if (typeof data.status === 'string') updateData.status = data.status;
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
        data: { status },
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
}
