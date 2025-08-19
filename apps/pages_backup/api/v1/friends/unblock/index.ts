import { NextApiRequest, NextApiResponse } from 'next';
import { FriendsController } from '../../../../../controllers/FriendsController';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'POST':
      return FriendsController.unblockUser(req, res);
    default:
      res.setHeader('Allow', ['POST']);
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` });
  }
}
