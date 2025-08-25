import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ErrorUtils } from '../common';
import { PrismaService } from '../prisma/prisma.service';

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
}
