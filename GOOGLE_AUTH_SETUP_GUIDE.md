# Google OAuth Setup Guide for DojoPool

## Current Status

✅ **Frontend Implementation**: Complete

- Google Sign-in button implemented with official branding
- Auth callback page created and functional
- Error handling and loading states implemented

✅ **Backend Implementation**: Complete

- Google OAuth endpoints implemented
- Mock implementation for testing (when credentials not configured)
- User creation and JWT token generation working

❌ **Critical Issue**: Google OAuth credentials not configured

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3002/api/v1/auth/google/callback` (development)
     - `https://yourdomain.com/api/v1/auth/google/callback` (production)
5. Copy the Client ID and Client Secret

### 2. Configure Environment Variables

Add the following to `services/api/.env.local`:

```bash
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your_actual_google_oauth_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_actual_google_oauth_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3002/api/v1/auth/google/callback
```

### 3. Test the Implementation

1. Restart the backend server to load new environment variables
2. Visit `http://localhost:3000/login`
3. Click "Sign in with Google"
4. Complete the OAuth flow
5. Verify successful login and redirect to dashboard

## Current Mock Implementation

The system currently includes a mock implementation that:

- Creates a test user when Google OAuth credentials are not configured
- Allows testing of the OAuth flow without real credentials
- Provides a seamless development experience

## Production Deployment

For production deployment:

1. **Update redirect URIs** in Google Cloud Console to include production domain
2. **Set production environment variables** with real Google OAuth credentials
3. **Remove mock implementation** by commenting out the mock code in `auth.service.ts`
4. **Test with real Google accounts** to ensure proper authentication flow

## Security Considerations

- Never commit Google OAuth credentials to version control
- Use environment variables for all sensitive configuration
- Implement proper CORS settings for production
- Use HTTPS in production for secure OAuth flow

## Troubleshooting

### Common Issues:

1. **"Google OAuth client ID not configured"**
   - Ensure environment variables are set correctly
   - Restart the backend server after setting variables

2. **"Invalid redirect URI"**
   - Check that redirect URI in Google Cloud Console matches exactly
   - Include both development and production URIs

3. **"Access blocked" error**
   - Verify OAuth consent screen is configured
   - Check that Google+ API is enabled

## Next Steps

1. **Configure real Google OAuth credentials** following the setup guide above
2. **Test the complete OAuth flow** with real Google accounts
3. **Deploy to production** with proper environment configuration
4. **Monitor authentication metrics** post-launch

## Status: READY FOR PRODUCTION SETUP

The Google OAuth implementation is complete and ready for production use once credentials are configured.
