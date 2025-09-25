/* eslint-env node */
/* global console */
// Auth login endpoint
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // For now, return an error since we don't have a real backend
    // In a real implementation, you would validate credentials against a database
    return res.status(501).json({
      error: 'Email/password login not implemented. Please use Google Sign-in.',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
