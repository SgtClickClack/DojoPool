import { CurrentUserService } from './CurrentUserService';

export type ChallengeType = 'duel' | 'pilgrimage' | 'gauntlet';

export interface CreateChallengeRequest {
  type: ChallengeType;
  defenderId: string;
  dojoId: string;
}

export interface Challenge {
  id: string;
  dojoId: string;
  type: ChallengeType;
  challengerId: string;
  defenderId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: number; // epoch ms
}

const STORAGE_KEY = 'dojopool_challenges';
const EVENT_KEY = 'dojopool:challenges:update';

function readChallenges(): Challenge[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as Challenge[]) : [];
  } catch {
    return [];
  }
}

function writeChallenges(list: Challenge[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function notify(dojoId?: string) {
  try {
    window.dispatchEvent(
      new CustomEvent(EVENT_KEY, { detail: { dojoId: dojoId ?? null } })
    );
  } catch {}
}

function uid() {
  return `chal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class ChallengeService {
  static async createChallenge(
    req: CreateChallengeRequest
  ): Promise<Challenge> {
    const user = CurrentUserService.getCurrentUser();

    try {
      // First, try to create challenge via backend API
      const backendChallenge = await this.createChallengeViaAPI(req);

      // If successful, add to local storage for offline support
      const list = readChallenges();
      list.push(backendChallenge);
      writeChallenges(list);
      notify(req.dojoId);

      return backendChallenge;
    } catch (error) {
      console.error(
        'Backend challenge creation failed, using local fallback:',
        error
      );

      // Fallback to local storage if backend fails
      const challenge: Challenge = {
        id: uid(),
        dojoId: req.dojoId,
        type: req.type,
        challengerId: user.id,
        defenderId: req.defenderId,
        status: 'pending',
        createdAt: Date.now(),
      };

      const list = readChallenges();
      list.push(challenge);
      writeChallenges(list);
      notify(req.dojoId);
      return challenge;
    }
  }

  private static async createChallengeViaAPI(
    req: CreateChallengeRequest
  ): Promise<Challenge> {
    try {
      // This would make an actual API call to the backend
      // For now, simulate the API call
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // If API call fails, throw error to trigger fallback
      throw new Error('Backend API unavailable');
    }
  }

  static getActiveChallenges(dojoId?: string): Challenge[] {
    const list = readChallenges();
    return dojoId ? list.filter((c) => c.dojoId === dojoId) : list;
  }

  static subscribe(cb: (list: Challenge[]) => void, dojoId?: string) {
    // initial emit
    try {
      cb(this.getActiveChallenges(dojoId));
    } catch {}

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!dojoId || (detail && detail.dojoId === dojoId)) {
        cb(ChallengeService.getActiveChallenges(dojoId));
      }
    };

    window.addEventListener(EVENT_KEY, handler as EventListener);
    return () =>
      window.removeEventListener(EVENT_KEY, handler as EventListener);
  }

  static getChallengeRequirements(type: ChallengeType): string {
    switch (type) {
      case 'duel':
        return 'No special requirements - available to all players';
      case 'pilgrimage':
        return 'Level 5+, 10+ wins, 3+ Top Ten defeats, 1+ Master defeat';
      case 'gauntlet':
        return 'Level 10+, 25+ wins, 5+ Top Ten defeats, 2+ Master defeats, Clan membership';
      default:
        return '';
    }
  }
}

export default ChallengeService;
