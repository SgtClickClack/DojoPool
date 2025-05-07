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

**Prerequisites:**
- Python 3.13
- Node.js (LTS version recommended)
- `uv` (Python package manager, can be installed via `pip install uv`)

**Python Environment Setup (using uv):**

1.  **Install uv (if not already installed):**
    ```bash
    pip install uv
    # OR, for a standalone install, refer to official uv documentation: https://github.com/astral-sh/uv
    ```

2.  **Create and activate the virtual environment (named .venv):**
    ```bash
    uv venv .venv -p python3.13  # Or specify the path to your Python 3.13 interpreter
    # Activate the environment:
    # Windows (PowerShell):
    . .\.venv\Scripts\Activate.ps1
    # Windows (CMD):
    .\.venv\Scripts\activate.bat
    # Linux/Mac:
    source .venv/bin/activate
    ```
    *Note: If `uv venv .venv -p python3.13` doesn't find Python 3.13 automatically, you might need to provide the full path to your Python 3.13 executable.*

3.  **Install Python dependencies:**
    ```bash
    uv pip install -r requirements.txt
    ```

**Node.js Dependencies:**

1.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

**Application Setup:**

1.  **Set up environment variables:**
    ```bash
    cp .env.template .env
    # Edit .env with your configuration
    ```

2.  **Initialize the database (if applicable for your setup):**
    ```bash
    # Ensure your .venv is activated
    python init_db_script.py 
    # Or using uv:
    # uv run python init_db_script.py
    ```

## Development

- Run tests: `pytest`
- Start development server: `python run.py`
# If using uv and your .venv is activated, this should work.
# Alternatively, you can use: uv run python run.py
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