import { type NextApiRequest, type NextApiResponse } from 'next';
import { AchievementService } from '../../../../dojopool/services/achievement/service';
import { getCurrentUser } from '../../../../dojopool/services/auth/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { completed, type } = req.query;

    // Get user achievements
    const achievements = await AchievementService.get_user_achievements(
      user.id,
      completed === 'true' ? true : completed === 'false' ? false : undefined,
      type as any
    );

    // Get achievement stats
    const stats = await AchievementService.get_user_achievement_stats(user.id);

    return res.status(200).json({
      achievements,
      stats,
    });
  } catch (error) {
    console.error('Error retrieving user achievements:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
