# Fix remaining vulnerabilities
Write-Host "Fixing remaining vulnerabilities..."

# Fix Next.js authorization bypass (Critical)
npm install next@14.1.0 --save-exact --legacy-peer-deps

# Fix axios SSRF vulnerability (High)
npm install axios@1.6.7 --save-exact --legacy-peer-deps

# Fix base64-url out-of-bounds read (High)
npm uninstall base64-url
npm install base64-url@2.3.3 --save-exact --legacy-peer-deps

# Fix jsPDF ReDoS vulnerability (High)
npm install jspdf@2.5.1 --save-exact --legacy-peer-deps

# Fix canvg prototype pollution (High)
npm install canvg@4.0.1 --save-exact --legacy-peer-deps

# Fix Babel regex complexity issues (Moderate)
npm install @babel/runtime@7.24.0 @babel/helpers@7.24.0 --save-exact --legacy-peer-deps

# Fix DOMPurify XSS vulnerability (Moderate)
npm install dompurify@3.0.9 --save-exact --legacy-peer-deps

# Fix development dependencies
npm install --save-dev cross-spawn@7.0.3 http-cache-semantics@4.1.1 semver-regex@4.0.5 got@12.3.0 --save-exact --legacy-peer-deps

# Fix cookie vulnerability (Low)
npm install cookie@0.6.0 --save-exact --legacy-peer-deps

# Run final security audit and fixes
Write-Host "Running final security audit and fixes..."
npm audit fix --force --legacy-peer-deps

# Clean install to ensure everything is consistent
Write-Host "Performing clean install..."
npm ci --legacy-peer-deps

Write-Host "Vulnerability fixes completed!" 