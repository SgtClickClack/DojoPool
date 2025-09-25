/* eslint-env node */
/* global console */
// Auth register endpoint
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res
        .status(400)
        .json({ error: 'Email, password, and username are required' });
    }

    // For now, return an error since we don't have a real backend
    // In a real implementation, you would create a user in the database
    return res.status(501).json({
      error:
        'Email/password registration not implemented. Please use Google Sign-in.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
