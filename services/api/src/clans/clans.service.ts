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

  constructor(private _prisma: PrismaService) {}

  async findClanByTag(tag: string) {
    try {
      return await this._prisma.clan.findFirst({
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
      const existingClan = await this._prisma.clan.findUnique({
        where: { name: data.name },
      });

      if (existingClan) {
        throw new ConflictException(
          `Clan with name '${data.name}' already exists`
        );
      }

      const clan = await this._prisma.clan.create({
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
      await this._prisma.clanMember.create({
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
      const clan = await this._prisma.clan.findUnique({
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
      // Check if clan exists and get its details
      const clan = await this._prisma.clan.findUnique({
        where: { id: clanId },
      });

      if (!clan) {
        throw new NotFoundException(`Clan with ID ${clanId} not found`);
      }

      // Check if clan is at max capacity (using default max of 50)
      const memberCount = await this._prisma.clanMember.count({
        where: { clanId },
      });

      if (memberCount >= 50) { // Default max members
        throw new BadRequestException('Clan is at maximum capacity');
      }

      // Check if user is already a member
      const existingMembership = await this._prisma.clanMember.findFirst({
        where: { clanId, userId },
      });

      if (existingMembership) {
        throw new BadRequestException('User is already a member of this clan');
      }

      // Add user to clan
      const membership = await this._prisma.clanMember.create({
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
      const membership = await this._prisma.clanMember.findFirst({
        where: { clanId, userId },
      });

      if (!membership) {
        throw new NotFoundException('User is not a member of this clan');
      }

      if (membership.role === 'LEADER') {
        throw new ConflictException('Clan leader cannot leave the clan');
      }

      const result = await this._prisma.clanMember.delete({
        where: { id: membership.id },
      });

      return result;
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
      return await this._prisma.clan.findMany({
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
      return await this._prisma.$transaction(async (tx) => {
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
          throw new ForbiddenException('Controlling clan not found');
        }
        if (clan.leaderId !== userId) {
          throw new ForbiddenException(
            'Only the clan leader can upgrade this dojo'
          );
        }

        if (clan.dojoCoinBalance < totalCost) {
          throw new BadRequestException(
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

  // Missing methods that tests are calling
  async updateClan(clanId: string, updateData: any, userId: string): Promise<any> {
    const clan = await this._prisma.clan.findUnique({
      where: { id: clanId },
    });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }
    if (clan.leaderId !== userId) {
      throw new ForbiddenException('Only the clan leader can update the clan');
    }
    return this._prisma.clan.update({
      where: { id: clanId },
      data: updateData,
    });
  }

  async deleteClan(clanId: string, userId: string): Promise<any> {
    const clan = await this._prisma.clan.findUnique({
      where: { id: clanId },
    });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }
    if (clan.leaderId !== userId) {
      throw new ForbiddenException('Only the clan leader can delete the clan');
    }
    return this._prisma.clan.delete({
      where: { id: clanId },
    });
  }

  async kickMember(clanId: string, memberId: string, leaderId: string): Promise<any> {
    const clan = await this._prisma.clan.findUnique({
      where: { id: clanId },
    });
    if (!clan) {
      throw new NotFoundException('Clan not found');
    }
    if (clan.leaderId !== leaderId) {
      throw new ForbiddenException('Only the clan leader can kick members');
    }
    return this._prisma.clanMember.delete({
      where: { clanId_userId: { clanId, userId: memberId } },
    });
  }

  calculateUpgradeCost(level: number): number {
    const baseCost = 1000;
    return baseCost * Math.pow(1.5, level - 1);
  }

  async getClanStatistics() {
    try {
      const [totalClans, totalMembers, clanStats] = await Promise.all([
        this.prisma.clan.count(),
        this.prisma.clanMember.count(),
        this.prisma.clanMember.groupBy({
          by: ['clanId'],
          _count: {
            clanId: true,
          },
        }),
      ]);

      // Calculate average members per clan
      const totalClansWithMembers = clanStats.length;
      const averageMembers = totalClansWithMembers > 0
        ? clanStats.reduce((sum, stat) => sum + stat._count.clanId, 0) / totalClansWithMembers
        : 0;

      return {
        totalClans,
        totalMembers,
        averageMembers: Math.round(averageMembers * 100) / 100, // Round to 2 decimal places
      };
    } catch (err) {
      this.logger.error(
        `Failed to get clan statistics: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  async getClanRankings(sortBy: 'treasury' | 'level' = 'treasury') {
    try {
      const orderBy = sortBy === 'treasury'
        ? { treasury: 'desc' as const }
        : { level: 'desc' as const };

      return await this._prisma.clan.findMany({
        orderBy,
        include: {
          leader: { select: { id: true, username: true } },
          _count: { select: { members: true } },
        },
        take: 10,
      });
    } catch (err) {
      this.logger.error(
        `Failed to get clan rankings: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  async validateClanLeadership(clanId: string, userId: string): Promise<boolean> {
    try {
      const clan = await this._prisma.clan.findUnique({
        where: { id: clanId },
        select: { leaderId: true },
      });

      return clan?.leaderId === userId;
    } catch (err) {
      this.logger.error(
        `Failed to validate clan leadership: ${ErrorUtils.getErrorMessage(err)}`
      );
      return false;
    }
  }

  async validateClanMembership(clanId: string, userId: string): Promise<boolean> {
    try {
      const membership = await this._prisma.clanMember.findFirst({
        where: { clanId, userId },
      });

      return !!membership;
    } catch (err) {
      this.logger.error(
        `Failed to validate clan membership: ${ErrorUtils.getErrorMessage(err)}`
      );
      return false;
    }
  }
}
