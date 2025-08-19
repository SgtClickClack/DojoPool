import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const response = await axios.get(
      'http://localhost:5000/api/training/recommendations',
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Training API Error:', error);
    return res.status(500).json({
      message: 'Error fetching training recommendations',
      error: error.message,
    });
  }
}
