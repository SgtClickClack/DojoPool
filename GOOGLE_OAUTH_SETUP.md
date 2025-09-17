# Google OAuth Setup Guide for DojoPool

This guide will help you set up Google OAuth authentication for the DojoPool application.

## Prerequisites

- A Google Cloud Console account
- Access to create OAuth 2.0 credentials

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Choose **Web application** as the application type
6. Configure the OAuth consent screen if prompted

## Step 2: Configure OAuth Client

1. **Application Name**: DojoPool
2. **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local development)
   - Your production frontend URL (e.g., `https://dojopool.com`)

3. **Authorized redirect URIs**:
   - `http://localhost:3002/api/v1/auth/google/callback` (for local development)
   - Your production API URL + `/api/v1/auth/google/callback`

4. Click **Create** and save your credentials:
   - **Client ID**: Copy this value
   - **Client Secret**: Copy this value (keep it secure!)

## Step 3: Configure Environment Variables

Create a `.env` file in `DojoPool/services/api/` with the following content:

```bash
# Database
DATABASE_URL="your-database-url-here"

# JWT Authentication
JWT_SECRET="your-jwt-secret-here"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-here"
JWT_REFRESH_EXPIRES_IN="7d"

# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID="your-google-client-id-here"
GOOGLE_OAUTH_CLIENT_SECRET="your-google-client-secret-here"
GOOGLE_OAUTH_REDIRECT_URI="http://localhost:3002/api/v1/auth/google/callback"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Redis (optional for development)
REDIS_URL="redis://localhost:6379"

# Server Port
PORT=3002
```

Replace the placeholder values with your actual credentials.

## Step 4: Configure Frontend Environment

Create or update `.env.local` in `DojoPool/apps/web/` with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
```

## Step 5: Test the Setup

1. Start the backend server:
   ```bash
   cd DojoPool/services/api
   npm install
   npm run start:dev
   ```

2. Start the frontend:
   ```bash
   cd DojoPool/apps/web
   npm install
   npm run dev
   ```

3. Navigate to `http://localhost:3000/login`
4. Click "Sign in with Google"
5. You should be redirected to Google's OAuth consent screen
6. After authorization, you should be redirected back to the application

## Troubleshooting

### Common Issues

1. **"Error 401: invalid_client"**
   - Verify your Client ID and Client Secret are correct
   - Ensure the redirect URI matches exactly (including protocol and port)
   - Check that the OAuth client is enabled in Google Cloud Console

2. **"Google OAuth client ID not configured" warning**
   - Make sure the `.env` file is in the correct location
   - Restart the backend server after adding environment variables
   - Verify the environment variables are being loaded

3. **Redirect URI mismatch**
   - The redirect URI must match exactly what's configured in Google Cloud Console
   - Pay attention to:
     - Protocol (http vs https)
     - Port number
     - Path (/api/v1/auth/google/callback)

4. **CORS errors**
   - Ensure your frontend URL is properly configured in the backend CORS settings
   - Check the `FRONTEND_URL` environment variable

## Security Notes

- Never commit your `.env` file to version control
- Keep your Client Secret secure
- In production, use HTTPS for all URLs
- Regularly rotate your OAuth credentials
- Use environment-specific OAuth clients (separate for dev/staging/prod)

## Next Steps

After successful setup:
1. Test the full authentication flow
2. Implement proper session management
3. Handle edge cases (user already exists, email not provided, etc.)
4. Add logout functionality
5. Implement refresh token rotation for enhanced security
