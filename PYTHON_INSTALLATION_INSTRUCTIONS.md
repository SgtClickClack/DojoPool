# Python Installation Instructions

## Current Status

- ❌ Python not installed properly (only Microsoft Store shortcuts available)
- ❌ No virtual environment exists
- ❌ Cannot proceed with environment activation

## Required Actions

### Step 1: Install Python from python.org

1. Go to https://python.org/downloads/
2. Download the latest Python 3.x version for Windows
3. **IMPORTANT**: During installation, check "Add Python to PATH"
4. Complete the installation
5. Restart WebStorm/PowerShell

### Step 2: Verify Python Installation

After installation, run these commands to verify:

```powershell
python --version
pip --version
```

### Step 3: Create Virtual Environment

Once Python is properly installed:

```powershell
python -m venv venv
```

### Step 4: Activate Virtual Environment

```powershell
.\venv\Scripts\Activate.ps1
```

### Step 5: Install Dependencies and Run Audit

```powershell
pip install -r requirements.txt
pip install pip-audit
pip-audit
```

## Why This is Required

The current system has Microsoft Store Python shortcuts which are non-functional placeholders. A proper Python installation from python.org is required to:

- Create virtual environments
- Install packages with pip
- Run Python scripts and applications

## Next Steps

1. Install Python from python.org with PATH option
2. Restart terminal/WebStorm
3. Return to run the environment activation commands
