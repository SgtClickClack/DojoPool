import type { NextApiRequest, NextApiResponse } from 'next';
import { getMockPlayers } from '../../mock-data';

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json(getMockPlayers());
}

