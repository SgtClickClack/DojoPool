# DojoPool

[![CI Status](https://github.com/SgtClickClack/DojoPool/actions/workflows/ci.yml/badge.svg)](https://github.com/SgtClickClack/DojoPool/actions/workflows/ci.yml)
[![Coverage Status](https://codecov.io/gh/SgtClickClack/DojoPool/branch/main/graph/badge.svg)](https://codecov.io/gh/SgtClickClack/DojoPool)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=SgtClickClack_DojoPool&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=SgtClickClack_DojoPool)
[![Dependency Status](https://deps.dev/repository/github/SgtClickClack/DojoPool/status.svg)](https://deps.dev/repository/github/SgtClickClack/DojoPool)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

DojoPool is an innovative platform that transforms traditional pool gaming into an immersive, tech-enhanced, AI-driven experience. By merging real-world venues with digital enhancements, it creates an ecosystem where players, venues, and competitive gaming thrive together.

## Features

- Smart venue integration with real-time game tracking
- Player profiles and matchmaking
- Tournament management system
- Venue discovery and booking
- Advanced game analytics and performance tracking
- Real-time game statistics and shot analysis
- Social features and player rankings

## Tech Stack

- Frontend: Next.js, Material-UI, TypeScript
- Backend: Node.js with Next.js API routes
- Database: PostgreSQL
- Real-time: WebSocket
- Authentication: JWT
- Analytics: Custom analytics engine

## Prerequisites

- Node.js 16.x or higher
- PostgreSQL 13.x or higher
- npm or yarn

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dojopool

# Authentication
JWT_SECRET=your_jwt_secret

# API Keys (if needed)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dojopool.git
cd dojopool
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up the database:
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE dojopool"

# Run the initialization script
psql -U postgres -d dojopool -f init.sql
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/verify` - Verify JWT token

### Game Management
- POST `/api/game/create` - Create a new game
- POST `/api/game/join` - Join an existing game
- GET `/api/game/state` - Get game state
- PUT `/api/game/state` - Update game state
- POST `/api/game/shot` - Record shot analytics
- GET `/api/game/list` - List user's games

### Tournament Management
- POST `/api/tournament/create` - Create a tournament
- POST `/api/tournament/join` - Join a tournament
- POST `/api/tournament/start` - Start a tournament
- GET `/api/tournament/matches` - Get tournament matches
- PUT `/api/tournament/matches` - Update match results
- GET `/api/tournament/list` - List tournaments

### Venue Management
- POST `/api/venue/register` - Register a new venue
- PUT `/api/venue/update` - Update venue details
- GET `/api/venue/tables` - Get venue tables
- POST `/api/venue/tables` - Add a table
- PUT `/api/venue/tables` - Update table status
- GET `/api/venue/bookings` - Get venue bookings
- POST `/api/venue/bookings` - Create a booking
- GET `/api/venue/list` - List venues

### Game Analysis
- GET `/api/game-analysis/player-stats` - Get player statistics
- GET `/api/game-analysis/game-history` - Get game history
- GET `/api/game-analysis/shot-analysis` - Get shot analysis
- GET `/api/game-analysis/performance-trends` - Get performance trends

## WebSocket Events

The application uses WebSocket for real-time updates with the following events:

### Client to Server
- `join_game` - Join a game session
- `leave_game` - Leave a game session
- `game_update` - Send game state update

### Server to Client
- `game.state` - Game state updates
- `game.shot` - Shot analytics updates
- `tournament.update` - Tournament status updates
- `venue.status` - Venue/table status updates
- `player.stats` - Player statistics updates

## Testing

Run the test suite:
```bash
npm test
# or
yarn test
```

Run tests with coverage:
```bash
npm run test:coverage
# or
yarn test:coverage
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@dojopool.com or join our Slack channel.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- All our amazing contributors
- The open-source community
- Our partner venues and players

## 📞 Contact

- Website: [dojopool.com](https://dojopool.com)
- Email: support@dojopool.com
- Twitter: [@DojoPool](https://twitter.com/DojoPool)

## 🔮 Roadmap

See our [project roadmap](docs/ROADMAP.md) for planned features and improvements. 