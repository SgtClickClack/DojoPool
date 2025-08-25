import { Injectable, Logger } from '@nestjs/common';
import { ErrorUtils } from '../common';
import { NotificationTemplatesService } from '../notifications/notification-templates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TerritoriesService {
  private readonly logger = new Logger(TerritoriesService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private notificationTemplates: NotificationTemplatesService
  ) {}

  async findAllTerritories(): Promise<any[]> {
    try {
      return await this.prisma.territory.findMany({
        select: {
          id: true,
          name: true,
          venue: {
            select: {
              id: true,
              name: true,
              controllingClan: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('fetch territories', undefined, err)
      );
      throw err;
    }
  }

  async getTerritoriesByClan(clanId: string) {
    try {
      const territories = await this.prisma.territory.findMany({
        where: { clanId },
        include: {
          venue: {
            select: { id: true, name: true },
          },
          owner: {
            select: { id: true, username: true },
          },
        },
      });

      return territories;
    } catch (err) {
      this.logger.warn(
        `DB getTerritoriesByClan failed: ${ErrorUtils.getErrorMessage(err)}`
      );
      return [];
    }
  }

  async getTerritoriesByVenue(venueId: string) {
    try {
      return await this.prisma.territory.findMany({
        where: { venueId },
        include: {
          owner: {
            select: { id: true, username: true },
          },
          clan: {
            select: { id: true, name: true },
          },
        },
      });
    } catch (err) {
      this.logger.warn(
        `DB getTerritoriesByVenue failed: ${ErrorUtils.getErrorMessage(err)}`
      );
      return [];
    }
  }

  // Awards influence to a winning player at a venue and recalculates clan control
  async awardInfluence(
    winnerId: string,
    venueId: string,
    influenceAmount: number
  ) {
    try {
      // Find or create territory for this venue
      let territory = await this.prisma.territory.findFirst({
        where: { venueId },
      });

      const previousOwnerId = territory?.ownerId ?? null;

      if (!territory) {
        // Create new territory
        territory = await this.prisma.territory.create({
          data: {
            name: `Territory of ${venueId}`,
            venueId,
            ownerId: winnerId,
          },
        });
      } else {
        // Update existing territory
        territory = await this.prisma.territory.update({
          where: { id: territory.id },
          data: { ownerId: winnerId },
        });
      }

      // Update venue controlling clan
      const winnerClan = await this.getUserClan(winnerId);
      if (winnerClan) {
        await this.prisma.venue.update({
          where: { id: venueId },
          data: { controllingClanId: winnerClan.id },
        });
      }

      // Emit notifications when ownership changes
      if (previousOwnerId !== winnerId) {
        // Get venue and user details for notifications
        const [venue, winner] = await Promise.all([
          this.prisma.venue.findUnique({
            where: { id: venueId },
            select: { name: true },
          }),
          this.prisma.user.findUnique({
            where: { id: winnerId },
            select: { username: true },
          }),
        ]);

        // Notify new owner
        try {
          const template =
            this.notificationTemplates.getTerritoryChangedTemplate(
              venue?.name || 'Unknown Venue',
              winner?.username || 'Unknown User'
            );

          await this.notifications.createNotification(
            winnerId,
            template.type,
            template.message,
            { territoryId: territory.id, venueId, previousOwnerId }
          );
        } catch (notifyErr: any) {
          this.logger.warn(
            `Failed to notify new owner: ${
              notifyErr?.message ?? String(notifyErr)
            }`
          );
        }

        // Notify previous owner (if existed and different)
        if (previousOwnerId) {
          try {
            const template =
              this.notificationTemplates.getTerritoryChangedTemplate(
                venue?.name || 'Unknown Venue',
                winner?.username || 'Unknown User'
              );

            await this.notifications.createNotification(
              previousOwnerId,
              template.type,
              template.message,
              { territoryId: territory.id, venueId, newOwnerId: winnerId }
            );
          } catch (notifyErr: any) {
            this.logger.warn(
              `Failed to notify previous owner: ${
                notifyErr?.message ?? String(notifyErr)
              }`
            );
          }
        }
      }

      return territory;
    } catch (err) {
      this.logger.error(
        `Failed to award influence: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  private async getUserClan(userId: string) {
    try {
      const membership = await this.prisma.clanMember.findFirst({
        where: { userId },
        include: { clan: true },
      });
      return membership?.clan || null;
    } catch (err) {
      this.logger.warn(
        `Failed to get user clan: ${ErrorUtils.getErrorMessage(err)}`
      );
      return null;
    }
  }
}
