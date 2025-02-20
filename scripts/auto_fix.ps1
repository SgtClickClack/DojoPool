# PowerShell script to run automated fixes

# Set Python path
$env:PYTHONPATH = "."

Write-Host "Running DojoPool Auto-Fixer..."

# Install required packages
Write-Host "Installing dependencies..."
pip install -r requirements.txt

# Run auto-fixer
Write-Host "Running fixes..."
python -m src.dojopool.automation.auto_fixer --verbose

Write-Host "Auto-fixing complete!" 