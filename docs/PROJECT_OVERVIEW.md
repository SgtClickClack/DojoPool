# Dojo Pool - Project Overview

## Core Concept
Dojo Pool is a next-generation pool-playing ecosystem combining real-world cue sports with AI-driven gameplay enhancement, narrative elements, and a hybrid in-app currency.

## Key Components

### Physical Component
- Real pool games played at participating venues
- QR code check-in system
- Tournament hosting capabilities
- Venue-specific leaderboards

### Digital Platform
- Web application for management and tracking
- Mobile application for real-time interaction
- AI-driven shot analysis and narrative generation
- Avatar system with facial recognition mapping

### Currency System
- Dojo Coins for transactions
- Tournament entry fees
- Marketplace purchases
- Power-up activation

## Technical Architecture

### Frontend Components
```
src/frontend/
├── web/          # Flask web application
└── mobile/       # React Native mobile app
```

### Backend Services
```
src/backend/
├── core/         # Core business logic
├── ai/          # AI services
└── api/         # REST API endpoints
```

### Data Storage
- PostgreSQL for relational data
- MongoDB for game analytics
- Redis for caching
- S3 for asset storage

## Development Guidelines

### Code Style
- PEP 8 for Python code
- ESLint for JavaScript/TypeScript
- Component-based architecture for frontend
- RESTful API design

### Testing Requirements
- Unit tests for all core functionality
- Integration tests for API endpoints
- End-to-end tests for critical user journeys

### Documentation
- Inline code documentation
- API documentation
- User guides
- Development guides

## Getting Started

### Prerequisites
```bash
python 3.8+
postgresql
node.js 14+
```

### Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/dojo-pool.git
cd dojo-pool
```

2. Install dependencies
```bash
pip install -r requirements.txt
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the application
```bash
cd src
python app.py
```

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*This document serves as the primary reference for project context and setup. For detailed development status, see DEVELOPMENT_TRACKING.md. For future plans, see ROADMAP.md.* 