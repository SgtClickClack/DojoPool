import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ErrorUtils } from '../common';
import { PrismaService } from '../prisma/prisma.service';
import { type UpgradeDojoDto } from './dto/upgrade-dojo.dto';

@Injectable()
export class ClansService {
  private readonly logger = new Logger(ClansService.name);

  constructor(private prisma: PrismaService) {}

  async findClanByTag(tag: string) {
    try {
      return await this.prisma.clan.findFirst({
        where: { name: { equals: tag } },
      });
    } catch (err) {
      this.logger.warn(
        `DB findClanByTag failed: ${ErrorUtils.getErrorMessage(err)}`
      );
      return null;
    }
  }

  async createClan(data: {
    name: string;
    description?: string;
    leaderId: string;
  }) {
    try {
      // Check if clan name already exists
      const existingClan = await this.prisma.clan.findUnique({
        where: { name: data.name },
      });

      if (existingClan) {
        throw new ConflictException(
          `Clan with name '${data.name}' already exists`
        );
      }

      const clan = await this.prisma.clan.create({
        data: {
          name: data.name,
          description: data.description,
          leaderId: data.leaderId,
          tag: data.name.toUpperCase().substring(0, 3), // Generate tag from name
        },
        include: {
          leader: { select: { id: true, username: true } },
          members: { select: { id: true, userId: true, role: true } },
        },
      });

      // Add leader as first member
      await this.prisma.clanMember.create({
        data: {
          clanId: clan.id,
          userId: data.leaderId,
          role: 'LEADER',
        },
      });

      return clan;
    } catch (err) {
      this.logger.error(
        `Failed to create clan: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  async getClanById(clanId: string) {
    try {
      const clan = await this.prisma.clan.findUnique({
        where: { id: clanId },
        include: {
          leader: { select: { id: true, username: true } },
          members: {
            include: {
              user: { select: { id: true, username: true } },
            },
          },
        },
      });

      if (!clan) {
        throw new NotFoundException(`Clan with ID ${clanId} not found`);
      }

      return clan;
    } catch (err) {
      this.logger.error(
        `Failed to get clan ${clanId}: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  async joinClan(clanId: string, userId: string) {
    try {
      // Check if user is already a member
      const existingMembership = await this.prisma.clanMember.findUnique({
        where: { clanId_userId: { clanId, userId } },
      });

      if (existingMembership) {
        throw new ConflictException('User is already a member of this clan');
      }

      // Add user to clan
      const membership = await this.prisma.clanMember.create({
        data: {
          clanId,
          userId,
          role: 'MEMBER',
        },
        include: {
          clan: { select: { id: true, name: true } },
          user: { select: { id: true, username: true } },
        },
      });

      return membership;
    } catch (err) {
      this.logger.error(
        `Failed to join clan ${clanId} for user ${userId}: ${ErrorUtils.getErrorMessage(
          err
        )}`
      );
      throw err;
    }
  }

  async leaveClan(clanId: string, userId: string) {
    try {
      const membership = await this.prisma.clanMember.findUnique({
        where: { clanId_userId: { clanId, userId } },
      });

      if (!membership) {
        throw new NotFoundException('User is not a member of this clan');
      }

      if (membership.role === 'LEADER') {
        throw new ConflictException('Clan leader cannot leave the clan');
      }

      await this.prisma.clanMember.delete({
        where: { clanId_userId: { clanId, userId } },
      });

      return { message: 'Successfully left clan' };
    } catch (err) {
      this.logger.error(
        `Failed to leave clan ${clanId} for user ${userId}: ${ErrorUtils.getErrorMessage(
          err
        )}`
      );
      throw err;
    }
  }

  async getAllClans() {
    try {
      return await this.prisma.clan.findMany({
        include: {
          leader: { select: { id: true, username: true } },
          _count: { select: { members: true } },
        },
      });
    } catch (err) {
      this.logger.warn(
        `DB getAllClans failed: ${ErrorUtils.getErrorMessage(err)}`
      );
      return [];
    }
  }

  async upgradeDojo(venueId: string, userId: string, dto: UpgradeDojoDto) {
    const type = dto.type;
    const levels = Math.max(1, Math.floor(dto.levels ?? 1));

    const incomeCost = Number.parseInt(
      process.env.DOJO_UPGRADE_INCOME_COST || '100',
      10
    );
    const defenseCost = Number.parseInt(
      process.env.DOJO_UPGRADE_DEFENSE_COST || '150',
      10
    );

    const costPerLevel = type === 'income' ? incomeCost : defenseCost;
    if (!Number.isFinite(costPerLevel) || costPerLevel < 0) {
      throw new BadRequestException('Invalid upgrade cost configuration');
    }
    const totalCost = costPerLevel * levels;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const venue = await tx.venue.findUnique({ where: { id: venueId } });
        if (!venue) {
          throw new NotFoundException(`Venue with ID ${venueId} not found`);
        }
        if (!venue.controllingClanId) {
          throw new BadRequestException('Venue has no controlling clan');
        }

        const clan = await tx.clan.findUnique({
          where: { id: venue.controllingClanId },
        });
        if (!clan) {
          throw new NotFoundException('Controlling clan not found');
        }
        if (clan.leaderId !== userId) {
          throw new ForbiddenException(
            'Only the clan leader can upgrade this dojo'
          );
        }

        if (clan.dojoCoinBalance < totalCost) {
          throw new ConflictException(
            'Insufficient DojoCoins for this upgrade'
          );
        }

        // Deduct cost first
        const updatedClan = await tx.clan.update({
          where: { id: clan.id },
          data: { dojoCoinBalance: { decrement: totalCost } },
          select: { id: true, dojoCoinBalance: true },
        });

        let updatedVenue;
        if (type === 'income') {
          const increment = 0.1 * levels;
          updatedVenue = await tx.venue.update({
            where: { id: venue.id },
            data: { incomeModifier: { increment } },
            select: { id: true, incomeModifier: true, defenseLevel: true },
          });
        } else {
          updatedVenue = await tx.venue.update({
            where: { id: venue.id },
            data: { defenseLevel: { increment: levels } },
            select: { id: true, incomeModifier: true, defenseLevel: true },
          });
        }

        return {
          success: true,
          clanId: clan.id,
          venueId: venue.id,
          type,
          levels,
          cost: totalCost,
          dojoCoinBalance: updatedClan.dojoCoinBalance,
          venue: updatedVenue,
        };
      });
    } catch (err) {
      this.logger.error(
        `Failed to upgrade dojo for venue ${venueId}: ${ErrorUtils.getErrorMessage(
          err
        )}`
      );
      throw err;
    }
  }
}
