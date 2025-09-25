/* eslint-env node */
/* global console */
import { Buffer } from 'node:buffer';
// Get current user endpoint
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token received:', token.substring(0, 20) + '...');

    try {
      // Decode the token (this is a simple base64 decode for our temporary token)
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      console.log('Token decoded successfully for user:', decoded.email);

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        console.log('Token expired');
        return res.status(401).json({ error: 'Token expired' });
      }

      // Return user data from token
      const userData = {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        username: decoded.name || decoded.email?.split('@')[0] || 'User',
        isAdmin: false, // Default to false for Google users
      };

      console.log('Returning user data:', userData);
      return res.status(200).json(userData);
    } catch (decodeError) {
      console.error('Token decode error:', decodeError);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
