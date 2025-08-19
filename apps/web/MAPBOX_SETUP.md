# Mapbox Setup for World Hub Map

## Overview

The World Hub Map component requires a Mapbox access token to function properly. This guide explains how to obtain and configure the token.

## Getting a Mapbox Access Token

1. **Create a Mapbox Account**

   - Visit [Mapbox](https://www.mapbox.com/) and sign up for a free account
   - Free tier includes 50,000 map loads per month

2. **Generate Access Token**
   - Go to your [Mapbox Account](https://account.mapbox.com/)
   - Navigate to "Access Tokens"
   - Create a new token or use the default public token
   - Ensure the token has the necessary scopes (public scopes are fine for basic map display)

## Environment Configuration

### Option 1: Next.js Environment Variables (Recommended)

Create or update your `.env.local` file in the `apps/web` directory:

```bash
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your_actual_mapbox_token_here
```

### Option 2: React Environment Variables

If using Create React App or similar:

```bash
REACT_APP_MAPBOX_TOKEN=your_actual_mapbox_token_here
```

### Option 3: System Environment Variables

Set the environment variable at the system level:

```bash
# Windows PowerShell
$env:NEXT_PUBLIC_MAPBOX_TOKEN="your_actual_mapbox_token_here"

# Windows Command Prompt
set NEXT_PUBLIC_MAPBOX_TOKEN=your_actual_mapbox_token_here

# Linux/macOS
export NEXT_PUBLIC_MAPBOX_TOKEN="your_actual_mapbox_token_here"
```

## Token Format

Your Mapbox access token should look like:

```bash
pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsc2V4cGNhdDAwMDAifQ.example
```

## Verification

After setting the token:

1. Restart your development server
2. Navigate to the World Hub page (`/map`)
3. The map should load without the error message
4. You should see the interactive map centered on Brisbane, Australia

## Troubleshooting

### Map Shows Error Message

- Verify the environment variable is set correctly
- Ensure the token is valid and not expired
- Check that the development server has been restarted

### Map Doesn't Load

- Check browser console for JavaScript errors
- Verify Mapbox GL JS library is properly installed
- Ensure the token has the correct permissions

### Development vs Production

- For development: Use `.env.local` or system environment variables
- For production: Set environment variables in your hosting platform
- Never commit actual tokens to version control

## Security Notes

- The `NEXT_PUBLIC_` prefix makes the token visible to clients
- This is acceptable for Mapbox public tokens used in frontend code
- Keep your secret tokens (if any) separate and server-side only
