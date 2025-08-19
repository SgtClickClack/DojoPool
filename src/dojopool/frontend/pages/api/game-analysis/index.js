import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const response = await axios.post(
      'http://localhost:5000/api/game-analysis',
      req.body,
      {
        headers: {
          Authorization: req.headers.authorization,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Game Analysis API Error:', error);
    return res.status(500).json({
      message: 'Error analyzing game data',
      error: error.message,
    });
  }
}
