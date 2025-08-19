import type { MissionData } from '@/components/missions/MissionHub';

// Placeholder service to be mocked by tests.
export async function getCurrentMission(): Promise<MissionData> {
  return {
    state: 'active',
    objectives: ['Play a match', 'Win a frame'],
    progress: 0,
    rewards: [],
  };
}
