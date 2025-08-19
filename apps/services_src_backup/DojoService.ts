import { DojoPresenceService, PresenceUser } from './DojoPresenceService';

export interface DojoLeaderboardPlayer {
  id: string;
  name: string;
  avatar?: string;
  rank: number;
  level: number;
  wins: number;
  losses: number;
}

export interface DojoLeaderboard {
  dojoId: string;
  players: DojoLeaderboardPlayer[];
}

interface PlayerStats {
  level: number;
  wins: number;
  losses: number;
}

const STATS_PREFIX = 'dojopool_leaderboard_stats_';

function statsKey(dojoId: string, userId: string) {
  return `${STATS_PREFIX}${dojoId}_${userId}`;
}

function deterministicNumber(seed: string, min: number, max: number): number {
  // Simple deterministic hash-based number within [min, max]
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const range = max - min + 1;
  return min + (hash % range);
}

function readOrSeedStats(dojoId: string, user: PresenceUser): PlayerStats {
  if (typeof window === 'undefined') {
    // SSR-safe default
    return { level: 1, wins: 0, losses: 0 };
  }
  const key = statsKey(dojoId, user.id);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as PlayerStats;
      if (
        typeof parsed.level === 'number' &&
        typeof parsed.wins === 'number' &&
        typeof parsed.losses === 'number'
      ) {
        return parsed;
      }
    }
  } catch {}

  // Seed deterministic but user-specific values for a nicer demo
  const seed = `${dojoId}:${user.id}:${user.username}`;
  const level = deterministicNumber(seed + ':lvl', 1, 30);
  const wins = deterministicNumber(seed + ':w', 0, 120);
  const losses = deterministicNumber(seed + ':l', 0, 120 - Math.floor(wins / 4));
  const seeded: PlayerStats = { level, wins, losses };
  try {
    localStorage.setItem(key, JSON.stringify(seeded));
  } catch {}
  return seeded;
}

export class DojoService {
  static async getLeaderboard(dojoId: string): Promise<DojoLeaderboard> {
    if (typeof window === 'undefined') {
      return { dojoId, players: [] };
    }

    // Collect active players from presence
    const active = DojoPresenceService.getActive(dojoId);

    // Map to leaderboard players with stats
    const players = active.map((u) => {
      const stats = readOrSeedStats(dojoId, u);
      return {
        id: u.id,
        name: u.username,
        avatar: u.avatarUrl,
        level: stats.level,
        wins: stats.wins,
        losses: stats.losses,
        rank: 0, // assigned after sorting
      } as DojoLeaderboardPlayer;
    });

    // Sort by a composite score (wins weighted + level), then by name
    players.sort((a, b) => {
      const scoreA = a.wins * 3 + (a.level || 0) * 2 - a.losses;
      const scoreB = b.wins * 3 + (b.level || 0) * 2 - b.losses;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.name.localeCompare(b.name);
    });

    // Assign ranks starting from 1
    players.forEach((p, idx) => (p.rank = idx + 1));

    return { dojoId, players };
  }
}

export default DojoService;
