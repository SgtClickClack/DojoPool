import type { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;

  try {
    const url = new URL('/api/v1/venues', API_BASE_URL);

    // Add query parameters
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Venues API proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
