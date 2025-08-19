# Check if Node.js is installed
$nodeVersion = node --version
if (-not $?) {
    Write-Host "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
}

Write-Host "Node.js version: $nodeVersion"

# Check if Python is installed (required for some dependencies)
$pythonVersion = python --version
if (-not $?) {
    Write-Host "Python is not installed. Please install Python from https://www.python.org/"
    exit 1
}

Write-Host "Python version: $pythonVersion"

# Install dependencies
Write-Host "Installing npm dependencies..."
npm install

# Install Python dependencies
Write-Host "Installing Python dependencies..."
pip install -r requirements.txt
pip install -r test-requirements.txt

# Create necessary environment files if they don't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..."
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
}

Write-Host "Installation complete! You can now run the development server with:"
Write-Host "npm run dev" 