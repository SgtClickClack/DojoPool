import { type NextApiRequest, type NextApiResponse } from 'next';
import { FriendService } from '../../../../dojopool/services/social/friend';
import { getCurrentUser } from '../../../../dojopool/services/auth/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get request body
    const { friend_id } = req.body;
    if (!friend_id || typeof friend_id !== 'number') {
      return res.status(400).json({ error: 'Friend ID is required' });
    }

    // Send friend request
    const [success, error] = await FriendService.send_friend_request(
      user.id,
      friend_id
    );
    if (!success) {
      return res.status(400).json({ error });
    }

    return res
      .status(200)
      .json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
