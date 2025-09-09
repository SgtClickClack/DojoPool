import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStats, CdnCostResponse } from '@dojopool/types';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string): Promise<DashboardStats> {
    try {
      const [user, wins, losses, tournamentsJoined] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { dojoCoinBalance: true },
        }),
        this.prisma.match.count({
          where: { winnerId: userId, status: 'COMPLETED' },
        }),
        this.prisma.match.count({
          where: { loserId: userId, status: 'COMPLETED' },
        }),
        // If model/table doesn't exist in some environments, this will throw; we guard below
        this.prisma.tournamentParticipant.count({ where: { userId } }),
      ]);

      const dojoCoinBalance = user?.dojoCoinBalance ?? 0;
      const total = wins + losses;

      return {
        dojoCoinBalance,
        matches: { wins, losses, total },
        tournaments: { joined: tournamentsJoined ?? 0 },
      };
    } catch (err) {
      this.logger.warn(
        `Falling back to zeroed dashboard stats due to error: ${err instanceof Error ? err.message : String(err)}`
      );
      return {
        dojoCoinBalance: 0,
        matches: { wins: 0, losses: 0, total: 0 },
        tournaments: { joined: 0 },
      };
    }
  }

  // Returns static, realistic-looking mock data for CDN cost dashboard.
  async getCdnCost(): Promise<CdnCostResponse> {
    // Use a fixed base date to keep tests deterministic and data stable across runs
    const base = new Date('2025-08-25T00:00:00Z');

    // Create 30 days of mock data with gentle variance
    const breakdown: CdnCostBreakdownDay[] = Array.from(
      { length: 30 },
      (_, i) => {
        const d = new Date(base);
        d.setUTCDate(base.getUTCDate() - i);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        // Bandwidth oscillates between 34 and 46 GB roughly
        const gb = 34 + ((i * 3) % 13); // deterministic pattern in [34..46]
        const costPerGb = 0.1; // $0.10 per GB as a simple model
        const cost = Math.round(gb * costPerGb * 100) / 100; // round to 2 decimals
        return { date: dateStr, gb, cost };
      }
    ).reverse(); // chronological order from oldest -> newest

    const totalBandwidthGB = breakdown.reduce((sum, d) => sum + d.gb, 0);
    const totalCostUSD =
      Math.round(breakdown.reduce((sum, d) => sum + d.cost, 0) * 100) / 100;

    return {
      period: 'Last 30 Days',
      totalBandwidthGB,
      totalCostUSD,
      dailyBreakdown: breakdown,
    };
  }
}
