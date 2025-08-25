# WebStorm Virtual Environment Setup Guide

## Objective

Use WebStorm's interface to create a new, correctly configured Python virtual environment for the DojoPool project.

## Step-by-Step Instructions

### Step 1: Open WebStorm Settings

- Press `Ctrl+Alt+S` (or go to `File > Settings...`)

### Step 2: Navigate to Python Interpreter

- In the settings window, navigate to `Project: DojoPool > Python Interpreter`

### Step 3: Add New Interpreter

- Click the **Add Interpreter** link
- Select **Add New Interpreter...**

### Step 4: Configure Virtual Environment

In the new window, configure exactly as follows:

1. **On the left panel**: Select `Virtualenv Environment`
2. **Environment type**: Select the `New` option
3. **Location**: The path should automatically end with `\DojoPool\venv` - this is correct
4. **Base interpreter**: Should be set to your installed `python.exe`
5. **Click OK**

### Step 5: Wait for Completion

- WebStorm will create the `venv` folder and set it up for the project
- This process may take a few moments
- After completion, the `ls -Directory` command would show a `venv` folder in the project list

### Step 6: Verification

- Once finished, you should see the new virtual environment listed in the Python Interpreter settings
- The interpreter path should point to `\DojoPool\venv\Scripts\python.exe`

## Expected Results

- A new `venv` folder will be created in the DojoPool project directory
- WebStorm will configure the project to use this virtual environment
- The Python interpreter will be properly set for the project

## Next Steps

Once the virtual environment is created and configured, you can proceed to install project dependencies and run security audits using the WebStorm terminal, which will automatically use the configured virtual environment.

## Status Checklist

- [ ] WebStorm settings opened (Ctrl+Alt+S)
- [ ] Navigated to Project: DojoPool > Python Interpreter
- [ ] Clicked Add Interpreter > Add New Interpreter
- [ ] Selected Virtualenv Environment > New
- [ ] Verified Location ends with \DojoPool\venv
- [ ] Selected correct Base interpreter (python.exe)
- [ ] Clicked OK and waited for completion
- [ ] Verified venv folder creation
- [ ] Confirmed Python interpreter configuration
