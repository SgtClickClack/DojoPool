import { useState, useEffect, useCallback } from 'react';
import { socialFeaturesService, Friend, Message, ActivityFeedItem, SocialProfile } from '../services/social/SocialFeaturesService';

export const useSocialFeatures = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    friends: false,
    messages: false,
    activity: false,
    profile: false
  });
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadFriends();
    loadActivityFeed();
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleFriendUpdate = (friend: Friend) => {
      setFriends(prev => prev.map(f => f.id === friend.id ? friend : f));
    };

    const handleNewActivity = (activity: ActivityFeedItem) => {
      setActivityFeed(prev => [activity, ...prev]);
    };

    socialFeaturesService.onMessage(handleNewMessage);
    socialFeaturesService.onFriendUpdate(handleFriendUpdate);
    socialFeaturesService.onActivity(handleNewActivity);

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  // Friend System
  const loadFriends = useCallback(async () => {
    setLoading(prev => ({ ...prev, friends: true }));
    setError(null);
    try {
      const friendsData = await socialFeaturesService.getFriends();
      setFriends(friendsData);
    } catch (err) {
      setError('Failed to load friends');
      console.error('Error loading friends:', err);
    } finally {
      setLoading(prev => ({ ...prev, friends: false }));
    }
  }, []);

  const sendFriendRequest = useCallback(async (userId: string) => {
    setError(null);
    try {
      const success = await socialFeaturesService.sendFriendRequest(userId);
      if (success) {
        await loadFriends(); // Refresh friends list
      }
      return success;
    } catch (err) {
      setError('Failed to send friend request');
      console.error('Error sending friend request:', err);
      return false;
    }
  }, [loadFriends]);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    setError(null);
    try {
      const success = await socialFeaturesService.acceptFriendRequest(requestId);
      if (success) {
        await loadFriends(); // Refresh friends list
      }
      return success;
    } catch (err) {
      setError('Failed to accept friend request');
      console.error('Error accepting friend request:', err);
      return false;
    }
  }, [loadFriends]);

  const removeFriend = useCallback(async (friendId: string) => {
    setError(null);
    try {
      const success = await socialFeaturesService.removeFriend(friendId);
      if (success) {
        setFriends(prev => prev.filter(f => f.id !== friendId));
      }
      return success;
    } catch (err) {
      setError('Failed to remove friend');
      console.error('Error removing friend:', err);
      return false;
    }
  }, []);

  // Messaging System
  const loadMessages = useCallback(async (userId: string) => {
    setLoading(prev => ({ ...prev, messages: true }));
    setError(null);
    try {
      const messagesData = await socialFeaturesService.getMessages(userId);
      setMessages(messagesData);
      setCurrentChat(userId);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  }, []);

  const sendMessage = useCallback(async (receiverId: string, content: string, type: Message['type'] = 'text', metadata?: any) => {
    setError(null);
    try {
      const success = await socialFeaturesService.sendMessage(receiverId, content, type, metadata);
      if (!success) {
        setError('Failed to send message');
      }
      return success;
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
      return false;
    }
  }, []);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await socialFeaturesService.markMessageAsRead(messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, []);

  // Activity Feed
  const loadActivityFeed = useCallback(async (page: number = 1) => {
    setLoading(prev => ({ ...prev, activity: true }));
    setError(null);
    try {
      const activities = await socialFeaturesService.getActivityFeed(page);
      if (page === 1) {
        setActivityFeed(activities);
      } else {
        setActivityFeed(prev => [...prev, ...activities]);
      }
    } catch (err) {
      setError('Failed to load activity feed');
      console.error('Error loading activity feed:', err);
    } finally {
      setLoading(prev => ({ ...prev, activity: false }));
    }
  }, []);

  const likeActivity = useCallback(async (activityId: string) => {
    setError(null);
    try {
      const success = await socialFeaturesService.likeActivity(activityId);
      if (success) {
        setActivityFeed(prev => prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, likes: activity.likes + 1 }
            : activity
        ));
      }
      return success;
    } catch (err) {
      setError('Failed to like activity');
      console.error('Error liking activity:', err);
      return false;
    }
  }, []);

  const commentOnActivity = useCallback(async (activityId: string, comment: string) => {
    setError(null);
    try {
      const success = await socialFeaturesService.commentOnActivity(activityId, comment);
      if (success) {
        setActivityFeed(prev => prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, comments: activity.comments + 1 }
            : activity
        ));
      }
      return success;
    } catch (err) {
      setError('Failed to comment on activity');
      console.error('Error commenting on activity:', err);
      return false;
    }
  }, []);

  // Social Profiles
  const getProfile = useCallback(async (userId: string): Promise<SocialProfile | null> => {
    setLoading(prev => ({ ...prev, profile: true }));
    setError(null);
    try {
      const profile = await socialFeaturesService.getProfile(userId);
      return profile;
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error loading profile:', err);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  }, []);

  const updateProfile = useCallback(async (profile: Partial<SocialProfile>) => {
    setError(null);
    try {
      const success = await socialFeaturesService.updateProfile(profile);
      if (!success) {
        setError('Failed to update profile');
      }
      return success;
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
      return false;
    }
  }, []);

  const followUser = useCallback(async (userId: string) => {
    setError(null);
    try {
      const success = await socialFeaturesService.followUser(userId);
      return success;
    } catch (err) {
      setError('Failed to follow user');
      console.error('Error following user:', err);
      return false;
    }
  }, []);

  const unfollowUser = useCallback(async (userId: string) => {
    setError(null);
    try {
      const success = await socialFeaturesService.unfollowUser(userId);
      return success;
    } catch (err) {
      setError('Failed to unfollow user');
      console.error('Error unfollowing user:', err);
      return false;
    }
  }, []);

  // Utility Methods
  const searchUsers = useCallback(async (query: string): Promise<SocialProfile[]> => {
    try {
      return await socialFeaturesService.searchUsers(query);
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  }, []);

  const getUnreadMessageCount = useCallback(() => {
    return socialFeaturesService.getUnreadMessageCount();
  }, []);

  const getOnlineFriends = useCallback(() => {
    return socialFeaturesService.getOnlineFriends();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    friends,
    messages,
    activityFeed,
    currentChat,
    loading,
    error,

    // Friend System
    loadFriends,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,

    // Messaging System
    loadMessages,
    sendMessage,
    markMessageAsRead,
    setCurrentChat,

    // Activity Feed
    loadActivityFeed,
    likeActivity,
    commentOnActivity,

    // Social Profiles
    getProfile,
    updateProfile,
    followUser,
    unfollowUser,

    // Utility Methods
    searchUsers,
    getUnreadMessageCount,
    getOnlineFriends,
    clearError
  };
}; 