import { Injectable, Logger } from '@nestjs/common';
import {
  CACHE_PRESETS,
  StandardizedCacheService,
} from '../cache/standardized-cache.service';
import { ErrorUtils } from '../common';
import { NotificationTemplatesService } from '../notifications/notification-templates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TerritoriesService {
  private readonly logger = new Logger(TerritoriesService.name);

  constructor(
    private prisma: PrismaService,
    private cache: StandardizedCacheService,
    private notifications: NotificationsService,
    private notificationTemplates: NotificationTemplatesService
  ) {}

  async findAllTerritories(): Promise<any[]> {
    const cacheKey = 'all';

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        try {
          return await this.prisma.territory.findMany({
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
      },
      CACHE_PRESETS.TERRITORY_DATA
    );
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

  // Strategic map methods
  async getStrategicMap(bbox?: string) {
    // For now, return all territories with minimal shape; bbox can be parsed later
    const territories = await this.prisma.territory.findMany({
      include: {
        venue: { select: { id: true, name: true, lat: true, lng: true } },
        clan: { select: { id: true, name: true } },
        owner: { select: { id: true, username: true } },
        contestedBy: { select: { id: true, username: true } },
      },
    });

    return territories.map((t) => ({
      id: t.id,
      name: t.name,
      venueId: t.venueId,
      coordinates: t.venue ? { lat: t.venue.lat, lng: t.venue.lng } : undefined,
      owner: t.owner ? { id: t.owner.id, username: t.owner.username } : null,
      clan: t.clan ? { id: t.clan.id, name: t.clan.name } : null,
      contestedBy: t.contestedBy
        ? { id: t.contestedBy.id, username: t.contestedBy.username }
        : null,
      level: t.level,
      defenseScore: t.defenseScore,
      strategicValue: (t as any).strategicValue ?? 0,
      resources: (t as any).resources ?? {},
      status: t.status,
      contestDeadline: t.contestDeadline,
      lastOwnershipChange: t.lastOwnershipChange,
      lastActivity: t.updatedAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  async scoutTerritory(territoryId: string, playerId: string) {
    // No-op for permissions for now; record an event
    const event = await this.prisma.territoryEvent.create({
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

  async claimTerritory(territoryId: string, playerId: string) {
    try {
      // Check if territory exists and is unclaimed
      const territory = await this.prisma.territory.findUnique({
        where: { id: territoryId },
        include: { venue: true },
      });

      if (!territory) {
        throw new Error('Territory not found');
      }

      if (territory.ownerId) {
        throw new Error('Territory is already claimed');
      }

      // Update territory ownership
      const updatedTerritory = await this.prisma.territory.update({
        where: { id: territoryId },
        data: {
          ownerId: playerId,
          status: 'CLAIMED',
          lastOwnershipChange: new Date(),
          contestedById: null,
          contestDeadline: null,
        },
        include: {
          venue: { select: { id: true, name: true, lat: true, lng: true } },
          owner: { select: { id: true, username: true } },
          clan: { select: { id: true, name: true } },
        },
      });

      // Update venue controlling clan if player belongs to one
      const playerClan = await this.getUserClan(playerId);
      if (playerClan) {
        await this.prisma.venue.update({
          where: { id: territory.venueId },
          data: { controllingClanId: playerClan.id },
        });
      }

      // Record the claim event
      await this.prisma.territoryEvent.create({
        data: {
          territoryId,
          type: 'CLAIM',
          metadata: JSON.stringify({
            action: 'CLAIM',
            by: playerId,
            at: new Date().toISOString(),
            clanId: playerClan?.id,
          }),
        },
      });

      // Invalidate related caches
      await this.cache.invalidateTerritoryData(territoryId);
      await this.cache.invalidateUserData(playerId);

      return {
        success: true,
        territory: updatedTerritory,
        message: 'Territory claimed successfully',
      };
    } catch (err) {
      this.logger.error(
        `Failed to claim territory: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  async challengeTerritory(territoryId: string, challengerId: string) {
    try {
      // Check if territory exists and is claimed
      const territory = await this.prisma.territory.findUnique({
        where: { id: territoryId },
        include: {
          venue: true,
          owner: { select: { id: true, username: true } },
        },
      });

      if (!territory) {
        throw new Error('Territory not found');
      }

      if (!territory.ownerId) {
        throw new Error('Territory is not claimed - use claim instead');
      }

      if (territory.ownerId === challengerId) {
        throw new Error('Cannot challenge your own territory');
      }

      // Get challenger clan
      const challengerClan = await this.getUserClan(challengerId);

      // Set contest deadline (24 hours from now)
      const contestDeadline = new Date();
      contestDeadline.setHours(contestDeadline.getHours() + 24);

      // Update territory to contested status
      await this.prisma.territory.update({
        where: { id: territoryId },
        data: {
          status: 'CONTESTED',
          contestedById: challengerId,
          contestDeadline,
        },
      });

      // Create challenge record (you might want to create a Challenge model for this)
      // For now, we'll record it as a territory event
      const event = await this.prisma.territoryEvent.create({
        data: {
          territoryId,
          type: 'CHALLENGE',
          metadata: JSON.stringify({
            action: 'CHALLENGE',
            challengerId,
            defenderId: territory.ownerId,
            challengerClanId: challengerClan?.id,
            contestDeadline: contestDeadline.toISOString(),
            at: new Date().toISOString(),
          }),
        },
      });

      // Here you could integrate with a tournament/match system to create an actual battle
      // For now, we'll return the challenge details

      // Invalidate related caches
      await this.cache.invalidateTerritoryData(territoryId);
      await this.cache.invalidateUserData(challengerId);
      if (territory.ownerId) {
        await this.cache.invalidateUserData(territory.ownerId);
      }

      return {
        success: true,
        challengeId: event.id,
        territory: territory,
        message: `Challenge issued to ${territory.owner?.username}`,
        defenderId: territory.ownerId,
        challengerId,
      };
    } catch (err) {
      this.logger.error(
        `Failed to challenge territory: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  async manageTerritory(
    territoryId: string,
    action: 'upgrade_defense' | 'allocate_resources' | 'transfer_ownership',
    payload?: any
  ) {
    switch (action) {
      case 'upgrade_defense': {
        const updated = await this.prisma.territory.update({
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
        const current = await this.prisma.territory.findUnique({
          where: { id: territoryId },
          select: { resources: true },
        });
        const resources = {
          ...(current?.resources as any),
          ...(payload?.resources || {}),
        };
        await this.prisma.territory.update({
          where: { id: territoryId },
          data: { resources },
        });
        return { success: true };
      }
      case 'transfer_ownership': {
        const newOwnerId: string | undefined = payload?.newOwnerId;
        if (!newOwnerId) throw new Error('newOwnerId required');
        await this.prisma.territory.update({
          where: { id: territoryId },
          data: { ownerId: newOwnerId },
        });
        return { success: true };
      }
    }
  }

  async processTerritoryDecay() {
    try {
      const decayThreshold = new Date();
      decayThreshold.setDate(decayThreshold.getDate() - 30); // 30 days without activity

      // Find territories that haven't had ownership changes in 30 days
      const decayingTerritories = await this.prisma.territory.findMany({
        where: {
          status: 'CLAIMED',
          lastOwnershipChange: {
            lt: decayThreshold,
          },
        },
        include: {
          owner: { select: { id: true, username: true } },
          venue: { select: { id: true, name: true } },
        },
      });

      const results = [];

      for (const territory of decayingTerritories) {
        // Reduce defense score over time
        const daysSinceChange = Math.floor(
          (Date.now() - territory.lastOwnershipChange!.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        let newDefenseScore = territory.defenseScore;
        let shouldDecay = false;

        // Decay defense score based on time
        if (daysSinceChange > 60) {
          // Complete decay after 60 days
          newDefenseScore = 0;
          shouldDecay = true;
        } else if (daysSinceChange > 45) {
          // Warning decay after 45 days
          newDefenseScore = Math.max(0, territory.defenseScore - 2);
        } else if (daysSinceChange > 30) {
          // Initial decay after 30 days
          newDefenseScore = Math.max(0, territory.defenseScore - 1);
        }

        if (shouldDecay) {
          // Territory decays - becomes unclaimed
          await this.prisma.territory.update({
            where: { id: territory.id },
            data: {
              status: 'UNCLAIMED',
              ownerId: null,
              clanId: null,
              defenseScore: 0,
              contestedById: null,
              contestDeadline: null,
            },
          });

          // Record decay event
          await this.prisma.territoryEvent.create({
            data: {
              territoryId: territory.id,
              type: 'DECAY_COMPLETE',
              metadata: JSON.stringify({
                action: 'DECAY_COMPLETE',
                previousOwnerId: territory.ownerId,
                daysSinceChange,
                at: new Date().toISOString(),
              }),
            },
          });

          results.push({
            territoryId: territory.id,
            action: 'DECAYED',
            previousOwner: territory.owner?.username,
          });
        } else if (newDefenseScore !== territory.defenseScore) {
          // Update defense score
          await this.prisma.territory.update({
            where: { id: territory.id },
            data: { defenseScore: newDefenseScore },
          });

          // Record decay warning if significant
          if (newDefenseScore <= territory.defenseScore / 2) {
            await this.prisma.territoryEvent.create({
              data: {
                territoryId: territory.id,
                type: 'DECAY_WARNING',
                metadata: JSON.stringify({
                  action: 'DECAY_WARNING',
                  defenseScore: newDefenseScore,
                  daysSinceChange,
                  at: new Date().toISOString(),
                }),
              },
            });
          }

          results.push({
            territoryId: territory.id,
            action: 'DECAYED_DEFENSE',
            newDefenseScore,
            daysSinceChange,
          });
        }
      }

      return {
        success: true,
        processed: decayingTerritories.length,
        results,
      };
    } catch (err) {
      this.logger.error(
        `Failed to process territory decay: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  async resolveExpiredContests() {
    try {
      const now = new Date();

      // Find expired contests
      const expiredContests = await this.prisma.territory.findMany({
        where: {
          status: 'CONTESTED',
          contestDeadline: {
            lt: now,
          },
        },
        include: {
          owner: { select: { id: true, username: true } },
          contestedBy: { select: { id: true, username: true } },
          venue: { select: { id: true, name: true } },
        },
      });

      const results = [];

      for (const territory of expiredContests) {
        // Contest expires - challenger loses, territory remains with current owner
        await this.prisma.territory.update({
          where: { id: territory.id },
          data: {
            status: 'CLAIMED',
            contestedById: null,
            contestDeadline: null,
          },
        });

        // Record contest end event
        await this.prisma.territoryEvent.create({
          data: {
            territoryId: territory.id,
            type: 'CONTEST_END',
            metadata: JSON.stringify({
              action: 'CONTEST_EXPIRED',
              winnerId: territory.ownerId,
              loserId: territory.contestedById,
              at: new Date().toISOString(),
            }),
          },
        });

        results.push({
          territoryId: territory.id,
          action: 'CONTEST_EXPIRED',
          winner: territory.owner?.username,
          loser: territory.contestedBy?.username,
        });
      }

      return {
        success: true,
        processed: expiredContests.length,
        results,
      };
    } catch (err) {
      this.logger.error(
        `Failed to resolve expired contests: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }
}
