# Dependency Installation & Security Audit

## Current Status
- Python is not currently available in the system PATH
- Virtual environment needs to be created
- Requirements.txt file exists with 12 dependencies

## Commands to Execute (Once Python is Available)

### Step 1: Create Virtual Environment
```powershell
python -m venv venv
```

### Step 2: Activate Virtual Environment
```powershell
.\venv\Scripts\Activate.ps1
```

### Step 3: Install Project Dependencies
```powershell
pip install -r requirements.txt
```

### Step 4: Install and Run Security Audit
```powershell
pip install pip-audit && pip-audit
```

## Project Dependencies (from requirements.txt)
- flask>=3.1.0
- flask-login>=0.6.3
- flask-sqlalchemy>=3.1.1
- psycopg2-binary>=2.9.10
- flask-socketio>=5.4.1
- eventlet>=0.36.1
- werkzeug>=3.1.0
- requests>=2.32.3
- oauthlib>=3.2.2
- python-dotenv>=1.0.1
- pillow>=11.0.0
- pyopenssl>=24.0.0

## Next Steps
1. Ensure Python is installed and available in PATH
2. Run the commands above in WebStorm's terminal
3. Paste the complete pip-audit output for vulnerability analysis

## Note
The issue description assumes WebStorm's terminal will automatically activate the venv. This requires:
- Python to be properly installed
- WebStorm to be configured with a Python interpreter
- A virtual environment to be created and configured in WebStorm settings