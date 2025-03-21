# Update npm to latest version
Write-Host "Updating npm to latest version..."
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
choco install nodejs -y

# Clean npm cache
Write-Host "Cleaning npm cache..."
npm cache clean --force

# Remove existing node_modules and package-lock.json
Write-Host "Removing existing dependencies..."
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Install dependencies with latest versions
Write-Host "Installing dependencies..."
npm install

# Run security audit fix
Write-Host "Running security audit fix..."
npm audit fix --force

# Update all dependencies to their latest versions
Write-Host "Updating all dependencies..."
npm update

# Run security audit again to verify fixes
Write-Host "Running final security audit..."
npm audit

# Generate new package-lock.json
Write-Host "Generating new package-lock.json..."
npm install

Write-Host "Dependencies updated successfully!" 