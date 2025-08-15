# DojoPool Environment Setup Guide

## Overview
This guide provides complete automation for setting up the DojoPool Python development environment, including virtual environment creation, dependency installation, and security auditing.

## Quick Start
For a complete automated setup, run:
```powershell
.\setup_complete_environment.ps1
```

## Individual Scripts

### 1. Python Installation Instructions
**File:** `PYTHON_INSTALLATION_INSTRUCTIONS.md`
- Provides step-by-step Python installation guide
- Explains why proper Python installation is required
- Use when Python is not installed or only Microsoft Store shortcuts exist

### 2. Virtual Environment Creation
**File:** `create_environment.ps1`
- Creates Python virtual environment
- Verifies Python installation first
- Handles existing environment scenarios
```powershell
.\create_environment.ps1
```

### 3. Environment Activation
**File:** `activate_environment.ps1`
- Activates virtual environment
- Verifies activation success
- Provides troubleshooting guidance
```powershell
.\activate_environment.ps1
```

### 4. Dependency Installation & Security Audit
**File:** `install_dependencies.ps1`
- Installs project dependencies from requirements.txt
- Installs pip-audit security tool
- Runs comprehensive security scan
```powershell
.\install_dependencies.ps1
```

### 5. Complete Setup (Recommended)
**File:** `setup_complete_environment.ps1`
- Orchestrates entire setup process
- Handles all steps automatically
- Provides clear progress feedback
```powershell
.\setup_complete_environment.ps1
```

## Prerequisites
- Windows PowerShell
- Python 3.x installed from python.org (not Microsoft Store)
- Python added to system PATH during installation

## Troubleshooting

### Python Not Found
If you see "Python was not found" errors:
1. Install Python from https://python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Restart WebStorm/PowerShell
4. Run setup script again

### Execution Policy Errors
If PowerShell scripts won't run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Virtual Environment Issues
If virtual environment creation fails:
1. Ensure Python is properly installed
2. Check that you're in the project root directory
3. Remove existing venv folder if corrupted: `Remove-Item -Recurse -Force venv`

## Project Dependencies
The following packages will be installed:
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

## Security Audit
The setup includes automatic security vulnerability scanning using pip-audit. This tool:
- Scans all installed packages for known vulnerabilities
- Provides detailed vulnerability reports
- Suggests remediation steps for security issues

## Success Indicators
After successful setup, you should see:
- ✓ Python installed and configured
- ✓ Virtual environment created and activated
- ✓ Project dependencies installed
- ✓ Security audit completed
- (venv) prefix in your PowerShell prompt

## Next Steps
Once environment setup is complete:
1. Your virtual environment will be automatically activated
2. All project dependencies will be installed
3. Security vulnerabilities (if any) will be reported
4. You can begin DojoPool development

## Support
If you encounter issues not covered in this guide:
1. Check that Python is properly installed from python.org
2. Verify you're running PowerShell as Administrator if needed
3. Ensure you're in the correct project directory
4. Review the error messages for specific guidance