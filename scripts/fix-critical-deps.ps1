# Update critical dependencies
Write-Host "Updating critical dependencies..."

# Update Next.js to fix authorization bypass
npm install next@14.1.0 --legacy-peer-deps

# Update axios to fix SSRF vulnerability
npm install axios@1.6.7 --legacy-peer-deps

# Update base64-url to fix out-of-bounds read
npm install base64-url@2.3.3 --legacy-peer-deps

# Update jsPDF to fix ReDoS vulnerability
npm install jspdf@2.5.1 --legacy-peer-deps

# Update canvg to fix prototype pollution
npm install canvg@4.0.1 --legacy-peer-deps

# Update Babel packages to fix regex complexity issues
npm install @babel/runtime@7.24.0 @babel/helpers@7.24.0 --legacy-peer-deps

# Update DOMPurify to fix XSS vulnerability
npm install dompurify@3.0.9 --legacy-peer-deps

# Update development dependencies with high vulnerabilities
npm install cross-spawn@7.0.3 http-cache-semantics@4.0.1 semver-regex@4.0.5 got@12.3.0 cookie@0.6.0 --legacy-peer-deps

# Run security audit
Write-Host "Running security audit..."
npm audit fix --force --legacy-peer-deps

# Generate new package-lock.json
Write-Host "Generating new package-lock.json..."
npm install --legacy-peer-deps

Write-Host "Critical dependency updates completed!" 