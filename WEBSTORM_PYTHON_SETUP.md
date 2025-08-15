# WebStorm Python Virtual Environment Setup

## Objective
Use WebStorm's interface to create a new, correctly configured Python virtual environment for the DojoPool project.

## Task Instructions

### Step 1: Open WebStorm Settings
- Press `Ctrl+Alt+S` or go to `File > Settings...`

### Step 2: Navigate to Python Interpreter Settings
- In the settings window, navigate to `Project: DojoPool > Python Interpreter`

### Step 3: Configure New Virtual Environment
A new window will open. Configure it exactly like this:

1. **On the left, select `Virtualenv Environment`**
2. **Select the `New` option**
3. **Location**: Should automatically fill with the correct path to a new `venv` folder in your project. This is correct.
4. **Base interpreter dropdown**: Should automatically find your installed `python.exe`. Ensure it's selected.
5. **Important**: Make sure the following boxes are **UNCHECKED**:
   - `Inherit global site-packages`
   - `Make available to all projects`
6. **Click OK**

### Step 4: Wait for Completion
- WebStorm will now create the new virtual environment and begin indexing it
- This process may take a minute
- Once finished, you should see a list of packages (like pip and setuptools) in the Python Interpreter settings screen

## What to Do Next
Once the process is finished and you see the package list in the Python Interpreter settings screen, we will proceed with installing the project's dependencies and running the security audit with pip-audit.

## Status
- [ ] WebStorm settings opened
- [ ] Python Interpreter configuration accessed
- [ ] New virtual environment created
- [ ] Virtual environment indexed and ready