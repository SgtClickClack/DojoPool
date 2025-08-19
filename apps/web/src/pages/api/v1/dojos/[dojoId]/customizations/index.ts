import { NextApiRequest, NextApiResponse } from 'next';
import { DojoCustomizationController } from '../../../../../../controllers/DojoCustomizationController';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      return DojoCustomizationController.getDojoCustomizations(req, res);
    case 'POST':
      return DojoCustomizationController.unlockCustomization(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` });
  }
}
