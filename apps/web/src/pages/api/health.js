/* eslint-env node */
/* global process, console */
// Health check endpoint for debugging serverless functions
export default function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      vercel: {
        region: process.env.VERCEL_REGION || 'unknown',
        url: process.env.VERCEL_URL || 'unknown',
      },
      oauth: {
        googleClientId: !!process.env.GOOGLE_CLIENT_ID,
        googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        googleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
      },
    };

    res.status(200).json(healthCheck);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
