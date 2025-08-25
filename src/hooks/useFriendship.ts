import { useEffect, useState } from 'react';

export interface FriendshipStatus {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
  createdAt: string;
  updatedAt: string;
}

export const useFriendship = (currentUserId: string, targetUserId: string) => {
  const [friendshipStatus, setFriendshipStatus] =
    useState<FriendshipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId || !targetUserId) {
      setLoading(false);
      return;
    }

    const checkFriendshipStatus = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // For now, we'll simulate the API response
        const response = await fetch(
          `/api/friendships/status?currentUserId=${currentUserId}&targetUserId=${targetUserId}`
        );

        if (response.ok) {
          const data = await response.json();
          setFriendshipStatus(data);
        } else if (response.status === 404) {
          // No friendship exists
          setFriendshipStatus(null);
        } else {
          throw new Error('Failed to fetch friendship status');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback: assume no friendship for now
        setFriendshipStatus(null);
      } finally {
        setLoading(false);
      }
    };

    checkFriendshipStatus();
  }, [currentUserId, targetUserId]);

  const isFriend = friendshipStatus?.status === 'ACCEPTED';
  const hasPendingRequest = friendshipStatus?.status === 'PENDING';
  const canSendRequest = !friendshipStatus && !loading;

  return {
    friendshipStatus,
    isFriend,
    hasPendingRequest,
    canSendRequest,
    loading,
    error,
  };
};
