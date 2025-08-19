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

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { achievement_id, progress, metadata } = req.body;

    // Validate required fields
    if (!achievement_id || typeof progress !== 'number') {
      return res
        .status(400)
        .json({ error: 'Achievement ID and progress are required' });
    }

    // Update achievement progress
    const [success, error, updated_achievement] =
      await AchievementService.update_achievement_progress(
        user.id,
        achievement_id,
        progress,
        metadata
      );

    if (!success) {
      return res
        .status(400)
        .json({ error: error || 'Failed to update achievement progress' });
    }

    return res.status(200).json(updated_achievement);
  } catch (error) {
    console.error('Error updating achievement progress:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
