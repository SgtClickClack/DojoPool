import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Return a valid, empty array as a placeholder.
    res.status(200).json([]);
    return;
  }

  if (req.method === 'POST') {
    // For now, return a placeholder response for POST requests.
    res.status(201).json({ message: 'Game creation endpoint placeholder' });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end('Method not allowed');
}
