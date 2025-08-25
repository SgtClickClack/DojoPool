# Google Maps Setup for WorldHub Map

## Overview

The WorldHub component now includes an interactive map that displays DojoPool dojos and their territory control status. To enable the full map functionality, you need to configure a Google Maps API key.

## Setup Steps

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API (optional, for enhanced features)
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### 2. Configure Environment Variables

Create a `.env.local` file in the `apps/web/` directory:

```bash
# Google Maps API Key for WorldHub Map
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
```

### 3. Restart Development Server

After adding the environment variables, restart your development server:

```bash
npm run dev
```

## Features

### Interactive Map

- **Custom Styling**: Dark theme optimized for gaming aesthetics
- **Dojo Markers**: Different icons for different dojo states
- **Territory Control**: Visual indicators for clan-controlled vs. neutral dojos
- **Interactive Popups**: Click markers to see detailed dojo information

### Marker Types

- 🟢 **Green (🎯)**: Neutral territory - available for claiming
- 🟠 **Orange (🏰)**: Clan-controlled territory
- 🔴 **Red (🔒)**: Locked territory - temporarily unavailable

### Map Controls

- Zoom in/out
- Pan around the map
- Fullscreen mode
- Custom dark theme styling

## Fallback Mode

If no Google Maps API key is configured, the component will display a list view of dojos instead of the interactive map, ensuring the application remains functional.

## Troubleshooting

### Common Issues

1. **Blank Map**: Check if the API key is correctly set in `.env.local`
2. **API Errors**: Verify the API key has the correct permissions
3. **Styling Issues**: Ensure the Google Maps JavaScript API is enabled

### Security Notes

- Never commit your API key to version control
- Use domain restrictions in Google Cloud Console
- Consider using environment-specific keys for dev/staging/prod
