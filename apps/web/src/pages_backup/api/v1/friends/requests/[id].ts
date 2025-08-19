import { NextApiRequest, NextApiResponse } from 'next';
import { FriendsController } from '../../../../../../controllers/FriendsController';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'PATCH':
      return FriendsController.updateFriendRequest(req, res);
    default:
      res.setHeader('Allow', ['PATCH']);
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` });
  }
}
