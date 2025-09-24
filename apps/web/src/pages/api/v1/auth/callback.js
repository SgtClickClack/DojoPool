// This is a simplified handler. In a real app, this is where you would
// exchange the code from Google for an access token, fetch the user's
// profile, and then create a session or JWT for them in your own system.

export default function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    // Redirect to a login page with an error message
    // eslint-disable-next-line no-undef
    console.error('Google OAuth Error:', error);
    return res.redirect('/login?error=oauth_failed');
  }

  if (code) {
    // In a real app, you would now use this 'code' and your client secret
    // to get an access token from Google, find or create a user in your
    // database, and create a session for them.

    // For now, we will just redirect to the dashboard on success.
    // eslint-disable-next-line no-undef
    console.log('Google OAuth code received:', code);
    return res.redirect('/dashboard');
  }

  // Fallback for any other case
  return res.redirect('/login?error=unknown');
}
