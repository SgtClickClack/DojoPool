import type { NextApiRequest, NextApiResponse } from 'next';
import { getMockActiveGames } from '../../mock-data';

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json(getMockActiveGames());
}

