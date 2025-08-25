# Mapbox Setup for World Hub Map

## 🚀 Quick Setup

1. **Get a Mapbox Access Token**

   - Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
   - Sign up or log in
   - Create a new token or use your default public token

2. **Configure Environment Variables**

   - Create a `.env.local` file in the `apps/web` directory
   - Add your Mapbox token:

   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsZXhhbXBsZSJ9.your_actual_token_here"
   ```

3. **Restart Development Server**
   - After creating/modifying `.env.local`, restart your dev server:
   ```bash
   npm run dev
   ```

## 🔧 Configuration

The map is configured to:

- Center on Brisbane, QLD by default
- Use the Mapbox Streets style
- Include navigation controls and geolocation
- Display dojo markers with real-time updates

## 📍 Features

- **Interactive Map**: Full Mapbox integration with zoom, pan, and navigation
- **Dojo Markers**: Color-coded markers showing control status
- **Player Tracking**: Real-time player position updates via WebSocket
- **Rich Popups**: Detailed dojo information with action buttons
- **Responsive Design**: Works on all device sizes

## 🚨 Troubleshooting

- **Map not loading**: Check your Mapbox token in `.env.local`
- **Token errors**: Ensure token starts with `pk.eyJ1...`
- **CORS issues**: Verify token has correct permissions
- **WebSocket errors**: Check backend connection in console

## 🔗 Resources

- [Mapbox Documentation](https://docs.mapbox.com/)
- [React Map GL](https://visgl.github.io/react-map-gl/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
