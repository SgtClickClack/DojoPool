import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/ApiService';
import React, { useEffect, useState } from 'react';

interface FriendRequestButtonProps {
  targetUserId: string;
  className?: string;
}

type FriendshipStatus =
  | 'NONE'
  | 'PENDING_SENT'
  | 'PENDING_RECEIVED'
  | 'FRIENDS'
  | 'BLOCKED';

const FriendRequestButton: React.FC<FriendRequestButtonProps> = ({
  targetUserId,
  className = '',
}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<FriendshipStatus>('NONE');
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>();

  useEffect(() => {
    if (user && targetUserId && user.id !== targetUserId) {
      fetchFriendshipStatus();
    }
  }, [user, targetUserId]);

  const fetchFriendshipStatus = async () => {
    try {
      const response = await apiService.getFriendshipStatus(targetUserId);
      setStatus(response.status as FriendshipStatus);
      setRequestId(response.requestId);
    } catch (error) {
      console.error('Failed to fetch friendship status:', error);
      setStatus('NONE');
    }
  };

  const sendFriendRequest = async () => {
    if (!user || user.id === targetUserId) return;

    setLoading(true);
    try {
      await apiService.sendFriendRequest(targetUserId);
      setStatus('PENDING_SENT');
    } catch (error) {
      console.error('Failed to send friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (accept: boolean) => {
    if (!requestId) return;

    setLoading(true);
    try {
      await apiService.respondToFriendRequest(
        requestId,
        accept ? 'ACCEPTED' : 'DECLINED'
      );
      setStatus(accept ? 'FRIENDS' : 'NONE');
      setRequestId(undefined);
    } catch (error) {
      console.error('Failed to respond to friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if viewing own profile
  if (!user || user.id === targetUserId) {
    return null;
  }

  const getButtonContent = () => {
    switch (status) {
      case 'NONE':
        return {
          text: 'Add Friend',
          action: () => sendFriendRequest(),
          className: 'bg-blue-600 hover:bg-blue-700 text-white',
          disabled: loading,
        };
      case 'PENDING_SENT':
        return {
          text: 'Request Sent',
          action: undefined,
          className: 'bg-gray-400 text-white cursor-not-allowed',
          disabled: true,
        };
      case 'PENDING_RECEIVED':
        return {
          text: 'Accept Request',
          action: () => respondToRequest(true),
          className: 'bg-green-600 hover:bg-green-700 text-white',
          disabled: loading,
        };
      case 'FRIENDS':
        return {
          text: '✔ Friends',
          action: undefined,
          className: 'bg-green-500 text-white cursor-not-allowed',
          disabled: true,
        };
      case 'BLOCKED':
        return {
          text: 'Blocked',
          action: undefined,
          className: 'bg-red-500 text-white cursor-not-allowed',
          disabled: true,
        };
      default:
        return {
          text: 'Add Friend',
          action: () => sendFriendRequest(),
          className: 'bg-blue-600 hover:bg-blue-700 text-white',
          disabled: loading,
        };
    }
  };

  const buttonContent = getButtonContent();

  return (
    <div className="flex gap-2">
      <button
        onClick={buttonContent.action}
        disabled={buttonContent.disabled}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${buttonContent.className} ${className}`}
      >
        {loading ? '...' : buttonContent.text}
      </button>

      {status === 'PENDING_RECEIVED' && (
        <button
          onClick={() => respondToRequest(false)}
          disabled={loading}
          className="px-4 py-2 rounded-md font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
        >
          Decline
        </button>
      )}
    </div>
  );
};

export default FriendRequestButton;
