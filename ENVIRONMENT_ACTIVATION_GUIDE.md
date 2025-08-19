# Environment Activation Guide

## Issue: "activate the environment"

## Current Status

- **No virtual environment exists** in the project directory
- **Python is not properly installed** on the system
- Only Microsoft Store Python shortcuts are available (non-functional)

## Prerequisites Before Activation

### 1. Install Python Properly

```powershell
# Current issue: Python not found
# Solution: Install Python from python.org (not Microsoft Store)
```

**Required Actions:**

- Download Python from https://python.org/downloads/
- During installation, check "Add Python to PATH"
- Restart WebStorm after installation

### 2. Create Virtual Environment

Once Python is installed:

```powershell
# Create virtual environment
python -m venv venv
```

## Environment Activation Commands

### Method 1: PowerShell Activation

```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Verify activation (should show (venv) in prompt)
```

### Method 2: WebStorm Integration

1. Open WebStorm Settings (`Ctrl+Alt+S`)
2. Navigate to `Project: DojoPool > Python Interpreter`
3. Click "Add Interpreter" > "Add New Interpreter"
4. Select "Virtualenv Environment" > "New"
5. Set location to `\DojoPool\venv`
6. Click OK

## Verification Steps

After activation, verify with:

```powershell
# Check Python location (should be in venv)
where python

# Check pip location (should be in venv)
where pip

# Verify environment is active (should show venv path)
python -c "import sys; print(sys.prefix)"
```

## Next Steps After Activation

Once environment is activated:

```powershell
# Install project dependencies
pip install -r requirements.txt

# Install security audit tool
pip install pip-audit

# Run security audit
pip-audit
```

## Current Blockers

1. ❌ Python not installed properly
2. ❌ No virtual environment exists
3. ❌ Cannot activate non-existent environment

## Resolution Path

1. Install Python from python.org
2. Create virtual environment: `python -m venv venv`
3. Activate environment: `.\venv\Scripts\Activate.ps1`
4. Install dependencies: `pip install -r requirements.txt`
5. Run audit: `pip install pip-audit && pip-audit`
