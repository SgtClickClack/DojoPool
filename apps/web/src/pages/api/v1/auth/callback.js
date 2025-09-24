/* eslint-env node */
/* global process, console, fetch, URLSearchParams */
// Google OAuth callback handler
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error } = req.query;

  // Handle OAuth errors
  if (error) {
    // eslint-disable-next-line no-console
    console.error('OAuth error:', error);
    return res.redirect('/login?error=oauth_error');
  }

  // Check if authorization code is present
  if (!code) {
    // eslint-disable-next-line no-console
    console.error('No authorization code received');
    return res.redirect('/login?error=no_code');
  }

  // Check for required environment variables
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Missing Google OAuth configuration:', {
      clientId: !!process.env.GOOGLE_CLIENT_ID,
      clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    });
    return res.redirect('/login?error=oauth_not_configured');
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri:
          process.env.GOOGLE_REDIRECT_URI ||
          `${req.headers.origin}/api/v1/auth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      // eslint-disable-next-line no-console
      console.error('Token exchange failed:', errorData);
      return res.redirect('/login?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user info from Google
    const userResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch user info');
      return res.redirect('/login?error=user_info_failed');
    }

    const userData = await userResponse.json();
    // eslint-disable-next-line no-unused-vars
    const { id, email, name, picture } = userData;

    // TODO: Create or update user in your database
    // For now, we'll redirect with user data in the URL (not secure for production)
    // In production, you should:
    // 1. Create/update user in your database
    // 2. Generate a JWT token
    // 3. Set secure cookies
    // 4. Redirect to dashboard

    // Temporary solution - redirect to dashboard with success
    return res.redirect('/dashboard?google_auth=success');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('OAuth callback error:', error);
    return res.redirect('/login?error=callback_error');
  }
}
