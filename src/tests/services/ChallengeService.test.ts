import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChallengeService } from '../../../apps/web/src/services/ChallengeService';

// Ensure a clean environment before each test
beforeEach(() => {
  if (typeof window !== 'undefined') {
    localStorage.clear();
  }
});

describe('ChallengeService', () => {
  it('creates a challenge, persists it, and emits update event', async () => {
    const cb = vi.fn();
    const unsubscribe = ChallengeService.subscribe(cb, 'dojo-1');

    // initial emit
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0]).toEqual([]);

    const challenge = await ChallengeService.createChallenge({
      type: 'duel',
      defenderId: 'def-2',
      dojoId: 'dojo-1',
    });

    expect(challenge).toMatchObject({
      dojoId: 'dojo-1',
      type: 'duel',
      defenderId: 'def-2',
      status: 'pending',
    });

    // Should be persisted
    const list = ChallengeService.getActiveChallenges('dojo-1');
    expect(list.find((c) => c.id === challenge.id)).toBeTruthy();

    // Event should trigger callback again
    expect(cb).toHaveBeenCalledTimes(2);
    const latest = cb.mock.calls[1][0];
    expect(Array.isArray(latest)).toBe(true);
    expect(latest.length).toBe(1);
    expect(latest[0].id).toBe(challenge.id);

    unsubscribe();
  });
});
