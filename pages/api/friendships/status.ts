import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { currentUserId, targetUserId } = req.query;

  if (!currentUserId || !targetUserId) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    // In a real app, this would query the database
    // For now, we'll simulate different friendship scenarios based on user IDs

    // Simulate friendship status based on user IDs for testing
    const friendshipStatus = simulateFriendshipStatus(
      currentUserId as string,
      targetUserId as string
    );

    if (friendshipStatus) {
      res.status(200).json(friendshipStatus);
    } else {
      res.status(404).json({ message: 'No friendship found' });
    }
  } catch (error) {
    console.error('Error checking friendship status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function simulateFriendshipStatus(currentUserId: string, targetUserId: string) {
  // Simulate different friendship scenarios for testing
  const scenarios = [
    // Scenario 1: Friends
    {
      currentUserId: 'current-user',
      targetUserId: 'player-1',
      status: 'ACCEPTED',
    },
    // Scenario 2: Pending request
    {
      currentUserId: 'current-user',
      targetUserId: 'player-2',
      status: 'PENDING',
    },
    // Scenario 3: No friendship
    {
      currentUserId: 'current-user',
      targetUserId: 'player-3',
      status: null,
    },
  ];

  const scenario = scenarios.find(
    (s) => s.currentUserId === currentUserId && s.targetUserId === targetUserId
  );

  if (scenario?.status === 'ACCEPTED') {
    return {
      id: 'friendship-1',
      user1Id: currentUserId,
      user2Id: targetUserId,
      status: 'ACCEPTED',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  } else if (scenario?.status === 'PENDING') {
    return {
      id: 'friendship-2',
      user1Id: currentUserId,
      user2Id: targetUserId,
      status: 'PENDING',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  return null; // No friendship
}
