/* eslint-env node */
/* global console */
// Dashboard stats API endpoint
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock dashboard stats data
    // In production, this would fetch real data from your database
    const dashboardStats = {
      matches: {
        total: 42,
        won: 28,
        lost: 14,
        winRate: 66.7,
        thisMonth: 8,
      },
      tournaments: {
        total: 5,
        won: 2,
        joined: 5,
        upcoming: 1,
      },
      clan: {
        name: 'Shadow Warriors',
        rank: 'Gold',
        points: 1250,
        level: 'Advanced',
      },
      dojoCoins: {
        balance: 2500,
        earned: 5000,
        spent: 2500,
      },
      recentActivity: [
        {
          id: '1',
          type: 'match_won',
          description: 'Won match against Thunder Clan',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          metadata: {
            opponent: 'Thunder Clan',
            score: '3-1',
          },
        },
        {
          id: '2',
          type: 'tournament_joined',
          description: 'Joined Spring Championship',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          metadata: {
            tournament: 'Spring Championship',
            entryFee: 100,
          },
        },
        {
          id: '3',
          type: 'clan_level_up',
          description: 'Clan advanced to Gold rank',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          metadata: {
            newRank: 'Gold',
            pointsEarned: 150,
          },
        },
      ],
    };

    res.status(200).json(dashboardStats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
