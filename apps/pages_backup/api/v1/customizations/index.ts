import { NextApiRequest, NextApiResponse } from 'next';
import { DojoCustomizationController } from '../../../../../controllers/DojoCustomizationController';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      return DojoCustomizationController.getAllCustomizationItems(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` });
  }
}
