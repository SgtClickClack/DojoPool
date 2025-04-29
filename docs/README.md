# Dojo Pool - Location-Based Coin Collection Game

A real-time multiplayer location-based game built with Flask and Google Maps SDK, featuring interactive gameplay, AI-powered umpire system, and robust authentication.

## Features

- **Location-Based Gameplay**
  - Real-time coin collection mechanics
  - Interactive Google Maps integration
  - Dynamic coin spawning system
  - Score tracking and leaderboards

- **Multiplayer Capabilities**
  - Real-time player interactions
  - Local chat system
  - Challenge system between players
  - Player proximity detection
  - Real-time score updates

- **Advanced Map Features**
  - Multiple theme support (dark, retro, night)
  - Custom map controls
  - Dynamic theme switching
  - Responsive map interface

- **AI-Powered Umpire System**
  - OpenCV-based ball detection
  - Real-time movement analysis
  - Thread-safe monitoring
  - WebSocket integration
  - Color calibration

- **Authentication & Security**
  - Email/password authentication
  - Secure password hashing
  - Session management
  - HTTPS enforcement
  - CORS protection

## Tech Stack

- **Backend**
  - Flask (Python web framework)
  - PostgreSQL (Database)
  - Socket.IO (Real-time communication)
  - OpenCV (Computer vision)

- **Frontend**
  - Bootstrap (UI framework)
  - Google Maps SDK
  - Socket.IO client
  - Webview support

- **Infrastructure**
  - Replit hosting
  - Git version control
  - Environment validation
  - Enhanced logging system

## Setup Instructions

1. **Environment Setup**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd dojo-pool

   # Install dependencies
   pip install -r requirements.txt
   ```

2. **Environment Variables**
   Required environment variables:
   - `FLASK_SECRET_KEY`: For session management
   - `DATABASE_URL`: PostgreSQL connection string
   - `GOOGLE_MAPS_API_KEY`: For maps integration
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`: Database configuration

3. **Database Setup**
   The application will automatically create necessary tables on first run.

4. **Running the Application**
   ```bash
   python app.py
   ```
   The application will be available at `http://localhost:5000`

## Project Structure

```
├── app.py                 # Main application entry point
├── blueprints/           # Feature-specific routes
├── static/
│   ├── css/             # Stylesheets
│   ├── js/              # Client-side scripts
│   └── images/          # Static assets
├── templates/           # HTML templates
├── utils/              # Helper functions
└── models.py           # Database models
```

## Current Status

- ✅ Core gameplay mechanics implemented
- ✅ Multiplayer system operational
- ✅ Authentication system complete
- ✅ Map customization features added
- ✅ AI umpire system integrated
- ✅ Socket.IO connection stability enhanced
- ✅ Git configuration optimized

## Future Roadmap

### Short-term Goals
1. **Performance Optimization**
   - ✅ Implement caching for map data (Venue details cached)
   - Optimize database queries
   - Add request rate limiting

2. **Enhanced User Experience**
   - Add tutorial system
   - Implement achievement system
   - Add progressive web app support

3. **Game Mechanics**
   - Add power-ups and special items
   - Implement team-based gameplay
   - Add competitive seasons

### Long-term Goals
1. **Platform Expansion**
   - Mobile app development
   - Cross-platform compatibility
   - Offline mode support

2. **Social Features**
   - Friend system
   - Global chat rooms
   - Player rankings

3. **Technical Improvements**
   - Microservices architecture
   - Advanced analytics
   - AI-powered game balancing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Maps Platform for mapping capabilities
- OpenCV community for computer vision tools
- Flask and Socket.IO communities for real-time features
- Replit for hosting and development platform
