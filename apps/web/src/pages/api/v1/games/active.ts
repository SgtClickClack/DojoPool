import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Return a valid, empty array as a placeholder.
  res.status(200).json([]);
}
