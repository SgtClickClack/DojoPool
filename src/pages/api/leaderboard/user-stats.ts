import { NextApiRequest, NextApiResponse } from 'next';
import { LeaderboardService } from '../../../../dojopool/services/leaderboard/service';
import { getCurrentUser } from '../../../../dojopool/services/auth/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get query parameters
    const {
      type,
      region_id,
      venue_id,
      tournament_id
    } = req.query;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Leaderboard type is required' });
    }

    // Get user statistics
    const stats = await LeaderboardService.get_user_stats(
      user.id,
      type,
      region_id ? parseInt(region_id as string) : undefined,
      venue_id ? parseInt(venue_id as string) : undefined,
      tournament_id ? parseInt(tournament_id as string) : undefined
    );

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting user statistics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 