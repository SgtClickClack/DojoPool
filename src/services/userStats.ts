import type { UserStatsData } from '@/components/user/UserStats';

// Placeholder service function designed to be mocked in tests.
export async function getUserStatsWithRings(): Promise<UserStatsData> {
  // In real app, this would call backend. We return a harmless default.
  return {
    name: 'Guest Player',
    rings: [],
  };
}
