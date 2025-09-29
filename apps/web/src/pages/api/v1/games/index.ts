import type { NextApiRequest, NextApiResponse } from 'next';
import { addMockGame, getMockActiveGames } from '../../mock-data';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    res.status(200).json(getMockActiveGames());
    return;
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { opponentId, gameType, wager, venueId, notes } = body || {};

    if (!opponentId) {
      res.status(400).json({ error: 'opponentId is required' });
      return;
    }

    const created = addMockGame({ opponentId, gameType, wager, venueId, notes });
    res.status(201).json(created);
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end('Method not allowed');
}

