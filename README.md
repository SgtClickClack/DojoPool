# DojoPool

DojoPool is an innovative platform that transforms traditional pool gaming into an immersive, tech-enhanced, AI-driven experience. By merging real-world venues with digital enhancements, it creates an ecosystem where players, venues, and competitive gaming thrive together.

## Features

- Smart Venues ("Dojos") with AI-powered cameras and real-time tracking
- Mobile App & Web Portal for game management and community engagement
- Dojo Coins hybrid currency system
- AI-driven, context-aware gameplay
- Venue integration and business model

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
- Format code: `black .`
- Check types: `mypy .`

## License

Copyright © 2024 DojoPool. All rights reserved. 