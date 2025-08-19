# Update npm dependencies with security fixes
Write-Host "Updating npm dependencies with security fixes..."

# Update critical dependencies
npm install next@latest axios@latest jspdf@latest canvg@latest @babel/runtime@latest @babel/helpers@latest dompurify@latest cross-spawn@latest http-cache-semantics@latest semver-regex@latest got@latest cookie@latest

# Update Python dependencies
Write-Host "Updating Python dependencies with security fixes..."
pip install --upgrade cryptography

# Run security audit
Write-Host "Running npm security audit..."
npm audit fix --force

# Run pip security check
Write-Host "Running pip security check..."
pip list --outdated
pip install --upgrade -r requirements/security.txt

# Generate new package-lock.json
Write-Host "Generating new package-lock.json..."
npm install

Write-Host "Security updates completed!" 