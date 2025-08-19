# PowerShell script to implement security fixes

# 1. Update package.json dependencies to secure versions
$packageJson = Get-Content -Path "../package.json" | ConvertFrom-Json
$packageJson.dependencies | ForEach-Object {
    # Update vulnerable dependencies to latest secure versions
    if ($_.react -lt "18.0.0") { $_.react = "18.2.0" }
    if ($_."@material-ui/core" -lt "4.12.4") { $_."@material-ui/core" = "4.12.4" }
}
$packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path "../package.json"

# 2. Implement security headers
$nginxConfig = @"
# Security headers
add_header X-Frame-Options "SAMEORIGIN";
add_header X-XSS-Protection "1; mode=block";
add_header X-Content-Type-Options "nosniff";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
"@
Add-Content -Path "../nginx/nginx.conf" -Value $nginxConfig

# 3. Implement rate limiting
$rateLimitConfig = @"
# Rate limiting
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
limit_req zone=one burst=10 nodelay;
"@
Add-Content -Path "../nginx/nginx.conf" -Value $rateLimitConfig

# 4. Update security rules
$securityRules = @"
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.auth.token.email_verified == true;
    }
  }
}
"@
Set-Content -Path "../firestore.rules" -Value $securityRules

# 5. Update storage rules
$storageRules = @"
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.auth.token.email_verified == true
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
"@
Set-Content -Path "../storage.rules" -Value $storageRules

Write-Host "Security fixes have been implemented." 