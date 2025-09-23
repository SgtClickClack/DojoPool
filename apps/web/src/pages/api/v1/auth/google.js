// Google OAuth API endpoint
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic Google OAuth redirect implementation
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.headers.origin}/api/v1/auth/callback`;
  
  if (!clientId) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=openid%20email%20profile&` +
    `access_type=offline`;

  res.redirect(authUrl);
}
