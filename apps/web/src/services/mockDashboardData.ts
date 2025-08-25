import { DashboardStats } from './APIService';

export const mockDashboardStats: DashboardStats = {
  matches: {
    total: 47,
    won: 32,
    lost: 15,
    winRate: 68,
    thisMonth: 12,
  },
  tournaments: {
    total: 8,
    won: 3,
    joined: 8,
    upcoming: 2,
  },
  clan: {
    name: 'Crimson Monkey',
    rank: 'Elite',
    points: 1247,
    level: 'Master',
  },
  dojoCoins: {
    balance: 2847,
    earned: 5200,
    spent: 2353,
  },
  recentActivity: [
    {
      id: '1',
      type: 'match',
      description: 'Won match against @PoolMaster at The Jade Tiger',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      metadata: {
        opponent: 'PoolMaster',
        venue: 'The Jade Tiger',
        score: '8-5',
      },
    },
    {
      id: '2',
      type: 'clan',
      description: 'Joined Crimson Monkey Clan',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      metadata: {
        clan: 'Crimson Monkey',
        role: 'Member',
      },
    },
    {
      id: '3',
      type: 'territory',
      description: 'Claimed territory at Downtown Pool Hall',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      metadata: {
        venue: 'Downtown Pool Hall',
        previousController: 'ShadowAlpha',
      },
    },
    {
      id: '4',
      type: 'tournament',
      description: 'Advanced to quarter-finals in Spring Championship',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      metadata: {
        tournament: 'Spring Championship',
        round: 'Quarter-finals',
      },
    },
    {
      id: '5',
      type: 'achievement',
      description: 'Unlocked "Win Streak" achievement',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      metadata: {
        achievement: 'Win Streak',
        requirement: '5 consecutive wins',
      },
    },
  ],
};
