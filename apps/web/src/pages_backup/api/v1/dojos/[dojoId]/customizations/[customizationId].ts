import { NextApiRequest, NextApiResponse } from 'next';
import { DojoCustomizationController } from '../../../../../../../controllers/DojoCustomizationController';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'PATCH':
      return DojoCustomizationController.updateCustomization(req, res);
    case 'DELETE':
      return DojoCustomizationController.removeCustomization(req, res);
    default:
      res.setHeader('Allow', ['PATCH', 'DELETE']);
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` });
  }
}
