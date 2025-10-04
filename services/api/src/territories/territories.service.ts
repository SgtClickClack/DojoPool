import { Injectable, Logger } from '@nestjs/common';
import { ErrorUtils } from '../common';
import { NotificationTemplatesService } from '../notifications/notification-templates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TerritoriesService {
  private readonly logger = new Logger(TerritoriesService.name);

  constructor(
    private _prisma: PrismaService,
    private notifications: NotificationsService,
    private notificationTemplates: NotificationTemplatesService
  ) {}

  async findAllTerritories(): Promise<any[]> {
    try {
      return await this._prisma.territory.findMany({
        select: {
          id: true,
          name: true,
          strategicValue: true,
          resources: true,
          venue: {
            select: {
              id: true,
              name: true,
              controllingClanId: true,
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

  async getTerritoryStatistics(): Promise<any> {
    try {
      const totalTerritories = await this._prisma.territory.count();
      const controlledTerritories = await this._prisma.territory.count({
        where: {
          ownerId: {
            not: null,
          },
        },
      });
      const clanControlledTerritories = await this._prisma.territory.count({
        where: {
          clanId: {
            not: null,
          },
        },
      });

      return {
        totalTerritories,
        controlledTerritories,
        clanControlledTerritories,
        uncontrolledTerritories: totalTerritories - controlledTerritories,
      };
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage(
          'fetch territory statistics',
          undefined,
          err
        )
      );
      throw err;
    }
  }

  async getTerritoriesByClan(clanId: string) {
    try {
      const territories = await this._prisma.territory.findMany({
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
      return await this._prisma.territory.findMany({
        where: { venueId },
        include: {
          owner: {
            select: { id: true, username: true },
          },
          clan: {
            select: { id: true, name: true },
          },
          venue: {
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
    _influenceAmount: number
  ) {
    try {
      // Find or create territory for this venue
      let territory = await this._prisma.territory.findFirst({
        where: { venueId },
      });

      const previousOwnerId = territory?.ownerId ?? null;

      if (!territory) {
        // Create new territory
        territory = await this._prisma.territory.create({
          data: {
            name: `Territory of ${venueId}`,
            venueId,
            ownerId: winnerId,
          },
        });
      } else {
        // Update existing territory
        territory = await this._prisma.territory.update({
          where: { id: territory.id },
          data: { ownerId: winnerId },
        });
      }

      // Update venue controlling clan
      const winnerClan = await this.getUserClan(winnerId);
      if (winnerClan) {
        await this._prisma.venue.update({
          where: { id: venueId },
          data: { controllingClanId: winnerClan.id },
        });
      }

      // Emit notifications when ownership changes
      if (previousOwnerId !== winnerId) {
        // Get venue and user details for notifications
        const [venue, winner] = await Promise.all([
          this._prisma.venue.findUnique({
            where: { id: venueId },
            select: { name: true },
          }),
          this._prisma.user.findUnique({
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
        } catch (notifyErr: unknown) {
          this.logger.warn(
            `Failed to notify new owner: ${
              notifyErr instanceof Error ? notifyErr.message : String(notifyErr)
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
          } catch (notifyErr: unknown) {
            this.logger.warn(
              `Failed to notify previous owner: ${
                notifyErr instanceof Error
                  ? notifyErr.message
                  : String(notifyErr)
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
      const membership = await this._prisma.clanMember.findFirst({
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

  // Strategic map methods
  async getStrategicMap(_bbox?: string) {
    // For now, return all territories with minimal shape; bbox can be parsed later
    const territories = await this._prisma.territory.findMany({
      include: {
        venue: { select: { id: true, name: true, lat: true, lng: true } },
        clan: { select: { id: true, name: true } },
        owner: { select: { id: true, username: true } },
      },
    });

    return territories.map((t) => ({
      id: t.id,
      name: t.name,
      venueId: t.venueId,
      coordinates: t.venue ? { lat: t.venue.lat, lng: t.venue.lng } : undefined,
      owner: t.owner ? { id: t.owner.id, username: t.owner.username } : null,
      clan: t.clan ? { id: t.clan.id, name: t.clan.name } : null,
      level: t.level,
      defenseScore: t.defenseScore,
      strategicValue: (t as { strategicValue?: number }).strategicValue ?? 0,
      resources: (t as any).resources ?? {},
    }));
  }

  async scoutTerritory(territoryId: string, playerId: string) {
    // No-op for permissions for now; record an event
    const event = await this._prisma.territoryEvent.create({
      data: {
        territoryId,
        type: 'CLAIM',
        metadata: JSON.stringify({
          action: 'SCOUT',
          by: playerId,
          at: new Date().toISOString(),
        }),
      },
    });
    return { success: true, eventId: event.id };
  }

  async manageTerritory(
    territoryId: string,
    action: 'upgrade_defense' | 'allocate_resources' | 'transfer_ownership',
    payload?: Record<string, unknown>
  ) {
    switch (action) {
      case 'upgrade_defense': {
        const updated = await this._prisma.territory.update({
          where: { id: territoryId },
          data: {
            defenseScore: { increment: 1 },
            strategicValue: { increment: 2 },
          },
        });
        return {
          success: true,
          territoryId: updated.id,
          defenseScore: updated.defenseScore,
        };
      }
      case 'allocate_resources': {
        const current = await this._prisma.territory.findUnique({
          where: { id: territoryId },
          select: { resources: true },
        });
        const resources = {
          ...(current?.resources as any),
          ...((payload?.resources as any) || {}),
        };
        await this._prisma.territory.update({
          where: { id: territoryId },
          data: { resources },
        });
        return { success: true };
      }
      case 'transfer_ownership': {
        const newOwnerId: string = payload?.newOwnerId as string;
        if (!newOwnerId) throw new Error('newOwnerId required');
        await this._prisma.territory.update({
          where: { id: territoryId },
          data: { ownerId: newOwnerId },
        });
        return { success: true };
      }
    }
  }
}
