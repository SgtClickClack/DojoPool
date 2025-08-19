import { NextApiRequest, NextApiResponse } from 'next';
import { friendsService } from '../services/FriendsService';
import { FriendRequestCreate, FriendRequestUpdate } from '../types/friends';

export class FriendsController {
  static async sendFriendRequest(req: NextApiRequest, res: NextApiResponse) {
    try {
      const { addresseeId } = req.body as FriendRequestCreate;

      if (!addresseeId) {
        return res.status(400).json({ message: 'addresseeId is required' });
      }

      // TODO: Get current user ID from authentication
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const friendRequest = await friendsService.sendFriendRequest({
        addresseeId,
      });
      res.status(201).json(friendRequest);
    } catch (error) {
      console.error('Error sending friend request:', error);
      res.status(500).json({ message: 'Failed to send friend request' });
    }
  }

  static async getFriendRequests(req: NextApiRequest, res: NextApiResponse) {
    try {
      // TODO: Get current user ID from authentication
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const requests = await friendsService.getFriendRequests();
      res.status(200).json(requests);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      res.status(500).json({ message: 'Failed to fetch friend requests' });
    }
  }

  static async updateFriendRequest(req: NextApiRequest, res: NextApiResponse) {
    try {
      const { id } = req.query;
      const { status } = req.body as FriendRequestUpdate;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Request ID is required' });
      }

      if (!['ACCEPTED', 'DECLINED', 'BLOCKED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // TODO: Get current user ID from authentication
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const updatedRequest = await friendsService.updateFriendRequest(id, {
        status,
      });
      res.status(200).json(updatedRequest);
    } catch (error) {
      console.error('Error updating friend request:', error);
      res.status(500).json({ message: 'Failed to update friend request' });
    }
  }

  static async getFriends(req: NextApiRequest, res: NextApiResponse) {
    try {
      // TODO: Get current user ID from authentication
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const friends = await friendsService.getFriends();
      res.status(200).json(friends);
    } catch (error) {
      console.error('Error fetching friends:', error);
      res.status(500).json({ message: 'Failed to fetch friends' });
    }
  }

  static async removeFriend(req: NextApiRequest, res: NextApiResponse) {
    try {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Friendship ID is required' });
      }

      // TODO: Get current user ID from authentication
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      await friendsService.removeFriend(id);
      res.status(204).end();
    } catch (error) {
      console.error('Error removing friend:', error);
      res.status(500).json({ message: 'Failed to remove friend' });
    }
  }

  static async blockUser(req: NextApiRequest, res: NextApiResponse) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // TODO: Get current user ID from authentication
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      await friendsService.blockUser(userId);
      res.status(200).json({ message: 'User blocked successfully' });
    } catch (error) {
      console.error('Error blocking user:', error);
      res.status(500).json({ message: 'Failed to block user' });
    }
  }

  static async unblockUser(req: NextApiRequest, res: NextApiResponse) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // TODO: Get current user ID from authentication
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      await friendsService.unblockUser(userId);
      res.status(200).json({ message: 'User unblocked successfully' });
    } catch (error) {
      console.error('Error unblocking user:', error);
      res.status(500).json({ message: 'Failed to unblock user' });
    }
  }
}
