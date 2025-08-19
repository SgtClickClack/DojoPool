import { NextApiRequest, NextApiResponse } from 'next';
import { FriendsController } from '../../../../../controllers/FriendsController';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'POST':
      return FriendsController.sendFriendRequest(req, res);
    case 'GET':
      return FriendsController.getFriendRequests(req, res);
    default:
      res.setHeader('Allow', ['POST', 'GET']);
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` });
  }
}
