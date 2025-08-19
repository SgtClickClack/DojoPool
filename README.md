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
   - Implement caching for map data
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

## Troubleshooting: Fix Corrupted npm Cache

If you encounter the npm error "Cannot read properties of null (reading 'matches')", it usually indicates a corrupted npm cache.

Quick fix (Windows PowerShell):

```powershell
npm run env:reset:npm
```

This runs a helper script that:
- Force-cleans the npm cache
- Removes node_modules and package-lock.json
- Reinstalls dependencies

Manual steps (run these in order from the project root):

```powershell
# 1) Force clean the cache (most important)
npm cache clean --force

# 2) Delete local files (modules and lockfile in one command)
Remove-Item -Recurse -Force node_modules, package-lock.json

# 3) Re-install dependencies
npm install
```


## Development Quick Start (Hygiene Pass Interim)

Follow these steps to run DojoPool locally following the project guidelines:

1) Prerequisites
- Node.js 20+
- Python 3.11+ (3.13 used in Docker, ensure local deps support your version)
- npm (lockfile present)

2) Environment
- Copy docs/env.example to .env (root) and to .flaskenv for Flask if used locally
- Update values (secrets, DB URIs). Keep ports: 3000 (Vite), 8080 (Node API), 5000 (Flask)

3) Install dependencies
- npm ci
- For Python (optional local dev): pip install -r requirements.txt

4) Start development (Vite dev for frontend, Node API backend)
- npm run dev        # Expected to start frontend on http://localhost:3000 with proxy to 8080
- npm run dev:server # Expected Node/Express backend on http://localhost:8080 (if applicable)
- flask run --port 5000  # Optional: start Flask API locally

5) Tests (Vitest)
- npm test
- npm run test:watch
- npm run test:coverage

6) Production build (Next.js)
- npm run build
- npm run preview

Notes
- API proxy (dev): Vite proxies /api to http://localhost:8080 (configure in vite.config.ts)
- API proxy (prod): Next.js rewrites use API_BASE_URL from environment (see next.config.js)
- Image domains and CSP/security headers configured in next.config.js; adjust via env for prod

This section is temporary during the Hygiene pass and will be merged into the top-level README structure once config copies are removed and scripts verified.


## Qodana Local Analysis

Analyze the codebase locally using JetBrains Qodana CLI.

1) Install Qodana CLI (Windows via Scoop):

```
scoop bucket add jetbrains https://github.com/JetBrains/scoop-utils
scoop install qodana
```

Alternative via Go (cross‑platform):

```
go install github.com/JetBrains/qodana-cli@latest
```

2) Run the scan from the repo root:

- PowerShell:
```
$env:QODANA_TOKEN = "<your-token>"
qodana scan
```
- Or use npm scripts:
```
npm run qodana:scan
npm run qodana:ui   # opens report in browser
```
- Or use the helper script (also installs Qodana via Scoop if missing):
```
.\run_qodana.ps1 -Token "<your-token>" -ShowReport
```

3) View results:
- With `--show-report`, Qodana opens the UI automatically.
- Reports are stored in the `.qodana` directory.

For more details and troubleshooting, see docs/QODANA_LOCAL_SETUP.md.
