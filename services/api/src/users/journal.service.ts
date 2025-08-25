import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface JournalItem {
  type: 'activity' | 'notification';
  message: string;
  timestamp: string; // ISO string
  relatedEntityId?: string | null;
  id: string; // source record id
  rawType?: string; // for activity events original type
}

export interface JournalResult {
  items: JournalItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

@Injectable()
export class JournalService {
  private readonly logger = new Logger(JournalService.name);

  constructor(private readonly prisma: PrismaService) {}

  private clampPage(page?: number) {
    const p = Number.isFinite(page as number) ? (page as number) : 1;
    return Math.max(1, Math.floor(p));
  }

  private clampLimit(limit?: number) {
    const l = Number.isFinite(limit as number) ? (limit as number) : 20;
    return Math.max(1, Math.min(100, Math.floor(l)));
  }

  async getJournal(userId: string, page?: number, limit?: number): Promise<JournalResult> {
    const pageNum = this.clampPage(page);
    const limitNum = this.clampLimit(limit);

    const take = pageNum * limitNum; // fetch enough from each source to build the combined page

    const [activityTotal, notificationTotal] = await Promise.all([
      this.prisma.activityEvent.count({ where: { userId } }),
      this.prisma.notification.count({ where: { recipientId: userId } }),
    ]);

    const total = activityTotal + notificationTotal;
    const totalPages = Math.max(1, Math.ceil(total / limitNum));

    // Early return when nothing to show
    if (total === 0) {
      return {
        items: [],
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
    }

    const [activities, notifications] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          type: true,
          message: true,
          createdAt: true,
          matchId: true,
          venueId: true,
          tournamentId: true,
          clanId: true,
        },
      }),
      this.prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          type: true,
          message: true,
          createdAt: true,
          payload: true,
        },
      }),
    ]);

    const activityItems: JournalItem[] = activities.map((e) => ({
      type: 'activity',
      id: e.id,
      message: e.message,
      rawType: e.type as string,
      timestamp: e.createdAt.toISOString(),
      relatedEntityId: e.matchId || e.venueId || e.tournamentId || e.clanId || null,
    }));

    const notificationItems: JournalItem[] = notifications.map((n) => {
      let relatedEntityId: string | null = null;
      try {
        if (n.payload) {
          const data = JSON.parse(n.payload as unknown as string);
          // Try common keys
          relatedEntityId = data?.matchId || data?.venueId || data?.tournamentId || data?.clanId || data?.id || null;
        }
      } catch (_err) {
        // ignore JSON parse errors, payload might be null or already an object in some environments
      }
      return {
        type: 'notification',
        id: n.id,
        message: n.message,
        timestamp: n.createdAt.toISOString(),
        relatedEntityId,
      };
    });

    const combined = [...activityItems, ...notificationItems];

    combined.sort((a, b) => (a.timestamp > b.timestamp ? -1 : a.timestamp < b.timestamp ? 1 : 0));

    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const items = combined.slice(start, end);

    return {
      items,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    };
  }
}
