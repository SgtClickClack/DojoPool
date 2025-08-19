import { CurrentUser } from './CurrentUserService';

export interface PresenceUser extends CurrentUser {}

interface PresenceEntry extends PresenceUser {
  dojoId: string;
  checkedInAt: number; // epoch ms
  lastSeen: number; // epoch ms
}

type PresenceCallback = (users: PresenceUser[]) => void;

const STORAGE_PREFIX = 'dojopool_presence_';
const CUSTOM_EVENT = 'dojopool:presence:update';
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

function storageKey(dojoId: string) {
  return `${STORAGE_PREFIX}${dojoId}`;
}

function now() {
  return Date.now();
}

function readPresence(dojoId: string): PresenceEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(dojoId));
    if (!raw) return [];
    const list = JSON.parse(raw) as PresenceEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writePresence(dojoId: string, entries: PresenceEntry[]) {
  try {
    localStorage.setItem(storageKey(dojoId), JSON.stringify(entries));
  } catch (e) {
    console.error('DojoPresenceService write error', e);
  }
}

function cleanupExpired(dojoId: string, ttlMs = DEFAULT_TTL_MS) {
  const cutoff = now() - ttlMs;
  const entries = readPresence(dojoId).filter((e) => e.lastSeen >= cutoff);
  writePresence(dojoId, entries);
  return entries;
}

export class DojoPresenceService {
  static getActive(dojoId: string, ttlMs = DEFAULT_TTL_MS): PresenceUser[] {
    const cleaned = cleanupExpired(dojoId, ttlMs);
    return cleaned
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .map(({ dojoId: _d, checkedInAt: _c, lastSeen: _l, ...u }) => u);
  }

  static isCheckedIn(dojoId: string, userId: string, ttlMs = DEFAULT_TTL_MS): boolean {
    const cutoff = now() - ttlMs;
    return readPresence(dojoId).some((e) => e.id === userId && e.lastSeen >= cutoff);
  }

  static checkIn(dojoId: string, user: PresenceUser, ttlMs = DEFAULT_TTL_MS) {
    const entries = cleanupExpired(dojoId, ttlMs);
    const idx = entries.findIndex((e) => e.id === user.id);
    const entry: PresenceEntry = {
      ...user,
      dojoId,
      checkedInAt: now(),
      lastSeen: now(),
    };
    if (idx >= 0) {
      entries[idx] = { ...entries[idx], ...entry };
    } else {
      entries.push(entry);
    }
    writePresence(dojoId, entries);
    this.notify(dojoId);
  }

  static heartbeat(dojoId: string, userId: string, ttlMs = DEFAULT_TTL_MS) {
    const entries = cleanupExpired(dojoId, ttlMs);
    const idx = entries.findIndex((e) => e.id === userId);
    if (idx >= 0) {
      entries[idx].lastSeen = now();
      writePresence(dojoId, entries);
      this.notify(dojoId);
    }
  }

  static checkOut(dojoId: string, userId: string) {
    const entries = readPresence(dojoId).filter((e) => e.id !== userId);
    writePresence(dojoId, entries);
    this.notify(dojoId);
  }

  static subscribe(dojoId: string, cb: PresenceCallback) {
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
