import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DojoPresenceService } from '../../../apps/web/src/services/DojoPresenceService';
import type { PresenceUser } from '../../../apps/web/src/services/DojoPresenceService';

// Use the localStorage mock provided by src/tests/setup.ts but back it with an in-memory Map
const memoryStore = new Map<string, string>();

function installMemoryLocalStorage() {
  const ls: any = window.localStorage as any;
  ls.getItem.mockImplementation((key: string) => {
    return memoryStore.has(key) ? memoryStore.get(key)! : null;
  });
  ls.setItem.mockImplementation((key: string, value: string) => {
    memoryStore.set(key, value);
  });
  ls.removeItem.mockImplementation((key: string) => {
    memoryStore.delete(key);
  });
  ls.clear.mockImplementation(() => {
    memoryStore.clear();
  });
  ls.key.mockImplementation((index: number) => Array.from(memoryStore.keys())[index] ?? null);
}

describe('DojoPresenceService', () => {
  const dojoId = 'dojo-test';
  const user: PresenceUser = {
    id: 'u-1',
    username: 'TestUser',
    avatarUrl: 'https://example.com/a.png',
  };

  beforeEach(() => {
    memoryStore.clear();
    installMemoryLocalStorage();
  });

  it('returns empty active users initially', () => {
    const active = DojoPresenceService.getActive(dojoId);
    expect(active).toEqual([]);
  });

  it('checks in a user and lists them as active', () => {
    DojoPresenceService.checkIn(dojoId, user);
    const active = DojoPresenceService.getActive(dojoId);
    expect(active.length).toBe(1);
    expect(active[0].id).toBe(user.id);
    expect(DojoPresenceService.isCheckedIn(dojoId, user.id)).toBe(true);
  });

  it('heartbeats keep the user active', async () => {
    DojoPresenceService.checkIn(dojoId, user);
    // simulate a heartbeat call
    DojoPresenceService.heartbeat(dojoId, user.id);
    const active = DojoPresenceService.getActive(dojoId, 10_000);
    expect(active.find((u) => u.id === user.id)).toBeTruthy();
  });

  it('checks out a user and removes them from active', () => {
    DojoPresenceService.checkIn(dojoId, user);
    DojoPresenceService.checkOut(dojoId, user.id);
    const active = DojoPresenceService.getActive(dojoId);
    expect(active.length).toBe(0);
    expect(DojoPresenceService.isCheckedIn(dojoId, user.id)).toBe(false);
  });
});
