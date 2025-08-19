import { PresenceUser } from './DojoPresenceService';

export type MatchStatus = 'in_progress' | 'paused';

export interface DojoMatchPlayer extends PresenceUser {}

export interface DojoMatch {
  id: string;
  dojoId: string;
  table: number;
  players: [DojoMatchPlayer, DojoMatchPlayer];
  startedAt: number; // epoch ms
  status: MatchStatus;
  lastUpdate: number; // epoch ms
}

type MatchesCallback = (matches: DojoMatch[]) => void;

const STORAGE_PREFIX = 'dojopool_matches_';
const CUSTOM_EVENT = 'dojopool:matches:update';

function storageKey(dojoId: string) {
  return `${STORAGE_PREFIX}${dojoId}`;
}

function now() {
  return Date.now();
}

function readMatches(dojoId: string): DojoMatch[] {
  try {
    const raw = localStorage.getItem(storageKey(dojoId));
    if (!raw) return [];
    const list = JSON.parse(raw) as DojoMatch[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeMatches(dojoId: string, entries: DojoMatch[]) {
  try {
    localStorage.setItem(storageKey(dojoId), JSON.stringify(entries));
  } catch (e) {
    console.error('DojoMatchesService write error', e);
  }
}

export class DojoMatchesService {
  static getActive(dojoId: string): DojoMatch[] {
    const list = readMatches(dojoId);
    return list
      .filter((m) => m.status === 'in_progress' || m.status === 'paused')
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  static startMatch(
    dojoId: string,
    p1: DojoMatchPlayer,
    p2: DojoMatchPlayer,
    table: number
  ): DojoMatch {
    const entries = readMatches(dojoId);
    const match: DojoMatch = {
      id: `${dojoId}_${table}_${now()}`,
      dojoId,
      table,
      players: [p1, p2],
      startedAt: now(),
      status: 'in_progress',
      lastUpdate: now(),
    };
    entries.push(match);
    writeMatches(dojoId, entries);
    this.notify(dojoId);
    return match;
  }

  static updateMatch(
    dojoId: string,
    id: string,
    patch: Partial<Pick<DojoMatch, 'status' | 'players' | 'table'>>
  ): DojoMatch | null {
    const entries = readMatches(dojoId);
    const idx = entries.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    entries[idx] = { ...entries[idx], ...patch, lastUpdate: now() };
    writeMatches(dojoId, entries);
    this.notify(dojoId);
    return entries[idx];
  }

  static endMatch(dojoId: string, id: string) {
    const entries = readMatches(dojoId).filter((m) => m.id !== id);
    writeMatches(dojoId, entries);
    this.notify(dojoId);
  }

  static createSampleMatches(dojoId: string) {
    const samplePlayers: DojoMatchPlayer[] = [
      {
        id: 'player1',
        username: 'RyuKlaw',
        avatarUrl: 'https://via.placeholder.com/40x40/ff6b6b/ffffff?text=RK',
        checkedInAt: Date.now(),
        lastSeen: Date.now(),
      },
      {
        id: 'player2',
        username: 'ShadowStriker',
        avatarUrl: 'https://via.placeholder.com/40x40/4ecdc4/ffffff?text=SS',
        checkedInAt: Date.now(),
        lastSeen: Date.now(),
      },
      {
        id: 'player3',
        username: 'NeonNinja',
        avatarUrl: 'https://via.placeholder.com/40x40/ffd93d/ffffff?text=NN',
        checkedInAt: Date.now(),
        lastSeen: Date.now(),
      },
      {
        id: 'player4',
        username: 'CyberQueen',
        avatarUrl: 'https://via.placeholder.com/40x40/45b7d1/ffffff?text=CQ',
        checkedInAt: Date.now(),
        lastSeen: Date.now(),
      },
    ];

    // Create some sample matches
    const sampleMatches: DojoMatch[] = [
      {
        id: `${dojoId}_table1_${now() - 300000}`, // 5 minutes ago
        dojoId,
        table: 1,
        players: [samplePlayers[0], samplePlayers[1]],
        startedAt: now() - 300000,
        status: 'in_progress',
        lastUpdate: now(),
      },
      {
        id: `${dojoId}_table2_${now() - 120000}`, // 2 minutes ago
        dojoId,
        table: 2,
        players: [samplePlayers[2], samplePlayers[3]],
        startedAt: now() - 120000,
        status: 'in_progress',
        lastUpdate: now(),
      },
      {
        id: `${dojoId}_table3_${now() - 60000}`, // 1 minute ago
        dojoId,
        table: 3,
        players: [samplePlayers[0], samplePlayers[3]],
        startedAt: now() - 60000,
        status: 'paused',
        lastUpdate: now(),
      },
    ];

    // Write sample matches to storage
    writeMatches(dojoId, sampleMatches);
    this.notify(dojoId);
    return sampleMatches;
  }

  static subscribe(dojoId: string, cb: MatchesCallback) {
    // initial emit
    try {
      cb(this.getActive(dojoId));
    } catch {}

    const storageHandler = (e: StorageEvent) => {
      if (e.key === storageKey(dojoId)) {
        cb(this.getActive(dojoId));
      }
    };

    const customHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.dojoId === dojoId) {
        cb(this.getActive(dojoId));
      }
    };

    window.addEventListener('storage', storageHandler);
    window.addEventListener(CUSTOM_EVENT, customHandler as EventListener);

    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener(CUSTOM_EVENT, customHandler as EventListener);
    };
  }

  private static notify(dojoId: string) {
    try {
      window.dispatchEvent(
        new CustomEvent(CUSTOM_EVENT, { detail: { dojoId } })
      );
    } catch {}
  }
}
