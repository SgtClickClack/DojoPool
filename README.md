# DojoPool

DojoPool is an innovative platform that transforms traditional pool gaming into an immersive, tech-enhanced, AI-driven experience. By merging real-world venues with digital enhancements, it creates an ecosystem where players, venues, and competitive gaming thrive together.

## Features

- Smart Venues ("Dojos") with AI-powered cameras and real-time tracking
- Mobile App & Web Portal for game management and community engagement
- Dojo Coins hybrid currency system
- AI-driven, context-aware gameplay
- Venue integration and business model
- Dynamic background system with smooth transitions
- Modern gaming aesthetics with neon effects
- Enhanced visual hierarchy and user experience

## Recent Updates (2024-04-12)

- Enhanced frontend with dynamic background cycling
- Implemented neon text and glow effects
- Improved card and button styling
- Updated logo placement and scaling
- Enhanced visual hierarchy
- Added security test suite
- Updated monitoring modules

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
npm install
```

3. Set up environment variables:
```bash
cp .env.template .env
# Edit .env with your configuration
```

4. Initialize the database:
```bash
python init_db_script.py
```

## Development

- Run tests: `pytest`
- Start development server: `python run.py`
- Start frontend development: `npm run dev`
- Format code: `black .`
- Check types: `mypy .`

## Performance Metrics

- Shot Analysis Accuracy: 95%
- Real-time Analysis Latency: <50ms
- Test Coverage: 95%
- Documentation Coverage: 90%

## Security

- Regular security audits
- Automated vulnerability scanning
- Comprehensive test suite
- Secure authentication system

## License

Copyright © 2024 DojoPool. All rights reserved. 