import { useCallback, useEffect, useState } from 'react';
import { friendsService } from '../services/FriendsService';
import { Friend, FriendRequest, FriendRequestUpdate } from '../types/friends';

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await friendsService.getFriends();
      setFriends(response.friends);
      setPendingRequests(response.pendingRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendFriendRequest = useCallback(
    async (addresseeId: string) => {
      try {
        setError(null);
        const request = await friendsService.sendFriendRequest({ addresseeId });
        // Refresh the list to show the new pending request
        await fetchFriends();
        return request;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to send friend request'
        );
        throw err;
      }
    },
    [fetchFriends]
  );

  const updateFriendRequest = useCallback(
    async (requestId: string, status: FriendRequestUpdate['status']) => {
      try {
        setError(null);
        const updatedRequest = await friendsService.updateFriendRequest(
          requestId,
          { status }
        );

        if (status === 'ACCEPTED') {
          // Refresh to show the new friend
          await fetchFriends();
        } else {
          // Remove the declined/blocked request from the list
          setPendingRequests((prev) =>
            prev.filter((req) => req.id !== requestId)
          );
        }

        return updatedRequest;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update friend request'
        );
        throw err;
      }
    },
    [fetchFriends]
  );

  const removeFriend = useCallback(async (friendshipId: string) => {
    try {
      setError(null);
      await friendsService.removeFriend(friendshipId);
      setFriends((prev) =>
        prev.filter((friend) => friend.friendshipId !== friendshipId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove friend');
      throw err;
    }
  }, []);

  const blockUser = useCallback(
    async (userId: string) => {
      try {
        setError(null);
        await friendsService.blockUser(userId);
        // Refresh to update the list
        await fetchFriends();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to block user');
        throw err;
      }
    },
    [fetchFriends]
  );

  const unblockUser = useCallback(
    async (userId: string) => {
      try {
        setError(null);
        await friendsService.unblockUser(userId);
        // Refresh to update the list
        await fetchFriends();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to unblock user');
        throw err;
      }
    },
    [fetchFriends]
  );

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return {
    friends,
    pendingRequests,
    loading,
    error,
    sendFriendRequest,
    updateFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    refresh: fetchFriends,
  };
};
