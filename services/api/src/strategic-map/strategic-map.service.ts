import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorldMapGateway } from '../world-map/world-map.gateway';

@Injectable()
export class StrategicMapService {
  private readonly logger = new Logger(StrategicMapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly worldMap: WorldMapGateway
  ) {}

  async tickResources() {
    await this.worldMap.tickResourcesForAllTerritories();
  }

  async getOverview() {
    const territories = await this.prisma.territory.findMany({
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
      strategicValue: (t as any).strategicValue ?? 0,
      resources: (t as any).resources ?? {},
    }));
  }
}
